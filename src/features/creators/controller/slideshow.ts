import debug from 'debug';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Router } from 'express';

import { SLIDESHOW_URL, DIST } from '../../../constants';

const logger = debug('features:creators:controller:slideshow');
const route = Router();

route.get('/:timestamp', async (req, res) => {
    try {
        const { timestamp } = req.params;

        const params = [
            { name: '__SLIDESHOW_URL__', value: SLIDESHOW_URL },
            { name: '__SLIDESHOW_ID__', value: timestamp },
        ];

        let html = (await readFile(join(DIST, 'slideshow.html'))).toString();
        params.forEach((param) => {
            if (!param.value) return;
            html = html.replace(param.name, param.value);
        });

        return res.status(200).send(html);
    } catch (error) {
        logger('Get slideshow failed: %O', error);

        const html = (await readFile(join(DIST, 'slideshow.html'))).toString();
        return res.status(200).send(html);
    }
});

export { route };
