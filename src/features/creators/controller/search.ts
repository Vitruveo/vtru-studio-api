import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { model } from '..';
import { APIResponse } from '../../../services';
import { createVideoGalleryHTML } from '../utils/createVideoGalleryHTML';
import { GENERAL_STORAGE_URL, SEARCH_URL, DIST } from '../../../constants';
import { Video } from '../model';

const logger = debug('features:creators:controller:search');
const route = Router();

/* Route to generate twitter grid stack url */
route.get('/grid', async (req, res) => {
    try {
        const { title, creatorId, type, timestamp } = req.query as {
            title: string;
            creatorId: string;
            type: string;
            timestamp: string;
        };
        const path = `${creatorId}/${type}/${timestamp}`;
        const domain = `${req.protocol}://${req.get('host')}`;

        const params = [
            {
                name: '__META_OG_URL__',
                value: `${SEARCH_URL}?grid=${timestamp}`,
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
                value: `${SEARCH_URL}?grid=${timestamp}`,
            },
            { name: '__META_OG_TWITTER_TITLE__', value: title },
            { name: '__META_OG_TWITTER_DESCRIPTION__', value: title },
            {
                name: '__META_OG_TWITTER_IMAGE__',
                value: `${GENERAL_STORAGE_URL}/${path}`,
            },
            { name: '__SEARCH_URL__', value: SEARCH_URL },
            { name: '__GRID_ID__', value: timestamp },
        ];

        let html = (await readFile(join(DIST, 'index.html'))).toString();
        params.forEach((param) => {
            if (!param.value) return;
            html = html.replace(param.name, param.value);
        });

        return res.status(200).send(html);
    } catch (error) {
        logger('Generate html failed: %O', error);

        const html = (await readFile(join(DIST, 'index.html'))).toString();
        return res.status(200).send(html);
    }
});

/* Route to generate twitter video gallery url */
route.get('/:id/html', async (req, res) => {
    try {
        const creator = await model.findCreatorById({ id: req.params.id });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.notFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const { timestamp } = req.query as {
            timestamp: string;
        };

        const gallery = creator.search?.video;

        if (!gallery || gallery.length === 0) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.gallery.notFound',
                message: 'Creator gallery not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        let video: Video[0] | null = null;

        if (timestamp) {
            const hasVideo = await model.findCreatorAssetsByVideoId({
                id: timestamp,
            });

            if (!hasVideo || !hasVideo?.search?.video) {
                video = gallery[gallery.length - 1];
            } else {
                video = hasVideo?.search?.video[0];
            }
        } else {
            video = gallery[gallery.length - 1];
        }

        const html = createVideoGalleryHTML({
            id: video.id,
            video: video.url,
            thumbnail: video.thumbnail ?? '',
            title: video.title,
        });

        res.send(html);
    } catch (error) {
        logger('Generate html failed: %O', error);

        res.status(500).json({
            code: 'vitruveo.studio.api.admin.creators.gallery.error',
            message: 'Error generating gallery',
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
