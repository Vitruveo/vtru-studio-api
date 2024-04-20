import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { createWriteStream, createReadStream, promises } from 'fs';
import { join } from 'path';
import { customAlphabet } from 'nanoid';

import {
    ASSET_TEMP_DIR,
    IPFS_AUTHORIZATION,
    IPFS_HOST,
    IPFS_PORT,
    IPFS_PROTOCOL,
} from '../../constants';

const tempFilename = customAlphabet('1234567890abcdefg', 10);

export const download = async ({
    path,
    url,
}: {
    path: string;
    url: string;
}) => {
    const writer = createWriteStream(path);
    const pipe = await axios.get(url, {
        responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
        let err: Error | null = null;
        writer.on('close', () => {
            if (!err) resolve(true);
        });
        writer.on('error', (error) => {
            err = error;
            writer.close();
            reject(error);
        });
        pipe.data.pipe(writer);
    });
};

export const uploadToIPFS = async ({
    url,
}: {
    url: string;
}): Promise<AxiosResponse> => {
    const baseURL = `${IPFS_PROTOCOL}://${IPFS_HOST}:${IPFS_PORT}/api/v0/add?pin=true`;
    const headers = {
        Authorization: IPFS_AUTHORIZATION,
    };

    // create temp dir
    await promises.mkdir(ASSET_TEMP_DIR, { recursive: true });
    const filename = join(ASSET_TEMP_DIR, tempFilename());

    // download file via stream
    await download({ path: filename, url });

    // create form data
    const formData = new FormData();
    formData.append('file', createReadStream(filename), {
        filename: url,
    });

    const response = await axios.post(baseURL, formData, {
        headers: {
            ...formData.getHeaders(),
            ...headers,
        },
    });

    // delete file
    await promises.unlink(filename);

    return response;
};
