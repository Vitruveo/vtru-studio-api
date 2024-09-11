import debug from 'debug';
import { nanoid } from 'nanoid';
import { Router } from 'express';
import { infer as zodInfer } from 'zod';
import {
    ASSET_STORAGE_URL,
    DEFAULT_AVATAR_URL,
    GENERAL_STORAGE_URL,
    MAIL_SENDGRID_TEMPLATE_VIDEO_GALLERY,
    STORE_URL,
} from '../../../constants';
import { APIResponse } from '../../../services';
import { generateVideo } from '../../../services/shortstack';
import { validateBodyForVideoGallery } from './rules';
import { middleware } from '../../users';
import { sendToExchangeMail } from '../../../services/mail';
import { schemaValidationForVideoGallery } from './schemas';
import * as model from '../../creators/model';
import * as modelAssets from '../model';
import { sendToExchangeRSS } from '../../../services/rss';
import { sendToExchangeVideo } from '../../../services/video';
import { videoExtension } from '../utils/videoExtensions';

const logger = debug('features:assets:controller:makeVideo');
const route = Router();

route.use(middleware.checkAuth);

route.post('/', validateBodyForVideoGallery, async (req, res) => {
    try {
        const creator = await model.findCreatorById({ id: req.auth.id });

        if (!creator) {
            res.status(401).json({
                code: 'vitruveo.studio.api.assets.makeVideo.failed',
                message: 'Creator not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const { artworks, title, sound, fees, timestamp } =
            req.body as zodInfer<typeof schemaValidationForVideoGallery>;

        const assets = await modelAssets.findAssetsByPath({
            path: 'formats.preview.path',
            query: { $in: artworks },
            options: {
                projection: {
                    _id: 1,
                    'framework.createdBy': 1,
                    'assetMetadata.creators.formData.name': 1,
                    'formats.preview.path': 1,
                    'assetMetadata.context.formData.title': 1,
                },
            },
        });

        if (!assets.length) {
            res.status(404).json({
                code: 'vitruveo.studio.api.assets.makeVideo.failed',
                message: 'Assets not found',
                transaction: nanoid(),
            } as APIResponse);
            return;
        }

        const payloadArtwork = await Promise.all(
            assets.map((asset) =>
                model
                    .findCreatorById({ id: asset.framework.createdBy! })
                    .then((item) => ({
                        artworkUrl: `${ASSET_STORAGE_URL}/${asset.formats.preview?.path}`,
                        artistUrl: !item?.profile?.avatar
                            ? DEFAULT_AVATAR_URL
                            : `${GENERAL_STORAGE_URL}/${item?.profile?.avatar}`,
                        artistName:
                            asset.assetMetadata.creators?.formData[0]?.name ??
                            '',
                        title:
                            asset.assetMetadata.context?.formData?.title ?? '',
                        _id: asset._id,
                        username: item?.username ?? '',
                        description:
                            asset.mediaAuxiliary?.description ??
                            asset.assetMetadata.context?.formData
                                ?.description ??
                            '',
                    }))
            )
        );

        const response = await generateVideo({
            stackImages: payloadArtwork,
            sound,
        });

        const path = `${req.auth.id}/video/${timestamp}.mp4`;

        await sendToExchangeVideo(
            JSON.stringify({
                path,
                url: response.url,
            })
        );

        const clip =
            response.data.timeline.tracks[
                response.data.timeline.tracks.length - 1
            ].clips[0].asset.src;

        const isVideo = videoExtension.some((ext) => clip.endsWith(ext));

        const thumbnail = isVideo
            ? clip.replace(/\.(\w+)$/, '_thumb.jpg')
            : clip;

        await model.updateCreatorSearchVideo({
            id: req.auth.id,
            video: {
                id: timestamp,
                fees,
                assets: assets.map((item) => item._id.toString()),
                url: `${GENERAL_STORAGE_URL}/${path}`,
                sound,
                thumbnail,
                title,
            },
        });

        if (creator.emails.length) {
            const payload = JSON.stringify({
                to: creator.emails[0].email,
                subject: 'Video Gallery',
                text: '',
                html: '',
                template: MAIL_SENDGRID_TEMPLATE_VIDEO_GALLERY,
                link: `${GENERAL_STORAGE_URL}/${path}`,
            });

            await sendToExchangeMail(payload);
        }

        try {
            const payload = JSON.stringify({
                title,
                sound,
                url: `${GENERAL_STORAGE_URL}/${path}`,
                assets: payloadArtwork.map((asset) => ({
                    artist: asset.artistName,
                    title: asset.title,
                    description: asset.description,
                    url: `${STORE_URL}/${asset.username}/${
                        asset._id
                    }/${Date.now()}`,
                })),
            });
            await sendToExchangeRSS(payload, 'video');
        } catch (error) {
            logger('RSS video failed: %O', error);
        }

        res.json({
            code: 'vitruveo.studio.api.assets.makeVideo.success',
            message: 'Make video success',
            transaction: nanoid(),
            data: response,
        } as APIResponse);
    } catch (error) {
        logger('Make video failed: %O', error);
        res.status(500).json({
            code: 'vitruveo.studio.api.assets.makeVideo.failed',
            message: `Make video failed: ${error}`,
            args: error,
            transaction: nanoid(),
        } as APIResponse);
    }
});

export { route };
