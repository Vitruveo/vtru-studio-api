import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../services';
import { assets, creators } from '..';

interface CanChangeParams {
    entity: 'assets' | 'creators' | 'users' | 'roles' | 'permissions';
}

export const CREATORS = 'creators';
export const ASSETS = 'assets';
export const USERS = 'users';
export const ROLES = 'roles';
export const PERMISSIONS = 'permissions';

export const canChange =
    ({ entity }: CanChangeParams) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const { userId } = req.body;

        if (!userId) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.common.can.change.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        const isCreator = await creators.model.findCreatorById({ id: userId });

        if (!isCreator) next();
        if (!req.params.id) next();

        if (entity === CREATORS) {
            if (req.params.id === isCreator?._id.toString()) {
                next();
                return;
            }

            res.status(401).json({
                code: 'vitruveo.studio.api.admin.common.can.change.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        if (entity === ASSETS) {
            const asset = await assets.model.findAssetsById({
                id: req.params.id,
            });

            if (
                asset?.framework.createdBy?.toString() ===
                isCreator?._id.toString()
            ) {
                next();
                return;
            }

            res.status(401).json({
                code: 'vitruveo.studio.api.admin.common.can.change.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        if ([USERS, ROLES, PERMISSIONS].includes(entity)) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.common.can.change.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        res.status(500).json({
            code: 'vitruveo.studio.api.admin.common.can.change.failed',
            message: 'Condition not handled',
            transaction: nanoid(),
        } as APIResponse);
    };
