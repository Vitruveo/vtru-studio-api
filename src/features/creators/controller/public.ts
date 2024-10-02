import debug from 'debug';
import { Router } from 'express';
import { readFile } from 'fs/promises';
import { nanoid } from 'nanoid';
import { join } from 'path';
import { DIST } from '../../../constants/static';
import { APIResponse } from '../../../services';
import { ArtistSpotlight } from './types';

const logger = debug('features:creators:controller:public');
const route = Router();

route.get('/artistSpotlight', async (req, res) => {
    try {
        const artistSpotlight = await readFile(
            join(DIST, 'artistSpotlight.json'),
            'utf-8'
        );
        const payload = JSON.parse(artistSpotlight) as ArtistSpotlight[];

        res.json({
            code: 'vitruveo.studio.api.assets.artistSpotlight.success',
            message: 'Reader artist Spotlight success',
            transaction: nanoid(),
            data: payload,
        } as APIResponse);
    } catch (error) {
        logger('Reader artist Spotlight failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.artistSpotlight.failed',
            message: `Reader artist Spotlight failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
