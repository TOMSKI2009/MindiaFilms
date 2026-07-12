const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const IMAGES_DIR = path.join(__dirname, '../images');
const SIZES = [
  { name: 'small', width: 600 },
  { name: 'medium', width: 1200 },
  { name: 'large', width: 1920 }
];

const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png'];

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

async function optimizeImages() {
  console.log('Scanning for images...');
  const files = await getFiles(IMAGES_DIR);
  const images = files.filter(f => SUPPORTED_EXTS.includes(path.extname(f).toLowerCase()));
  
  console.log(`Found ${images.length} images. Starting optimization...`);

  for (const file of images) {
    const ext = path.extname(file);
    const basename = path.basename(file, ext);
    const dir = path.dirname(file);
    
    // Skip if it's already an optimized webp file or a suffix file
    if (ext.toLowerCase() === '.webp') continue;
    if (basename.endsWith('-small') || basename.endsWith('-medium') || basename.endsWith('-large')) continue;

    console.log(`Processing: ${file}`);
    const metadata = await sharp(file).metadata();

    // Generate responsive WebP sizes
    for (const size of SIZES) {
      // Always generate expected sizes for srcset compatibility, capping at original width.
      
      const resizeWidth = metadata.width && metadata.width < size.width ? metadata.width : size.width;
      const outPath = path.join(dir, `${basename}-${size.name}.webp`);
      
      if (fs.existsSync(outPath)) {
        continue; // Skip if already exists
      }

      try {
        await sharp(file)
          .resize({ width: resizeWidth, withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toFile(outPath);
        console.log(`  -> Created ${outPath}`);
      } catch (e) {
        console.error(`  -> Failed to create ${outPath}:`, e.message);
      }
    }
  }
  
  console.log('Optimization complete!');
}

optimizeImages().catch(console.error);
