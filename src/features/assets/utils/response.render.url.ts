export interface ResponseRenderUrlParams {
    creatorName: string;
    assetId: string;
    title: string;
    description: string;
    image: string;
}

const frontURL = 'https://store.vtru.dev';
const awsURL = 'https://vitruveo-studio-qa-assets.s3.amazonaws.com';

export const responseRenderUrl = ({
    creatorName,
    assetId,
    title,
    description,
    image,
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
            <meta property="og:image" content="${awsURL}/${image}.png?${Date.now()}">
        
            <!-- Twitter Meta Tags -->
            <meta name="twitter:card" content="summary_large_image">
            <meta property="twitter:domain" content="${frontURL}">
            <meta property="twitter:url" content="${frontURL}/${creatorName}/${assetId}/${Date.now()}">
            <meta name="twitter:title" content="${title}">
            <meta name="twitter:description" content="${description}">
            <meta name="twitter:image" content="${awsURL}/${image}.png?${Date.now()}">
        </head>
        <body>
        </body>
    </html>
`;
