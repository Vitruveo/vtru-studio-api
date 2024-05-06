import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    createRecordFramework,
    updateRecordFramework,
} from '../../common/record';
import {
    schemaAssetMetadata,
    schemaAssetUpdateStatus,
    schemaAssetUpload,
    schemaAuxiliaryMedia,
    schemaC2pa,
    schemaConsignArtworkListing,
    schemaConsignArtworkStatus,
    schemaContract,
    schemaContractExplorer,
    schemaIpfs,
    schemaLicenses,
    schemaPublish,
    schemaValidationForCreate,
    schemaValidationForDeleteFile,
    schemaValidationForVideoGallery,
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

export const validateBodyForVideoGallery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.assets.validateBodyForMakeVideo.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForVideoGallery.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForMakeVideo.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.body = schemaAssetUpdateStatus.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForUpdateStatus.failed',
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

            case 'auxiliaryMedia':
                req.body = schemaAuxiliaryMedia.parse(payload);
                break;

            case 'assetMetadata':
                req.body = schemaAssetMetadata.parse(payload);
                break;

            case 'license':
                req.body = schemaLicenses.parse(payload);
                break;

            case 'contract':
                req.body = schemaContract.parse(payload);
                break;
            case 'publish':
                req.body = schemaPublish.parse(payload);
                break;
            case 'consignArtworkStatus':
                schemaConsignArtworkStatus.parse(payload);
                req.body = {
                    'consignArtwork.status': payload.consignArtwork.status,
                    framework: payload.framework,
                };
                break;
            case 'consignArtworkListing':
                schemaConsignArtworkListing.parse(payload);
                req.body = {
                    'consignArtwork.listing': payload.consignArtwork.listing,
                    framework: payload.framework,
                };
                break;
            case 'c2pa': {
                req.body = schemaC2pa.parse(payload);
                break;
            }
            case 'ipfs': {
                schemaIpfs.parse(payload);

                req.body = {
                    'ipfs.finishedAt': payload.ipfs.finishedAt,
                    framework: payload.framework,
                };

                break;
            }
            case 'contractExplorer': {
                schemaContractExplorer.parse(payload);
                req.body = {
                    'contractExplorer.finishedAt':
                        payload.contractExplorer.finishedAt,
                    framework: payload.framework,
                };
                break;
            }
            default:
                throw new Error('Invalid step name');
        }

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

export const validateBodyForDeleteFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'DELETE') {
        res.status(405).json({
            code: 'vitruveo.studio.api.assets.validateBodyForDeleteFile.failed',
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

        req.body = schemaValidationForDeleteFile.parse(payload);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.assets.validateBodyForDeleteFile.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
