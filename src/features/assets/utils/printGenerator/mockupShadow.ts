import sharp from 'sharp';

async function processImage() {
    const inputImage = 'source4.png'; // Use the provided filename
    const outputImage = 'output4.png'; // Save as PNG with transparency

    // Load the input image
    const image = sharp(inputImage)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data, info } = await image;
    const newData = Buffer.from(data);

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i]; // Red channel
        const g = data[i + 1]; // Green channel
        const b = data[i + 2]; // Blue channel

        // Apply rule: Process only if G ≥ 1.5 × R and G ≥ 1.5 × B
        if (g >= 1.5 * r && g >= 1.5 * b) {
            const lightness = g / 255; // Normalize green intensity for transparency
            newData[i] = 0; // Black (R)
            newData[i + 1] = 0; // Black (G)
            newData[i + 2] = 0; // Black (B)
            newData[i + 3] = Math.round((1 - lightness) * 255); // Transparency (lighter = more transparent)
        }
    }

    // Save the processed image as a PNG with transparency
    await sharp(newData, {
        raw: {
            width: info.width,
            height: info.height,
            channels: info.channels,
        },
    })
        .png() // Ensure output format is PNG
        .toFile(outputImage);

    console.log('Processing complete. Saved as', outputImage);
}

// Run the function
processImage().catch(console.error);
