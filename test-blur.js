const { isImageBlurry } = require('./utils/blurDetection');
const sharp = require('sharp');

async function run() {
    // Solid gray = blurry (variance near 0)
    const blurBuf = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } }
    }).jpeg().toBuffer();

    const r1 = await isImageBlurry(blurBuf);
    console.log('Solid gray (expect blurry=true):', r1);

    // Sharp edges = not blurry
    const sharpBuf = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 255, b: 255 } }
    })
    .composite([{ input: Buffer.from(`<svg><rect x="0" y="0" width="50" height="100" fill="black"/></svg>`), top: 0, left: 0 }])
    .jpeg().toBuffer();

    const r2 = await isImageBlurry(sharpBuf);
    console.log('Sharp edges (expect blurry=false):', r2);
}

run().catch(console.error);
