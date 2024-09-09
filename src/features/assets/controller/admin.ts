import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { Sort } from 'mongodb';
import * as model from '../model';
import { APIResponse } from '../../../services';
import { middleware } from '../../users';
import { ResponsePaginatedAdmin } from './types';
import { needsToBeOwner } from '../../common/rules';
import { queryByTitleOrDescOrCreator } from '../utils/queries';

const logger = debug('features:assets:controller:admin');
const route = Router();

route.use(middleware.checkAuth);

const defaultSort: Sort = {
    'contractExplorer.createdAt': -1,
};

export const defaultQuery = {
    'framework.createdBy': {
        $exists: true,
        $ne: null,
        $nin: [''],
    },
};

route.get(
    '/',
    needsToBeOwner({ permissions: ['asset:admin'] }),
    async (req, res) => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 24;
            const query = (req.query.query as Record<string, unknown>) || {};
            const sort = req.query.sort as Sort;
            const name = req.query.name as string;

            const addSearchByTitleDescCreator = (param: string) => {
                const searchByTitleDescCreator = {
                    $or: queryByTitleOrDescOrCreator({ name: param }),
                };

                query.$and = [searchByTitleDescCreator];
            };

            if (name) addSearchByTitleDescCreator(name);

            const parsedQuery = {
                ...query,
                ...defaultQuery,
            };

            const result = await model.countAssets({
                query: parsedQuery,
                colors: [],
                precision: 0.7,
            });
            const total = result[0]?.count ?? 0;
            const totalPage = Math.ceil(total / limit);

            const assets = await model.findAssetsPaginated({
                limit,
                skip: (page - 1) * limit,
                query: parsedQuery,
                sort: sort || defaultSort,
                precision: 0.7,
                colors: [],
            });

            res.json({
                code: 'vitruveo.studio.api.assets.admin.success',
                message: 'Admin asset success',
                transaction: nanoid(),
                data: {
                    data: assets,
                    page,
                    totalPage,
                    total,
                    limit,
                },
            } as APIResponse<ResponsePaginatedAdmin>);
        } catch (error) {
            logger('Admin asset failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.admin.failed',
                message: `Admin asset failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
