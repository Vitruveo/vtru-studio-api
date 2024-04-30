interface CreateVideoGalleryHTMLParams {
    videoURL: string;
    thumbnailURL: string;
}
// verificar o tamanho da imagem
export const createVideoGalleryHTML = ({
    videoURL,
    thumbnailURL,
}: CreateVideoGalleryHTMLParams) =>
    `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="twitter:card" content="player" />
      <meta name="twitter:title" content='Video Gallery' />
      <meta name="twitter:site" content="@vitruveo" />
      <meta name="twitter:player" content="${videoURL}" />
      <meta name="twitter:player:width" content="480" />
      <meta name="twitter:player:height" content="480" />
      <meta name="twitter:image" content="${thumbnailURL}" />
    </head>
    <body>
    </body>
  </html>
  `;
