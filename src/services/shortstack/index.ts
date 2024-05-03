/* eslint-disable no-await-in-loop */

// @ts-ignore
import Shotstack from 'shotstack-sdk';
import debug from 'debug';

import {
    SHOTSTACK_ENV,
    SHOTSTACK_PRODUCTION_KEY,
    SHOTSTACK_STAGING_KEY,
    SHOTSTACK_HOST,
} from '../../constants';

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

interface StackeImage {
    artworkUrl: string;
    artistUrl: string;
    artistName: string;
    title: string;
}

const templates = {
    left: {
        url: 'https://bafybeigea3qlu4ihdmmlla5fi2okzpltamtprpi2awq4wo3xqegrf2eldq.ipfs.nftstorage.link',
        avatar: {
            x: 0.331,
            y: 0.14,
        },
        username: {
            x: 0.317,
            y: -0.154,
        },
        title: {
            x: 0.322,
            y: -0.23,
        },
        background: {
            x: 0.003,
            y: -0.002,
        },
        artwork: {
            x: -0.254,
            y: -0.065,
        },
    },
    right: {
        url: 'https://bafybeib5b5mnng2lhyfvqe3ktqexckicotawlbdnksyzwt3mxex36mwyre.ipfs.nftstorage.link',
        avatar: {
            x: -0.331,
            y: 0.14,
        },
        username: {
            x: -0.339,
            y: -0.125,
        },
        title: {
            x: -0.33,
            y: -0.23,
        },
        background: {
            x: 0.006,
            y: 0.004,
        },
        artwork: {
            x: 0.268,
            y: -0.047,
        },
    },
};

export async function generateVideo(stackImages: StackeImage[]) {
    if (!SHOTSTACK_STAGING_KEY || !SHOTSTACK_PRODUCTION_KEY) {
        logger(
            'API Key is required. Set using: export SHOTSTACK_KEY=your_key_here'
        );
        throw new Error('API Key is required');
    }

    if (stackImages.length <= 15) {
        const soundtrack = new Shotstack.Soundtrack();
        soundtrack
            .setSrc(
                'https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/gangsta.mp3'
            )
            .setEffect('fadeInFadeOut');

        const clips: any = {
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
                .setScale(0.236)
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
                .setWidth(388);

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
                    "p { color: #ffffff; font-size: 12px; font-family: 'Montserrat ExtraBold'; text-align: center; }"
                )
                .setWidth(388);

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
            imageBackground.setSrc(template.url);

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

            const artwork = new Shotstack.ImageAsset();
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
                trackAvatar,
                trackUsername,
                trackBackground,
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
            logger(renderInfo.response.status);
        }
    } else {
        throw new Error('Maximum 10 images');
    }
}
