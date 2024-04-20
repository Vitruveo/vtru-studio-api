import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { APIResponse } from '../../../services';
import { generateVideo } from '../../../services/shortstack';
import { validateBodyForMakeVideo } from './rules';

const logger = debug('features:assets:controller:makeVideo');
const route = Router();

route.post('/', validateBodyForMakeVideo, async (req, res) => {
    try {
        const { artworks } = req.body;

        const response = await generateVideo(
            artworks.map((item: string) => ({
                artworkUrl: item,
                artistUrl: '',
                artistName: '',
            }))
        );

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
