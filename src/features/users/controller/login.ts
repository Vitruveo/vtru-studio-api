import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { model } from '..';
import { JwtPayload } from '../../common/types';
import {
    createUser,
    encryptCode,
    findOneUser,
    generateCode,
    updateUser,
} from '../model';
import {
    LOGIN_TEMPLATE_EMAIL_SIGNIN,
    LOGIN_TEMPLATE_EMAIL_SIGNUP,
    JWT_SECRETKEY,
} from '../../../constants';
import type { APIResponse } from '../../../services/express';
import { sendToExchangeMail } from '../../../services/mail';
import { redis } from '../../../services/redis';
import { loginSchema, otpConfirmSchema } from './schemas';

export interface LoginAnswer {
    token: string;
    user: Partial<model.UserDocument>;
}

const logger = debug('features:users:controller');
const route = Router();

route.get('/', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
});

route.post('/otpConfirm', async (req, res) => {
    try {
        const { email, code } = otpConfirmSchema.parse(req.body);

        const user = await findOneUser({
            query: {
                'login.email': email,
                'login.codeHash': encryptCode(code),
            },
        });

        if (!user) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.users.login.otpConfirm.failed',
                message: 'Login failed: code or email invalid or was expired',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        await updateUser({
            id: user._id,
            user: {
                ...user,
                login: { email, codeHash: '' },
            },
            updatedBy: null,
        });

        const loginHistory = {
            ip: nanoid(),
            createdAt: new Date(),
        };
        await model.pushUserLoginHistory({
            id: user._id,
            data: loginHistory,
        });

        const token = jwt.sign(
            { id: user._id.toString(), type: 'user' } as JwtPayload,
            JWT_SECRETKEY,
            {
                expiresIn: '14d',
            }
        );

        await redis.set(`user:${user._id}`, token, 'EX', 60 * 60 * 24 * 14);

        res.json({
            code: 'vitruveo.studio.api.admin.users.login.otpConfirm.success',
            message: 'Login success',
            transaction: nanoid(),
            data: {
                user,
                token,
            },
        } as APIResponse<LoginAnswer>);
    } catch (error) {
        // situations: body parsing error, mongo error.
        logger('Login failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.login.otpConfirm.failed',
            message: `Login failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.post('/', async (req, res) => {
    try {
        const { email } = loginSchema.parse(req.body);
        const user = await findOneUser({ query: { 'login.email': email } });

        const code = generateCode();
        const codeHash = encryptCode(code);

        let template = LOGIN_TEMPLATE_EMAIL_SIGNIN;

        if (!user) {
            await createUser({
                user: {
                    login: {
                        email,
                        codeHash,
                    },
                },
                createdBy: null,
            });

            template = LOGIN_TEMPLATE_EMAIL_SIGNUP;
        } else {
            await updateUser({
                id: user._id,
                user: {
                    ...user,
                    login: { email, codeHash },
                },
                updatedBy: null,
            });
        }

        console.log({ template, code, email });

        const payload = JSON.stringify({ template, code, email });
        await sendToExchangeMail(payload);

        res.json({
            code: 'vitruveo.studio.api.admin.users.login.success',
            message: 'Login success',
            transaction: nanoid(),
            data: 'A code has been sent to your email',
        } as APIResponse<string>);
    } catch (error) {
        // situations: body parsing error, mongo error.
        logger('Login failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.login.failed',
            message: `Login failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/logout', async (req, res) => {
    try {
        await redis.del(`user:${req.body.id}`);
        res.json({
            code: 'vitruveo.studio.api.admin.users.logout.success',
            message: 'Logout success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Logout failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.admin.users.logout.failed',
            message: `Logout failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
