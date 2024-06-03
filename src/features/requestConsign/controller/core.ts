import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { middleware } from '../../users';
import { validateQueries } from '../../common/rules';
import { APIResponse } from '../../../services';
import { findAssetCreatedBy } from '../../assets/model';
import { RequestConsignProps } from './types';

const logger = debug('features:requestConsign:controller');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', validateQueries, async (req, res) => {
    try {
        const { id } = req.auth;
        const asset = await findAssetCreatedBy({ id });

        const requestConsign: RequestConsignProps = {
            asset: asset?._id!,
            creator: id,
            when: new Date(),
            status: 'pending',
        };

        res.json({ message: requestConsign });
    } catch (error) {
        logger('Create request consign failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.requestConsign.failed',
            message: `Request Consign failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
