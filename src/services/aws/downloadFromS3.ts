import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

import {
    ASSET_TEMP_DIR,
    AWS_BUCKET_ASSET_NAME,
    AWS_REGION,
} from '../../constants';

interface DownloadFromS3Params {
    filename: string;
}

export const downloadFromS3 = async ({ filename }: DownloadFromS3Params) => {
    const s3 = new S3Client({
        region: AWS_REGION,
    });
    const data = await s3.send(
        new GetObjectCommand({
            Bucket: AWS_BUCKET_ASSET_NAME,
            Key: filename,
        })
    );

    const endFileName = path.join(ASSET_TEMP_DIR, filename);
    const parsedFileName = path.parse(endFileName);

    await fs.mkdir(parsedFileName.dir, { recursive: true });
    await fs.writeFile(
        path.join(ASSET_TEMP_DIR, filename),
        data.Body as unknown as string
    );

    return data.Metadata;
};
