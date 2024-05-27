import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { sendToExchangeCreators } from '../upload';
import { Query } from '../../common/types';

import { middleware } from '../../users';
import { encryptCode, generateCode } from '../../users/model';
import { MAIL_SENDGRID_TEMPLATE_SIGNIN } from '../../../constants';
import { sendToExchangeMail } from '../../../services/mail';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';
import {
    validateBodyForAddEmail,
    validateBodyForCreate,
    validateBodyForPut,
    validateBodyForPutAvatar,
} from './rules';
import {
    needsToBeOwner,
    validateParamsEmail,
    validateParamsId,
    validateQueries,
} from '../../common/rules';
import { updateRecordFramework } from '../../common/record';
import {
    createAssets,
    findAssetCreatedBy,
    updateAssets,
} from '../../assets/model';
import generateInitialAsset from '../utils/generateInitialAsset';

const logger = debug('features:creators:controller');
const route = Router();

route.use(middleware.checkAuth);

route.get('/', validateQueries, async (req, res) => {
    try {
        const { query }: { query: Query } = req;

        const creators = await model.findCreators({
            query: { limit: query.limit },
            sort: query.sort
                ? { [query.sort.field]: query.sort.order }
                : { name: 1 },
            skip: query.skip || 0,
        });

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        creators
            .on('data', (doc) => {
                res.write('event: creator_list\n');
                res.write(`id: ${doc._id}\n`);
                res.write(`data: ${JSON.stringify(doc)}\n\n`);
            })
            .on('end', () => {
                res.end();
            });
    } catch (error) {
        logger('Reader all creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', validateParamsId, async (req, res) => {
    try {
        const creator = await model.findCreatorById({ id: req.params.id });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.reader.one.not.found',
                message: `Reader one failed: creator not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: creator,
        } as APIResponse<model.CreatorDocument>);
    } catch (error) {
        logger('Reader one creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', validateBodyForCreate, async (req, res) => {
    try {
        const result = await model.createCreator({
            creator: req.body,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.create.success',
            message: 'Create success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.CreatorDocument>>);
    } catch (error) {
        logger('Create creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.put(
    '/:id',
    validateParamsId,
    needsToBeOwner({ permissions: ['creator:admin', 'creator:editor'] }),
    validateBodyForPut,
    async (req, res) => {
        try {
            const assetByCreator = await findAssetCreatedBy({
                id: req.params.id,
            });

            if (assetByCreator) {
                await updateAssets({
                    id: assetByCreator._id,
                    asset: {
                        'assetMetadata.creators.formData': req.body.creators,
                    },
                });
            } else {
                const initialAsset = generateInitialAsset();
                initialAsset.asset.framework.createdBy = req.params.id;
                initialAsset.asset.assetMetadata.creators.formData =
                    req.body.creators;
                await createAssets({ asset: initialAsset.asset });
            }

            delete req.body.creators;

            const result = await model.updateCreator({
                id: req.params.id,
                creator: req.body,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.creators.update.success',
                message: 'Update success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<UpdateResult<model.CreatorDocument>>);
        } catch (error) {
            logger('Update creator failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.update.failed',
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
    needsToBeOwner({ permissions: ['creator:admin', 'creator:editor'] }),
    async (req, res) => {
        try {
            const result = await model.deleteCreator({ id: req.params.id });

            res.json({
                code: 'vitruveo.studio.api.admin.creators.delete.success',
                message: 'Delete success',
                transaction: nanoid(),
                data: result,
            } as APIResponse<DeleteResult>);
        } catch (error) {
            logger('Delete creator failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.delete.failed',
                message: `Delete failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.get('/:username/username', async (req, res) => {
    try {
        if (!/^[a-zA-Z0-9_]+$/.test(req.params.username)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.admin.creators.username.invalid',
                message: `Checked username failed: username invalid`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const creator = await model.checkUsernameExist({
            username: req.params.username,
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.username.not.found',
                message: `Checked username failed: username not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.creators.username.success',
            message: 'Checked username with success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist username creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.username.failed',
            message: `Exist username failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:email/email', validateParamsEmail, async (req, res) => {
    try {
        const creator = await model.checkEmailExist({
            email: req.params.email,
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.email.not.found',
                message: `Checked email failed: email not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.json({
            code: 'vitruveo.studio.api.admin.creators.email.success',
            message: 'Checked email with success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist email creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.email.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post(
    '/:id/email',
    validateParamsId,
    needsToBeOwner({ permissions: ['creator:admin', 'creator:editor'] }),
    validateBodyForAddEmail,
    async (req, res) => {
        try {
            const creatorExist = await model.checkEmailExist({
                email: req.body.email,
            });

            if (creatorExist > 0) {
                res.status(500).json({
                    code: 'vitruveo.studio.api.admin.creators.add.email.failed',
                    message: `Creator add email failed: email already exist`,
                    args: [],
                    transaction: nanoid(),
                } as APIResponse);

                return;
            }

            const creator = await model.addEmailCreator({
                id: req.params.id,
                email: req.body.email,
                framework: req.body.framework,
            });

            res.json({
                code: 'vitruveo.studio.api.admin.creators.add.email.success',
                message: 'Creator add email success',
                transaction: nanoid(),
                data: creator,
            } as APIResponse<UpdateResult<model.CreatorDocument>>);
        } catch (error) {
            logger('Creator add email failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.add.email.failed',
                message: `Creator add email failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post('/:email/email/sendCode', validateParamsEmail, async (req, res) => {
    try {
        const { email } = req.params;

        const creator = await model.findOneCreator({
            query: { emails: { $elemMatch: { email } } },
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.send.code.email.failed',
                message: `Creator send code email failed: email not found`,
                args: [],
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const code = generateCode();
        const codeHash = encryptCode(code);
        const template = MAIL_SENDGRID_TEMPLATE_SIGNIN;

        await model.updateCodeHashEmailCreator({
            id: creator._id,
            email,
            codeHash,
            checkedAt: null,
            framework: updateRecordFramework({
                framework: creator.framework,
                updatedBy: req.auth.id,
            }),
        });

        console.log({ email, code });

        const payload = JSON.stringify({
            to: email,
            subject: 'Login code',
            text: code,
            html: '',
            template,
            link: '',
        });

        await sendToExchangeMail(payload);

        res.json({
            code: 'vitruveo.studio.api.admin.creators.send.code.email.success',
            message: 'Creator send code email success',
            transaction: nanoid(),
            data: 'A code has been sent to your email',
        } as APIResponse<string>);
    } catch (error) {
        logger('Creator send code email failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.send.code.email.failed',
            message: `Creator send code email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post(
    '/:email/email/verifyCode',
    validateParamsEmail,
    async (req, res) => {
        try {
            const { code } = req.body;
            const { email } = req.params;

            const creator = await model.findOneCreator({
                query: {
                    emails: {
                        $elemMatch: { email, codeHash: encryptCode(code) },
                    },
                },
            });
            if (!creator) {
                res.status(404).json({
                    code: 'vitruveo.studio.api.admin.creators.verify.code.email.failed',
                    message: `Creator verify code email failed: code or email invalid or was expired`,
                    args: [],
                    transaction: nanoid(),
                } as APIResponse);

                return;
            }

            await model.updateCodeHashEmailCreator({
                id: creator._id,
                email,
                codeHash: null,
                checkedAt: new Date(),
                framework: updateRecordFramework({
                    framework: creator.framework,
                    updatedBy: req.auth.id,
                }),
            });

            const creatorUpdated = await model.findOneCreator({
                query: {
                    emails: { $elemMatch: { email } },
                },
            });

            res.json({
                code: 'vitruveo.studio.api.admin.creators.verify.code.email.success',
                message: 'Creator verify code email success',
                transaction: nanoid(),
                data: creatorUpdated,
            } as APIResponse<model.CreatorDocument>);
        } catch (error) {
            logger('Creator verify code email failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.verify.code.email.failed',
                message: `Creator verify code email failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

route.post('/request/upload', async (req, res) => {
    const transactionApiId = nanoid();

    try {
        const { mimetype, transactionId } = req.body;
        const { id } = req.auth;

        const extension = mimetype.split('/')[1];
        const path = `${id}/${new Date().getTime()}.${extension}`;

        await sendToExchangeCreators(
            JSON.stringify({
                path,
                creatorId: id,
                transactionId,
                origin: 'profile',
                method: 'PUT',
            })
        );

        res.json({
            code: 'vitruveo.studio.api.admin.creators.request.upload.success',
            message: 'Creator request upload success',
            transaction: transactionApiId,
            data: 'request requested, wait for the URL to upload',
        } as APIResponse<string>);
    } catch (error) {
        logger('Creator request upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.request.upload.failed',
            message: `Creator request upload failed: ${error}`,
            args: error,
            transaction: transactionApiId,
        } as APIResponse);
    }
});

route.delete('/request/deleteFile', async (req, res) => {
    const transactionApiId = nanoid();

    try {
        const { transactionId, deleteKeys } = req.body;
        const { id } = req.auth;

        await sendToExchangeCreators(
            JSON.stringify({
                deleteKeys,
                creatorId: id,
                transactionId,
                origin: 'profile',
                method: 'DELETE',
            })
        );

        res.json({
            code: 'vitruveo.studio.api.admin.creators.request.deleteFile.success',
            message: 'Creator request delete success',
            transaction: transactionApiId,
            data: 'request requested, wait for the URL to delete',
        } as APIResponse<string>);
    } catch (error) {
        logger('Creator request delete failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.request.deleteFile.failed',
            message: `Creator request delete failed: ${error}`,
            args: error,
            transaction: transactionApiId,
        } as APIResponse);
    }
});

route.put('/profile/avatar', validateBodyForPutAvatar, async (req, res) => {
    try {
        const { id } = req.auth;
        const result = await model.updateAvatar({
            id,
            fileId: req.body.fileId,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.update.success',
            message: 'Update success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<UpdateResult<model.CreatorDocument>>);
    } catch (error) {
        logger('Update creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
