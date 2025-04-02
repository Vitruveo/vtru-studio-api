/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* Disable eslint for this file because it's a migration script */
import 'dotenv/config';
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
import { convertHEXtoRGB } from '../src/utils/convertHexToRGB';

const assetsCollection = () =>
    getDb().collection<AssetsDocument>(COLLECTION_ASSETS);

const updateAssetColors = async (assetId: string, colors: number[][]) => {
    await assetsCollection().updateOne(
        { _id: new ObjectId(assetId) },
        { $set: { 'assetMetadata.context.formData.colors': colors } }
    );
    console.log(`🔄 Updated colors for asset ${assetId}`);
};

const isImage = (filename: string) => /\.(jpe?g|png|gif|bmp)$/i.test(filename);

const getColorsFromAsset = async (asset: AssetsDocument, s3: string[]) => {
    const image = asset.formats?.original?.path;

    if (image && isImage(image) && s3.includes(image)) {
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

        const resizedFilename = join(ASSET_TEMP_DIR, `${nanoid()}.jpg`);
        await fs.writeFile(resizedFilename, buffer);

        console.log(`🌈 Extracting colors from asset ${asset._id}`);
        const extractedColors = await handleExtractColor({
            filename: resizedFilename,
        });

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

        return extractedColors;
    }

    console.log(
        `🚫 File not found in S3 or missing original format. Skipping color extraction.`
    );

    return undefined;
};

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
                console.log(`🚫 No colors found in asset ${asset._id}.`);
                const extractedColors = await getColorsFromAsset(asset, s3);

                if (extractedColors) {
                    await updateAssetColors(
                        asset._id.toString(),
                        extractedColors
                    );
                }
            } else {
                console.log(`🔄 Processing colors from asset ${asset._id}`);
                let hasHEXColors = false;

                const convertedColors = assetColors.map((value) => {
                    if (typeof value === 'string' && value.startsWith('#')) {
                        hasHEXColors = true;
                        return convertHEXtoRGB(value);
                    }
                    return value as number[];
                });

                if (hasHEXColors) {
                    console.log(
                        `🔄 Converted hex colors from asset ${asset._id} with RGB colors`
                    );
                }

                const extractedColors = await getColorsFromAsset(asset, s3);
                await updateAssetColors(asset._id.toString(), [
                    ...convertedColors,
                    ...(extractedColors ?? []),
                ]);
            }
            console.log(`✅ Asset ${asset._id} processed`);
        }

        console.log('🟢 Migration completed');
    } catch (error) {
        console.log('🔴 An error occured: ', error);
    }
};
bootstrap();
