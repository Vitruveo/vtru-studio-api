import debug from 'debug';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import * as model from '../model';
import { middleware } from '../../users';
import { validateQueries } from '../../common/rules';
import { APIResponse, InsertOneResult } from '../../../services';
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
            asset: asset?._id.toString()!,
            creator: id,
            when: new Date(),
            status: 'pending',
        };

        const result = await model.createRequestConsign({ requestConsign });

        res.json({
            code: 'vitruveo.studio.api.requestConsign.success',
            message: 'Create request consign success',
            transaction: nanoid(),
            data: result,
        } as APIResponse<InsertOneResult<model.RequestConsignDocument>>);
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
