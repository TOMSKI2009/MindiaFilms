const sharp = require('sharp');
const pngToIco = require('png-to-ico').default;
const fs = require('fs');
const path = require('path');

const sourceImg = path.join(__dirname, '../images/favicon-source.png');
const outDir = path.join(__dirname, '../'); // Root directory as requested

async function generateFavicons() {
  console.log('Generating favicons...');

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 }
  ];

  const trimmedBuffer = await sharp(sourceImg).trim().toBuffer();
  const metadata = await sharp(trimmedBuffer).metadata();
  const scale = 1.2; // 120% zoom
  const extractWidth = Math.floor(metadata.width / scale);
  const extractHeight = Math.floor(metadata.height / scale);
  const left = Math.floor((metadata.width - extractWidth) / 2);
  const top = Math.floor((metadata.height - extractHeight) / 2);

  for (const item of sizes) {
    const outPath = path.join(outDir, item.name);
    await sharp(trimmedBuffer)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .resize(item.size, item.size, { fit: 'cover', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(outPath);
    console.log(`Generated ${item.name}`);
  }

  // Generate favicon.ico from the 16 and 32 sizes
  const icoPath = path.join(outDir, 'favicon.ico');
  const buf = await pngToIco([
    path.join(outDir, 'favicon-16x16.png'),
    path.join(outDir, 'favicon-32x32.png')
  ]);
  fs.writeFileSync(icoPath, buf);
  console.log('Generated favicon.ico');

  // Delete the source image so it's not checked into git
  fs.unlinkSync(sourceImg);
}

generateFavicons().catch(console.error);
