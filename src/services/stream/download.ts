import { createWriteStream } from 'fs';
import axios from 'axios';
import type { DownloadOptions } from './types';

export const download = async ({ path, url }: DownloadOptions) => {
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
