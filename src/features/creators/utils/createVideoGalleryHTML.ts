interface CreateVideoGalleryHTMLParams {
    videoURL: string;
    username: string;
    callbackURL: string;
}

export const createVideoGalleryHTML = ({
    username,
    videoURL,
    callbackURL,
}: CreateVideoGalleryHTMLParams) =>
    `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="twitter:card" content="player" />
      <meta name="twitter:site" content="@${username}" />
      <meta name="twitter:title" content="Video Gallery" />
      <meta name="twitter:description" content="Video Gallery" />
      <meta name="twitter:url" content="${callbackURL}" />
      <meta name="twitter:player" content="${videoURL}" />
      <meta name="twitter:player:width" content="480" />
      <meta name="twitter:player:height" content="480" />
    </head>
    <body>
    </body>
  </html>
  `;
