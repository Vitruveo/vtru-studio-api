import debug from 'debug';
import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { createReadStream, promises } from 'fs';
import { join } from 'path';
import { customAlphabet } from 'nanoid';

import {
    ASSET_TEMP_DIR,
    IPFS_AUTHORIZATION,
    IPFS_HOST,
    IPFS_PORT,
    IPFS_PROTOCOL,
} from '../../constants';
import { captureException } from '../sentry';
import { download } from '../stream';

const logger = debug('services:ipfs');

const tempFilename = customAlphabet('1234567890abcdefg', 10);

export const uploadToIPFS = async ({
    url,
}: {
    url: string;
}): Promise<AxiosResponse> => {
    const fileName = join(ASSET_TEMP_DIR, tempFilename());

    try {
        const baseURL = `${IPFS_PROTOCOL}://${IPFS_HOST}:${IPFS_PORT}/api/v0/add?pin=true`;
        const headers = {
            Authorization: IPFS_AUTHORIZATION,
        };

        // create temp dir
        await promises.mkdir(ASSET_TEMP_DIR, { recursive: true });

        // download file via stream
        await download({ path: fileName, url });

        // create form data
        const formData = new FormData();
        formData.append('file', createReadStream(fileName), {
            filename: url,
        });

        const response = await axios.post(baseURL, formData, {
            headers: {
                ...formData.getHeaders(),
                ...headers,
            },
        });

        return response;
    } catch (error) {
        logger('uploadToIPFS failed: %O', error);
        captureException(error, {
            extra: {
                url,
                fileName,
            },
            tags: { scope: 'uploadToIPFS' },
        });
        throw error;
    } finally {
        // delete file
        await promises.unlink(fileName);
    }
};
