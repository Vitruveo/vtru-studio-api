import debug from 'debug';
import fs from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import { validateBodyForUpload, validateBodyForUploadWithFile } from './rules';
import { ASSET_TEMP_DIR, GENERAL_STORAGE_NAME } from '../../../constants';
import { APIResponse } from '../../../services';
import { download } from '../../../services/stream';
import { upload } from '../../../services/aws';
import * as multer from '../../../services/multer';

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

export { route };
