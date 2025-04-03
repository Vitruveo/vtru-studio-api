import dayjs from 'dayjs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';

import type { UploadBufferOptions, UploadOptions } from './types';
import { AWS_DEFAULT_REGION } from '../../../constants';

export const upload = async ({ fileName, key, bucket }: UploadOptions) => {
    const s3 = new S3Client({
        region: AWS_DEFAULT_REGION,
    });
    const body = await fs.readFile(fileName);
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
        })
    );
};

export const uploadBuffer = async ({
    buffer,
    key,
    bucket,
}: UploadBufferOptions) => {
    const s3 = new S3Client({
        region: 'us-west-2',
    });

    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            Expires: dayjs().add(30, 'days').toDate(),
        })
    );
};
