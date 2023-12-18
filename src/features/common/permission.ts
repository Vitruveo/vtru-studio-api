import { NextFunction, Request, Response } from 'express';

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
    next();
};
