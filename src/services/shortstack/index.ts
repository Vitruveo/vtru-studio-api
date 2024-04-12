/* eslint-disable no-await-in-loop */

// @ts-ignore
import Shotstack from 'shotstack-sdk';
import {
    SHOTSTACK_PRODUCTION_KEY,
    SHOTSTACK_STAGING_KEY,
} from '../../constants';

const defaultClient = Shotstack.ApiClient.instance;
const { DeveloperKey } = defaultClient.authentications;
const api = new Shotstack.EditApi();

const useProduction = true;
let apiUrl =
    useProduction === true
        ? 'https://api.shotstack.io/v1'
        : 'https://api.shotstack.io/stage';

if (!SHOTSTACK_STAGING_KEY || !SHOTSTACK_PRODUCTION_KEY) {
    console.log(
        'API Key is required. Set using: export SHOTSTACK_KEY=your_key_here'
    );
    process.exit(1);
}

if (process.env.SHOTSTACK_HOST) {
    apiUrl = process.env.SHOTSTACK_HOST;
}

defaultClient.basePath = apiUrl;
DeveloperKey.apiKey =
    useProduction === true ? SHOTSTACK_PRODUCTION_KEY : SHOTSTACK_STAGING_KEY;

async function sleep(millis: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, millis);
    });
}

interface StackeImage {
    artworkUrl: string;
    artistUrl: string;
    artistName: string;
}

export async function generateVideo(stackImages: StackeImage[]) {
    if (stackImages.length <= 10) {
        const clips: any[] = [];
        let start = 0;
        const length = 2;

        const soundtrack = new Shotstack.Soundtrack();
        soundtrack
            .setSrc(
                'https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/gangsta.mp3'
            )
            .setEffect('fadeInFadeOut');

        let effectCounter = 0;
        let effect = 'slideLeft';
        stackImages.forEach((stackItem) => {
            if (effectCounter === 0) {
                effect = 'slideLeft';
                effectCounter += 1;
            } else if (effectCounter === 1) {
                effect = 'slideRight';
                effectCounter += 1;
            } else if (effectCounter === 2) {
                effect = 'slideDown';
                effectCounter += 1;
            } else if (effectCounter === 3) {
                effect = 'slideUp';
                effectCounter = 0;
            }

            const imageAsset = new Shotstack.ImageAsset();
            imageAsset.setSrc(stackItem.artworkUrl);

            const clip = new Shotstack.Clip();
            clip.setAsset(imageAsset)
                .setStart(start)
                .setLength(length)
                .setEffect(effect);

            start += length;
            clips.push(clip);
        });

        const track = new Shotstack.Track();
        track.setClips(clips);

        const timeline = new Shotstack.Timeline();
        timeline
            .setBackground('#000000')
            .setSoundtrack(soundtrack)
            .setTracks([track]);

        const output = new Shotstack.Output();
        output
            .setFormat('mp4')
            .setResolution('hd')
            .setAspectRatio('1:1')
            .setFps(30);

        const edit = new Shotstack.Edit();
        edit.setTimeline(timeline).setOutput(output);

        const render = await api.postRender(edit);

        for (;;) {
            sleep(1000);
            const renderInfo = await api.getRender(render.response.id);
            if (renderInfo.response.status === 'done') {
                return renderInfo.response;
            }
            console.log(renderInfo.response.status);
        }
    } else {
        throw new Error('Maximum 10 images');
    }
}
