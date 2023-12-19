import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from '../../common/types';
import {
    UserDocument,
    createUser,
    encryptCode,
    findOneUser,
    pushUserLoginHistory,
    updateUser,
} from '../model';
import {
    LOGIN_TEMPLATE_EMAIL_SIGNIN,
    LOGIN_TEMPLATE_EMAIL_SIGNUP,
    JWT_SECRETKEY,
} from '../../../constants';
import type { APIResponse } from '../../../services/express';
import { sendToExchangeMail } from '../../../services/mail';
import { ObjectId } from '../../../services/mongo';
import { redis } from '../../../services/redis';
import { otpConfirmSchema } from './schemas';
import { findRoleReturnPermissions } from '../../roles/model';
import { validateBodyForLogin } from './rules';

export interface LoginAnswer {
    token: string;
    user: Partial<UserDocument>;
}

const logger = debug('features:users:controller:login');
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
                login: { ...user.login, email, codeHash: '' },
            },
        });

        const loginHistory = {
            ip: nanoid(),
            createdAt: new Date(),
        };
        await pushUserLoginHistory({
            id: user._id,
            data: loginHistory,
        });

        const permissions = await findRoleReturnPermissions({
            query: {
                _id: { $in: user.roles.map((item) => new ObjectId(item)) },
            },
        });

        const userPermissions = permissions.reduce(
            (acc, item) => [...acc, ...item.permissions],
            [] as string[]
        );

        const payload = {
            id: user._id.toString(),
            type: 'user',
            permissions: userPermissions,
        } as JwtPayload;

        const token = jwt.sign(payload, JWT_SECRETKEY, {
            expiresIn: '14d',
        });

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

route.post('/', validateBodyForLogin, async (req, res) => {
    try {
        const { email, code, codeHash } = req.body;
        const user = await findOneUser({ query: { 'login.email': email } });

        let template = LOGIN_TEMPLATE_EMAIL_SIGNIN;

        if (!user) {
            await createUser({
                user: req.body.user,
            });

            template = LOGIN_TEMPLATE_EMAIL_SIGNUP;
        } else {
            await updateUser({
                id: user._id,
                user: {
                    login: { ...user.login, email, codeHash },
                },
            });
        }

        console.log({ template, code, email });

        const payload = JSON.stringify({
            template,
            code,
            email,
        });
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
