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

  for (const item of sizes) {
    const outPath = path.join(outDir, item.name);
    const innerSize = Math.max(1, Math.round(item.size * 0.8));
    await sharp(sourceImg)
      .trim()
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: Math.floor((item.size - innerSize) / 2),
        bottom: Math.ceil((item.size - innerSize) / 2),
        left: Math.floor((item.size - innerSize) / 2),
        right: Math.ceil((item.size - innerSize) / 2),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
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
