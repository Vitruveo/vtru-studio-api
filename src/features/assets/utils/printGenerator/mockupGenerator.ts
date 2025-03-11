/* eslint-disable */

import sharp from 'sharp';
import { PassThrough } from 'stream';

// Função principal
export async function generateMockup(
    sourcePath: string | Buffer,
    artworkPaths: string[] | Buffer[],
    maskColors: string[],
    outputStream: PassThrough
): Promise<void> {
    try {
        console.log('Loading source image...');
        const sourceMetadata = await sharp(sourcePath).metadata();
        const sourceImage = await sharp(sourcePath).ensureAlpha().toBuffer();

        console.log('Processing artworks and masks...');
        const compositeLayers: Array<{
            input: Buffer;
            left: number;
            top: number;
        }> = [];

        for (let i = 0; i < artworkPaths.length; i++) {
            const artworkPath = artworkPaths[i];
            const maskColor = maskColors[i];

            console.log(
                `Processing artwork: ${artworkPath} with mask color: #${maskColor}`
            );
            console.log('Mask color in RGB:', hexToRgb(maskColor));

            // Detect the mask color region
            const { x, y, width, height } = await detectMaskRegion(
                sourceImage,
                sourceMetadata,
                maskColor
            );
            console.log(
                `Mask region detected: { x: ${x}, y: ${y}, width: ${width}, height: ${height} }`
            );

            if (width <= 0 || height <= 0) {
                console.warn(
                    `Warning: No mask region detected for color #${maskColor}. Skipping this artwork.`
                );
                continue;
            }

            // Increase the artwork size by 2px on all sides
            const expandedWidth = width + 6; // 2px on each side
            const expandedHeight = height + 6; // 2px on each side

            // Resize the artwork to fit the expanded mask region
            const resizedArtwork = await sharp(artworkPath)
                .resize(expandedWidth, expandedHeight)
                .toBuffer();

            // Adjust the position to center the expanded artwork over the mask region
            const adjustedX = Math.max(0, x - 2);
            const adjustedY = Math.max(0, y - 2);

            // Add the resized artwork to the composite layers
            compositeLayers.push({
                input: resizedArtwork,
                left: adjustedX,
                top: adjustedY,
            });
        }

        console.log('Making mask regions transparent...');
        const sourceWithTransparency = await makeMaskAndNeighborsTransparent(
            sourceImage,
            sourceMetadata,
            maskColors
        );

        console.log('Compositing artworks below the source image...');

        const pipeline = sharp({
            // @ts-ignore
            create: {
                width: sourceMetadata.width,
                height: sourceMetadata.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([
                ...compositeLayers, // Artwork layers
                { input: sourceWithTransparency, left: 0, top: 0 }, // Source layer with transparency
            ])
            .jpeg(); // Ensure output is in JPEG format

        pipeline.pipe(outputStream);
    } catch (error) {
        console.error('Error generating mockup:', error);
        outputStream.end();
    }
}

// Detect the region of a specific mask color (exact match)
async function detectMaskRegion(
    imageBuffer: Buffer,
    metadata: sharp.Metadata,
    maskColor: string
): Promise<{ x: number; y: number; width: number; height: number }> {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const [maskR, maskG, maskB] = hexToRgb(maskColor);
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * info.channels;
            const pixelR = data[idx];
            const pixelG = data[idx + 1];
            const pixelB = data[idx + 2];

            // Check if the pixel color matches the mask color exactly
            if (pixelR === maskR && pixelG === maskG && pixelB === maskB) {
                if (x < x1) x1 = x;
                if (y < y1) y1 = y;
                if (x > x2) x2 = x;
                if (y > y2) y2 = y;
            }
        }
    }

    if (
        x1 === Infinity ||
        y1 === Infinity ||
        x2 === -Infinity ||
        y2 === -Infinity
    ) {
        throw new Error(`No mask region detected for color #${maskColor}.`);
    }

    return {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
    };
}

// Make mask regions and neighboring pixels transparent
async function makeMaskAndNeighborsTransparent(
    imageBuffer: Buffer,
    metadata: sharp.Metadata,
    maskColors: string[]
): Promise<Buffer> {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const mask = new Array(info.width * info.height).fill(false);

    // Step 1: Mark mask pixels
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * info.channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Check if the pixel matches any mask color exactly
            for (const maskColor of maskColors) {
                const [maskR, maskG, maskB] = hexToRgb(maskColor);
                if (r === maskR && g === maskG && b === maskB) {
                    mask[y * info.width + x] = true; // Mark as mask pixel
                    data[idx + 3] = 0; // Set transparency to 0
                    break;
                }
            }
        }
    }

    // Step 2: Mark neighboring pixels as transparent
    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            if (mask[y * info.width + x]) {
                // Check neighboring pixels (1-2 pixels in all directions)
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;

                        // Skip if out of bounds or the pixel itself
                        if (
                            nx < 0 ||
                            nx >= info.width ||
                            ny < 0 ||
                            ny >= info.height ||
                            (dx === 0 && dy === 0)
                        ) {
                            continue;
                        }

                        // Mark the neighboring pixel as transparent if it's not a mask pixel
                        const nIdx = (ny * info.width + nx) * info.channels;
                        if (!mask[ny * info.width + nx]) {
                            data[nIdx + 3] = 0; // Set transparency to 0
                        }
                    }
                }
            }
        }
    }

    return await sharp(data, {
        raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
        },
    })
        .toFormat('png') // Ensure the output is in a supported format
        .toBuffer();
}

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [r, g, b];
}
