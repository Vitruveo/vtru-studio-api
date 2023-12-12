import debug from 'debug';
import { z } from 'zod';
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

export interface LoginAnswer {
    token: string;
    user: Partial<model.UserDocument>;
}

const logger = debug('features:users:controller');
const route = Router();

const emailValidation = z.string().email().min(1).max(64);

const loginSchema = z.object({
    email: emailValidation,
});

const otpConfirmSchema = z.object({
    email: emailValidation,
    code: z.string().length(6),
});

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
                message: 'Login failed: invalid code',
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
        });

        const loginHistory = {
            ip: nanoid(),
            createdAt: new Date(),
        };
        await model.pushUserLoginHistory({
            id: user._id,
            data: loginHistory,
        });

        const token = jwt.sign({ id: user._id } as JwtPayload, JWT_SECRETKEY, {
            expiresIn: '14d',
        });

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
            });

            template = LOGIN_TEMPLATE_EMAIL_SIGNUP;
        } else {
            await updateUser({
                id: user._id,
                user: {
                    ...user,
                    login: { email, codeHash },
                },
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
    res.status(500).json({ message: 'Not implemented' });
});

export { route };
