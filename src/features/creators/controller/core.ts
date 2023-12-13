import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { sendToExchangeCreators } from '../upload';
import { middleware } from '../../users';
import { encryptCode, generateCode } from '../../users/model';
import { LOGIN_TEMPLATE_EMAIL_SIGNIN } from '../../../constants';
import { sendToExchangeMail } from '../../../services/mail';
import {
    APIResponse,
    DeleteResult,
    InsertOneResult,
    UpdateResult,
} from '../../../services';

const logger = debug('features:creators:controller');
const route = Router();

// TODO: needs to check if creator is authenticated
route.use(middleware.checkAuth);

route.get('/', async (req, res) => {
    // TODO: needs to acquire query, sort, skip and limit from req.query
    try {
        const creators = await model.findCreators({
            query: {},
            sort: { name: 1 },
            skip: 0,
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

route.get('/:id', async (req, res) => {
    // TODO: needs to check if id is valid ObjectId
    try {
        const creator = await model.findCreatorById({ id: req.params.id });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.success',
            message: 'Reader one success',
            transaction: nanoid(),
            data: creator,
        } as APIResponse<model.CreatorDocument | null>);
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

route.post('/', async (req, res) => {
    try {
        const result = await model.createCreator({ creator: req.body });

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

route.put('/:id', async (req, res) => {
    try {
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
});

route.delete('/:id', async (req, res) => {
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
});

route.get('/:username/username', async (req, res) => {
    try {
        const creator = await model.checkUsernameExist({
            username: req.params.username,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.username.exist.success',
            message: 'Exist username success',
            transaction: nanoid(),
            data: creator > 0,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist username creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.username.exist.failed',
            message: `Exist username failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:email/email', async (req, res) => {
    try {
        const creator = await model.checkEmailExist({
            email: req.params.email,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.email.exist.success',
            message: 'Exist email success',
            transaction: nanoid(),
            data: creator > 0,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Exist email creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.email.exist.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/:id/email', async (req, res) => {
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
            });

            return;
        }

        const creator = await model.addEmailCreator({
            id: req.params.id,
            email: req.body.email,
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
});

route.post('/:email/email/sendCode', async (req, res) => {
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
        const template = LOGIN_TEMPLATE_EMAIL_SIGNIN;

        await model.updateCodeHashEmailCreator({
            id: creator._id,
            email,
            codeHash,
            checkedAt: null,
        });

        console.log({ template, code, email });

        const payload = JSON.stringify({ template, code, email });
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

route.post('/:email/email/verifyCode', async (req, res) => {
    try {
        const { code } = req.body;
        const { email } = req.params;

        const creator = await model.findOneCreator({
            query: {
                emails: { $elemMatch: { email, codeHash: encryptCode(code) } },
            },
        });
        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.verify.code.email.failed',
                message: `Creator verify code email failed: invalid credentials`,
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
});

route.post('/request/upload', async (req, res) => {
    try {
        const { mimetype, userId } = req.body;

        const key = `${userId}/${new Date().getDate()}.${mimetype}`;

        await sendToExchangeCreators(
            JSON.stringify({ key, creatorId: userId })
        );

        res.json({
            code: 'vitruveo.studio.api.admin.creators.request.upload.success',
            message: 'Creator request upload success',
            transaction: nanoid(),
            data: 'request requested, wait for the URL to upload',
        } as APIResponse<string>);
    } catch (error) {
        logger('Creator request upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.request.upload.failed',
            message: `Creator request upload failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
