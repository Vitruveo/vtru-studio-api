import debug from 'debug';
import os from 'os';
import archiver from 'archiver';
import { readFile } from 'fs/promises';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { z } from 'zod';
import path, { join } from 'path';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { fork } from 'child_process';
import * as model from '../model';
import * as creatorModel from '../../creators/model';
import { APIResponse, ObjectId } from '../../../services';
import {
    ArtistSpotlight,
    CarouselResponse,
    QueryCollectionParams,
    QueryTagsParams,
    ResponseAssetsPaginated,
    Spotlight,
    StorePackItem,
} from './types';
import { FindAssetsCarouselParams } from '../model/types';
import { querySortGroupByCreator, querySortSearch } from '../utils/queries';
import { DIST } from '../../../constants/static';
import {
    ASSET_STORAGE_URL,
    GENERAL_STORAGE_URL,
    GENERATE_PACK_LIMIT,
    NODE_ENV,
    SEARCH_URL,
} from '../../../constants';
import { splitIntoChunks } from '../utils/splitInChunks';
import { validatePath } from '../utils/validatePath';
import { sendToExchangePrintOutputs } from '../../../services/printOutput';
import { checkAssetExists, checkCountCharacters } from '../middleware';
import { checkPrintOutputExists } from '../middleware/printOutputExists';
import { checkSourceExists } from '../middleware/sourceExists';
import {
    schemaValidationForGroupedAssets,
    schemaValidationForUngroupedAssets,
} from './schemas';
import {
    validateBodyForUngroupedAssets,
    validateBodyGroupedAssets,
} from './rules';
import { buildParsedQuery } from '../useCase/ungrouped';
import { buildParsedQueryGrouped } from '../useCase/grouped';

const logger = debug('features:assets:controller:public');
const route = Router();

route.post('/search', validateBodyForUngroupedAssets, async (req, res) => {
    try {
        const {
            query,
            page,
            limit,
            minPrice,
            maxPrice,
            name,
            sort,
            precision,
            showAdditionalAssets,
            hasBts,
            hasNftAutoStake,
            storesId,
        } = req.body as z.infer<typeof schemaValidationForUngroupedAssets>;

        const parsedQuery = buildParsedQuery({
            query,
            showAdditionalAssets,
            maxPrice,
            minPrice,
            name,
            hasBts,
            hasNftAutoStake,
            storesId,
        });

        const { colors } = parsedQuery.avoid;

        delete parsedQuery.avoid;

        const result = await model.countAssets({
            query: parsedQuery,
            colors,
            precision: Number(precision),
        });

        const total = result[0]?.count ?? 0;

        const totalPage = Math.ceil(total / limit);

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortSearch(sort, hasBts);

        const assets = await model.findAssetsPaginated({
            query: parsedQuery,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
            colors,
            precision: Number(precision),
        });

        const tags = await model.findAssetsTagsSearchable({
            showAdditionalAssets,
        });

        const maxAssetPrice = await model.findMaxPrice();

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                tags,
                page,
                totalPage,
                total,
                limit,
                maxPrice: maxAssetPrice || 0,
            },
        } as APIResponse<ResponseAssetsPaginated>);
    } catch (error) {
        logger('Reader search asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.search.failed',
            message: `Reader search failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/groupByCreator', validateBodyGroupedAssets, async (req, res) => {
    try {
        const {
            query,
            page,
            limit,
            minPrice,
            maxPrice,
            name,
            sort,
            hasBts,
            hasNftAutoStake,
            storesId,
        } = req.body as z.infer<typeof schemaValidationForGroupedAssets>;

        const { parsedQuery, grouped } = buildParsedQueryGrouped({
            query,
            maxPrice,
            minPrice,
            name,
            hasBts,
            hasNftAutoStake,
            storesId,
        });

        delete parsedQuery.avoid;

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortGroupByCreator(sort, hasBts);

        const assets = await model.findAssetGroupPaginated({
            query: parsedQuery,
            limit,
            skip: (page - 1) * limit,
            sort: sortQuery,
            grouped,
        });

        const total = await model.countAssetsGroup({
            query: parsedQuery,
            grouped,
        });

        const totalPage = Math.ceil(total.length / limit);

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                page,
                totalPage,
                total: total.length,
                limit,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader groupByCreator asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.groupByCreator.failed',
            message: `Reader groupByCreator failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/carousel', async (req, res) => {
    const { layout, nudity } = req.query as FindAssetsCarouselParams;

    try {
        const assets = await model.findAssetsCarousel({ layout, nudity });

        res.json({
            code: 'vitruveo.studio.api.assets.carousel.success',
            message: 'Reader carousel success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<CarouselResponse[]>);
    } catch (error) {
        logger('Reader carousel failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.carousel.failed',
            message: `Reader carousel failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get(
    '/collections',
    checkCountCharacters({ field: 'name', minLength: 3 }),
    async (req, res) => {
        try {
            const { name, showAdditionalAssets } =
                req.query as unknown as QueryCollectionParams;

            const collections = await model.findAssetsCollections({
                name,
                showAdditionalAssets,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.collections.success',
                message: 'Reader collections success',
                transaction: nanoid(),
                data: collections,
            } as APIResponse<model.AssetsDocument[]>);
        } catch (error) {
            logger('Reader collections failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.collections.failed',
                message: `Reader collections failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get(
    '/subjects',
    checkCountCharacters({ field: 'name', minLength: 3 }),
    async (req, res) => {
        try {
            const { name, showAdditionalAssets } =
                req.query as unknown as QueryCollectionParams;

            const subjects = await model.findAssetsSubjects({
                name,
                showAdditionalAssets,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.subjects.success',
                message: 'Reader subjects success',
                transaction: nanoid(),
                data: subjects,
            } as APIResponse<model.AssetsDocument[]>);
        } catch (error) {
            logger('Reader subjects failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.subjects.failed',
                message: `Reader subjects failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get(
    '/tags',
    checkCountCharacters({ field: 'name', minLength: 3 }),
    async (req, res) => {
        try {
            const { name, showAdditionalAssets } =
                req.query as unknown as QueryTagsParams;

            const tags = await model.findAssetsTagsSearchable({
                name: name.trim(),
                showAdditionalAssets,
                limit: 20,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.tags.success',
                message: 'Reader tags success',
                transaction: nanoid(),
                data: tags,
            } as APIResponse<model.AssetsDocument[]>);
        } catch (error) {
            logger('Reader tags failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.tags.failed',
                message: `Reader tags failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get(
    '/creators',
    checkCountCharacters({ field: 'name', minLength: 3 }),
    async (req, res) => {
        try {
            const { name, showAdditionalAssets } =
                req.query as unknown as QueryCollectionParams;

            const creators = await model.findAssetsByCreatorName({
                name,
                showAdditionalAssets,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.creators.success',
                message: 'Reader creators success',
                transaction: nanoid(),
                data: creators,
            } as APIResponse<model.AssetsDocument[]>);
        } catch (error) {
            logger('Reader creators failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.creators.failed',
                message: `Reader creators failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post('/lastSold', async (req, res) => {
    try {
        const { query = {} as any, storesId } = req.body as unknown as {
            query: Record<string, unknown>;
            storesId: string;
        };

        const parsedQuery = {
            ...query,
        };

        if (query['assetMetadata.creators.formData.name']) {
            const creators = query['assetMetadata.creators.formData.name'].$in;
            parsedQuery['assetMetadata.creators.formData'] = {
                $elemMatch: {
                    $or: creators.map((creator: string) => ({
                        name: { $regex: `^${creator}$`, $options: 'i' },
                    })),
                },
            };
            delete parsedQuery['assetMetadata.creators.formData.name'];
        }
        if (parsedQuery['assetMetadata.taxonomy.formData.subject']) {
            const subjects =
                query['assetMetadata.taxonomy.formData.subject'].$in;
            delete parsedQuery['assetMetadata.taxonomy.formData.subject'];
            if (Array.isArray(parsedQuery.$and)) {
                subjects.forEach((subject: string) => {
                    // @ts-ignore
                    parsedQuery.$and.push({
                        'assetMetadata.taxonomy.formData.subject': {
                            $elemMatch: {
                                $regex: subject,
                                $options: 'i',
                            },
                        },
                    });
                });
            } else {
                parsedQuery.$and = subjects.map((subject: string) => ({
                    'assetMetadata.taxonomy.formData.subject': {
                        $elemMatch: {
                            $regex: subject,
                            $options: 'i',
                        },
                    },
                }));
            }
        }
        if (parsedQuery['assetMetadata.taxonomy.formData.collections']) {
            const collections =
                query['assetMetadata.taxonomy.formData.collections'].$in;
            delete parsedQuery['assetMetadata.taxonomy.formData.collections'];
            if (Array.isArray(parsedQuery.$and)) {
                collections.forEach((collection: string) => {
                    // @ts-ignore
                    parsedQuery.$and.push({
                        'assetMetadata.taxonomy.formData.collections': {
                            $elemMatch: {
                                $regex: collection,
                                $options: 'i',
                            },
                        },
                    });
                });
            } else {
                parsedQuery.$and = collections.map((collection: string) => ({
                    'assetMetadata.taxonomy.formData.collections': {
                        $elemMatch: {
                            $regex: collection,
                            $options: 'i',
                        },
                    },
                }));
            }
        }

        if ('assetMetadata.taxonomy.formData.nudity' in parsedQuery) {
            const currentNudity =
                parsedQuery['assetMetadata.taxonomy.formData.nudity'];
            if (currentNudity?.$in?.includes('yes'))
                parsedQuery['assetMetadata.taxonomy.formData.nudity'] = {
                    $in: ['yes', 'no'],
                };
        }

        if (storesId) {
            parsedQuery.$or = [
                ...(parsedQuery.$or || []),
                { stores: { $exists: false } },
                { stores: null },
                { 'stores.visibility': 'visibleInAllStores' },
                {
                    'stores.visibility': 'visibleInSelectedStores',
                    'stores.list': storesId,
                },
                {
                    'stores.visibility': 'hiddenInSelectedStores',
                    'stores.list': { $nin: [storesId] },
                },
            ];
        }

        const assets = await model.findLastSoldAssets({ query: parsedQuery });

        res.json({
            code: 'vitruveo.studio.api.assets.lastSold.success',
            message: 'Reader last sold success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<model.AssetsDocument[]>);
    } catch (error) {
        logger('Reader last sold failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.lastSold.failed',
            message: `Reader last sold failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/spotlight', async (req, res) => {
    try {
        const { query = {} as any, storesId } = req.body as unknown as {
            query: Record<string, unknown>;
            storesId: string;
        };

        const parsedQuery = {
            ...query,
        };

        if (query['assetMetadata.creators.formData.name']) {
            const creators = query['assetMetadata.creators.formData.name'].$in;
            parsedQuery['assetMetadata.creators.formData'] = {
                $elemMatch: {
                    $or: creators.map((creator: string) => ({
                        name: { $regex: `^${creator}$`, $options: 'i' },
                    })),
                },
            };
            delete parsedQuery['assetMetadata.creators.formData.name'];
        }
        if (parsedQuery['assetMetadata.taxonomy.formData.subject']) {
            const subjects =
                query['assetMetadata.taxonomy.formData.subject'].$in;
            delete parsedQuery['assetMetadata.taxonomy.formData.subject'];
            if (Array.isArray(parsedQuery.$and)) {
                subjects.forEach((subject: string) => {
                    // @ts-ignore
                    parsedQuery.$and.push({
                        'assetMetadata.taxonomy.formData.subject': {
                            $elemMatch: {
                                $regex: subject,
                                $options: 'i',
                            },
                        },
                    });
                });
            } else {
                parsedQuery.$and = subjects.map((subject: string) => ({
                    'assetMetadata.taxonomy.formData.subject': {
                        $elemMatch: {
                            $regex: subject,
                            $options: 'i',
                        },
                    },
                }));
            }
        }
        if (parsedQuery['assetMetadata.taxonomy.formData.collections']) {
            const collections =
                query['assetMetadata.taxonomy.formData.collections'].$in;
            delete parsedQuery['assetMetadata.taxonomy.formData.collections'];
            if (Array.isArray(parsedQuery.$and)) {
                collections.forEach((collection: string) => {
                    // @ts-ignore
                    parsedQuery.$and.push({
                        'assetMetadata.taxonomy.formData.collections': {
                            $elemMatch: {
                                $regex: collection,
                                $options: 'i',
                            },
                        },
                    });
                });
            } else {
                parsedQuery.$and = collections.map((collection: string) => ({
                    'assetMetadata.taxonomy.formData.collections': {
                        $elemMatch: {
                            $regex: collection,
                            $options: 'i',
                        },
                    },
                }));
            }
        }

        if ('assetMetadata.taxonomy.formData.nudity' in parsedQuery) {
            const currentNudity =
                parsedQuery['assetMetadata.taxonomy.formData.nudity'];
            if (currentNudity?.$in?.includes('yes'))
                parsedQuery['assetMetadata.taxonomy.formData.nudity'] = {
                    $in: ['yes', 'no'],
                };
        }

        if (storesId) {
            parsedQuery.$or = [
                ...(parsedQuery.$or || []),
                { stores: { $exists: false } },
                { stores: null },
                { 'stores.visibility': 'visibleInAllStores' },
                {
                    'stores.visibility': 'visibleInSelectedStores',
                    'stores.list': storesId,
                },
                {
                    'stores.visibility': 'hiddenInSelectedStores',
                    'stores.list': { $nin: [storesId] },
                },
            ];
        }

        const spotlight = await readFile(join(DIST, 'spotlight.json'), 'utf-8');

        const payload = JSON.parse(spotlight) as Spotlight[];

        parsedQuery.$and = [
            ...(parsedQuery.$and || []),
            {
                _id: {
                    $in: payload.map((v) => new ObjectId(v._id)),
                },
            },
        ];

        let response: Spotlight[] = [];

        const assets = await model.findAssets({
            query: parsedQuery,
        });

        response = payload
            .filter((asset) =>
                assets.some((v) => v._id.toString() === asset._id.toString())
            )
            .map((v) => {
                const framework = assets.find(
                    (asset) => asset._id.toString() === v._id.toString()
                )?.framework;
                if (framework) {
                    return { ...v, framework };
                }
                return v;
            });

        res.json({
            code: 'vitruveo.studio.api.assets.spotlight.success',
            message: 'Reader spotlight success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Reader spotlight failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.spotlight.failed',
            message: `Reader spotlight failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/artistSpotlight/:name?', async (req, res) => {
    try {
        const artistSpotlight = await readFile(
            join(DIST, 'artistSpotlight.json'),
            'utf-8'
        );
        const payload = JSON.parse(artistSpotlight) as ArtistSpotlight[];

        if (!req.params.name) {
            res.json({
                code: 'vitruveo.studio.api.assets.artistSpotlight.success',
                message: 'Reader artist Spotlight success',
                transaction: nanoid(),
                data: payload,
            } as APIResponse);
            return;
        }

        const assets = await model.findAssets({
            query: {
                'framework.createdBy': {
                    $in: payload.map((v) => v._id),
                },
                'assetMetadata.creators.formData.name': {
                    $regex: new RegExp(`(^| )${req.params.name}`, 'i'),
                },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.assets.artistSpotlight.success',
            message: 'Reader artist Spotlight success',
            transaction: nanoid(),
            data: payload.filter((v) =>
                assets.find(
                    (asset) => asset.framework.createdBy === v._id.toString()
                )
            ),
        } as APIResponse);
    } catch (error) {
        logger('Reader artist Spotlight failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.artistSpotlight.failed',
            message: `Reader artist Spotlight failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', checkAssetExists, async (_req, res) => {
    try {
        const { asset } = res.locals;

        const creatorId = asset.framework.createdBy;

        if (!creatorId) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await creatorModel.findCreatorById({ id: creatorId });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.creatorNotFound',
                message: 'Reader get asset creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.get.success',
            message: 'Reader get asset success',
            transaction: nanoid(),
            data: {
                username: creator.username,
                avatar: creator.profile.avatar,
            },
        } as APIResponse);
    } catch (error) {
        logger('Reader get asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.get.failed',
            message: `Reader get asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/grid/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const grid = await creatorModel.findCreatorAssetsByGridId({ id });

        res.json({
            code: 'vitruveo.studio.api.assets.grid.success',
            message: 'Reader grid success',
            transaction: nanoid(),
            data: { grid },
        } as APIResponse);
    } catch (error) {
        logger('Reader get grid failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.grid.get.failed',
            message: `Reader get grid failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/video/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const video = await creatorModel.findCreatorAssetsByVideoId({ id });

        res.json({
            code: 'vitruveo.studio.api.assets.video.success',
            message: 'Reader video success',
            transaction: nanoid(),
            data: { video },
        } as APIResponse);
    } catch (error) {
        logger('Reader get video failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.video.get.failed',
            message: `Reader get video failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/slideshow/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const slideshow = await creatorModel.findCreatorAssetsBySlideshowId({
            id,
        });

        res.json({
            code: 'vitruveo.studio.api.assets.slideshow.success',
            message: 'Reader slideshow success',
            transaction: nanoid(),
            data: { slideshow },
        } as APIResponse);
    } catch (error) {
        logger('Reader get slideshow failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.slideshow.get.failed',
            message: `Reader get slideshow failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get(
    '/printOutputGenerator/:id',
    checkAssetExists,
    checkSourceExists,
    checkPrintOutputExists,
    async (req, res) => {
        try {
            const { source } = req.query as { source: string };
            const { asset, sourceKey } = res.locals;

            res.setHeader('Cache-Control', 'public, max-age=604800');
            res.setHeader(
                'Expires',
                new Date(Date.now() + 604800000).toUTCString()
            );
            res.setHeader('Content-Type', 'image/jpeg');

            const outputStream = new PassThrough();

            pipeline(outputStream, res).catch((err) => {
                logger('Error in output stream pipeline: %O', err);
            });

            const printGeneratorPath = path.join(
                __dirname,
                NODE_ENV === 'dev'
                    ? '../utils/printGenerator/event.ts'
                    : '../utils/printGenerator/event.js'
            );

            const child = fork(printGeneratorPath);

            const imageBuffer: Buffer[] = [];

            child.on('message', (message) => {
                const { type, data, error } = message as any;
                if (type === 'data') {
                    const chunk = Buffer.from(data);
                    imageBuffer.push(chunk);
                    outputStream.write(chunk);
                } else if (type === 'end') {
                    outputStream.end();
                    const finalBuffer = Buffer.concat(imageBuffer);
                    sendToExchangePrintOutputs(
                        JSON.stringify({
                            buffer: finalBuffer,
                            key: sourceKey,
                        })
                    );
                } else if (type === 'error') {
                    logger('Error in child process: %O', error);
                    outputStream.end();
                    res.status(500).end();
                }
            });

            child.on('error', (err) => {
                logger('Child process error: %O', err);
                outputStream.end();
                res.status(500).end();
            });

            res.on('close', () => {
                child.send({
                    action: 'end',
                });
                child.removeAllListeners();
            });

            try {
                child.send({
                    assetPath: asset.formats.exhibition?.path,
                    source,
                    action: 'render',
                });
            } catch (fetchError) {
                logger('Error loading images: %O', fetchError);
                outputStream.end();
                res.status(500).json({
                    code: 'vitruveo.studio.api.assets.printOutputGenerator.failed',
                    message: `Failed to load images: ${fetchError}`,
                    args: fetchError,
                    transaction: nanoid(),
                } as APIResponse);
            }
        } catch (error) {
            logger('Error generating print output for asset: %O', error);

            res.status(500).json({
                code: 'vitruveo.studio.api.assets.printOutputGenerator.failed',
                message: `Failed to generate print output for asset: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post('/generator/pack', async (req, res) => {
    try {
        const { ids } = req.body as { ids: string[] };

        if (!ids || ids.length === 0) {
            res.status(400).json({
                code: 'vitruveo.studio.api.pack.get.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }
        if (ids.length > GENERATE_PACK_LIMIT) {
            ids.slice(0, GENERATE_PACK_LIMIT);
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=pack.zip');

        const assetsForStorePack = await model.findAssetsForStorePack({
            query: { _id: { $in: ids.map((item) => new ObjectId(item)) } },
        });

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);

        const data: StorePackItem[] = await Promise.all(
            assetsForStorePack.map(async (item) => {
                let avatar = `${GENERAL_STORAGE_URL}/xibit-icon.png`;

                if (item.creator.avatar) {
                    const avatarPath = `${GENERAL_STORAGE_URL}/${item.creator.avatar}`;
                    const isvalidAvatar = await validatePath(avatarPath);
                    avatar = isvalidAvatar ? avatarPath : avatar;
                }

                return {
                    id: item._id,
                    path: `${ASSET_STORAGE_URL}/${item.formats.exhibition?.path}`,
                    title: item.assetMetadata.context.formData.title,
                    username: item.creator.username,
                    avatar,
                    qrCode: `${SEARCH_URL}/${item._id}/go`,
                    logo: `${GENERAL_STORAGE_URL}/xibit-logo.png`,
                };
            })
        );

        const childCount = os.cpus().length;
        const chunks = splitIntoChunks(data, childCount);

        let completedTasks = 0;
        let allResults: { buffer: Buffer; id: string }[] = [];

        chunks.forEach((chunk) => {
            if (chunk.length === 0) return;

            const child = fork(
                join(
                    __dirname,
                    NODE_ENV === 'dev'
                        ? '../../../services/pack/index.ts'
                        : '../../../services/pack/index.js'
                )
            );

            child.send({ data: chunk });

            child.on('message', (message) => {
                const { type, data: bufferResponse, error } = message as any;

                if (type === 'complete') {
                    allResults = [...allResults, ...bufferResponse];
                    completedTasks += 1;

                    if (
                        completedTasks ===
                        chunks.filter((c) => c.length > 0).length
                    ) {
                        allResults.forEach((buffer) => {
                            const bufferData =
                                buffer.buffer instanceof Buffer
                                    ? buffer.buffer
                                    : Buffer.from(buffer.buffer);
                            archive.append(bufferData, {
                                name: `${buffer.id}.png`,
                            });
                        });
                        archive.finalize();
                    }
                    child.kill();
                }

                if (type === 'error') {
                    logger('Pack error: %O', error);
                    res.status(500).end();
                    child.kill();
                }
            });

            child.on('error', (error) => {
                logger('Child process error: %O', error);
                res.status(500).end();
                child.kill();
            });
        });
    } catch (error) {
        logger('Reader get pack failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.pack.get.failed',
            message: `Reader get pack failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
