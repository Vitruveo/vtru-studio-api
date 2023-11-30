import debug from 'debug';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import * as model from '../model';
import type { JwtPayload } from '../types';
import type { APIResponse } from '../../../services/express';
import { JWT_SECRETKEY } from '../../../constants';

const logger = debug('features:users:controller');
const route = Router();

const loginSchema = z.object({
    email: z.string().email().min(1).max(64),
    password: z.string().min(3).max(64),
});

export interface LoginAnswer {
    token: string;
    user: Partial<model.UserDocument>;
}

route.get('/', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
});

route.post('/', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const encryptedPassword = model.encryptPassword(password);

        const user = await model.findOneUser({
            query: {
                'login.email': email,
                'login.password': encryptedPassword,
            },
        });

        if (!user) {
            logger('Invalid credential: %O', req.body);
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.users.login.invalid',
                message: 'Invalid credential',
                args: req.body,
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const token = jwt.sign({ id: user._id } as JwtPayload, JWT_SECRETKEY, {
            expiresIn: '14d',
        });

        res.json({
            code: 'vitruveo.studio.api.admin.users.login.success',
            message: 'Login success',
            transaction: nanoid(),
            data: {
                token,
                user,
            },
        } as APIResponse<LoginAnswer>);
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
