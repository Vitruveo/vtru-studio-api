import { GENERAL_STORAGE_URL, SEARCH_URL } from '../../../constants';

interface createGridStackHTMLParams {
    path: string;
    id: string;
    title: string;
}

export const createGridStackHTML = ({
    path,
    id,
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
    <meta property="og:url" content="${SEARCH_URL}?grid=${id}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="${GENERAL_STORAGE_URL}/${path}">

    <!-- Twitter Meta Tags -->
    <meta property="twitter:url" content="${SEARCH_URL}?grid=${id}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${title}">
    <meta name="twitter:image" content="${GENERAL_STORAGE_URL}/${path}">
</head>

<body>
    <script>
        window.location.href = '${SEARCH_URL}?grid=${id}';
    </script>
</body>

</html>
  `;
