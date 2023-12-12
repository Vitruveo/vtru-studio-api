import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import { sendToExchangeMail } from '../../../services/mail';
import { LOGIN_TEMPLATE_EMAIL_SIGNIN } from '../../../constants';
import { encryptCode, generateCode } from '../../users/model';

const logger = debug('features:creators:controller');
const route = Router();

// TODO: needs to check if creator is authenticated
// route.use(middleware.checkAuth);

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
                res.write('event: close\n');
                res.write(`id: ${nanoid()}\n`);
                res.write(`data: {}\n\n`);

                res.end();
            });
    } catch (error) {
        logger('Reader all creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.all.failed',
            message: `Reader all failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Reader one creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.reader.one.failed',
            message: `Reader one failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Create creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.create.failed',
            message: `Create failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Update creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.update.failed',
            message: `Update failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
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
        });
    } catch (error) {
        logger('Delete creator failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.delete.failed',
            message: `Delete failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.get('/:username/username/exist', async (req, res) => {
    try {
        const creator = await model.checkUsernameExist({
            username: req.params.username,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.username.exist.success',
            message: 'Exist username success',
            transaction: nanoid(),
            data: creator > 0,
        });
    } catch (error) {
        logger('Exist username creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.username.exist.failed',
            message: `Exist username failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.get('/:email/email/exist', async (req, res) => {
    try {
        const creator = await model.checkEmailExist({
            email: req.params.email,
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.email.exist.success',
            message: 'Exist email success',
            transaction: nanoid(),
            data: creator > 0,
        });
    } catch (error) {
        logger('Exist email creators failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.email.exist.failed',
            message: `Exist email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.post('/:id/email/add', async (req, res) => {
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
        });
    } catch (error) {
        logger('Creator add email failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.add.email.failed',
            message: `Creator add email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.post('/email/send/code', async (req, res) => {
    try {
        const { email } = req.body;

        const creator = await model.findOneCreator({
            query: { emails: { $elemMatch: { email } } },
        });
        if (!creator) {
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.send.code.email.failed',
                message: `Creator send code email failed: email not found`,
                args: [],
                transaction: nanoid(),
            });

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
        });
    } catch (error) {
        logger('Creator send code email failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.send.code.email.failed',
            message: `Creator send code email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});

route.post('/email/verification/code', async (req, res) => {
    try {
        const { email, code } = req.body;

        const creator = await model.findOneCreator({
            query: {
                emails: { $elemMatch: { email, codeHash: encryptCode(code) } },
            },
        });
        if (!creator) {
            res.status(500).json({
                code: 'vitruveo.studio.api.admin.creators.verification.code.email.failed',
                message: `Creator verification code email failed: email not found`,
                args: [],
                transaction: nanoid(),
            });

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
            code: 'vitruveo.studio.api.admin.creators.verification.code.email.success',
            message: 'Creator verification code email success',
            transaction: nanoid(),
            data: creatorUpdated,
        });
    } catch (error) {
        logger('Creator verification code email failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.verification.code.email.failed',
            message: `Creator verification code email failed: ${error}`,
            args: error,
            transaction: nanoid(),
        });
    }
});
export { route };
