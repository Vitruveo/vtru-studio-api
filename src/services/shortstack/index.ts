/* eslint-disable no-await-in-loop */

// @ts-ignore
import Shotstack from 'shotstack-sdk';
import debug from 'debug';

import {
    SHOTSTACK_ENV,
    SHOTSTACK_PRODUCTION_KEY,
    SHOTSTACK_STAGING_KEY,
    SHOTSTACK_HOST,
    GENERAL_STORAGE_URL,
} from '../../constants';
import { captureException } from '../sentry';
import { isVideo } from './utils';
import type { GenerateVideosParams, Response } from './types';

const logger = debug('services:shotstack');

const defaultClient = Shotstack.ApiClient.instance;
const { DeveloperKey } = defaultClient.authentications;
const api = new Shotstack.EditApi();

const useProduction = SHOTSTACK_ENV === 'production';

let apiUrl = useProduction
    ? 'https://api.shotstack.io/v1'
    : 'https://api.shotstack.io/stage';

if (SHOTSTACK_HOST) {
    apiUrl = SHOTSTACK_HOST;
}

defaultClient.basePath = apiUrl;

DeveloperKey.apiKey = useProduction
    ? SHOTSTACK_PRODUCTION_KEY
    : SHOTSTACK_STAGING_KEY;

async function sleep(millis: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
}

const templates = {
    left: {
        avatar: {
            x: 0.331,
            y: 0.134,
        },
        username: {
            x: 0.336,
            y: -0.127,
        },
        title: {
            x: 0.336,
            y: -0.239,
        },
        background: {
            url: `${GENERAL_STORAGE_URL}/template-artwork-left`,
            x: 0,
            y: 0,
        },
        artwork: {
            x: -0.26,
            y: -0.047,
        },
    },
    right: {
        avatar: {
            x: -0.331,
            y: 0.134,
        },
        username: {
            x: -0.336,
            y: -0.127,
        },
        title: {
            x: -0.336,
            y: -0.239,
        },
        background: {
            url: `${GENERAL_STORAGE_URL}/template-artwork-right`,
            x: 0,
            y: 0,
        },
        artwork: {
            x: 0.26,
            y: -0.047,
        },
    },
};

export async function generateVideo({
    stackImages,
    sound,
}: GenerateVideosParams): Promise<Response> {
    if (!SHOTSTACK_STAGING_KEY || !SHOTSTACK_PRODUCTION_KEY) {
        logger(
            'API Key is required. Set using: export SHOTSTACK_KEY=your_key_here'
        );
        throw new Error('API Key is required');
    }

    if (stackImages.length <= 16) {
        const soundtrack = new Shotstack.Soundtrack();

        soundtrack
            .setSrc(`${GENERAL_STORAGE_URL}/${sound}`)
            .setEffect('fadeInFadeOut');

        const clips: any = {
            border: [],
            avatar: [],
            username: [],
            title: [],
            background: [],
            artwork: [],
        };

        const length = 3;
        stackImages.forEach((item, index) => {
            const template = index % 2 === 0 ? templates.left : templates.right;

            const avatar = new Shotstack.ImageAsset();
            avatar.setSrc(item.artistUrl);

            const clipAvatar = new Shotstack.Clip();
            clipAvatar
                .setAsset(avatar)
                .setStart(index * length)
                .setOffset({
                    x: template.avatar.x,
                    y: template.avatar.y,
                })
                .setPosition('center')
                .setScale(0.451)
                .setLength(length)
                .setFit('contain')
                .setTransition({
                    in: 'fade',
                });
            clips.avatar.push(clipAvatar);

            const username = new Shotstack.HtmlAsset();
            username
                .setHtml(`<p data-html-type="text">@${item.artistName}</p>`)
                .setCss(
                    "p { color: #ffffff; font-size: 20px; font-family: 'Montserrat ExtraBold'; text-align: center; }"
                )
                .setWidth(380);

            const clipUsername = new Shotstack.Clip();
            clipUsername
                .setAsset(username)
                .setStart(index * length)
                .setFit('none')
                .setScale(1)
                .setOffset({
                    x: template.username.x,
                    y: template.username.y,
                })
                .setPosition('center')
                .setLength(length)
                .setTransition({
                    in: 'fade',
                });
            clips.username.push(clipUsername);

            const title = new Shotstack.HtmlAsset();
            title
                .setHtml(`<p data-html-type="text">${item.title}</p>`)
                .setCss(
                    "p { color: #ffffff; font-size: 16px; font-family: 'Montserrat ExtraBold'; text-align: center; }"
                )
                .setWidth(380);

            const cliptitle = new Shotstack.Clip();
            cliptitle
                .setAsset(title)
                .setStart(index * length)
                .setFit('none')
                .setScale(1)
                .setOffset({
                    x: template.title.x,
                    y: template.title.y,
                })
                .setPosition('center')
                .setLength(length)
                .setTransition({
                    in: 'fade',
                });
            clips.title.push(cliptitle);

            const imageBackground = new Shotstack.ImageAsset();
            imageBackground.setSrc(template.background.url);

            const clipBackground = new Shotstack.Clip();
            clipBackground
                .setAsset(imageBackground)
                .setStart(index * length)
                .setOffset({
                    x: template.background.x,
                    y: template.background.y,
                })
                .setPosition('center')
                .setLength(length)
                .setFit('contain')
                .setTransition({
                    in: 'fade',
                })
                .setScale(1);
            clips.background.push(clipBackground);

            const artwork = isVideo({ path: item.artworkUrl })
                ? new Shotstack.VideoAsset()
                : new Shotstack.ImageAsset();
            artwork.setSrc(item.artworkUrl);

            const clipArtwork = new Shotstack.Clip();
            clipArtwork
                .setAsset(artwork)
                .setStart(index * length)
                .setOffset({
                    x: template.artwork.x,
                    y: template.artwork.y,
                })
                .setPosition('center')
                .setLength(length)
                .setFit('contain')
                .setTransition({
                    in: 'fade',
                })
                .setScale(0.65);
            clips.artwork.push(clipArtwork);
        });

        const trackAvatar = new Shotstack.Track();
        trackAvatar.setClips(clips.avatar);

        const trackUsername = new Shotstack.Track();
        trackUsername.setClips(clips.username);

        const trackBackground = new Shotstack.Track();
        trackBackground.setClips(clips.background);

        const tracktitle = new Shotstack.Track();
        tracktitle.setClips(clips.title);

        const trackArtwork = new Shotstack.Track();
        trackArtwork.setClips(clips.artwork);

        const timeline = new Shotstack.Timeline();
        timeline
            .setBackground('#000000')
            .setSoundtrack(soundtrack)
            .setTracks([
                tracktitle,
                trackUsername,
                trackBackground,
                trackAvatar,
                trackArtwork,
            ]);

        const output = new Shotstack.Output();
        output
            .setFormat('mp4')
            .setResolution('hd')
            .setAspectRatio('16:9')
            .setFps(25);

        const edit = new Shotstack.Edit();
        edit.setTimeline(timeline).setOutput(output);

        const render = await api.postRender(edit);

        for (;;) {
            sleep(1000);
            const renderInfo = await api.getRender(render.response.id);
            if (renderInfo.response.status === 'done') {
                return renderInfo.response;
            }

            if (renderInfo.response.status === 'failed') {
                captureException(renderInfo.response, {
                    tags: { scope: 'videoGallery' },
                });
                throw new Error(renderInfo.response.error);
            }
        }
    } else {
        throw new Error('Maximum 16 images');
    }
}
