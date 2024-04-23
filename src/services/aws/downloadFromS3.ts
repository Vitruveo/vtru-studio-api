import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import fs from 'fs/promises';

import { AWS_BUCKET_ASSET_NAME, AWS_REGION } from '../../constants';

interface DownloadFromS3Params {
    file: string;
}

export const downloadFromS3 = async ({ file }: DownloadFromS3Params) => {
    const s3 = new S3Client({
        region: AWS_REGION,
    });
    const data = await s3.send(
        new GetObjectCommand({
            Bucket: AWS_BUCKET_ASSET_NAME,
            Key: file,
        })
    );

    const endFileName = path.join('/', 'tmp', file);
    const parsedFileName = path.parse(endFileName);

    await fs.mkdir(parsedFileName.dir, { recursive: true });
    await fs.writeFile(
        path.join('/', 'tmp', file),
        data.Body as unknown as string
    );

    return data.Metadata;
};
