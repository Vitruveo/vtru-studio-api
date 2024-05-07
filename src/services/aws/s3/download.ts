import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

import { ASSET_TEMP_DIR, AWS_DEFAULT_REGION } from '../../../constants';
import { DownloadOptions } from './types';

export const download = async ({ bucket, fileName, key }: DownloadOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });
    const data = await s3.send(
        new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        })
    );

    const endFileName = path.join(ASSET_TEMP_DIR, fileName);
    const parsedFileName = path.parse(endFileName);

    await fs.mkdir(parsedFileName.dir, { recursive: true });
    await fs.writeFile(
        path.join(ASSET_TEMP_DIR, fileName),
        data.Body as unknown as string
    );

    return data.Metadata;
};
