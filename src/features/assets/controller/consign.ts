import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ZodError } from 'zod';
import { ObjectId, APIResponse, captureException } from '../../../services';

import * as model from '../model';
import * as modelCreators from '../../creators/model';
import { middleware } from '../../users';
import { formatErrorMessage } from '../../../utils';
import {
    AWS_DEFAULT_REGION,
    GENERAL_STORAGE_URL,
    DEFAULT_AVATAR_URL,
    ASSET_STORAGE_NAME,
} from '../../../constants';
import {
    schemaAssetValidation,
    schemaCreatorValidation,
} from './schemaValidate';

const logger = debug('features:assets:controller:consign');
const s3Client = new S3Client({ region: AWS_DEFAULT_REGION });
const bucketName = ASSET_STORAGE_NAME;
const route = Router();

route.use(middleware.checkAuth);

async function checkS3FileExists(key: string) {
    try {
        await s3Client.send(
            new HeadObjectCommand({ Bucket: bucketName, Key: key })
        );
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound') {
            return false;
        }
        throw error; 
    }
}

route.get('/validation/:id', async (req, res) => {
    try {
        const asset = await model.findOneAssets({
            query: {
                _id: new ObjectId(req.params.id),
            },
        });

        if (!asset || !asset.framework.createdBy) {
            return res.status(400).json({
                code: 'vitruveo.studio.api.assets.Creator is null.validation.error',
                message: 'Creator ID is missing',
                transaction: nanoid(),
                args: 'Creator ID is missing',
            } as APIResponse);
        }

        const creator = await modelCreators.findCreatorById({
            id: asset.framework.createdBy,
        });

        if (!creator) {
            return res.status(404).json({
                code: 'vitruveo.studio.api.assets.Creator not found',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
        }

        const avatarPath =
            creator.profile?.avatar &&
            creator.profile.avatar !== DEFAULT_AVATAR_URL
                ? `${GENERAL_STORAGE_URL}/${creator.profile.avatar}`
                : null;

        const mediaPaths = [
            asset.formats?.original?.path,
            asset.formats?.display?.path,
            asset.formats?.preview?.path,
            asset.formats?.exhibition?.path,
            asset.formats?.print?.path,
            avatarPath,
        ]
            .filter(Boolean)
            .map((path) => path ? path.replace(`${GENERAL_STORAGE_URL  }/`, '') : '')
            .filter(Boolean);

        try {
            await Promise.all(mediaPaths.map(checkS3FileExists));
        } catch (error) {
            return res.status(404).json({
                code: 'vitruveo.studio.api.assets.consign.validation.error',
                message: `Media file at path does not exist in our S3 bucket.`,
                transaction: nanoid(),
            } as APIResponse);
        }

        schemaCreatorValidation.parse(creator);
        schemaAssetValidation.parse(asset);

        return res.json({
            code: 'vitruveo.studio.api.assets.consign.validation.success',
            message: 'Consign validation success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Consign validation failed: %O', error);
        captureException(
            {
                message: 'Consign validation failed',
                error: error instanceof Error ? error.message : error,
                creator: req.auth.id,
            },
            { tags: { scope: 'consign' } }
        );

        return res.status(400).json({
            code: 'vitruveo.studio.api.assets.consign.validation.error',
            message: 'Consign validation error',
            transaction: nanoid(),
            args: error instanceof ZodError ? formatErrorMessage(error) : error,
        } as APIResponse);
    }
});

export { route };
