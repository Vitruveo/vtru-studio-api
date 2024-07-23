import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { ZodError } from 'zod';

import * as model from '../model';
import * as modelCreators from '../../creators/model';
import { ObjectId, APIResponse } from '../../../services';
import { exists } from '../../../services/aws/s3/exists';
import { middleware } from '../../users';
import { formatErrorMessage } from '../../../utils';
import { ASSET_STORAGE_NAME } from '../../../constants';

import {
    schemaAssetValidation,
    schemaCreatorValidation,
} from './schemaValidate';

const logger = debug('features:assets:controller:consign');
const bucketName = ASSET_STORAGE_NAME;
const route = Router();

route.use(middleware.checkAuth);

route.get('/validation/:id', async (req, res) => {
    try {
        const asset = await model.findOneAssets({
            query: {
                _id: new ObjectId(req.params.id),
            },
        });

        if (!asset || !asset.framework.createdBy) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.creator.id.missing',
                message: 'Creator ID is missing',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await modelCreators.findCreatorById({
            id: asset.framework.createdBy,
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.creator.not.found',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        // Validate schema asset
        schemaAssetValidation.parse(asset);

        // Validate schema creator
        schemaCreatorValidation.parse(creator);

        // Validate midias
        const avatarPath = creator.profile?.avatar;
        const mediaPaths = [
            asset.formats?.original?.path,
            asset.formats?.display?.path,
            asset.formats?.preview?.path,
            asset.formats?.exhibition?.path,
            asset.formats?.print?.path,
            asset.mediaAuxiliary?.formats?.arImage?.path,
            asset.mediaAuxiliary?.formats?.arVideo?.path,
            asset.mediaAuxiliary?.formats?.btsImage?.path,
            asset.mediaAuxiliary?.formats?.btsVideo?.path,
            asset.mediaAuxiliary?.formats?.codeZip?.path,
            avatarPath,
        ].filter(Boolean) as string[];

        const checkExists = await Promise.all(
            mediaPaths.map((path) => exists({ key: path, bucket: bucketName }))
        );

        if (checkExists.some((fileExists) => !fileExists)) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.file.not.found',
                message: 'File not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.consign.validation.success',
            message: 'Consign validation success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Consign validation failed: %O', error);

        res.status(400).json({
            code: 'vitruveo.studio.api.assets.consign.validation.error',
            message: 'Consign validation error',
            transaction: nanoid(),
            args: error instanceof ZodError ? formatErrorMessage(error) : error,
        } as APIResponse);
    }
});

export { route };
