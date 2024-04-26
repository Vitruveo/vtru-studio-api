import degub from 'debug';
import getPixels from 'get-pixels';
import { extractColors } from 'extract-colors';

const logger = degub('services:extractColor');

interface HandleExtractColorParams {
    filename: string;
}

export const hadleExtractColor = ({ filename }: HandleExtractColorParams) =>
    new Promise((resolve, reject) => {
        getPixels(filename, async (error, pixels) => {
            if (error) {
                logger('Error:', error);
                reject(error);
            }

            const data = [...pixels.data];
            const width = Math.round(Math.sqrt(data.length / 4));
            const height = width;

            const response = await extractColors({ data, width, height });

            resolve(response.map((item) => item.hex));
        });
    });
