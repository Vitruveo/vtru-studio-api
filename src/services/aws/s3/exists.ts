import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import axios from 'axios';
import debug from 'debug';

const logger = debug('services:aws:s3:exists');

interface ExistsOptions {
    key: string;
    bucketUrl: string;
}

export const exists = async ({ key, bucketUrl }: ExistsOptions) => {
    try {
        await axios.head(`${bucketUrl}/${key}`);

        return true;
    } catch (error) {
        logger('Error on check file exists: %O', error);

        return false;
    }
};

export async function verifyEObterURL(
    bucket: string,
    key: string
): Promise<string | null> {
    try {
        const s3 = new S3Client({
            region: 'us-west-2',
        });
        const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
        await s3.send(command);

        return `https://${bucket}.s3.amazonaws.com/${key}`;
    } catch (error: any) {
        return null;
    }
}
