import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../common/types';
import {
    CreatorDocument,
    addEmailCreator,
    createCreator,
    encryptCode,
    findOneCreator,
    pushCreatorLoginHistory,
    updateCodeHashEmailCreator,
} from '../model';
import {
    MAIL_SENDGRID_TEMPLATE_SIGNIN,
    MAIL_SENDGRID_TEMPLATE_SIGNUP,
    JWT_SECRETKEY,
} from '../../../constants';
import type { APIResponse } from '../../../services/express';
import { sendToExchangeMail } from '../../../services/mail';
import { validateBodyForLogin, validateBodyForOtpLogin } from './rules';
import type { LoginHistory } from '../model/types';

export interface LoginAnswer {
    token: string;
    creator: Partial<CreatorDocument>;
}

const logger = debug('features:creators:controller:login');
const route = Router();

route.get('/', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
});

route.post('/otpConfirm', validateBodyForOtpLogin, async (req, res) => {
    try {
        const { email, code, framework } = req.body;
        const ip = req.headers['x-forwarded-for']?.toString() || '';

        const creator = await findOneCreator({
            query: {
                emails: { $elemMatch: { email, codeHash: encryptCode(code) } },
            },
        });

        if (!creator) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.creators.login.otpConfirm.failed',
                message: 'Login failed: code or email invalid or was expired',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        await updateCodeHashEmailCreator({
            id: creator._id,
            email,
            codeHash: null,
            checkedAt: new Date(),
            framework,
        });

        const loginHistory: LoginHistory = {
            ip,
            createdAt: new Date(),
        };
        await pushCreatorLoginHistory({
            id: creator._id,
            data: loginHistory,
        });

        const token = jwt.sign(
            { id: creator._id, type: 'creator' } as JwtPayload,
            JWT_SECRETKEY,
            {
                expiresIn: '14d',
            }
        );
        const creatorUpdated = await findOneCreator({
            query: {
                emails: { $elemMatch: { email } },
            },
        });

        res.json({
            code: 'vitruveo.studio.api.admin.creators.login.otpConfirm.success',
            message: 'Login success',
            transaction: nanoid(),
            data: {
                creator: creatorUpdated,
                token,
            },
        } as APIResponse<LoginAnswer>);
    } catch (error) {
        // situations: body parsing error, mongo error.
        logger('Login failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.login.otpConfirm.failed',
            message: `Login failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', validateBodyForLogin, async (req, res) => {
    try {
        const {
            email,
            code,
            codeHash,
            creator: creatorData,
            framework,
        } = req.body;

        const standardEmail = email
            .trim()
            .toLowerCase()
            .replace(/\.(?=.*@)|\+.*(?=@)/g, '');

        const creator = await findOneCreator({
            query: {
                $or: [
                    { emails: { $elemMatch: { email } } },
                    { emails: { $elemMatch: { email: standardEmail } } },
                ],
            },
        });

        let template = MAIL_SENDGRID_TEMPLATE_SIGNIN;

        if (!creator) {
            await createCreator({ creator: creatorData });

            template = MAIL_SENDGRID_TEMPLATE_SIGNUP;
        } else {
            if (!creator.emails.some((e) => e.email === standardEmail)) {
                await addEmailCreator({
                    id: creator._id,
                    email: standardEmail,
                    framework: {
                        createdAt: new Date(),
                        createdBy: creator._id.toString(),
                        updatedAt: new Date(),
                        updatedBy: creator._id.toString(),
                    },
                });
            }
            if (
                creator.emails.some((e) => e.email === standardEmail) &&
                !creator.emails.some((e) => e.email === email)
            ) {
                await addEmailCreator({
                    id: creator._id,
                    email,
                    framework: {
                        createdAt: new Date(),
                        createdBy: creator._id.toString(),
                        updatedAt: new Date(),
                        updatedBy: creator._id.toString(),
                    },
                });
            }
            await updateCodeHashEmailCreator({
                id: creator._id,
                email,
                codeHash,
                framework,
                checkedAt: null,
            });
            await updateCodeHashEmailCreator({
                id: creator._id,
                email: standardEmail,
                codeHash,
                framework,
                checkedAt: null,
            });
        }

        console.log({ code, email, standardEmail });

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
            code: 'vitruveo.studio.api.admin.creators.login.success',
            message: 'Login success',
            transaction: nanoid(),
            data: 'A code has been sent to your email',
        } as APIResponse<string>);
    } catch (error) {
        // situations: body parsing error, mongo error.
        logger('Login failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.login.failed',
            message: `Login failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/logout', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
});

export { route };
