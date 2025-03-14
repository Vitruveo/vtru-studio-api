import { nanoid } from 'nanoid';
import { NextFunction, Request, Response } from 'express';
import { APIResponse } from '../../../services';
import {
    createRecordFramework,
    defaultRecordFramework,
    updateRecordFramework,
} from '../../common/record';
import {
    loginSchema,
    otpConfirmSchema,
    schemaValidationForAddEmail,
    schemaValidationForCreate,
    schemaValidationForGenerateStackSlideshow,
    schemaValidationForPut,
    schemaValidationForPutAvatar,
    schemaValidationForRequestConnect,
    updateLicenseSchema,
} from './schemas';
import { CreatorSchema, encryptCode, generateCode } from '../model';

export const validateBodyForLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForLogin.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        loginSchema.parse(req.body);

        const code = generateCode();
        const codeHash = encryptCode(code);

        req.body.email = req.body.email.trim().toLowerCase();
        req.body.code = code;
        req.body.codeHash = codeHash;
        req.body.framework = defaultRecordFramework();
        req.body.creator = CreatorSchema.parse({
            emails: [
                {
                    email: req.body.email.trim().toLowerCase(),
                    codeHash,
                    checkedAt: null,
                },
            ],
        });

        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForLogin.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
export const validateBodyForRequestConnect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'airdrop.api.profile.validateBodyForAuth.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForRequestConnect.parse(req.body);

        next();
    } catch (error) {
        res.status(400).json({
            code: 'airdrop.api.profile.validateBodyForAuth.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForOtpLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForOtpLogin.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = otpConfirmSchema.parse(req.body);
        req.body.framework = defaultRecordFramework();
        req.body.email = req.body.email.trim().toLowerCase();
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForOtpLogin.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForPut = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PUT') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForPut.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForPut.parse(req.body);
        req.body.framework = updateRecordFramework({
            framework: req.body.framework,
            updatedBy: req.auth.id,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForPut.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForAddEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForAddEmail.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        const originalBody = req.body;
        req.body = schemaValidationForAddEmail.parse(originalBody);
        req.body.framework = updateRecordFramework({
            framework: originalBody.framework,
            updatedBy: req.auth.id,
        });
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForAddEmail.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForPutAvatar = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PUT') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForPutAvatar.failed',
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

        req.body = schemaValidationForPutAvatar.parse(payload);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForPutAvatar.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForCreate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForCreate.failed',
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
            code: 'vitruveo.studio.api.creator.validateBodyForCreate.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForGenerateStackSlideshow = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'POST') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForGenerateStackSlideshow.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);

        return;
    }

    try {
        req.body = schemaValidationForGenerateStackSlideshow.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForGenerateStackSlideshow.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};

export const validateBodyForUpdateLicenses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.method !== 'PATCH') {
        res.status(405).json({
            code: 'vitruveo.studio.api.creator.validateBodyForUpdateLicenses.failed',
            message: '',
            transaction: nanoid(),
        } as APIResponse);
        return;
    }
    try {
        req.body = updateLicenseSchema.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            code: 'vitruveo.studio.api.creator.validateBodyForPut.failed',
            message: '',
            transaction: nanoid(),
            args: error,
        } as APIResponse);
    }
};
