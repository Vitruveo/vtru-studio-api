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
