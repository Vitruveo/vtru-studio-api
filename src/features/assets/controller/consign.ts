import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';

import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { middleware } from '../../users';
import {
    createConsign,
    createVault,
    transformCreateVaultResult,
    // createVault,
    // transformCreateVaultResult,
} from '../../../services/web3/consign';
import { APIResponse, captureException } from '../../../services';
import { list } from '../../../services/aws';
import { sendToExchangeRSS } from '../../../services/rss';
import {
    ASSET_STORAGE_NAME,
    ASSET_STORAGE_URL,
    STORE_URL,
} from '../../../constants';
import { schemaAssetValidation } from './schemaValidate';
import { CreateContractParams } from '../../../services/web3/consign/types';

const logger = debug('features:assets:controller:consign');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', async (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write(`event: start_processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: \n\n`);

        const creator = await modelCreator.findCreatorById({ id: req.auth.id });

        if (!creator) throw new Error('creator_not_found');

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: creator ${creator._id} is being processed\n\n`);

        const asset = await model.findAssetCreatedBy({
            id: creator._id.toString(),
        });

        if (!asset) throw new Error('asset_not_found');

        if (asset.contractExplorer?.explorer) {
            res.write(`event: consign_success\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(
                `data: ${JSON.stringify({
                    transactionHash: asset.contractExplorer.explorer,
                    assetId: asset.assetRefId,
                })}\n\n`
            );

            return;
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: asset ${asset._id} is being processed\n\n`);

        let creatorRefId = Date.now();
        let assetRefId = Date.now();

        if (asset?.assetRefId) {
            assetRefId = asset.assetRefId;
        }
        if (creator?.creatorRefId) {
            creatorRefId = creator.creatorRefId;
        }

        const licenses = [];

        // TODO: todas as posições 0 do data sempre sera o available
        // TODO: todas as posições 1 do data sempre sera o preço

        const licenseNFT = {
            id: 0,
            licenseTypeId: 1,
            data: [asset.licenses.nft.single.editionPrice * 100],
            info: [
                asset.licenses.nft.editionOption,
                asset.licenses.nft.license,
            ],
        };

        const licenseStream = {
            id: 0,
            licenseTypeId: 2,
            data: [],
            info: [],
        };

        const licenseRemix = {
            id: 0,
            licenseTypeId: 3,
            data: [asset.licenses.remix.unitPrice * 100],
            info: [],
        };

        const licensePrint = {
            id: 0,
            licenseTypeId: 4,
            data: [asset.licenses.print.unitPrice * 100],
            info: [],
        };

        if (asset.licenses.nft.added) {
            licenses.push(licenseNFT);
        }
        if (asset.licenses.stream.added) {
            licenses.push(licenseStream);
        }
        if (asset.licenses.remix.added) {
            licenses.push(licenseRemix);
        }
        if (asset.licenses.print.added) {
            licenses.push(licensePrint);
        }

        if (
            !creator.walletDefault &&
            Array.isArray(creator.wallets) &&
            creator.wallets.length > 0
        ) {
            creator.walletDefault = creator.wallets[0].address;
        }

        if (!creator?.vault?.vaultAddress) {
            console.log('creating vault');

            const result: any = await createVault({
                vaultKey: `${creator._id.toString()}_${Math.random().toString()}`,
                vaultName: `${creator.username}'s Vault`,
                vaultSymbol: creator.username ?? 'unknown user',
                wallets: [creator.walletDefault as `x0${string}`],
            });

            console.log('result', result);

            const parsed = transformCreateVaultResult(result);

            console.log('parsed', parsed);

            creator.vault.vaultAddress = parsed.vaultAddress;
        }

        const params: CreateContractParams = {
            assetKey: asset._id.toString(),
            header: {
                title: asset?.assetMetadata?.context?.formData?.title || '',
                description:
                    asset?.assetMetadata?.context?.formData?.description || '',
                metadataRefId: Date.now(),
                metadataXRefId: Date.now().toString(),
                tokenUri: 'https://www.vitruveo.xyz',
                status: 2,
            },
            creator: {
                refId: creatorRefId,
                xRefId: creatorRefId.toString(),
                vault: creator.vault.vaultAddress!,
                split: 9000,
            },
            collaborator1: {
                refId: 0,
                xRefId: '',
                vault: '0x0000000000000000000000000000000000000000',
                split: 0,
            },
            collaborator2: {
                refId: 0,
                xRefId: '',
                vault: '0x0000000000000000000000000000000000000000',
                split: 0,
            },
            license1: {
                id: 0,
                licenseTypeId: 1, // 1=NFT, 2=STREAM, 3=REMIX, 4=PRINT
                editions: 1,
                editionCents: 15000,
                discountEditions: 0,
                discountBasisPoints: 0,
                discountMaxBasisPoints: 0,
                available: 10,
                licensees: [],
            },
            license2: {
                id: 0,
                licenseTypeId: 2,
                editions: 0,
                editionCents: 0,
                discountEditions: 0,
                discountBasisPoints: 0,
                discountMaxBasisPoints: 0,
                available: 0,
                licensees: [],
            },
            license3: {
                id: 0,
                licenseTypeId: 3,
                editions: 10000,
                editionCents: 500,
                discountEditions: 0,
                discountBasisPoints: 0,
                discountMaxBasisPoints: 0,
                available: 10,
                licensees: [],
            },
            license4: {
                id: 0,
                licenseTypeId: 0,
                editions: 0,
                editionCents: 0,
                discountEditions: 0,
                discountBasisPoints: 0,
                discountMaxBasisPoints: 0,
                available: 0,
                licensees: [],
            },
            media: Object.entries({
                original: asset.ipfs.original!,
                display: asset.ipfs.display!,
                exhibition: asset.ipfs.exhibition!,
                preview: asset.ipfs.preview!,
                print: asset?.ipfs?.print,
                arImage: asset?.ipfs?.arImage,
                arVideo: asset?.ipfs?.arVideo,
                btsImage: asset?.ipfs?.btsImage,
                btsVideo: asset?.ipfs?.btsVideo,
                codeZip: asset?.ipfs?.codeZip,
            }).reduce(
                (acc, cur) => {
                    const [key, value] = cur;
                    if (value) {
                        return { ...acc, [key]: value };
                    }
                    return acc;
                },
                {} as CreateContractParams['media']
            ),
        };

        if (!params.creator.vault) {
            res.write(`event: creator_wallet_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(params.creator)}\n\n`);

            throw new Error('creator_wallet_not_found');
        }

        if (!Object.keys(params.media).length) {
            res.write(`event: asset_media_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${JSON.stringify(params.media)}\n\n`);

            throw new Error('asset_media_not_found');
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: values are being processed\n\n`);

        const response = await createConsign(params);

        if (!response.transactionHash) {
            res.write(`event: consign_url_not_found\n`);
            res.write(`id: ${nanoid()}\n`);
            res.write(`data: ${response.transactionHash}\n\n`);

            throw new Error('consign_url_not_found');
        }

        res.write(`event: processing\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(
            `data: consign ${response.transactionHash} is being processed\n\n`
        );

        await model.updateAssets({
            id: asset._id.toString(),
            asset: {
                'consignArtwork.status': 'active',
                'consignArtwork.listing': new Date().toISOString(),
                assetRefId,
                contractExplorer: {
                    explorer: response.transactionHash,
                    tx: response.transactionHash,
                    assetId: response.assetId,
                    assetRefId,
                    creatorRefId,
                },
            },
        });

        await modelCreator.updateCreator({
            id: creator._id.toString(),
            creator: { creatorRefId },
        });

        await Promise.all(
            Object.entries(asset.licenses).map(([key, license]) => {
                if (license.added) {
                    try {
                        const payload = JSON.stringify({
                            license: key,
                            id: asset._id.toString(),
                            title: asset.assetMetadata.context.formData.title,
                            url: `${STORE_URL}/${
                                creator.username
                            }/${asset._id.toString()}/${Date.now()}`,
                            creator:
                                asset.assetMetadata.creators.formData[0].name,
                            image: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                            description:
                                asset?.mediaAuxiliary?.description ||
                                asset.assetMetadata.context.formData
                                    .description,
                        });
                        sendToExchangeRSS(payload, 'consign').then(() => {
                            res.write(`event: rss_${key}\n`);
                            res.write(`id: ${nanoid()}\n`);
                            res.write(`data: ${payload}\n\n`);
                        });
                    } catch (error) {
                        logger(`RSS ${key} failed: %O`, error);
                    }
                }
                return license;
            })
        );

        res.write(`event: consign_success\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${JSON.stringify(response)}\n\n`);
    } catch (error) {
        logger('Consign failed: %O', error);
        captureException(error);

        res.write(`event: consign_error\n`);
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${error}\n\n`);
    } finally {
        res.end();
    }
});

route.get('/validation', async (req, res) => {
    try {
        const asset = await model.findAssetCreatedBy({ id: req.auth.id });

        const finalAsset = schemaAssetValidation.parse(asset);

        try {
            const files = await list({ bucket: ASSET_STORAGE_NAME });

            const medias: string[] = [
                'original',
                'display',
                'preview',
                'exhibition',
            ];

            medias.forEach((media) => {
                const current = media as keyof typeof finalAsset.formats;
                if (!files.includes(finalAsset.formats[current]!.path))
                    throw new Error(`${media} media not found on S3`);
            });

            if (finalAsset.licenses.print.added) {
                if (
                    !finalAsset.formats.print ||
                    !finalAsset.formats.print.path ||
                    !files.includes(finalAsset.formats.print.path)
                )
                    throw new Error('Print media not found on S3');
                medias.push('print');
            }

            if (finalAsset.mediaAuxiliary) {
                // check all mediaAuxiliary
                const auxiliaries = Object.keys(
                    finalAsset.mediaAuxiliary.formats
                );

                auxiliaries.forEach((media) => {
                    const current =
                        media as keyof typeof finalAsset.mediaAuxiliary.formats;
                    const mediaAuxiliary =
                        finalAsset.mediaAuxiliary!.formats[current];
                    if (!mediaAuxiliary) return;
                    if (!files.includes(mediaAuxiliary.path))
                        throw new Error(`${media} media not found on S3`);
                    medias.push(media);
                });
            }
        } catch (error) {
            logger('Consign validation failed: %O', error);
        }

        return res.json({
            code: 'vitruveo.studio.api.assets.consign.validation.success',
            message: 'Consign validation success',
            transaction: nanoid(),
            data: true,
        } as APIResponse<boolean>);
    } catch (error) {
        logger('Consign validation failed: %O', error);
        captureException(
            {
                message: 'Consign validation failed',
                error: error instanceof Error ? error.message : error,
                creator: req.auth.id,
            },
            { tags: { scope: 'consign' } }
        );

        return res.status(400).json({
            code: 'vitruveo.studio.api.assets.consign.validation.error',
            message: 'Consign validation error',
            transaction: nanoid(),
            args: error instanceof Error ? error.message : error,
        } as APIResponse);
    }
});

export { route };
