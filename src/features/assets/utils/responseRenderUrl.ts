import { ASSET_STORAGE_URL, STORE_URL } from '../../../constants';

export interface ResponseRenderUrlParams {
    creatorName: string;
    assetId: string;
    title: string;
    description: string;
    image: string;
    video: string;
    thumbnail: string;
}

const frontURL = STORE_URL;
const awsURL = ASSET_STORAGE_URL;

export const responseRenderUrl = ({
    creatorName,
    assetId,
    title,
    description,
    image,
    video,
    thumbnail,
}: ResponseRenderUrlParams) => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/v-icon.png" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Store</title>
            
            <!-- Facebook Meta Tags -->
            <meta property="og:url" content="${frontURL}/${creatorName}/${assetId}/${Date.now()}">
            <meta property="og:type" content="website">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${awsURL}/${image}">
        
            <!-- Twitter Meta Tags -->
            <meta name="twitter:card" content="summary_large_image">
            <meta property="twitter:domain" content="${frontURL}">
            <meta property="twitter:url" content="${frontURL}/${creatorName}/${assetId}/${Date.now()}">
            <meta name="twitter:title" content="${title}">
            <meta name="twitter:description" content="${description}">
            <meta name="twitter:player" content="${awsURL}/${video}" />
            <meta name="twitter:player:width" content="480" />
            <meta name="twitter:player:height" content="480" />
            <meta name="twitter:image" content="${awsURL}/${
                video ? thumbnail : image
            }">
        </head>
        <body>
        </body>
    </html>
`;
