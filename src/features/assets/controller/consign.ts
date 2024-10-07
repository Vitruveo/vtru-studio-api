/* eslint-disable no-await-in-loop */
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
import {
    ASSET_STORAGE_NAME,
    ASSET_STORAGE_URL,
    GENERAL_STORAGE_URL,
} from '../../../constants';

import {
    schemaAssetValidation,
    schemaCreatorValidation,
} from './schemaValidate';
import { mustBeOwner } from '../../common/rules';

const logger = debug('features:assets:controller:consign');

const route = Router();

route.use(middleware.checkAuth);

route.get('/validation/:id', mustBeOwner, async (req, res) => {
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

        // Validate avatar
        const avatarPath = creator.profile?.avatar;
        if (avatarPath) {
            const checkAvatarExists = await exists({
                key: avatarPath,
                bucketUrl: GENERAL_STORAGE_URL,
            });

            if (!checkAvatarExists) {
                res.status(400).json({
                    code: 'vitruveo.studio.api.assets.creator.avatar.not.found',
                    message: 'Avatar not found',
                    transaction: nanoid(),
                    args: `Error: Validation Error\nThe file ${avatarPath} not found on S3. Please, upload the avatar again.`,
                } as APIResponse);
                return;
            }
        }

        // Validate midias
        const medias = [
            { name: 'original', path: asset.formats?.original?.path },
            { name: 'display', path: asset.formats?.display?.path },
            { name: 'preview', path: asset.formats?.preview?.path },
            { name: 'exhibition', path: asset.formats?.exhibition?.path },
            { name: 'print', path: asset.formats?.print?.path },
            {
                name: 'arImage',
                path: asset.mediaAuxiliary?.formats?.arImage?.path,
            },
            {
                name: 'arVideo',
                path: asset.mediaAuxiliary?.formats?.arVideo?.path,
            },
            {
                name: 'btsImage',
                path: asset.mediaAuxiliary?.formats?.btsImage?.path,
            },
            {
                name: 'btsVideo',
                path: asset.mediaAuxiliary?.formats?.btsVideo?.path,
            },
            {
                name: 'codeZip',
                path: asset.mediaAuxiliary?.formats?.codeZip?.path,
            },
        ].filter((media) => media.path);

        // list files not found
        const filesNotFound: string[] = [];

        logger('Bucket: %s', ASSET_STORAGE_NAME);

        for (let i = 0; i < medias.length; i += 1) {
            const media = medias[i];

            logger('path: %s', media.path);

            const existsFile = await exists({
                key: media.path!,
                bucketUrl: ASSET_STORAGE_URL,
            });

            if (!existsFile) filesNotFound.push(media.name);
        }

        if (filesNotFound.length > 0) {
            res.status(400).json({
                code: 'vitruveo.studio.api.assets.file.not.found',
                message: 'Files not found',
                transaction: nanoid(),
                args: `Error: Validation Error\nThe file ${filesNotFound.join(
                    ', '
                )} not found on S3. Please, upload the files again.`,
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
