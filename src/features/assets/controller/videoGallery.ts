import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { MAIL_SENDGRID_TEMPLATE_VIDEO_GALLERY } from '../../../constants';
import { APIResponse } from '../../../services';
import { generateVideo } from '../../../services/shortstack';
import { validateBodyForMakeVideo } from './rules';
import { middleware } from '../../users';
import { sendToExchangeMail } from '../../../services/mail';
import * as model from '../../creators/model';

const logger = debug('features:assets:controller:makeVideo');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', validateBodyForMakeVideo, async (req, res) => {
    try {
        const creator = await model.findCreatorById({ id: req.auth.id });

        if (!creator) {
            res.status(401).json({
                code: 'vitruveo.studio.api.assets.makeVideo.failed',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const { artworks } = req.body;

        const response = await generateVideo(
            artworks.map((item: string) => ({
                artworkUrl: item,
                artistUrl: '',
                artistName: '',
            }))
        );

        if (creator.emails.length) {
            const payload = JSON.stringify({
                to: creator.emails[0].email,
                subject: 'Video Gallery',
                text: '',
                html: '',
                template: MAIL_SENDGRID_TEMPLATE_VIDEO_GALLERY,
                link: response.url,
            });

            await sendToExchangeMail(payload);
        }

        res.json({
            code: 'vitruveo.studio.api.assets.makeVideo.success',
            message: 'Make video success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Make video failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.makeVideo.failed',
            message: `Make video failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };