/* eslint-disable no-restricted-syntax */
import sharp from 'sharp';
import extractChunks from 'png-chunks-extract';
import {
    createCanvas,
    loadImage,
    CanvasRenderingContext2D,
    Image,
} from 'canvas';

import { PassThrough } from 'stream';

interface Corner {
    x: number;
    y: number;
}

interface PerspectiveParams {
    ctxd: CanvasRenderingContext2D;
    cvso: ReturnType<typeof createCanvas>;
    ctxo: CanvasRenderingContext2D;
    ctxt: CanvasRenderingContext2D;
}

class Perspective {
    private p: PerspectiveParams;

    constructor(ctxd: CanvasRenderingContext2D, image: Image) {
        // Check the arguments
        if (!ctxd || !ctxd.strokeStyle) {
            throw new Error('Invalid context');
        }
        if (!image || !image.width || !image.height) {
            throw new Error('Invalid image');
        }

        // Prepare a canvas for the image
        const cvso = createCanvas(image.width, image.height);
        const ctxo = cvso.getContext('2d');
        ctxo.drawImage(image, 0, 0, cvso.width, cvso.height);

        // Prepare a canvas for the transformed image
        const cvst = createCanvas(ctxd.canvas.width, ctxd.canvas.height);
        const ctxt = cvst.getContext('2d');

        // Parameters
        this.p = {
            ctxd,
            cvso,
            ctxo,
            ctxt,
        };
    }

    draw(points: number[][]): Buffer | undefined {
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
            Math.sqrt((d0x - d1x) ** 2 + (d0y - d1y) ** 2), // Top side
            Math.sqrt((d1x - d2x) ** 2 + (d1y - d2y) ** 2), // Right side
            Math.sqrt((d2x - d3x) ** 2 + (d2y - d3y) ** 2), // Bottom side
            Math.sqrt((d3x - d0x) ** 2 + (d3y - d0y) ** 2), // Left side
        ];

        const ow = this.p.cvso.width;
        const oh = this.p.cvso.height;

        // Specify the index of which dimension is longest
        let baseIndex = 0;
        let maxScaleRate = 0;
        let zeroNum = 0;

        for (let i = 0; i < 4; i += 1) {
            let rate = 0;
            if (i % 2) {
                rate = dims[i] / ow;
            } else {
                rate = dims[i] / oh;
            }
            if (rate > maxScaleRate) {
                baseIndex = i;
                maxScaleRate = rate;
            }
            if (dims[i] === 0) {
                zeroNum += 1;
            }
        }

        if (zeroNum > 1) {
            return undefined;
        }

        const step = 2;
        const coverStep = step * 5;

        const { ctxo } = this.p;
        const { ctxt } = this.p;
        ctxt.clearRect(0, 0, ctxt.canvas.width, ctxt.canvas.height);

        if (baseIndex % 2 === 0) {
            // Top or bottom side
            const ctxl = this.createCanvasContext(ow, coverStep);
            ctxl.globalCompositeOperation = 'copy';
            const cvsl = ctxl.canvas;

            for (let y = 0; y < oh; y += step) {
                const r = y / oh;
                const sx = d0x + (d3x - d0x) * r;
                const sy = d0y + (d3y - d0y) * r;
                const ex = d1x + (d2x - d1x) * r;
                const ey = d1y + (d2y - d1y) * r;
                const ag = Math.atan((ey - sy) / (ex - sx));
                const sc = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2) / ow;

                ctxl.setTransform(1, 0, 0, 1, 0, -y);
                ctxl.drawImage(ctxo.canvas, 0, 0);

                ctxt.translate(sx, sy);
                ctxt.rotate(ag);
                ctxt.scale(sc, sc);
                ctxt.drawImage(cvsl, 0, 0);

                ctxt.setTransform(1, 0, 0, 1, 0, 0);
            }
        } else if (baseIndex % 2 === 1) {
            // Right or left side
            const ctxl = this.createCanvasContext(coverStep, oh);
            ctxl.globalCompositeOperation = 'copy';
            const cvsl = ctxl.canvas;

            for (let x = 0; x < ow; x += step) {
                const r = x / ow;
                const sx = d0x + (d1x - d0x) * r;
                const sy = d0y + (d1y - d0y) * r;
                const ex = d3x + (d2x - d3x) * r;
                const ey = d3y + (d2y - d3y) * r;
                const ag = Math.atan((sx - ex) / (ey - sy));
                const sc = Math.sqrt((ex - sx) ** 2 + (ey - sy) ** 2) / oh;

                ctxl.setTransform(1, 0, 0, 1, -x, 0);
                ctxl.drawImage(ctxo.canvas, 0, 0);

                ctxt.translate(sx, sy);
                ctxt.rotate(ag);
                ctxt.scale(sc, sc);
                ctxt.drawImage(cvsl, 0, 0);

                ctxt.setTransform(1, 0, 0, 1, 0, 0);
            }
        }

        // Set a clipping path and draw the transformed image on the destination canvas
        this.p.ctxd.save();
        this.applyClipPath(this.p.ctxd, [
            [d0x, d0y],
            [d1x, d1y],
            [d2x, d2y],
            [d3x, d3y],
        ]);
        this.p.ctxd.drawImage(ctxt.canvas, 0, 0);
        this.p.ctxd.restore();

        // Return the transformed image buffer
        return ctxt.canvas.toBuffer('image/png');
    }

    private createCanvasContext(
        w: number,
        h: number
    ): CanvasRenderingContext2D {
        const canvas = createCanvas(w, h);
        return canvas.getContext('2d');
    }

    private applyClipPath(
        ctx: CanvasRenderingContext2D,
        points: number[][]
    ): void {
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);

        for (let i = 1; i < points.length; i += 1) {
            ctx.lineTo(points[i][0], points[i][1]);
        }

        ctx.closePath();
        ctx.clip();
    }
}

function readCornersFromSharpBuffer(buffer: Buffer): Corner[] | null {
    const chunks = extractChunks(buffer);

    for (const chunk of chunks) {
        if (chunk.name === 'tEXt') {
            // PNG tEXt chunks are: [keyword]\0[text] in ISO-8859-1 (latin1)
            const nullIndex = chunk.data.indexOf(0); // Null separator

            // eslint-disable-next-line no-continue
            if (nullIndex === -1) continue; // Malformed chunk

            const keyBuffer = chunk.data.slice(0, nullIndex);
            const valueBuffer = chunk.data.slice(nullIndex + 1);

            const key = Buffer.from(keyBuffer).toString('latin1');
            const value = Buffer.from(valueBuffer).toString('latin1');

            if (key === 'Comment' && value.startsWith('chroma=')) {
                const coords = value
                    .slice(7) // Remove "chroma="
                    .split(';')
                    .map((pair) => {
                        const [x, y] = pair.split(',').map(Number);
                        return { x, y };
                    });

                return coords;
            }
        }
    }

    console.log('❌ No chroma comment found');
    return null;
}

export async function generateMockup(
    sourcePath: Buffer,
    artworkPath: Buffer,
    outputPath: PassThrough
): Promise<void> {
    try {
        const sourceImage = await sharp(sourcePath)
            .ensureAlpha()
            .keepMetadata()
            .toBuffer();
        const sourceMetadata = await sharp(sourceImage).metadata();

        const corners = await readCornersFromSharpBuffer(sourceImage);

        const artworkLayers: { input: Buffer }[] = [];

        if (!corners || corners.length !== 4) {
            console.warn('Warning: No valid quadrilateral found. Skipping.');
            return;
        }

        const artwork = await loadImage(artworkPath);

        if (!artwork || artwork.width === 0 || artwork.height === 0) {
            throw new Error(`Artwork ${artworkPath} failed to load.`);
        }

        const warpCanvas = createCanvas(
            sourceMetadata.width!,
            sourceMetadata.height!
        );
        const warpCtx = warpCanvas.getContext('2d');

        const p = new Perspective(warpCtx, artwork);
        const formattedCorners = corners.map((point) => [point.x, point.y]);
        p.draw(formattedCorners);

        let warpedBuffer = warpCanvas.toBuffer('image/png');
        warpedBuffer = await sharp(warpedBuffer).toFormat('png').toBuffer();

        artworkLayers.push({ input: warpedBuffer });

        const pipeline = sharp({
            // @ts-ignore
            create: {
                width: sourceMetadata.width,
                height: sourceMetadata.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([...artworkLayers, { input: sourceImage }])
            .jpeg();

        pipeline.pipe(outputPath);
    } catch (error) {
        console.error('Error generating mockup:', error);
    }
}
