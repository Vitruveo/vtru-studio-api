/* eslint-disable @typescript-eslint/no-unused-vars */
import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import * as modelAssets from '../../assets/model';
import * as modelCreator from '../../creators/model';
import * as modelUsers from '../../users/model';
import { middleware } from '../../users';
import { mustBeOwner, needsToBeOwner } from '../../common/rules';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    ObjectId,
    UpdateResult,
} from '../../../services';
import {
    validateBodyForPatch,
    validateBodyForPatchComments,
    validateBodyForPatchCommentsVisibility,
} from './rules';
import { sendToExchangeMail } from '../../../services/mail';
import {
    ASSET_STORAGE_URL,
    MAIL_SENDGRID_TEMPLATE_CONSIGN_REJECTED,
} from '../../../constants';
import { RequestConsignsPaginatedResponse } from '../model/types';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const data = await model.findRequestConsignsById({ id });

        if (!data) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Get request consign success',
            transaction: nanoid(),
            data,
        } as APIResponse<model.RequestConsign>);
    } catch (error) {
        logger('Get request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Get request consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const total = await model.countRequestConsigns({
            query: { status, search },
        });
        const data = await model.findRequestConsignsPaginated({
            query: { status, search },
            limit,
            skip: (page - 1) * limit,
            sort: { when: 1 },
        });

        const totalPage = Math.ceil(total / limit);

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Get request consigns success',
            transaction: nanoid(),
            data: {
                data,
                page,
                totalPage,
                total,
                limit,
            },
        } as APIResponse<RequestConsignsPaginatedResponse>);
    } catch (error) {
        logger('Get request consigns failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Get request consigns failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/:assetId', mustBeOwner, async (req, res) => {
    try {
        const { id } = req.auth;
        const alreadyExists = await model.findRequestConsignsByCreator({
            creator: id,
            assetId: req.params.assetId,
        });
        if (
            alreadyExists &&
            !['draft', 'error'].includes(alreadyExists.status)
        ) {
            res.status(409).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign already exists',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const asset = await modelAssets.findOneAssets({
            query: {
                _id: new ObjectId(req.params.assetId),
            },
        });
        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const requestConsign = model.RequestConsignSchema.parse({
            asset: asset._id.toString(),
            creator: id,
        });

        if (alreadyExists) {
            await model.updateRequestConsign({
                id: alreadyExists._id,
                requestConsign: { status: 'pending' },
            });
        } else {
            await model.createRequestConsign({ requestConsign });
        }

        await modelAssets.updateAssets({
            id: asset._id,
            asset: {
                consignArtwork: {
                    status: 'pending',
                },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Create request consign success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Create request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Create request Consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.patch(
    '/:id',
    needsToBeOwner({ permissions: ['moderator:admin'] }),
    validateBodyForPatch,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status, logs } = req.body;

            const requestConsign = await model.findRequestConsignsById({ id });

            if (!requestConsign) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.requestConsign.failed',
                    message: 'Request consign not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            const result = await model.updateRequestConsign({
                id,
                requestConsign: {
                    status,
                    ...(logs && { logs }),
                },
            });

            if (status !== 'approved') {
                await modelAssets.updateAssets({
                    id: requestConsign.asset.toString(),
                    asset: {
                        consignArtwork: { status },
                    },
                });
            }

            if (status === 'rejected') {
                const creator = await modelCreator.findCreatorById({
                    id: requestConsign.creator,
                });
                const asset = await modelAssets.findAssetsById({
                    id: requestConsign.asset.toString(),
                });

                if (
                    creator &&
                    Array.isArray(creator.emails) &&
                    creator.emails.length > 0
                ) {
                    await sendToExchangeMail(
                        JSON.stringify({
                            template: MAIL_SENDGRID_TEMPLATE_CONSIGN_REJECTED,
                            to: creator.emails[0].email,
                            title: asset?.assetMetadata.context.formData.title,
                            creator: creator.username,
                            thumbnail: `${ASSET_STORAGE_URL}/${
                                asset?.formats.original?.path.replace(
                                    /\.(\w+)$/,
                                    '_thumb.jpg'
                                ) || ''
                            }`,
                        })
                    );
                }
            }

            res.json({
                code: 'vitruveo.studio.api.requestConsign.success',
                message: 'Update request consign success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.RequestConsignDocument>>);
        } catch (error) {
            logger('Update request consign failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: `Update request consign failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.patch(
    '/comments/:id',
    needsToBeOwner({ permissions: ['moderator:admin'] }),
    validateBodyForPatchComments,
    async (req, res) => {
        try {
            const logged = req.auth;
            const { id } = req.params;
            const { comment } = req.body;

            const requestConsign = await model.findRequestConsignsById({ id });
            if (!requestConsign) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.requestConsign.failed',
                    message: 'Request consign not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            const user = await modelUsers.findUserById({ id: logged.id });
            if (!user) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.requestConsign.failed',
                    message: 'User not found',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            const comments = Array.isArray(requestConsign.comments)
                ? requestConsign.comments
                : [];

            const data = {
                id: new ObjectId().toString(),
                username: user.name,
                comment,
                when: new Date().toISOString(),
                isPublic: false,
            };

            await model.updateRequestConsign({
                id,
                requestConsign: {
                    comments: [...comments, data],
                },
            });

            res.json({
                code: 'vitruveo.studio.api.requestConsign.success',
                message: 'Update request consign comments success',
                transaction: nanoid(),
                data,
            } as APIResponse);
        } catch (error) {
            logger('Update request consign comments failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: `Update request consign comments failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.patch(
    '/comments/:id/visibility',
    needsToBeOwner({ permissions: ['moderator:admin'] }),
    validateBodyForPatchCommentsVisibility,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { isPublic, commentId } = req.body;

            await model.updateCommentVisibility({
                id,
                commentId,
                isPublic,
            });

            res.json({
                code: 'vitruveo.studio.api.requestConsign.success',
                message: 'Update request consign comments visibility success',
                transaction: nanoid(),
            } as APIResponse);
        } catch (error) {
            logger(
                'Update request consign comments visibility failed: %O',
                error
            );
            res.status(500).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: `Update request consign comments visibility failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get('/comments/:assetId', mustBeOwner, async (req, res) => {
    try {
        const { assetId } = req.params;

        const data = await model.findCommentsByAsset({ assetId });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Get request consign comments success',
            transaction: nanoid(),
            data,
        } as APIResponse);
    } catch (error) {
        logger('Get request consign comments failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Get request consign comments failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.delete('/:assetId', async (req, res) => {
    try {
        const { id } = req.auth;

        const exists = await model.findRequestConsignsByCreator({
            creator: id,
            assetId: req.params.assetId,
        });
        if (!exists) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const requestConsignStatus = exists.status;
        if (requestConsignStatus !== 'pending') {
            res.status(409).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign cannot be canceled',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const result = await model.deleteRequestConsign({
            id: exists._id,
        });

        const asset = await modelAssets.findOneAssets({
            query: {
                _id: new ObjectId(req.params.assetId),
            },
        });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        await modelAssets.updateAssets({
            id: asset._id,
            asset: {
                consignArtwork: {
                    status: 'draft',
                },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Delete request consign success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<DeleteResult>);
    } catch (error) {
        logger('Delete request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Delete request consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
