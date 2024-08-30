import debug from 'debug';
import { Router } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { model } from '..';
import { GENERAL_STORAGE_URL, SEARCH_URL } from '../../../constants';

const DIST = join(__dirname, '..', '..', '..', '..', 'static');
const logger = debug('features:creators:controller:video');
const route = Router();

route.get('/:timestamp', async (req, res) => {
    try {
        const { timestamp } = req.params;

        const video = await model.findCreatorAssetsByVideoId({ id: timestamp });
        const title = video?.search?.video[0].title;
        const path = `${video?._id}/creators/${timestamp}`;
        const domain = `${req.protocol}://${req.get('host')}`;

        const params = [
            {
                name: '__META_OG_URL__',
                value: `${SEARCH_URL}?video=${timestamp}`,
            },
            { name: '__META_OG_TITLE__', value: title },
            { name: '__META_OG_DESCRIPTION__', value: title },
            {
                name: '__META_OG_IMAGE__',
                value: `${GENERAL_STORAGE_URL}/${path}`,
            },

            // from twitter
            { name: '__META_OG_TWITTER_DOMAIN__', value: domain },
            {
                name: '__META_OG_TWITTER_URL__',
                value: `${SEARCH_URL}?video=${timestamp}`,
            },
            { name: '__META_OG_TWITTER_TITLE__', value: title },
            { name: '__META_OG_TWITTER_DESCRIPTION__', value: title },
            {
                name: '__META_OG_TWITTER_PLAYER__',
                value: video?.search?.video[0].url,
            },
            {
                name: '__META_OG_TWITTER_PLAYER__',
                value: video?.search?.video[0].url,
            },
            {
                name: '__META_OG_TWITTER_IMAGE__',
                value: video?.search?.video[0].thumbnail,
            },
            { name: '__SEARCH_URL__', value: SEARCH_URL },
            { name: '__VIDEO_ID__', value: timestamp },
        ];

        let html = (await readFile(join(DIST, 'video.html'))).toString();
        params.forEach((param) => {
            if (!param.value) return;
            html = html.replace(param.name, param.value);
        });

        return res.status(200).send(html);
    } catch (error) {
        logger('Get video failed: %O', error);

        const html = (await readFile(join(DIST, 'video.html'))).toString();
        return res.status(200).send(html);
    }
});

export { route };
