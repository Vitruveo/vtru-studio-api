import axios from 'axios';
import { PassThrough } from 'stream';
import { generateMockup } from './mockupGenerator';
import { ASSET_STORAGE_URL } from '../../../../constants';

process.on('message', async (message) => {
    const outputStream = new PassThrough();

    outputStream.on('data', (chunk) => {
        if (process.send) {
            process.send({
                type: 'data',
                data: Array.from(chunk),
            });
        }
    });

    outputStream.on('end', () => {
        if (process.send) {
            process.send({ type: 'end' });
        }
    });

    outputStream.on('error', (err) => {
        if (process.send) {
            process.send({
                type: 'error',
                error: err.message,
            });
        }
    });

    try {
        const { source, assetPath } = message as any;

        if (!source || !assetPath) {
            throw new Error(
                'Invalid parameters: source and assetPath are required'
            );
        }

        let sourceBuffer;
        let artworkBuffer;

        try {
            const sourceResponse = await axios.get(source as string, {
                responseType: 'arraybuffer',
            });
            sourceBuffer = Buffer.from(sourceResponse.data);

            if (!sourceBuffer || sourceBuffer.length === 0) {
                throw new Error('Source buffer is empty or invalid');
            }
        } catch (error: any) {
            throw new Error(`Error retrieving source file: ${error.message}`);
        }

        try {
            const artworkResponse = await axios.get(
                `${ASSET_STORAGE_URL}/${assetPath}`,
                { responseType: 'arraybuffer' }
            );
            artworkBuffer = Buffer.from(artworkResponse.data);

            if (!artworkBuffer || artworkBuffer.length === 0) {
                throw new Error('Artwork buffer is empty or invalid');
            }
        } catch (error: any) {
            throw new Error(`Error retrieving artwork: ${error.message}`);
        }

        await generateMockup(sourceBuffer, artworkBuffer, outputStream);
    } catch (error: any) {
        if (process.send) {
            process.send({
                type: 'error',
                error: error.message || 'Unknown error',
            });
        }
        outputStream.end();
    } finally {
        process.exit(0);
    }
});
