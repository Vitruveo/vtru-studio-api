import { nanoid } from 'nanoid';
import { Request, Response, NextFunction } from 'express';
import debug from 'debug';

import { APIResponse } from '../../../services';

const logger = debug('features:assets:middlewares:countCharacters');

interface CheckCountCharactersParams {
    field: string;
    minLength: number;
}

export const checkCountCharacters =
    ({ field, minLength }: CheckCountCharactersParams) =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const value = req.query[field] || req.body[field];

            if (value.trim().length < minLength) {
                res.status(400).json({
                    code: 'vitruveo.studio.api.assets.subjects.invalidParams',
                    message: 'Invalid params',
                    transaction: nanoid(),
                } as APIResponse);
                return;
            }

            next();
        } catch (error) {
            logger('Error checking character count:', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.assets.get.error',
                transaction: nanoid(),
                args: {
                    field,
                    minLength,
                },
                message: 'Error checking character count',
            } as APIResponse);
        }
    };
