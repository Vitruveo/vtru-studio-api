import debug from 'debug';
import axios from 'axios';
import { customAlphabet, nanoid } from 'nanoid';
import { auth } from 'twitter-api-sdk';
import { Request, Response, Router } from 'express';
import { getConnection } from '@nsfilho/redis-connection';

import * as model from '../model';
import type { APIResponse } from '../../../services/express';
import {
    X_CLIENT_ID,
    X_CLIENT_SECRET,
    X_CALLBACK_URL,
    FACEBOOK_CLIENT_ID,
    FACEBOOK_CLIENT_SECRET,
    FACEBOOK_CALLBACK_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,
} from '../../../constants';
import { middleware } from '../../users';
import { keyRedisSocial } from '../utils/keyRedisRequest';
import { responseRenderClose } from '../utils/responseRenderClose';
import { sendToExchangeCreators } from '../upload';

const logger = debug('features:creators:controller:social');
const route = Router();

const generateNonce = customAlphabet('1234567890abcdef', 32);

const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];

const authClient = new auth.OAuth2User({
    client_id: X_CLIENT_ID,
    client_secret: X_CLIENT_SECRET,
    callback: X_CALLBACK_URL,
    scopes: ['tweet.read', 'users.read', 'follows.write'],
});

route.get('/x/auth', middleware.checkAuth, async (req, res) => {
    try {
        const nonce = generateNonce();

        const redis = await getConnection();
        await redis.set(keyRedisSocial(nonce), req.auth.id, 'EX', 60 * 30); // 30 minutes

        const url = authClient.generateAuthURL({
            state: nonce,
            code_challenge_method: 's256',
        });

        res.json({
            code: 'vitruveo.studio.api.creator.get.social.x.success',
            message: 'Get social x success',
            transaction: nanoid(),
            data: url,
        } as APIResponse);
    } catch (error) {
        logger('Auth social x failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.social.x.failed',
            message: `Get social x failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

const xCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query as { code: string; state: string };

        const redis = await getConnection();
        const creatorId = await redis.get(keyRedisSocial(state));

        if (!creatorId) {
            res.status(400).json({
                code: 'vitruveo.studio.api.creator.get.social.x.failed',
                message: 'Get social x failed: Invalid nonce',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const { token } = await authClient.requestAccessToken(code);

        const userInfo = await axios.get(
            'https://api.twitter.com/2/users/me?user.fields=profile_image_url',
            {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                },
            }
        );

        await model.updateCreatorSocialById({
            id: creatorId,
            key: 'x',
            value: {
                avatar: userInfo.data.data.profile_image_url,
                name: userInfo.data.data.name,
            },
        });

        await sendToExchangeCreators(
            JSON.stringify({
                creatorId,
                type: 'x',
                avatar: userInfo.data.data.profile_image_url,
                name: userInfo.data.data.name,
            }),
            'userSocialAvatar'
        );

        res.send(responseRenderClose());
    } catch (error) {
        logger('Auth social callback x failed: %O', error);
        res.send(responseRenderClose());
    }
};

route.get('/facebook/auth', middleware.checkAuth, async (req, res) => {
    try {
        const nonce = generateNonce();

        const redis = await getConnection();
        await redis.set(keyRedisSocial(nonce), req.auth.id, 'EX', 60 * 30); // 30 minutes

        const url = `https://www.facebook.com/v13.0/dialog/oauth?client_id=${FACEBOOK_CLIENT_ID}&redirect_uri=${FACEBOOK_CALLBACK_URL}&state=${nonce}&scope=email`;

        res.json({
            code: 'vitruveo.studio.api.creator.get.social.facebook.success',
            message: 'Get social facebook success',
            transaction: nanoid(),
            data: url,
        } as APIResponse);
    } catch (error) {
        logger('Auth social facebook failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.social.facebook.failed',
            message: `Get social facebook failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

const facebookCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query as { code: string; state: string };

        const redis = await getConnection();
        const creatorId = await redis.get(keyRedisSocial(state));

        if (!creatorId) {
            res.status(400).json({
                code: 'vitruveo.studio.api.creator.get.social.x.failed',
                message: 'Get social x failed: Invalid nonce',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const { data } = await axios.get(
            `https://graph.facebook.com/v13.0/oauth/access_token?client_id=${FACEBOOK_CLIENT_ID}&client_secret=${FACEBOOK_CLIENT_SECRET}&code=${code}&redirect_uri=${FACEBOOK_CALLBACK_URL}`
        );

        const { access_token: accessToken } = data;

        const { data: userInfo } = await axios.get(
            `https://graph.facebook.com/v13.0/me?fields=name,email,picture&access_token=${accessToken}`
        );

        await model.updateCreatorSocialById({
            id: creatorId,
            key: 'facebook',
            value: {
                avatar: userInfo.picture.data.url,
                name: userInfo.name,
            },
        });

        await sendToExchangeCreators(
            JSON.stringify({
                creatorId,
                type: 'facebook',
                avatar: userInfo.picture.data.url,
                name: userInfo.name,
            }),
            'userSocialAvatar'
        );

        res.send(responseRenderClose());
    } catch (error) {
        logger('Auth social callback facebook failed: %O', error);
        res.send(responseRenderClose());
    }
};

route.get('/google/auth', middleware.checkAuth, async (req, res) => {
    try {
        const nonce = generateNonce();

        const redis = await getConnection();
        await redis.set(keyRedisSocial(nonce), req.auth.id, 'EX', 60 * 30); // 30 minutes

        const url = `https://accounts.google.com/o/oauth2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_CALLBACK_URL}&state=${nonce}&scope=${scopes.join(
            ' '
        )}&response_type=code`;

        res.json({
            code: 'vitruveo.studio.api.creator.get.social.google.success',
            message: 'Get social google success',
            transaction: nanoid(),
            data: url,
        } as APIResponse);
    } catch (error) {
        logger('Auth social google failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.creator.get.social.google.failed',
            message: `Get social google failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

const googleCallback = async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query as { code: string; state: string };

        const redis = await getConnection();
        const creatorId = await redis.get(keyRedisSocial(state));

        if (!creatorId) {
            res.status(400).json({
                code: 'vitruveo.studio.api.creator.get.social.x.failed',
                message: 'Get social x failed: Invalid nonce',
                transaction: nanoid(),
            } as APIResponse);
        }

        const response = await axios.post(
            'https://accounts.google.com/o/oauth2/token',
            null,
            {
                params: {
                    code,
                    client_id: GOOGLE_CLIENT_ID,
                    client_secret: GOOGLE_CLIENT_SECRET,
                    redirect_uri: GOOGLE_CALLBACK_URL,
                    grant_type: 'authorization_code',
                },
            }
        );

        const userInfo = await axios.get(
            'https://www.googleapis.com/oauth2/v1/userinfo',
            {
                headers: {
                    Authorization: `Bearer ${response.data.access_token}`,
                },
            }
        );

        await model.updateCreatorSocialById({
            id: creatorId,
            key: 'google',
            value: {
                avatar: userInfo.data.picture,
                name: userInfo.data.name,
            },
        });

        await sendToExchangeCreators(
            JSON.stringify({
                creatorId,
                type: 'google',
                avatar: userInfo.data.picture,
                name: userInfo.data.name,
            }),
            'userSocialAvatar'
        );

        res.send(responseRenderClose());
    } catch (error) {
        logger('Auth social callback google failed: %O', error);
        res.send(responseRenderClose());
    }
};

route.delete('/:social', middleware.checkAuth, (req, res) => {
    if (!['x', 'facebook', 'google'].includes(req.params.social)) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.delete.social.failed',
            message: 'Delete social failed: Invalid social',
            transaction: nanoid(),
        } as APIResponse);
        return;
    }

    model
        .removeCreatorSocialById({
            id: req.auth.id,
            key: req.params.social as 'x' | 'facebook' | 'google',
        })
        .then(() => {
            res.json({
                code: 'vitruveo.studio.api.creator.remove.social.success',
                message: 'Remove social success',
                transaction: nanoid(),
            } as APIResponse);
        })
        .catch((error) => {
            logger('Remove social failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.creator.remove.social.failed',
                message: `Remove social failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        });
});

export { route, xCallback, facebookCallback, googleCallback };
