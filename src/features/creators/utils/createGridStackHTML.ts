import { GENERAL_STORAGE_URL } from '../../../constants';

interface createGridStackHTMLParams {
    path: string;
    title: string;
}

export const createGridStackHTML = ({
    path,
    title,
}: createGridStackHTMLParams) =>
    `
<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vtru-logo.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${title}</title> 

    <!-- Facebook Meta Tags -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="${GENERAL_STORAGE_URL}/${path}">

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${title}">
    <meta name="twitter:image" content="${GENERAL_STORAGE_URL}/${path}">
</head>

<body>
    <div>
        ${title}
    </div>
</body>

</html>
  `;
