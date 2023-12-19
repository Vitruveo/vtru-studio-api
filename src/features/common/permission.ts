import { NextFunction, Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { APIResponse } from '../../services';

export interface CheckUserPermissionParams {
    req: Request;
    res: Response;
    next: NextFunction;
    permissions: string[];
}

export const checkUserPermission = ({
    req,
    res,
    next,
    permissions,
}: CheckUserPermissionParams) => {
    const userPermissions = req.auth.permissions;

    if (userPermissions.includes('super-admin')) {
        next();
        return;
    }

    if (
        !permissions.some((permission) => userPermissions.includes(permission))
    ) {
        res.status(401).json({
            code: 'vitruveo.studio.api.admin.users.login.otpConfirm.failed',
            message: 'Permission not found',
            transaction: nanoid(),
        } as APIResponse);
        return;
    }

    next();
};
