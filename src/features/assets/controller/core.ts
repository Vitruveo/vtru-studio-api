import debug from 'debug';
import fs from 'fs/promises';
import { join, parse } from 'path';
import { customAlphabet, nanoid } from 'nanoid';
import { Request, Router } from 'express';
import * as model from '../model';
import { middleware } from '../../users';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    ObjectId,
    UpdateResult,
} from '../../../services';
import {
    needsToBeOwner,
    validateParamsId,
    validateQueries,
} from '../../common/rules';
import {
    validateBodyForCreate,
    validateBodyForDeleteFile,
    validateBodyForUpdate,
    validateBodyForUpdateManyStatus,
    validateBodyForUpdateStatus,
    validateBodyForUpdateStep,
} from './rules';
import { sendToExchangeCreators } from '../../creators/upload';
import { handleExtractColor } from '../../../services/extractColor';
import { ASSET_STORAGE_URL, ASSET_TEMP_DIR } from '../../../constants';
import { download } from '../../../services/stream';

const logger = debug('features:assets:controller');
const route = Router();

const tempFilename = customAlphabet('1234567890abcdefg', 10);

route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    try {
        const assets = await model.findAssetsByCreatorId({ id: req.auth.id });

        res.json({
            code: 'vitruveo.studio.api.assets.reader.success',
            message: 'Reader success',
            transaction: nanoid(),
            data: assets,
        } as APIResponse<model.AssetsDocument[]>);
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

route.get('/creatorMy', validateQueries, async (req, res) => {
    try {
        const asset = await model.findAssetCreatedBy({ id: req.auth.id });

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

route.get('/:id', validateParamsId, async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.reader.one.notFound',
                message: 'Reader one not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
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
        } | null = null;

        if (req.body.cloneId) {
            const asset = await model.findAssetsById({
                id: req.body.cloneId,
            });

            if (asset) {
                asset.actions = asset.actions || { countClone: 0 };
                asset.actions.countClone += 1;

                await model.updateAssets({
                    id: asset._id,
                    asset: { actions: asset.actions },
                });

                clone = {
                    assetMetadata: asset?.assetMetadata,
                    licenses: asset?.licenses,
                    terms: asset?.terms,
                };
                clone.assetMetadata.context.formData.title += ` ${asset.actions.countClone}`;
                clone.licenses.print.added = false;
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

route.delete('/:id/form', async (req, res) => {
    try {
        await model.deleteAssets({ id: req.params.id });

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

route.put('/:id/form', validateBodyForUpdateStep, async (req, res) => {
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
});

route.delete(
    '/request/deleteFile',
    validateBodyForDeleteFile,
    async (req, res) => {
        const transactionApiId = nanoid();

        try {
            const { id } = req.auth;

            const assetsByCreatorId = await model.findOneAssets({
                query: { 'framework.createdBy': id },
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

                if (checkDeleteKeys.length === 0) {
                    res.status(404).json({
                        code: 'vitruveo.studio.api.admin.assets.request.deleteFiles.notFound',
                        message: 'Asset not found',
                        transaction: transactionApiId,
                    } as APIResponse);
                    return;
                }

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

export { route };
