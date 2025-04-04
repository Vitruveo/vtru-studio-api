import debug from 'debug';
import { resolve } from 'path';
import { createCanvas, loadImage, registerFont } from 'canvas';
import Qrcode from 'qrcode';
import axios, { AxiosError } from 'axios';
import { Jimp } from 'jimp';

import { StorePackItem } from '../../features/assets/controller/types';

const sizes = {
    canvaWidth: 2160,
    canvaHeight: 3840,
    imageHeight: 3000,
    headerHeight: 680,
    avatarSize: 180,
    qrCodeSize: 600,
    logoWidth: 535,
    logoHeight: 180,
};
const margin = 80;
const characterLimit = 20;

const logger = debug('services:pack');

async function fetchImage(url: string) {
    try {
        const response = await axios({ url, responseType: 'arraybuffer' });

        const image = await Jimp.read(response.data);
        const buffer = await image.getBuffer('image/png');

        return loadImage(buffer);
    } catch (error) {
        if (error instanceof AxiosError) {
            logger(
                'Error fetching image',
                error.response?.status,
                error.response?.data
            );
        }
        if (error instanceof Error) {
            logger('Error fetching image', error.message);
        }

        throw error;
    }
}

const generateBufferForPack = async (item: StorePackItem) => {
    registerFont(resolve('public/fonts/Inter.ttf'), {
        family: 'Inter',
        style: 'normal',
        weight: 'bold',
    });

    try {
        // canvas
        const canvas = createCanvas(sizes.canvaWidth, sizes.canvaHeight);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, sizes.canvaWidth, sizes.canvaHeight);

        // imagem
        const img = await fetchImage(item.path);
        const imgAspectRatio = img.width / img.height;
        const isSquare = Math.abs(imgAspectRatio - 1) < 0.01;

        if (isSquare) {
            let drawWidth = 0;
            const drawHeight =
                Math.min(sizes.imageHeight, sizes.canvaWidth) - 2 * margin;
            drawWidth = drawHeight;

            const offsetX = (sizes.canvaWidth - drawWidth - 156) / 2;
            const offsetY = (sizes.imageHeight - drawHeight) / 2;

            ctx.drawImage(
                img,
                margin + offsetX,
                sizes.canvaHeight - sizes.imageHeight + offsetY,
                drawWidth,
                drawHeight
            );
        } else {
            ctx.drawImage(
                img,
                margin,
                sizes.canvaHeight - sizes.imageHeight - margin,
                sizes.canvaWidth - 2 * margin,
                sizes.imageHeight
            );
        }

        // titulo
        const truncatedTitle =
            item.title.length > characterLimit
                ? `${item.title.slice(0, characterLimit)}...`
                : item.title;
        ctx.fillStyle = '#ffffff';
        ctx.font = '120px Inter';
        ctx.textAlign = 'left';
        const titleX = 120;
        const titleY = 270;
        ctx.fillText(truncatedTitle, titleX, titleY);

        // username
        ctx.fillStyle = '#ff0000';
        ctx.font = '58px Inter';
        ctx.textAlign = 'left';
        const usernameX = 340;
        const usernameY = 466;
        ctx.fillText(item.username, usernameX, usernameY);

        // avatar
        const avatarImg = await fetchImage(item.avatar);
        const avatarX = 120;
        const avatarY = 350;
        const avatarRadius = sizes.avatarSize / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(
            avatarX + avatarRadius,
            avatarY + avatarRadius,
            avatarRadius,
            0,
            Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
            avatarImg,
            avatarX,
            avatarY,
            sizes.avatarSize,
            sizes.avatarSize
        );
        ctx.restore();

        // qrCode
        const qrCodeCanvas = createCanvas(sizes.qrCodeSize, sizes.qrCodeSize);
        await Qrcode.toCanvas(qrCodeCanvas, item.qrCode, {
            errorCorrectionLevel: 'H',
            margin: 0,
            scale: 1,
            width: sizes.qrCodeSize,
            color: {
                dark: '#ffffff',
                light: '#000000',
            },
        });
        const qrCodeX = sizes.canvaWidth - sizes.qrCodeSize - margin;
        const qrCodeY = margin;
        ctx.fillRect(qrCodeX, qrCodeY, sizes.qrCodeSize, sizes.qrCodeSize);
        ctx.drawImage(qrCodeCanvas, qrCodeX, qrCodeY);

        // logo
        const logoImg = await fetchImage(item.logo);
        const logoX = sizes.canvaWidth - sizes.logoWidth - 1.5 * margin;
        const logoY = sizes.canvaHeight - sizes.logoHeight - 1.5 * margin;
        ctx.drawImage(logoImg, logoX, logoY, sizes.logoWidth, sizes.logoHeight);

        // convert buffer and name
        return {
            id: item.id,
            buffer: canvas.toBuffer('image/png'),
        };
    } catch (error) {
        logger(`Error generating buffer for pack ${item.id}: `, error);
        throw error;
    }
};

process.on('message', async (message) => {
    try {
        const { data } = message as any;
        const tasks: StorePackItem[] = data;

        const imagesPromises = tasks.map((item) => generateBufferForPack(item));
        const buffers = await Promise.all(imagesPromises);

        if (process.send) {
            process.send({
                type: 'complete',
                data: buffers,
            });
        }
    } catch (error) {
        logger('Error generating pack: ', error);
        if (process.send) {
            process.send({
                type: 'error',
                error: error instanceof Error ? error.message : String(error),
            });
            process.exit(1);
        }
    }
});
