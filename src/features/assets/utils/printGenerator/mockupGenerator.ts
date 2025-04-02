/* eslint-disable */

import sharp from 'sharp';
import { PassThrough } from 'stream';
import { createCanvas, loadImage } from 'canvas';

// Convert Hex Color to RGB
function hexToRgb(hex: string) {
    if (!/^([0-9A-Fa-f]{6})$/.test(hex)) {
        throw new Error(`Invalid hex color: ${hex}`);
    }
    return [
        parseInt(hex.substring(0, 2), 16),
        parseInt(hex.substring(2, 4), 16),
        parseInt(hex.substring(4, 6), 16),
    ];
}

// Create canvas context
function createCanvasContext(w: number, h: number) {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d');
    return { canvas, ctx };
}

// Apply clip path
function applyClipPath(ctx: CanvasRenderingContext2D, points: number[][]) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.clip();
}

// Perspective transformation
function applyPerspective(
    ctxd: CanvasRenderingContext2D,
    image: any,
    points: number[][]
) {
    // Check the arguments
    if (!ctxd || !ctxd.strokeStyle) {
        return;
    }
    if (!image || !image.width || !image.height) {
        return;
    }

    // Prepare a canvas for the image
    const { canvas: cvso, ctx: ctxo } = createCanvasContext(
        image.width,
        image.height
    );
    ctxo.drawImage(image, 0, 0, cvso.width, cvso.height);

    // Prepare a canvas for the transformed image
    const { canvas: cvst, ctx: ctxt } = createCanvasContext(
        ctxd.canvas.width,
        ctxd.canvas.height
    );

    const d0x = points[0][0];
    const d0y = points[0][1];
    const d1x = points[1][0];
    const d1y = points[1][1];
    const d2x = points[2][0];
    const d2y = points[2][1];
    const d3x = points[3][0];
    const d3y = points[3][1];

    // Compute the dimension of each side
    const dims = [
        Math.sqrt(Math.pow(d0x - d1x, 2) + Math.pow(d0y - d1y, 2)), // top side
        Math.sqrt(Math.pow(d1x - d2x, 2) + Math.pow(d1y - d2y, 2)), // right side
        Math.sqrt(Math.pow(d2x - d3x, 2) + Math.pow(d2y - d3y, 2)), // bottom side
        Math.sqrt(Math.pow(d3x - d0x, 2) + Math.pow(d3y - d0y, 2)), // left side
    ];

    const ow = cvso.width;
    const oh = cvso.height;

    // Specify the index of which dimension is longest
    let base_index = 0;
    let max_scale_rate = 0;
    let zero_num = 0;
    for (let i = 0; i < 4; i++) {
        let rate = 0;
        if (i % 2) {
            rate = dims[i] / ow;
        } else {
            rate = dims[i] / oh;
        }
        if (rate > max_scale_rate) {
            base_index = i;
            max_scale_rate = rate;
        }
        if (dims[i] == 0) {
            zero_num++;
        }
    }
    if (zero_num > 1) {
        return;
    }

    const step = 2;
    const cover_step = step * 5;

    ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height);

    if (base_index % 2 == 0) {
        // top or bottom side
        const { canvas: cvsl, ctx: ctxl } = createCanvasContext(ow, cover_step);
        ctxl.globalCompositeOperation = 'copy';

        for (let y = 0; y < oh; y += step) {
            const r = y / oh;
            const sx = d0x + (d3x - d0x) * r;
            const sy = d0y + (d3y - d0y) * r;
            const ex = d1x + (d2x - d1x) * r;
            const ey = d1y + (d2y - d1y) * r;
            const ag = Math.atan((ey - sy) / (ex - sx));
            const sc =
                Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / ow;
            ctxl.setTransform(1, 0, 0, 1, 0, -y);
            ctxl.drawImage(cvso, 0, 0);

            ctxt.translate(sx, sy);
            ctxt.rotate(ag);
            ctxt.scale(sc, sc);
            ctxt.drawImage(cvsl, 0, 0);

            ctxt.setTransform(1, 0, 0, 1, 0, 0);
        }
    } else if (base_index % 2 == 1) {
        // right or left side
        const { canvas: cvsl, ctx: ctxl } = createCanvasContext(cover_step, oh);
        ctxl.globalCompositeOperation = 'copy';

        for (let x = 0; x < ow; x += step) {
            const r = x / ow;
            const sx = d0x + (d1x - d0x) * r;
            const sy = d0y + (d1y - d0y) * r;
            const ex = d3x + (d2x - d3x) * r;
            const ey = d3y + (d2y - d3y) * r;
            const ag = Math.atan((sx - ex) / (ey - sy));
            const sc =
                Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2)) / oh;
            ctxl.setTransform(1, 0, 0, 1, -x, 0);
            ctxl.drawImage(cvso, 0, 0);

            ctxt.translate(sx, sy);
            ctxt.rotate(ag);
            ctxt.scale(sc, sc);
            ctxt.drawImage(cvsl, 0, 0);

            ctxt.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    // Set a clipping path and draw the transformed image on the destination canvas
    ctxd.save();
    applyClipPath(ctxd, [
        [d0x, d0y],
        [d1x, d1y],
        [d2x, d2y],
        [d3x, d3y],
    ]);
    // @ts-ignore
    ctxd.drawImage(ctxt.canvas, 0, 0);
    ctxd.restore();

    return ctxt.canvas.toBuffer('image/png');
}

// Detect mask regions and make them transparent
async function detectAndMakeTransparent(
    imageBuffer: Buffer,
    metadata: any,
    maskColors: string[]
) {
    const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });
    let detectedRegions = [];
    let outlierPixels = [];

    for (const maskColor of maskColors) {
        const [r, g, b] = hexToRgb(maskColor);
        let detectedPixels = [];

        // Track Outliers
        let outMinX = Infinity,
            outMaxX = -Infinity,
            outMinY = Infinity,
            outMaxY = -Infinity;

        for (let y = 0; y < info.height; y++) {
            for (let x = 0; x < info.width; x++) {
                const idx = (y * info.width + x) * info.channels;
                if (
                    data[idx] === r &&
                    data[idx + 1] === g &&
                    data[idx + 2] === b
                ) {
                    detectedPixels.push({ x, y });
                    data[idx + 3] = 0; // Make transparent

                    // Track outermost pixels
                    if (x < outMinX) {
                        outMinX = x;
                    }
                    if (x > outMaxX) {
                        outMaxX = x;
                    }
                    if (y < outMinY) {
                        outMinY = y;
                    }
                    if (y > outMaxY) {
                        outMaxY = y;
                    }
                }
            }
        }

        if (detectedPixels.length === 0) {
            detectedRegions.push(null);
            continue;
        }

        const detectedRegionCoords = [
            detectedPixels.reduce((a, b) => (b.x + b.y < a.x + a.y ? b : a)), // Top-left
            detectedPixels.reduce((a, b) => (b.x - b.y > a.x - a.y ? b : a)), // Top-right
            detectedPixels.reduce((a, b) => (b.x + b.y > a.x + a.y ? b : a)), // Bottom-right
            detectedPixels.reduce((a, b) => (b.y - b.x > a.y - a.x ? b : a)), // Bottom-left
        ];
        const outlierPixelCoords = [outMinX, outMaxX, outMinY, outMaxY];

        // Adjust region coordinates based on outliers
        const adjust0X =
            outMinX < detectedRegionCoords[0].x
                ? detectedRegionCoords[0].x - outMinX
                : 0;
        const adjust3X =
            outMinX < detectedRegionCoords[3].x
                ? detectedRegionCoords[3].x - outMinX
                : 0;
        detectedRegionCoords[0].x -= Math.max(adjust0X, adjust3X);
        detectedRegionCoords[3].x -= Math.max(adjust0X, adjust3X);

        const adjust0Y =
            outMinY < detectedRegionCoords[0].y
                ? detectedRegionCoords[0].y - outMinY
                : 0;
        const adjust1Y =
            outMinY < detectedRegionCoords[1].y
                ? detectedRegionCoords[1].y - outMinY
                : 0;
        detectedRegionCoords[0].y -= Math.max(adjust0Y, adjust1Y);
        detectedRegionCoords[1].y -= Math.max(adjust0Y, adjust1Y);

        const adjust1X =
            outMaxX > detectedRegionCoords[1].x
                ? outMaxX - detectedRegionCoords[1].x
                : 0;
        const adjust2X =
            outMaxX > detectedRegionCoords[2].x
                ? outMaxX - detectedRegionCoords[2].x
                : 0;
        detectedRegionCoords[1].x += Math.max(adjust1X, adjust2X);
        detectedRegionCoords[2].x += Math.max(adjust1X, adjust2X);

        const adjust2Y =
            outMaxY > detectedRegionCoords[2].y
                ? outMaxY - detectedRegionCoords[2].y
                : 0;
        const adjust3Y =
            outMaxY > detectedRegionCoords[3].y
                ? outMaxY - detectedRegionCoords[3].y
                : 0;
        detectedRegionCoords[2].y += Math.max(adjust2Y, adjust3Y);
        detectedRegionCoords[3].y += Math.max(adjust2Y, adjust3Y);

        detectedRegions.push(detectedRegionCoords);
        outlierPixels.push(outlierPixelCoords);

        // console.log(`🔌 Outlier Pixels for #${maskColor}:`, [
        //     outMinX - 3,
        //     outMaxX + 3,
        //     outMinY - 3,
        //     outMaxY + 3,
        // ]);
    }

    const transparentImage = await sharp(data, { raw: info })
        .toFormat('png')
        .toBuffer();
    return { transparentSource: transparentImage, detectedRegions };
}

// Main function
export async function generateMockup(
    sourcePath: Buffer,
    artworkPaths: Buffer[],
    maskColors: string[],
    outputStream: PassThrough
) {
    try {
        // console.log('Loading source image...');
        let sourceImage = await sharp(sourcePath).ensureAlpha().toBuffer();
        let sourceMetadata = await sharp(sourceImage).metadata();

        // console.log(
        //     'Detecting chromakey regions and making them transparent...'
        // );
        const { transparentSource, detectedRegions } =
            await detectAndMakeTransparent(
                sourceImage,
                sourceMetadata,
                maskColors
            );

        let artworkLayers = [];

        for (let i = 0; i < artworkPaths.length; i++) {
            const artworkPath = artworkPaths[i];
            const maskColor = maskColors[i];

            // console.log(
            //     `Processing artwork: ${artworkPath} with mask color: #${maskColor}`
            // );
            let corners = detectedRegions[i];

            if (!corners || corners.length !== 4) {
                // console.warn(
                //     `Warning: No valid quadrilateral found for mask color #${maskColor}. Skipping.`
                // );
                continue;
            }

            // console.log(`Loading artwork: ${artworkPath}`);
            const artwork = await loadImage(artworkPath);

            if (!artwork || artwork.width === 0 || artwork.height === 0) {
                throw new Error(`Artwork ${artworkPath} failed to load.`);
            }

            // console.log(
            //     `Applying perspective transformation for artwork: ${artworkPath}`
            // );

            // Create a new canvas for this artwork
            const { canvas: warpCanvas, ctx: warpCtx } = createCanvasContext(
                sourceMetadata.width!,
                sourceMetadata.height!
            );

            // Apply perspective warp
            const formattedCorners = corners.map((point) => [point.x, point.y]); // Convert to [x, y] format
            const warpedBuffer = applyPerspective(
                // @ts-ignore
                warpCtx,
                artwork,
                formattedCorners
            );

            // Store for compositing
            artworkLayers.push({ input: warpedBuffer });
        }

        // console.log('Stacking all warped artworks...');

        const pipeline = sharp({
            // @ts-ignore
            create: {
                width: sourceMetadata.width,
                height: sourceMetadata.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([...artworkLayers, { input: transparentSource }])
            .jpeg();

        pipeline.pipe(outputStream);

        // console.log(`Mockup saved`);
    } catch (error) {
        console.error('Error generating mockup:', error);
    }
}
