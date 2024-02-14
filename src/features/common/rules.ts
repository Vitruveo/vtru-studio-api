import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { schemaParamsEmail, schemaParamsObjectId, schemaQuery } from './schema';
import { APIResponse } from '../../services';
import { NeedsToBeOwnerPermissions } from './types';
import { checkUserPermission } from './permission';

export const needsToBeOwner =
    ({ permissions }: NeedsToBeOwnerPermissions) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const { id, type: authType } = req.auth;

        if (!id) {
            res.status(401).json({
                code: 'vitruveo.studio.api.common.needsToBeOwner.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);

            return;
        }

        // TODO: check permissions
        if (authType === 'user') {
            checkUserPermission({
                req,
                res,
                next,
                permissions,
            });

            return;
        }

        if (req.params.id === id.toString()) {
            next();
            return;
        }

        if (!req.params.id) {
            res.status(404).json({
                code: 'vitruveo.studio.api.common.needsToBeOwner.failed',
                message: 'You are not allowed to change this',
                transaction: nanoid(),
            } as APIResponse);
        }

        res.status(401).json({
            code: 'vitruveo.studio.api.common.needsToBeOwner.failed',
            message: 'You are not allowed to change this',
            transaction: nanoid(),
        } as APIResponse);
    };

export const validateQueries = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schemaQuery.parse(req.query);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.common.validateQueries.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateParamsId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schemaParamsObjectId.id.parse(req.params.id);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.common.validateParamsId.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateParamsEmail = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schemaParamsEmail.email.parse(req.params.email);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.common.validateParamsEmail.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
