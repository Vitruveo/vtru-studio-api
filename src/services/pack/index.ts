import { resolve } from 'path';
import { createCanvas, loadImage, registerFont } from 'canvas';
import Qrcode from 'qrcode';
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

export const generateBufferForPack = async (item: StorePackItem) => {
    registerFont(resolve('public/fonts/Inter.ttf'), {
        family: 'Inter',
        style: 'normal',
        weight: 'bold',
    });

    // canvas
    const canvas = createCanvas(sizes.canvaWidth, sizes.canvaHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, sizes.canvaWidth, sizes.canvaHeight);

    // imagem
    const img = await loadImage(item.path);
    ctx.drawImage(
        img,
        margin,
        sizes.canvaHeight - sizes.imageHeight - margin,
        sizes.canvaWidth - 2 * margin,
        sizes.imageHeight
    );

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
    const avatarImg = await loadImage(item.avatar);
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
    const logoImg = await loadImage(item.logo);
    const logoX = sizes.canvaWidth - sizes.logoWidth - 1.5 * margin;
    const logoY = sizes.canvaHeight - sizes.logoHeight - 1.5 * margin;
    ctx.drawImage(logoImg, logoX, logoY, sizes.logoWidth, sizes.logoHeight);

    // convert buffer and name
    return {
        id: item.id,
        buffer: canvas.toBuffer('image/png'),
    };
};
