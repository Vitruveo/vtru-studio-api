import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { model } from '..';
import { APIResponse } from '../../../services';
import { createVideoGalleryHTML } from '../utils/createVideoGalleryHTML';

const logger = debug('features:creators:controller:search');
const route = Router();

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

        const gallery = creator.videoGallery;

        if (gallery.length === 0) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.creators.gallery.notFound',
                message: 'Creator gallery not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const lastGeneratedVideo = gallery[gallery.length - 1];

        const html = createVideoGalleryHTML({
            video: lastGeneratedVideo.url,
            thumbnail: lastGeneratedVideo.thumbnail ?? '',
            title: lastGeneratedVideo.title
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
