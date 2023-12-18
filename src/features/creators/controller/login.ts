import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as jwt from 'jsonwebtoken';

import { model } from '..';
import { JwtPayload } from '../../common/types';
import {
    createCreator,
    encryptCode,
    findOneCreator,
    updateCodeHashEmailCreator,
} from '../model';
import {
    LOGIN_TEMPLATE_EMAIL_SIGNIN,
    LOGIN_TEMPLATE_EMAIL_SIGNUP,
    JWT_SECRETKEY,
} from '../../../constants';
import type { APIResponse } from '../../../services/express';
import { sendToExchangeMail } from '../../../services/mail';
import { LoginHistory } from '../model/types';
import { validateBodyForLogin, validateBodyForOtpLogin } from './rules';

export interface LoginAnswer {
    token: string;
    creator: Partial<model.CreatorDocument>;
}

const logger = debug('features:creators:controller');
const route = Router();

route.get('/', async (req, res) => {
    res.status(500).json({ message: 'Not implemented' });
});

route.post('/otpConfirm', validateBodyForOtpLogin, async (req, res) => {
    try {
        const { email, code } = req.body;
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
            framework: req.body.framework,
        });

        const loginHistory: LoginHistory = {
            ip,
            createdAt: new Date(),
        };
        await model.pushCreatorLoginHistory({
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
        const { email } = req.body;

        const creator = await findOneCreator({
            query: { emails: { $elemMatch: { email } } },
        });

        let template = LOGIN_TEMPLATE_EMAIL_SIGNIN;

        if (!creator) {
            await createCreator({ creator: req.body.creator });

            template = LOGIN_TEMPLATE_EMAIL_SIGNUP;
        } else {
            await updateCodeHashEmailCreator({
                id: creator._id,
                email,
                codeHash: req.body.codeHash,
                framework: req.body.framework,
                checkedAt: null,
            });
        }

        console.log({ code: req.body.code, email });

        const payload = JSON.stringify({
            template,
            code: req.body.code,
            email,
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
