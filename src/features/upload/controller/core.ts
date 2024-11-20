import debug from 'debug';
import fs from 'fs/promises';
import { z } from 'zod';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import {
    validateBodyForRequestUpload,
    validateBodyForUpload,
    validateBodyForUploadWithFile,
} from './rules';
import {
    ASSET_STORAGE_URL,
    ASSET_TEMP_DIR,
    GENERAL_STORAGE_NAME,
} from '../../../constants';
import { APIResponse } from '../../../services';
import { download } from '../../../services/stream';
import { upload } from '../../../services/aws';
import * as multer from '../../../services/multer';
import { checkAuth } from '../../users/middleware';
import { model } from '../../creators';
import { schemaValidationForRequestUpload } from './schemas';
import { sendToExchangeGrid } from '../../../services/grid';
import { videoExtension } from '../../assets/utils/videoExtensions';
import { checkMd5Hash } from '../middleware';

const logger = debug('features:upload:controller');
const route = Router();

route.post('/', validateBodyForUpload, async (req, res) => {
    const { url, key } = req.body;
    const fileName = join(ASSET_TEMP_DIR, key);
    try {
        // download the file
        await download({ url, path: fileName });
        logger('File downloaded: %s', fileName);

        await upload({ bucket: GENERAL_STORAGE_NAME, fileName, key });
        logger('File uploaded: %s', key);

        res.json({
            code: 'vitruveo.studio.api.upload.success',
            message: 'Upload success',
            transaction: nanoid(),
        } as APIResponse);
    } catch (error) {
        logger('Upload failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.upload.failed',
            message: `Upload failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    } finally {
        try {
            // remove file
            await fs.unlink(fileName);
        } catch (error) {
            // do nothing
        }
    }
});

route.post(
    '/file',
    multer.upload.single('file'),
    validateBodyForUploadWithFile,
    async (req, res) => {
        const fileName = req.file?.path;
        try {
            const { key } = req.body;

            if (!fileName) throw new Error('File not found');

            await upload({ bucket: GENERAL_STORAGE_NAME, fileName, key });
            logger('File uploaded: %s', key);

            res.json({
                code: 'vitruveo.studio.api.upload.file.success',
                message: 'Upload file success',
                transaction: nanoid(),
            } as APIResponse);
        } catch (error) {
            logger('Upload file failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.upload.file.failed',
                message: `Upload file failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        } finally {
            if (fileName)
                fs.unlink(fileName).then(() =>
                    logger('File removed: %s', fileName)
                );
        }
    }
);

route.post(
    '/grid',
    checkAuth,
    checkMd5Hash,
    validateBodyForRequestUpload,
    async (req, res) => {
        try {
            const { id } = req.auth;
            const {
                assetsId,
                assets = [],
                fees,
                title,
                description,
                size,
                hash,
            } = req.body as z.infer<typeof schemaValidationForRequestUpload>;
            const date = Date.now().toString();

            const path = `${id}/creators/${date}`;

            await sendToExchangeGrid(
                JSON.stringify({
                    size,
                    pathName: path,
                    assets: assets.map((item) => {
                        const isVideo = videoExtension.some((ext) =>
                            item.endsWith(ext)
                        );

                        if (isVideo)
                            return `${ASSET_STORAGE_URL}/${item}`.replace(
                                /\.(\w+)$/,
                                '_thumb.jpg'
                            );
                        return `${ASSET_STORAGE_URL}/${item}`;
                    }),
                    creatorId: id,
                })
            );

            await model.updateCreatorSearchGrid({
                id,
                grid: {
                    id: date,
                    path,
                    assets: assetsId,
                    fees,
                    title,
                    description,
                },
                hash,
            });

            res.status(200).json({
                code: 'vitruveo.studio.api.upload.request.success',
                message: `Request Upload success`,
                transaction: nanoid(),
            } as APIResponse);
        } catch (error) {
            logger('Request upload failed: %O', error);
            res.status(500).json({
                code: 'vitruveo.studio.api.upload.request.failed',
                message: `Request Upload failed: ${error}`,
                args: error,
                transaction: nanoid(),
            } as APIResponse);
        }
    }
);

export { route };
