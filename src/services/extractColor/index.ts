import getPixels from 'get-pixels';
import { extractColors } from 'extract-colors';

interface HandleExtractColorParams {
    imagePath: string;
}

export const hadleExtractColor = ({ imagePath }: HandleExtractColorParams) =>
    new Promise((resolve, reject) => {
        console.log('imagePath:', imagePath);

        getPixels(imagePath, async (error, pixels) => {
            if (error) {
                console.log('Error:', error);
                reject(error);
            }

            const data = [...pixels.data];
            const width = Math.round(Math.sqrt(data.length / 4));
            const height = width;

            console.log('data:', data);
            console.log('width:', width);
            console.log('height:', height);

            const response = await extractColors({ data, width, height });

            console.log('response:', response);

            resolve(response.map((item) => item.hex));
        });
    });
