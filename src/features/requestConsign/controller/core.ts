import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import * as modelAssets from '../../assets/model';
import * as modelCreator from '../../creators/model';
import { middleware } from '../../users';
import { needsToBeOwner } from '../../common/rules';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';
import { findAssetCreatedBy } from '../../assets/model';
import { validateBodyForPatch, validateBodyForPatchComments } from './rules';
import { sendToExchangeMail } from '../../../services/mail';
import { MAIL_SENDGRID_TEMPLATE_CONSIGN } from '../../../constants';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        const { id } = req.auth;
        const alreadyExists = await model.findRequestConsignsByCreator({
            creator: id,
        });
        if (alreadyExists) {
            res.status(409).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: 'Request consign already exists',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const asset = await findAssetCreatedBy({ id });
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

        const result = await model.createRequestConsign({ requestConsign });
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
            data: result,
        } as APIResponse<InsertOneResult<model.RequestConsignDocument>>);
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

                if (
                    creator &&
                    Array.isArray(creator.emails) &&
                    creator.emails.length > 0
                ) {
                    await sendToExchangeMail(
                        JSON.stringify({
                            template: MAIL_SENDGRID_TEMPLATE_CONSIGN,
                            to: creator.emails[0].email,
                            consignMessage:
                                'Your art was not accepted by the moderators.',
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
            const { id } = req.params;
            const { comments } = req.body;

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
                    comments,
                },
            });

            res.json({
                code: 'vitruveo.studio.api.requestConsign.success',
                message: 'Update request consign comments success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.RequestConsignDocument>>);
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

route.delete('/', async (req, res) => {
    try {
        const { id } = req.auth;

        const exists = await model.findRequestConsignsByCreator({
            creator: id,
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

        const asset = await modelAssets.findAssetCreatedBy({ id });

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
