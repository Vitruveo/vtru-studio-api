import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import * as modelAssets from '../../assets/model';
import * as modelCreator from '../../creators/model';
import { middleware } from '../../users';
import { needsToBeOwner, validateQueries } from '../../common/rules';
import { APIResponse, InsertOneResult, UpdateResult } from '../../../services';
import { findAssetCreatedBy } from '../../assets/model';
import { validateBodyForPatch } from './rules';
import { emitter } from '../emitter';
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

route.get(
    '/',
    needsToBeOwner({ permissions: ['moderator:admin', 'moderator:reader'] }),
    validateQueries,
    async (_req, res) => {
        try {
            res.set('Content-Type', 'text/event-stream');
            res.set('Cache-Control', 'no-cache');
            res.set('Connection', 'keep-alive');
            res.flushHeaders();

            const sendEvent = (
                data: model.RequestConsignDocument,
                eventType: string
            ) => {
                res.write(`event: ${eventType}\n`);
                res.write(`id: ${nanoid()}\n`);
                res.write(`data: ${JSON.stringify(data)}\n\n`);
                return !(res.closed || res.destroyed);
            };

            // live create request consign
            const sendEventCreateRequestConsign = (
                data: model.RequestConsignDocument
            ) => sendEvent(data, 'create_request_consign');
            emitter.on('createRequestConsign', sendEventCreateRequestConsign);

            // live update request consign status
            const sendEventUpdateRequestConsignStatus = (
                data: model.RequestConsignDocument
            ) => sendEvent(data, 'update_request_consign_status');
            emitter.on(
                'updateRequestConsignStatus',
                sendEventUpdateRequestConsignStatus
            );

            // history
            const sendEventRequestConsignHistory = (
                data: model.RequestConsignDocument
            ) => sendEvent(data, 'request_consign_history');
            emitter.emit('initial');

            const requestConsignQueue = (
                data: model.RequestConsignDocument[]
            ) => {
                data.forEach(sendEventRequestConsignHistory);
            };

            emitter.once('requestConsigns', requestConsignQueue);

            const removeListeners = () => {
                emitter.off(
                    'createRequestConsign',
                    sendEventCreateRequestConsign
                );
                emitter.off(
                    'updateRequestConsignStatus',
                    sendEventUpdateRequestConsignStatus
                );
            };

            res.on('close', removeListeners);
            res.on('error', removeListeners);
            res.on('finish', removeListeners);
        } catch (error) {
            logger('Find request consign failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.requestConsign.failed',
                message: `Find request consign failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

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

export { route };
