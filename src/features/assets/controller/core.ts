import debug from 'debug';
import fs from 'fs/promises';
import axios from 'axios';
import { z } from 'zod';
import { join, parse } from 'path';
import { customAlphabet, nanoid } from 'nanoid';
import { Request, Router } from 'express';

import * as model from '../model';
import * as modelRequestConsign from '../../requestConsign/model';
import * as modelCreator from '../../creators/model';
import { middleware } from '../../users';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    ObjectId,
    UpdateResult,
} from '../../../services';
import {
    mustBeOwner,
    needsToBeOwner,
    validateParamsId,
    validateQueries,
} from '../../common/rules';
import {
    validateBodyForCreate,
    validateBodyForDeleteFile,
    validateBodyForPatchAssetPrice,
    validateBodyForUpdate,
    validateBodyForUpdateManyNudity,
    validateBodyForUpdateManyStatus,
    validateBodyForUpdateStatus,
    validateBodyForUpdateStep,
    validateBodyForUpdateStoresVisibility,
} from './rules';
import { sendToExchangeCreators } from '../../creators/upload';
import { handleExtractColor } from '../../../services/extractColor';
import {
    ASSET_STORAGE_URL,
    ASSET_TEMP_DIR,
    BATCH_URL,
} from '../../../constants';
import { download } from '../../../services/stream';
import { schemaAssetUpdateManyNudity } from './schemas';
import {
    schemaValidationForPatchAssetPrice,
    schemaValidationForPatchPrintLicenseAdded,
    schemaValidationForPatchPrintLicensePrice,
} from './schemaValidate';
import { AssetsPaginatedResponse } from '../model/types';
import { querySortStudioCreatorById } from '../utils/queries';
import { StoresVisibilityBody } from './types';

const logger = debug('features:assets:controller');
const route = Router();

const tempFilename = customAlphabet('1234567890abcdefg', 10);

route.use(middleware.checkAuth);

const statusMapper = {
    draft: { contractExplorer: { $exists: false } },
    pending: {
        'consignArtwork.status': 'pending',
    },
    listed: {
        'consignArtwork.status': 'active',
        mintExplorer: { $exists: false },
    },
    sold: { mintExplorer: { $exists: true } },
    artcards: {
        'licenses.artCards.added': true,
        'licenses.artCards.status': 'approved',
    },
    all: {},
};

route.get('/', async (req, res) => {
    try {
        const creatorId = req.query?.creatorId as string;
        const status = req.query.status as keyof typeof statusMapper;
        const collection = req.query.collection as string;
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 24;
        const sort = req.query.sort as string;

        const query: any = {
            'framework.createdBy': creatorId || req.auth.id,
            ...(statusMapper[status] || statusMapper.all),
        };

        if (collection && collection !== 'all') {
            query['assetMetadata.taxonomy.formData.collections'] = {
                $elemMatch: { $eq: collection },
            };
        }

        if (creatorId && req.auth.type !== 'user') {
            res.status(403).json({
                code: 'vitruveo.studio.api.assets.reader.notAllowed',
                message: 'You are not allowed to read assets',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const sortQuery = querySortStudioCreatorById(sort);
        const total = await model.countAssetsByCreator({ query });
        const totalPage = Math.ceil(total / limit);

        const data = await model.findAssetsByCreatorIdPaginated({
            query,
            skip: (page - 1) * limit,
            limit,
            sort: sortQuery,
        });

        const collections = await model.findCollectionsByCreatorId({
            creatorId: creatorId || req.auth.id,
        });

        const licenseArtCards =
            await model.countAssetsWithLicenseArtCardsByCreator({
                creatorId: creatorId || req.auth.id,
            });

        res.json({
            code: 'vitruveo.studio.api.assets.reader.success',
            message: 'Reader success',
            transaction: nanoid(),
            data: {
                data,
                page,
                totalPage,
                total,
                limit,
                collection,
                collections,
                licenseArtCards,
            },
        } as APIResponse<AssetsPaginatedResponse>);
    } catch (error) {
        logger('Reader assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.reader.failed',
            message: `Reader failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/myAssets', validateQueries, async (req, res) => {
    try {
        let query = { 'framework.createdBy': req.auth.id } as any;
        const title = req.query?.title;
        if (title) {
            query = {
                ...query,
                $or: [
                    {
                        'assetMetadata.context.formData.title': {
                            $regex: title,
                            $options: 'i',
                        },
                    },
                    {
                        'assetMetadata.context.formData.description': {
                            $regex: title,
                            $options: 'i',
                        },
                    },
                ],
            };
        }

        const assets = await model.findMyAssets({ query });

        if (!assets) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.myAssets.failed',
                message: `Asset not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.myAssets.success',
            message: 'Reader success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<model.AssetsDocument[]>);
    } catch (error) {
        logger('Reader asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.myAssets.failed',
            message: `Reader failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/creatorMy', validateQueries, async (req, res) => {
    try {
        const query = { id: req.auth.id } as any;

        const asset = await model.findAssetCreatedBy(query);

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.creatorMy.failed',
                message: `Asset not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.creatorMy.success',
            message: 'Reader success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('Reader asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.creatorMy.failed',
            message: `Reader failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', mustBeOwner, validateParamsId, async (req, res) => {
    try {
        let asset = await model.findAssetsByIdFull({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.reader.one.notFound',
                message: 'Reader one not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // TODO: investigar por que as propriedades do campo terms esta sendo setado como falso
        if (asset?.consignArtwork && !asset?.terms?.contract) {
            await model.updateAssets({
                id: asset._id,
                asset: {
                    'terms.contract': true,
                    'terms.generatedArtworkAI': true,
                    'terms.isOriginal': true,
                    'terms.notMintedOtherBlockchain': true,
                },
            });

            asset = await model.findAssetsByIdFull({ id: req.params.id });
        }

        res.json({
            code: 'vitruveo.studio.api.admin.assets.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: asset,
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('Reader one assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', validateBodyForCreate, async (req, res) => {
    try {
        let clone: {
            assetMetadata: model.AssetsDocument['assetMetadata'];
            licenses: model.AssetsDocument['licenses'];
            terms: model.AssetsDocument['terms'];
            creator: model.AssetsDocument['creator'];
        } | null = null;

        if (req.body.cloneId) {
            const asset = await model.findAssetsById({
                id: req.body.cloneId,
            });

            if (asset) {
                if (!asset?.actions) {
                    asset.actions = { countClone: 0 };
                } else if (!asset.actions?.countClone) {
                    asset.actions.countClone = 0;
                }

                if (!asset?.creator) {
                    const creator = await modelCreator.findCreatorById({
                        id: req.auth.id,
                    });
                    asset.creator = { username: creator?.username || '' };
                }

                asset.actions.countClone += 1;

                await model.updateAssets({
                    id: asset._id,
                    asset: { actions: asset.actions },
                });

                clone = {
                    assetMetadata: asset?.assetMetadata,
                    licenses: asset?.licenses,
                    terms: asset?.terms,
                    creator: asset?.creator,
                };
                clone.assetMetadata.context.formData.title += ` ${asset.actions.countClone}`;
                // clone.licenses.print.added = false;
            }
        }

        const result = await model.createAssets({
            asset: {
                ...req.body,
                ...(clone && clone),
            },
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.AssetsDocument>>);
    } catch (error) {
        logger('create assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put(
    '/status',
    needsToBeOwner({ permissions: ['asset:admin'] }),
    validateBodyForUpdateManyStatus,
    async (req, res) => {
        const body = req.body as {
            ids: string[];
            status: string;
        };

        try {
            const result = await model.updateManyAssetsStatus({
                ids: body.ids,
                status: body.status,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.assets.updateStatus.success',
                message: 'Update status success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult>);
        } catch (error) {
            logger('Update status assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.updateStatus.failed',
                message: `Update status failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put('/changeAutoStakeInAllAssets', async (req, res) => {
    const body = req.body as {
        autoStake: boolean;
    };

    try {
        const result = await model.updateManyAssetsAutoStake({
            creatorId: req.auth.id,
            autoStake: body.autoStake,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.updateAutoStake.success',
            message: 'Update status success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult>);
    } catch (error) {
        logger('Update status assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.updateAutoStake.failed',
            message: `Update status failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put(
    '/:id/storesVisibility',
    validateBodyForUpdateStoresVisibility,
    async (req, res) => {
        const body = req.body as StoresVisibilityBody;
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.storesVisibility.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== req.auth.id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.assets.storesVisibility.notAllowed',
                message: 'You are not allowed to update stores visibility',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        try {
            const result = await model.updateStoresVisibility({
                id: req.params.id,
                stores: body,
            });

            res.json({
                code: 'vitruveo.studio.api.assets.storesVisibility.success',
                message: 'Update stores visibility success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult>);
        } catch (error) {
            logger('Update stores visibility failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.storesVisibility.failed',
                message: `Update stores visibility failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/nudity',
    needsToBeOwner({ permissions: ['asset:admin'] }),
    validateBodyForUpdateManyNudity,
    async (req, res) => {
        const body = req.body as z.infer<typeof schemaAssetUpdateManyNudity>;

        try {
            const result = await model.updateManyAssetsNudity({
                ids: body.ids,
                nudity: body.nudity,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.assets.updateNudity.success',
                message: 'Update nudity success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult>);
        } catch (error) {
            logger('Update nudity assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.updateNudity.failed',
                message: `Update nudity failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/:id/status',
    needsToBeOwner({ permissions: ['asset:admin'] }),
    validateBodyForUpdateStatus,
    async (req, res) => {
        try {
            const asset = await model.findAssetsById({
                id: req.params.id,
            });

            if (!asset) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.admin.assets.updateStatus.notFound',
                    message: 'Asset not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            const result = await model.updateAssets({
                id: asset._id,
                asset: { 'consignArtwork.status': req.body.status },
            });

            res.json({
                code: 'vitruveo.studio.api.admin.assets.updateStatus.success',
                message: 'Update status success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult>);
        } catch (error) {
            logger('Update status assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.updateStatus.failed',
                message: `Update status failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.put(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['asset:admin'] }),
    validateBodyForUpdate,
    async (req, res) => {
        try {
            const result = await model.updateAssets({
                id: req.params.id,
                asset: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.assets.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.AssetsDocument>>);
        } catch (error) {
            logger('Update assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.update.failed',
                message: `Update failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.delete(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['asset:admin'] }),
    async (req, res) => {
        try {
            const result = await model.deleteAssets({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.assets.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.delete.failed',
                message: `Delete failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.delete('/:id/form', mustBeOwner, async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.delete.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }
        if (
            asset.consignArtwork &&
            asset.consignArtwork.status !== 'rejected'
        ) {
            res.status(409).json({
                code: 'vitruveo.studio.api.admin.assets.delete.conflict',
                message: 'Asset conflict',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        await model.deleteAssets({ id: req.params.id });
        await modelRequestConsign.deleteRequestConsignByAsset({
            id: asset._id.toString(),
        });
        res.json({
            code: 'vitruveo.studio.api.admin.assets.delete.success',
            message: 'Delete success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Delete assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put(
    '/:id/form',
    mustBeOwner,
    validateBodyForUpdateStep,
    async (req, res) => {
        try {
            const assetsByCreatorId = await model.findOneAssets({
                query: { _id: new ObjectId(req.params.id) },
            });

            let result;

            if (!assetsByCreatorId) {
                result = await model.createAssets({ asset: req.body });
            } else {
                result = await model.updateAssets({
                    id: assetsByCreatorId._id,
                    asset: req.body,
                });
            }

            res.json({
                code: 'vitruveo.studio.api.admin.assets.updatStep.success',
                message: 'Update step success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<InsertOneResult | UpdateResult>);
        } catch (error) {
            logger('Update step assets failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.updatStep.failed',
                message: `Update step failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get('/:id/isLicenseEditable', async (req, res) => {
    try {
        const { id } = req.auth;
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.price.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.admin.assets.price.notAllowed',
                message: 'You are not allowed to update price',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const response = await axios.get(
            `${BATCH_URL}/assets/isLicenseEditable/${asset._id.toString()}`
        );

        if (response.status !== 200) {
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.price.failed',
                message: `Get isLicenseEditable failed: ${response.data}`,
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.assets.price.success',
            message: 'Get isLicenseEditable success',
            transaction: nanoid(),
            data: response.data.data,
        } as APIResponse);
    } catch (error) {
        logger('Get isLicenseEditable assets failed: %O', error);
        res.status(400).json({
            code: 'vitruveo.studio.api.admin.assets.price.failed',
            message: `Get isLicenseEditable failed: ${error}`,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch('/:id/price', validateBodyForPatchAssetPrice, async (req, res) => {
    try {
        const { id } = req.auth;
        const { price } = req.body as z.infer<
            typeof schemaValidationForPatchAssetPrice
        >;

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.price.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.admin.assets.price.notAllowed',
                message: 'You are not allowed to update price',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const response = await axios.patch(
            `${BATCH_URL}/assets/updatedLicensePrice`,
            {
                assetKey: asset._id.toString(),
                editionPrice: price,
            }
        );

        if (response.status !== 200) {
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.price.failed',
                message: `Update price failed: ${response.data}`,
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const result = await model.updateAssets({
            id: asset._id,
            asset: {
                'licenses.nft.single.editionPrice': price,
            },
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.price.success',
            message: 'Update price success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult>);
    } catch (error) {
        logger('Update price assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.price.failed',
            message: `Update price failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.delete(
    '/request/deleteFile/:assetId',
    validateBodyForDeleteFile,
    async (req, res) => {
        const transactionApiId = nanoid();

        try {
            const { id } = req.auth;

            const assetsByCreatorId = await model.findOneAssets({
                query: { _id: new ObjectId(req.params.assetId) },
            });

            if (assetsByCreatorId) {
                const deleteKeys = req.body.deleteKeys as string[];
                const checkDeleteKeys = deleteKeys.filter(
                    (v) =>
                        assetsByCreatorId.uploadedMediaKeys?.includes(v) ||
                        Object.values(assetsByCreatorId?.formats || {}).some(
                            (f) => f?.path === v
                        ) ||
                        Object.values(
                            assetsByCreatorId.mediaAuxiliary?.formats || {}
                        ).some((f) => f?.path === v)
                );

                if (checkDeleteKeys.length > 0) {
                    await sendToExchangeCreators(
                        JSON.stringify({
                            creatorId: id,
                            origin: 'asset',
                            method: 'DELETE',
                            deleteKeys: checkDeleteKeys,
                        })
                    );

                    await model.removeUploadedMediaKeys({
                        id: assetsByCreatorId._id,
                        mediaKeys: checkDeleteKeys,
                    });
                }

                res.json({
                    code: 'vitruveo.studio.api.admin.assets.request.deleteFiles.success',
                    message: 'Asset request delete success',
                    transaction: transactionApiId,
                    data: 'request requested, wait for the URL to delete',
                } as APIResponse<string>);
            } else {
                res.status(404).json({
                    code: 'vitruveo.studio.api.admin.assets.request.deleteFiles.notFound',
                    message: 'Asset not found',
                    transaction: transactionApiId,
                } as APIResponse);
            }
        } catch (error) {
            logger('Asset request delete failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.assets.request.deleteFiles.failed',
                message: `Asset request delete failed: ${error}`,
                args: error,
                transaction: transactionApiId,
            } as APIResponse);
        }
    }
);

route.post('/request/upload/:id', async (req, res) => {
    const transactionApiId = nanoid();

    try {
        const { mimetype, transactionId, metadata } = req.body;

        const { id } = req.auth;

        const extension = mimetype.split('/')[1];
        const path = `${id}/${new Date().getTime()}.${extension}`;

        await sendToExchangeCreators(
            JSON.stringify({
                path,
                creatorId: id,
                transactionId,
                metadata,
                origin: 'asset',
                method: 'PUT',
            })
        );

        const assetsByCreatorId = await model.findOneAssets({
            query: { _id: new ObjectId(req.params.id) },
        });

        if (assetsByCreatorId) {
            await model.updateUploadedMediaKeys({
                id: assetsByCreatorId._id,
                mediaKey: path,
            });
        }

        res.json({
            code: 'vitruveo.studio.api.assets.request.upload.success',
            message: 'Asset request upload success',
            transaction: transactionApiId,
            data: 'request requested, wait for the URL to upload',
        } as APIResponse<string>);
    } catch (error) {
        logger('Asset request upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.request.upload.failed',
            message: `Asset request upload failed: ${error}`,
            args: error,
            transaction: transactionApiId,
        } as APIResponse);
    }
});

route.get('/:id/colors', async (req: Request<{ id: string }>, res) => {
    const files: Record<string, string> = {};
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write(`event: start_processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        const asset = await model.findAssetsById({ id: req.params.id });
        if (!asset) {
            throw new Error('asset_not_found');
        }

        if (asset.framework.createdBy !== req.auth.id) {
            throw new Error('creator_not_found');
        }

        if (!asset.formats?.original?.path) {
            throw new Error('asset_file_not_found');
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: values are being processed\n\n`);

        const { path } = asset.formats.original;

        const url = `${ASSET_STORAGE_URL}/${path}`;
        const parsedPath = parse(path);

        // create temp dir
        await fs.mkdir(ASSET_TEMP_DIR, { recursive: true });

        const filename = join(
            ASSET_TEMP_DIR,
            `${tempFilename()}${parsedPath.ext}`
        );

        await download({ path: filename, url });
        files[filename] = filename;

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: file downloaded\n\n`);

        const sharp = await import('sharp');

        // resize image  down and transform image jpeg
        const buffer = await sharp
            .default(filename)
            .resize(100)
            .jpeg({ quality: 80 })
            .toBuffer();
        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: file resized\n\n`);

        const newFilename = join(ASSET_TEMP_DIR, `${tempFilename()}.jpeg`);
        files[newFilename] = newFilename;

        await fs.writeFile(newFilename, buffer);
        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: file writed\n\n`);

        const colors = await handleExtractColor({ filename: newFilename });

        res.write(`event: extract_color_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${JSON.stringify(colors)}\n\n`);
    } catch (error) {
        logger('Extract color failed: %O', error);

        res.write(`event: extract_color_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);
    } finally {
        await Promise.all(
            Object.values(files).map((fileName) =>
                fs.unlink(fileName).catch(() => {})
            )
        );
        res.end();
    }
});

route.patch('/:id/printLicense/price', async (req, res) => {
    try {
        const { id } = req.auth;
        const { merchandisePrice, displayPrice } = req.body as z.infer<
            typeof schemaValidationForPatchPrintLicensePrice
        >;

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.price.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.admin.assets.price.notAllowed',
                message: 'You are not allowed to update price',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const result = await model.updateAssets({
            id: asset._id,
            asset: {
                'licenses.print.merchandisePrice': merchandisePrice,
                'licenses.print.displayPrice': displayPrice,
            },
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.price.success',
            message: 'Update price success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult>);
    } catch (error) {
        logger('Update price assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.price.failed',
            message: `Update price failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch('/:id/printLicense/added', async (req, res) => {
    try {
        const { id } = req.auth;
        const { added } = req.body as z.infer<
            typeof schemaValidationForPatchPrintLicenseAdded
        >;

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.price.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (asset.framework.createdBy !== id) {
            res.status(403).json({
                code: 'vitruveo.studio.api.admin.assets.price.notAllowed',
                message: 'You are not allowed to update price',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const result = await model.updateAssets({
            id: asset._id,
            asset: {
                'licenses.print.added': added,
            },
        });

        res.json({
            code: 'vitruveo.studio.api.admin.assets.price.success',
            message: 'Update added success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult>);
    } catch (error) {
        logger('Update price assets failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.assets.price.failed',
            message: `Update price failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
