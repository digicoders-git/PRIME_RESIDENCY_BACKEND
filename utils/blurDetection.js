const sharp = require('sharp');

const BLUR_THRESHOLD = 80;

const isImageBlurry = async (imageBuffer) => {
    try {
        const { data, info } = await sharp(imageBuffer)
            .grayscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const { width, height } = info;
        const pixels = Array.from(data);

        // Laplacian kernel: [0,1,0,1,-4,1,0,1,0]
        let sumSq = 0, count = 0;
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = y * width + x;
                const lap =
                    pixels[idx - width] +
                    pixels[idx + width] +
                    pixels[idx - 1] +
                    pixels[idx + 1] -
                    4 * pixels[idx];
                sumSq += lap * lap;
                count++;
            }
        }

        const variance = sumSq / count;
        const isBlurry = variance < BLUR_THRESHOLD;

        console.log(`📊 Blur variance: ${variance.toFixed(2)} (threshold: ${BLUR_THRESHOLD}) → ${isBlurry ? '❌ BLURRY' : '✅ CLEAR'}`);

        return { blurry: isBlurry, variance };
    } catch (err) {
        console.error('❌ Blur detection error:', err);
        return { blurry: false };
    }
};

module.exports = { isImageBlurry };
