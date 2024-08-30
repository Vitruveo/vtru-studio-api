import debug from 'debug';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Router } from 'express';

import { model } from '..';
import { GENERAL_STORAGE_URL, SEARCH_URL } from '../../../constants';

const DIST = join(__dirname, '..', '..', '..', '..', 'static');
const logger = debug('features:creators:controller:grid');
const route = Router();

route.get('/:timestamp', async (req, res) => {
    try {
        const { timestamp } = req.params;

        const grid = await model.findCreatorAssetsByGridId({ id: timestamp });

        const path = `${grid?._id}/creators/${timestamp}`;
        const domain = `${req.protocol}://${req.get('host')}`;
        const title = grid?.search?.grid[0].title;

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

        let html = (await readFile(join(DIST, 'grid.html'))).toString();
        params.forEach((param) => {
            if (!param.value) return;
            html = html.replace(param.name, param.value);
        });

        return res.status(200).send(html);
    } catch (error) {
        logger('Get grid failed: %O', error);

        const html = (await readFile(join(DIST, 'grid.html'))).toString();
        return res.status(200).send(html);
    }
});

export { route };
