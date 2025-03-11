import { PassThrough } from 'stream';
import { generateMockup } from './mockupGenerator';

process.on('message', async (message) => {
    try {
        const { sourceBuffer, artworkBuffer } = message as any;

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

        const sourceBufferObj = Buffer.from(sourceBuffer.data);
        const artworkBufferObj = Buffer.from(artworkBuffer.data);

        await generateMockup(
            sourceBufferObj,
            [artworkBufferObj],
            ['00ff00', 'ff0000'],
            outputStream
        );
    } catch (error) {
        if (process.send) {
            process.send({
                type: 'error',
                error: (error as any).message,
            });
        }
    }
});
