interface CreateVideoGalleryHTMLParams {
    video: string;
    thumbnail: string;
    title: string;
}

export const createVideoGalleryHTML = ({
    video,
    thumbnail,
    title
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
      <meta name="twitter:player:width" content="480" />
      <meta name="twitter:player:height" content="480" />
      <meta name="twitter:image" content="${thumbnail}" />
    </head>
    <body>
    </body>
  </html>
  `;
