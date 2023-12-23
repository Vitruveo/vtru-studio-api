import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    createRecordFramework,
    updateRecordFramework,
} from '../../common/record';
import {
    schemaAssetMetadata,
    schemaAssetUpload,
    schemaContract,
    schemaCreatorMetadata,
    schemaLicenses,
    schemaValidationForCreate,
    schemaValidationForUpdate,
} from './schemas';

export const validateBodyForCreate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.assets.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForCreate.parse(req.body);
        req.body.framework = createRecordFramework({
            createdBy: req.auth.id,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PUT') {
        res.status(405).json({
            code: 'vitruveo.studio.api.assets.validateBodyForUpdate.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForUpdate.parse(req.body);
        req.body.framework = updateRecordFramework({
            updatedBy: req.auth.id,
            framework: req.body.framework,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForUpdate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdateStep = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PUT') {
        res.status(405).json({
            code: 'vitruveo.studio.api.assets.validateBodyForUpdateStep.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        const payload = {
            ...req.body,
            framework: createRecordFramework({
                createdBy: req.auth.id,
            }),
        };

        switch (req.body.stepName) {
            case 'assetUpload':
                req.body = schemaAssetUpload.parse(payload);
                break;

            case 'assetMetadata':
                req.body = schemaAssetMetadata.parse(payload);
                break;

            case 'creatorMetadata':
                req.body = schemaCreatorMetadata.parse(payload);
                break;

            case 'license':
                req.body = schemaLicenses.parse(payload);
                break;

            case 'contract':
                req.body = schemaContract.parse(payload);
                break;
            default:
                throw new Error('Invalid step name');
        }

        // req.body = schemaValidationForUpdateStep.parse(payload);

        req.body.status = 'draft';
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForUpdateStep.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
