import debug from 'debug';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import type { APIResponse } from '../../../services/express';

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
} from '../../../constants/login';
import { sendToExchangeMail } from '../../../services/mail';

const logger = debug('features:users:controller');
const route = Router();

const loginSchema = z.object({
    email: z.string().email().min(1).max(64),
});

route.get('/', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
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
                user: { login: { email, codeHash } },
            });
        }

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
