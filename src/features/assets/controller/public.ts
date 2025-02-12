import debug from 'debug';
import { readFile } from 'fs/promises';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { join } from 'path';
import * as model from '../model';
import * as creatorModel from '../../creators/model';
import { APIResponse } from '../../../services';
import {
    ArtistSpotlight,
    CarouselResponse,
    QueryCollectionParams,
    QueryPaginatedParams,
    ResponseAssetsPaginated,
    Spotlight,
} from './types';
import { FindAssetsCarouselParams } from '../model/types';
import {
    queryByPrice,
    queryByTitleOrDescOrCreator,
    querySortSearch,
    querySortGroupByCreator,
} from '../utils/queries';
import { DIST } from '../../../constants/static';

// this is used to filter assets that are not ready to be shown
export const conditionsToShowAssets = {
    'consignArtwork.status': 'active',
    'contractExplorer.explorerUrl': {
        $exists: true,
    },
    'licenses.nft.added': true,
    'formats.preview.path': {
        $exists: true,
        $ne: null,
    },
};

const groupedOptions = ['all', 'noSales'];

const logger = debug('features:assets:controller:public');
const route = Router();

route.get('/groupByCreator', async (req, res) => {
    try {
        const {
            query = {} as any,
            page = 1,
            limit = 10,
            name,
            sort,
            hasBts,
            hasNftAutoStake,
        } = req.query as unknown as {
            query: Record<string, unknown>;
            page: string;
            limit: string;
            name: string;
            sort: QueryPaginatedParams['sort'];
            hasBts: string;
            hasNftAutoStake: boolean;
        };

        const pageNumber = Number(page);
        let limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // limit the number of assets to 200
        if (limitNumber > 200) {
            limitNumber = 200;
        }

        const parsedQuery = {
            ...query,
            ...conditionsToShowAssets,
        };

        const addSearchByTitleDescCreator = (param: string) => {
            const searchByTitleDescCreator = {
                $or: queryByTitleOrDescOrCreator({ name: param }),
            };
            if ('$and' in parsedQuery) {
                if (Array.isArray(parsedQuery.$and)) {
                    parsedQuery.$and.push(searchByTitleDescCreator);
                }
            } else {
                parsedQuery.$and = [searchByTitleDescCreator];
            }
        };

        if (name) addSearchByTitleDescCreator(name);

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortGroupByCreator(sort, hasBts);

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

        if (hasBts === 'yes') {
            const btsConditions = [
                { 'mediaAuxiliary.formats.btsImage': { $ne: null } },
                { 'mediaAuxiliary.formats.btsVideo': { $ne: null } },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(btsConditions)
                : btsConditions;
        }

        if (hasNftAutoStake) {
            parsedQuery.$and = parsedQuery.$and
                ? [...parsedQuery.$and, { 'licenses.nft.autoStake': true }]
                : [{ 'licenses.nft.autoStake': true }];
        }

        const grouped = groupedOptions.includes(query.grouped as string)
            ? (query.grouped as string)
            : 'all';

        delete parsedQuery.grouped;

        const assets = await model.findAssetGroupPaginated({
            query: parsedQuery,
            limit: limitNumber,
            skip: (pageNumber - 1) * limitNumber,
            sort: sortQuery,
            grouped,
        });

        const total = await model.countAssetsGroup({
            query: parsedQuery,
            grouped,
        });

        const totalPage = Math.ceil(total.length / limitNumber);

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                page: pageNumber,
                totalPage,
                total: total.length,
                limit: limitNumber,
            },
        } as APIResponse);
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

route.post('/groupByCreator', async (req, res) => {
    try {
        const {
            query = {} as any,
            page = 1,
            limit = 10,
            name,
            sort,
            hasBts,
            hasNftAutoStake,
        } = req.body as unknown as {
            query: Record<string, unknown>;
            page: string;
            limit: string;
            name: string;
            sort: QueryPaginatedParams['sort'];
            hasBts: string;
            hasNftAutoStake: boolean;
        };

        const pageNumber = Number(page);
        let limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // limit the number of assets to 200
        if (limitNumber > 200) {
            limitNumber = 200;
        }

        const parsedQuery = {
            ...query,
            ...conditionsToShowAssets,
        };

        const addSearchByTitleDescCreator = (param: string) => {
            const searchByTitleDescCreator = {
                $or: queryByTitleOrDescOrCreator({ name: param }),
            };
            if ('$and' in parsedQuery) {
                if (Array.isArray(parsedQuery.$and)) {
                    parsedQuery.$and.push(searchByTitleDescCreator);
                }
            } else {
                parsedQuery.$and = [searchByTitleDescCreator];
            }
        };

        if (name) addSearchByTitleDescCreator(name);

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortGroupByCreator(sort, hasBts);

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

        if (hasBts === 'yes') {
            const btsConditions = [
                { 'mediaAuxiliary.formats.btsImage': { $ne: null } },
                { 'mediaAuxiliary.formats.btsVideo': { $ne: null } },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(btsConditions)
                : btsConditions;
        }

        if (hasNftAutoStake) {
            parsedQuery.$and = parsedQuery.$and
                ? [...parsedQuery.$and, { 'licenses.nft.autoStake': true }]
                : [{ 'licenses.nft.autoStake': true }];
        }

        const grouped = groupedOptions.includes(query.grouped as string)
            ? (query.grouped as string)
            : 'all';

        delete parsedQuery.grouped;

        const assets = await model.findAssetGroupPaginated({
            query: parsedQuery,
            limit: limitNumber,
            skip: (pageNumber - 1) * limitNumber,
            sort: sortQuery,
            grouped,
        });

        const total = await model.countAssetsGroup({
            query: parsedQuery,
            grouped,
        });

        const totalPage = Math.ceil(total.length / limitNumber);

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                page: pageNumber,
                totalPage,
                total: total.length,
                limit: limitNumber,
            },
        } as APIResponse);
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

route.get('/search', async (req, res) => {
    try {
        const {
            query = {} as any,
            page = 1,
            limit = 10,
            minPrice,
            maxPrice,
            name,
            sort,
            precision = '0.7',
            showAdditionalAssets,
            hasBts,
            hasNftAutoStake,
        } = req.query as unknown as QueryPaginatedParams;

        const pageNumber = Number(page);
        let limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // limit the number of assets to 200
        if (limitNumber > 200) {
            limitNumber = 200;
        }

        const parsedQuery = {
            ...query,
            ...conditionsToShowAssets,
        };

        if (showAdditionalAssets === 'true') {
            delete parsedQuery['consignArtwork.status'];
            const statusCondition = [
                { 'consignArtwork.status': 'active' },
                { 'consignArtwork.status': 'blocked' },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(statusCondition)
                : statusCondition;
        }

        const addSearchByTitleDescCreator = (param: string) => {
            const searchByTitleDescCreator = {
                $or: queryByTitleOrDescOrCreator({ name: param }),
            };
            if (parsedQuery.$and) {
                parsedQuery.$and.push(searchByTitleDescCreator);
            } else {
                parsedQuery.$and = [searchByTitleDescCreator];
            }
        };

        if (
            maxPrice &&
            minPrice &&
            Number(minPrice) >= 0 &&
            Number(maxPrice) > 0
        ) {
            parsedQuery.$and = [
                {
                    $or: queryByPrice({
                        min: Number(minPrice),
                        max: Number(maxPrice),
                    }),
                },
            ];

            if (name) addSearchByTitleDescCreator(name);
        } else if (name) {
            addSearchByTitleDescCreator(name);
        }

        let filterColors: number[][] = [];
        if (query['assetMetadata.context.formData.colors']?.$in) {
            const colors = query['assetMetadata.context.formData.colors']
                .$in as string[][];
            filterColors = colors.map((color) =>
                color.map((rgb) => parseInt(rgb, 10))
            );
            delete parsedQuery['assetMetadata.context.formData.colors'];
        }

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

        if (hasBts === 'yes') {
            const btsConditions = [
                { 'mediaAuxiliary.formats.btsImage': { $ne: null } },
                { 'mediaAuxiliary.formats.btsVideo': { $ne: null } },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(btsConditions)
                : btsConditions;
        }

        if (hasNftAutoStake) {
            parsedQuery.$and = parsedQuery.$and
                ? [...parsedQuery.$and, { 'licenses.nft.autoStake': true }]
                : [{ 'licenses.nft.autoStake': true }];
        }

        const maxAssetPrice = await model.findMaxPrice();

        if (parsedQuery?._id?.$in)
            parsedQuery._id.$in = parsedQuery._id.$in.map(
                (id: string) => new ObjectId(id)
            );

        const result = await model.countAssets({
            query: parsedQuery,
            colors: filterColors,
            precision: Number(precision),
        });

        const total = result[0]?.count ?? 0;

        const totalPage = Math.ceil(total / limitNumber);

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortSearch(sort, hasBts);

        const assets = await model.findAssetsPaginated({
            query: parsedQuery,
            skip: (pageNumber - 1) * limitNumber,
            limit: limitNumber,
            sort: sortQuery,
            colors: filterColors,
            precision: Number(precision),
        });

        const tags = await model.findAssetsTags({ query: parsedQuery });

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                tags,
                page: pageNumber,
                totalPage,
                total,
                limit: limitNumber,
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

route.post('/search', async (req, res) => {
    try {
        const {
            query = {} as any,
            page = 1,
            limit = 10,
            minPrice,
            maxPrice,
            name,
            sort,
            precision = '0.7',
            showAdditionalAssets,
            hasBts,
            hasNftAutoStake,
        } = req.body as unknown as QueryPaginatedParams;

        const pageNumber = Number(page);
        let limitNumber = Number(limit);

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // limit the number of assets to 200
        if (limitNumber > 200) {
            limitNumber = 200;
        }

        const parsedQuery = {
            ...query,
            ...conditionsToShowAssets,
        };

        if (showAdditionalAssets === 'true') {
            delete parsedQuery['consignArtwork.status'];
            const statusCondition = [
                { 'consignArtwork.status': 'active' },
                { 'consignArtwork.status': 'blocked' },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(statusCondition)
                : statusCondition;
        }

        const addSearchByTitleDescCreator = (param: string) => {
            const searchByTitleDescCreator = {
                $or: queryByTitleOrDescOrCreator({ name: param }),
            };
            if (parsedQuery.$and) {
                parsedQuery.$and.push(searchByTitleDescCreator);
            } else {
                parsedQuery.$and = [searchByTitleDescCreator];
            }
        };

        if (
            maxPrice &&
            minPrice &&
            Number(minPrice) >= 0 &&
            Number(maxPrice) > 0
        ) {
            parsedQuery.$and = [
                {
                    $or: queryByPrice({
                        min: Number(minPrice),
                        max: Number(maxPrice),
                    }),
                },
            ];

            if (name) addSearchByTitleDescCreator(name);
        } else if (name) {
            addSearchByTitleDescCreator(name);
        }

        let filterColors: number[][] = [];
        if (query['assetMetadata.context.formData.colors']?.$in) {
            const colors = query['assetMetadata.context.formData.colors']
                .$in as string[][];
            filterColors = colors.map((color) =>
                color.map((rgb) => parseInt(rgb, 10))
            );
            delete parsedQuery['assetMetadata.context.formData.colors'];
        }

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

        if (hasBts === 'yes') {
            const btsConditions = [
                { 'mediaAuxiliary.formats.btsImage': { $ne: null } },
                { 'mediaAuxiliary.formats.btsVideo': { $ne: null } },
            ];
            parsedQuery.$or = parsedQuery.$or
                ? parsedQuery.$or.concat(btsConditions)
                : btsConditions;
        }

        if (hasNftAutoStake) {
            parsedQuery.$and = parsedQuery.$and
                ? [...parsedQuery.$and, { 'licenses.nft.autoStake': true }]
                : [{ 'licenses.nft.autoStake': true }];
        }

        const maxAssetPrice = await model.findMaxPrice();

        if (parsedQuery?._id?.$in)
            parsedQuery._id.$in = parsedQuery._id.$in.map(
                (id: string) => new ObjectId(id)
            );

        const result = await model.countAssets({
            query: parsedQuery,
            colors: filterColors,
            precision: Number(precision),
        });

        const total = result[0]?.count ?? 0;

        const totalPage = Math.ceil(total / limitNumber);

        if ('mintExplorer.address' in parsedQuery && sort.order === 'latest') {
            sort.order = 'mintNewToOld';
        }

        const sortQuery = querySortSearch(sort, hasBts);

        const assets = await model.findAssetsPaginated({
            query: parsedQuery,
            skip: (pageNumber - 1) * limitNumber,
            limit: limitNumber,
            sort: sortQuery,
            colors: filterColors,
            precision: Number(precision),
        });

        const tags = await model.findAssetsTags({ query: parsedQuery });

        res.json({
            code: 'vitruveo.studio.api.assets.search.success',
            message: 'Reader search success',
            transaction: nanoid(),
            data: {
                data: assets,
                tags,
                page: pageNumber,
                totalPage,
                total,
                limit: limitNumber,
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

route.get('/collections', async (req, res) => {
    try {
        const { name, showAdditionalAssets } =
            req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.collections.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

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
});

route.get('/subjects', async (req, res) => {
    try {
        const { name, showAdditionalAssets } =
            req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.subjects.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

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
});

route.get('/creators', async (req, res) => {
    try {
        const { name, showAdditionalAssets } =
            req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.creators.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

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
});

route.post('/lastSold', async (req, res) => {
    try {
        const { query = {} as any } = req.body as unknown as {
            query: Record<string, unknown>;
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
        const { query = {} as any } = req.body as unknown as {
            query: Record<string, unknown>;
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

        response = payload.filter((asset) =>
            assets.some((v) => v._id.toString() === asset._id.toString())
        );

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

route.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const asset = await model.findAssetsById({ id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.get.notFound',
                message: 'Reader get asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

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

export { route };
