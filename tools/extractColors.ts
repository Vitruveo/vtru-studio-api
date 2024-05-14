/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* Disable eslint for this file because it's a migration script */

import fs from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import {
    AssetsDocument,
    COLLECTION_ASSETS,
} from '../src/features/assets/model';
import { connect, getDb, ObjectId } from '../src/services/mongo';
import { download, list } from '../src/services/aws/s3';
import { ASSET_STORAGE_NAME, ASSET_TEMP_DIR } from '../src/constants';
import { handleExtractColor } from '../src/services/extractColor';

const assetsCollection = () =>
    getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

const convertHEXtoRGB = (hex: string) => {
    const parts = /#?(..)(..)(..)/.exec(hex);
    if (!parts) {
        throw new Error(`${hex} is not a valid HEX color.`);
    }
    return [
        parseInt(parts[1], 16),
        parseInt(parts[2], 16),
        parseInt(parts[3], 16),
    ];
};

const updateAssetColors = async (assetId: string, colors: number[][]) => {
    await assetsCollection().updateOne(
        { _id: new ObjectId(assetId) },
        { $set: { 'assetMetadata.context.formData.colors': colors } }
    );
};

const isImage = (filename: string) => /\.(jpe?g|png|gif|bmp)$/i.test(filename);

const bootstrap = async () => {
    try {
        const s3 = await list({ bucket: ASSET_STORAGE_NAME });

        await connect();
        const assets = await assetsCollection().find().toArray();

        for await (const asset of assets) {
            console.log(`\n🔎 Processing asset ${asset._id}`);
            const assetColors = (asset.assetMetadata?.context?.formData
                ?.colors || []) as (string | number[])[];

            if (!assetColors.length) {
                console.log(
                    `🎨 No colors found for asset ${asset._id}. Starting color extraction.`
                );

                const image = asset.formats?.original?.path;

                if (image && isImage(image) && s3.includes(image)) {
                    // Download image from S3
                    console.log(`📥 Downloading asset ${asset._id} from S3`);
                    const filename = join(ASSET_TEMP_DIR, image);

                    await download({
                        bucket: ASSET_STORAGE_NAME,
                        fileName: image,
                        key: image,
                    });

                    const sharp = await import('sharp');
                    console.log(`📏 Resizing asset ${asset._id}`);

                    // Resize image to 100x100
                    const buffer = await sharp
                        .default(filename)
                        .resize(100)
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    const resizedFilename = join(
                        ASSET_TEMP_DIR,
                        `${nanoid()}.jpg`
                    );
                    await fs.writeFile(resizedFilename, buffer);

                    console.log(`🌈 Extracting colors from asset ${asset._id}`);
                    const extractedColors = await handleExtractColor({
                        filename: resizedFilename,
                    });
                    await updateAssetColors(
                        asset._id.toString(),
                        extractedColors
                    );

                    await fs.unlink(resizedFilename).catch(() => {
                        console.log(
                            `🔴 Failed to unlink resized ${resizedFilename} from asset ${asset._id}`
                        );
                    });
                    await fs.unlink(filename).catch(() => {
                        console.log(
                            `🔴 Failed to unlink original image ${filename} from asset ${asset._id}`
                        );
                    });
                } else {
                    console.log(
                        `🚫 File not found in S3 or missing original format. Skipping color extraction.`
                    );
                }
            } else {
                // Converting HEX colors to RGB
                let hasHEXColors = false;
                const rgbColors = assetColors.map((color) => {
                    if (typeof color === 'string' && color.startsWith('#')) {
                        hasHEXColors = true;
                        return convertHEXtoRGB(color);
                    }
                    return color as number[];
                });

                // TODO: adicionar o extarct color para somar com as cores que ja tem

                if (hasHEXColors) {
                    console.log(
                        `🔄 Updated asset ${asset._id} with RGB colors`
                    );
                    await updateAssetColors(asset._id.toString(), rgbColors);
                }
            }
            console.log(`✅ Asset ${asset._id} processed`);
        }

        console.log('🟢 Migration completed');
    } catch (error) {
        console.log('🔴 An error occured: ', error);
    }
};
bootstrap();
