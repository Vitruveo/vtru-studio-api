import degub from 'debug';
import getPixels from 'get-pixels';
import { extractColors } from 'extract-colors';

const logger = degub('services:extractColor');

interface HandleExtractColorParams {
    filename: string;
}

export const handleExtractColor = ({ filename }: HandleExtractColorParams): Promise<number[][]> =>
    new Promise((resolve, reject) => {
        getPixels(filename, async (error, pixels) => {
            if (error) {
                logger('Error:', error, filename);
                reject(error);
            }

            const data = [...pixels.data];
            const width = Math.round(Math.sqrt(data.length / 4));
            const height = width;

            const response = await extractColors({ data, width, height });
            const colors = response.map((item) => [item.red, item.green, item.blue]);

            resolve(colors);
        });
    });
