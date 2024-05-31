import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import * as model from '../model';
import * as modelCreator from '../../creators/model';
import { APIResponse, ObjectId, captureException } from '../../../services';
import { responseRenderUrl } from '../utils/responseRenderUrl';
import { MAIL_SENDGRID_TEMPLATE_MINT } from '../../../constants';
import { sendToExchangeMail } from '../../../services/mail';
import { videoExtension } from '../utils/videoExtensions';

const logger = debug('features:assets:controller:store');
const route = Router();

route.get('/:id/html', async (req, res) => {
    try {
        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const assetPath = asset.formats.preview?.path;
        const thumbnail = assetPath?.replace(/\.(\w+)$/, '_thumb.jpg');

        const isVideo = videoExtension.some((ext) => assetPath?.endsWith(ext));

        const html = responseRenderUrl({
            creatorName: asset.framework.createdBy || '',
            assetId: asset._id.toString(),
            title: asset.assetMetadata.context.formData.title,
            description: asset.assetMetadata.context.formData.description,
            image: assetPath || '',
            thumbnail: thumbnail || '',
            video: isVideo ? assetPath || '' : '',
        });

        res.send(html);
    } catch (error) {
        logger('Render asset html failed: %O', error);
        res.status(500).json({
            code: 'studio.api.store.html.failed',
            message: `Render asset html failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id', async (req, res) => {
    try {
        if (!req.params.id) {
            res.status(400).json({
                code: 'vitruveo.studio.api.admin.assets.store.badRequest',
                message: 'Bad request',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const asset = await model.findAssetsById({ id: req.params.id });

        if (!asset) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.notFound',
                message: 'Asset not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (!asset.framework.createdBy) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.creatorNotFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const creator = await modelCreator.findOneCreator({
            query: { _id: new ObjectId(asset.framework.createdBy) },
        });

        if (!creator) {
            res.status(404).json({
                code: 'vitruveo.studio.api.admin.assets.store.creatorNotFound',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (creator._id.toString() !== asset.framework.createdBy?.toString()) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.assets.store.unauthorized',
                message: 'This asset is not created by this creator',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        if (
            !['active', 'hidden', 'blocked'].includes(
                asset.consignArtwork.status
            )
        ) {
            res.status(401).json({
                code: 'vitruveo.studio.api.admin.assets.store.unauthorized',
                message: 'Unauthorized access',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        res.json({
            code: 'vitruveo.studio.api.assets.store.success',
            message: 'Store asset success',
            transaction: nanoid(),
            data: {
                ...asset,
                vault: {
                    transactionhash: creator.vault.transactionHash,
                },
            },
        } as APIResponse<model.AssetsDocument>);
    } catch (error) {
        logger('store asset failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.store.failed',
            message: `Store asset failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

route.get('/:id/mint', async (req, res) => {
    try {
        // TODO: receber wallet via query (do comprador)

        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        const assetExists = await model.findAssetsById({ id: req.params.id });
        if (!assetExists) throw new Error('Asset not found');

        if (!assetExists.framework.createdBy)
            throw new Error('Creator not found');

        const creatorExists = await modelCreator.findCreatorById({
            id: assetExists.framework.createdBy,
        });
        if (!creatorExists) throw new Error('Creator not found');

        if (
            assetExists.framework.createdBy?.toString() !==
            creatorExists._id.toString()
        )
            throw new Error('Unauthorized access');

        // TODO: Mint web3

        const payload = JSON.stringify({
            to: creatorExists.emails[0].email,
            subject: 'Mint NFT Success',
            template: MAIL_SENDGRID_TEMPLATE_MINT,
            creator: creatorExists.username,
            title: assetExists.assetMetadata.context.formData.title,
        });
        await sendToExchangeMail(payload);

        const response = JSON.stringify({
            code: 'vitruveo.studio.api.admin.assets.store.success',
            message: 'Store mint asset success',
            transaction: nanoid(),
        });

        res.write('event: mint_nft_success\n');
        res.write(`id: ${nanoid()}\n`);
        res.write(`data: ${response}\n\n`);
    } catch (error) {
        logger('Search profile failed: %O', error);
        captureException(error, {
            extra: {
                message: 'Mint NFT failed',
            },
            tags: { scope: 'mint_NFT_error' },
        });

        res.write('event: mint_nft_error\n');
        res.write(`data: ${error}\n\n`);
        res.write(`id: ${nanoid()}\n`);
    } finally {
        res.end();
    }
});

route.get('/:wallet/creditsAvailable', (req, res) => {
    try {
        res.set('Content-Type', 'text/event-stream');
        res.set('Cache-Control', 'no-cache');
        res.set('Connection', 'keep-alive');
        res.flushHeaders();

        res.write('event: credits_available_success\n');
        res.write(`data: ${Math.random().toString()}\n\n`);
        res.write(`id: ${nanoid()}\n`);
    } catch (error) {
        logger('Credits Available failed: %O', error);
        captureException(error, {
            extra: {
                message: 'Credits Available failed',
            },
            tags: { scope: 'credits_available' },
        });

        res.write('event: credits_available_error\n');
        res.write(`data: ${error}\n\n`);
        res.write(`id: ${nanoid()}\n`);
    } finally {
        res.end();
    }
});

export { route };
