import multer from 'multer';
import fs from 'fs/promises';
import {
    EXPRESS_MULTER_MAX_FILE_SIZE,
    TEMPORARY_DIRECTORY,
} from '../../constants';

const storage = multer.diskStorage({
    destination(_req, _file, cb) {
        fs.mkdir(TEMPORARY_DIRECTORY, { recursive: true })
            .then(() => cb(null, TEMPORARY_DIRECTORY))
            .catch(() => cb(null, TEMPORARY_DIRECTORY));
    },
});

export const upload = multer({
    storage,
    limits: { fileSize: EXPRESS_MULTER_MAX_FILE_SIZE },
});
