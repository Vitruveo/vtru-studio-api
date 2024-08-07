import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { ObjectId, Sort } from 'mongodb';
import * as model from '../model';
import * as creatorModel from '../../creators/model';
import { APIResponse } from '../../../services';
import {
    CarouselResponse,
    QueryCollectionParams,
    QueryPaginatedParams,
    ResponseAssetsPaginated,
} from './types';
import { FindAssetsCarouselParams } from '../model/types';

// this is used to filter assets that are not ready to be shown
export const conditionsToShowAssets = {
    'consignArtwork.status': 'active',
    'contractExplorer.explorer': {
        $exists: true,
    },
    'licenses.nft.added': true,
    'formats.preview.path': {
        $exists: true,
        $ne: null,
    },
};

const logger = debug('features:assets:controller:public');
const route = Router();

// TODO: ALTERAR COMPLETAMENTE FORMA DE BUSCA DE ASSETS E FILTRAR
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
        } = req.query as unknown as QueryPaginatedParams;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);
        const showAdditionalAssetsValue = showAdditionalAssets === 'true';

        if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.search.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const parsedQuery = {
            ...query,
            ...conditionsToShowAssets,
        };

        if (showAdditionalAssetsValue) {
            delete parsedQuery['consignArtwork.status'];

            if (parsedQuery.$or) {
                parsedQuery.$or.push(
                    {
                        'consignArtwork.status': 'active',
                    },
                    {
                        'consignArtwork.status': 'blocked',
                    }
                );
            } else {
                parsedQuery.$or = [
                    {
                        'consignArtwork.status': 'active',
                    },
                    {
                        'consignArtwork.status': 'blocked',
                    },
                ];
            }
        }

        if (
            maxPrice &&
            minPrice &&
            Number(minPrice) >= 0 &&
            Number(maxPrice) > 0
        ) {
            parsedQuery.$and = [
                {
                    $or: [
                        {
                            'licenses.nft.elastic.editionPrice': {
                                $gte: Number(minPrice),
                                $lte: Number(maxPrice),
                            },
                            'licenses.nft.editionOption': 'elastic',
                        },
                        {
                            'licenses.nft.single.editionPrice': {
                                $gte: Number(minPrice),
                                $lte: Number(maxPrice),
                            },
                            'licenses.nft.editionOption': 'single',
                        },
                        {
                            'licenses.nft.unlimited.editionPrice': {
                                $gte: Number(minPrice),
                                $lte: Number(maxPrice),
                            },
                            'licenses.nft.editionOption': 'unlimited',
                        },
                    ],
                },
            ];

            if (name) {
                parsedQuery.$and.push({
                    $or: [
                        {
                            'assetMetadata.context.formData.title': {
                                $regex: name,
                                $options: 'i',
                            },
                        },
                        {
                            'assetMetadata.context.formData.description': {
                                $regex: name,
                                $options: 'i',
                            },
                        },
                        {
                            'assetMetadata.creators.formData': {
                                $elemMatch: {
                                    name: {
                                        $regex: name,
                                        $options: 'i',
                                    },
                                },
                            },
                        },
                    ],
                });
            }
        } else if (name) {
            if (parsedQuery.$or) {
                parsedQuery.$or.push(
                    {
                        'assetMetadata.context.formData.title': {
                            $regex: name,
                            $options: 'i',
                        },
                    },
                    {
                        'assetMetadata.context.formData.description': {
                            $regex: name,
                            $options: 'i',
                        },
                    },
                    {
                        'assetMetadata.creators.formData': {
                            $elemMatch: {
                                name: {
                                    $regex: name,
                                    $options: 'i',
                                },
                            },
                        },
                    }
                );
            } else {
                parsedQuery.$or = [
                    {
                        'assetMetadata.context.formData.title': {
                            $regex: name,
                            $options: 'i',
                        },
                    },
                    {
                        'assetMetadata.context.formData.description': {
                            $regex: name,
                            $options: 'i',
                        },
                    },
                    {
                        'assetMetadata.creators.formData': {
                            $elemMatch: {
                                name: {
                                    $regex: name,
                                    $options: 'i',
                                },
                            },
                        },
                    },
                ];
            }
        }

        let sortQuery: Sort = {};

        switch (sort?.order) {
            case 'priceHighToLow':
                sortQuery = {
                    'licenses.nft.single.editionPrice': -1,
                };
                break;
            case 'priceLowToHigh':
                sortQuery = {
                    'licenses.nft.single.editionPrice': 1,
                };
                break;
            case 'creatorAZ':
                sortQuery = {
                    insensitiveCreator: 1,
                };
                break;
            case 'creatorZA':
                sortQuery = {
                    insensitiveCreator: -1,
                };
                break;
            case 'consignNewToOld':
                sortQuery = { 'consignArtwork.listing': -1 };
                break;
            case 'consignOldToNew':
                sortQuery = { 'consignArtwork.listing': 1 };
                break;
            default:
                sortQuery = {
                    'consignArtwork.status': 1,
                    'licenses.nft.availableLicenses': -1,
                    'consignArtwork.listing': -1,
                };
                break;
        }
        sortQuery =
            sort?.isIncludeSold === 'true'
                ? sortQuery
                : { 'licenses.nft.availableLicenses': -1, ...sortQuery };

        let filterColors: number[][] = [];

        if (query['assetMetadata.context.formData.colors']?.$in) {
            const colors = query['assetMetadata.context.formData.colors']
                .$in as string[][];

            filterColors = colors.map((color) =>
                color.map((rgb) => parseInt(rgb, 10))
            );

            delete parsedQuery['assetMetadata.context.formData.colors'];
        }

        const maxAssetPrice = await model.findMaxPrice();

        if (parsedQuery?._id?.$in) {
            parsedQuery._id.$in = parsedQuery._id.$in.map(
                (id: string) => new ObjectId(id)
            );
        }

        const result = await model.countAssets({
            query: parsedQuery,
            colors: filterColors,
            precision: Number(precision),
        });

        const total = result[0]?.count ?? 0;

        const totalPage = Math.ceil(total / limitNumber);

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
        const { name } = req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.collections.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const collections = await model.findAssetsCollections({ name });

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
        const { name } = req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.subjects.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const subjects = await model.findAssetsSubjects({ name });

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
        const { name } = req.query as unknown as QueryCollectionParams;

        if (name.trim().length < 3) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.creators.invalidParams',
                message: 'Invalid params',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creators = await model.findAssetsByCreatorName({ name });

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

route.get('/lastSold', async (req, res) => {
    try {
        const assets = await model.findLastSoldAssets();

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

export { route };
