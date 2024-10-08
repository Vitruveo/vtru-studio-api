import { SEARCH_URL } from '../../../constants';

interface CreateVideoGalleryHTMLParams {
    id: string;
    video: string;
    thumbnail: string;
    title: string;
}

export const createVideoGalleryHTML = ({
    id,
    video,
    thumbnail,
    title,
}: CreateVideoGalleryHTMLParams) =>
    `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="twitter:card" content="player" />
    <meta name="twitter:title" content="${title ?? 'Video Gallery'}" />
    <meta name="twitter:site" content="@vitruveochain"/>
    <meta name="twitter:player" content="${video}" />
    <meta name="twitter:player:stream" content="${video}" />
    <meta name="twitter:player:stream:content_type" content="video/mp4" />
    <meta name="twitter:player:width" content="480" />
    <meta name="twitter:player:height" content="480" />
    <meta name="twitter:image" content="${thumbnail}" />
  </head>
  <body>
    <script>
        window.location.href = '${SEARCH_URL}?video=${id}';
    </script>
  </body>
</html>
  `;
