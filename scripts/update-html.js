const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Function to generate picture tag string
function generatePictureTag(src, alt, loading, className = '') {
  const ext = path.extname(src);
  const base = src.substring(0, src.length - ext.length);
  // Don't optimize svg or already optimized
  if (ext === '.svg' || ext === '.webp') {
    return `<img ${className ? `class="${className}" ` : ''}src="${src}" alt="${alt}" loading="${loading}" />`;
  }
  
  const srcset = `${base}-small.webp 600w, ${base}-medium.webp 1200w, ${base}-large.webp 1920w`;
  return `<picture>
              <source srcset="${srcset}" type="image/webp" />
              <img ${className ? `class="${className}" ` : ''}src="${src}" alt="${alt}" loading="${loading}" />
            </picture>`;
}

// 1. Update Hero Carousel & Thumbnail Images (lines ~1591-1659)
html = html.replace(/<img src="(images\/hero_upload_\d\.jpg)" alt="([^"]*)" loading="(eager|lazy)" \/>/g, (match, src, alt, loading) => {
  return generatePictureTag(src, alt, loading);
});

// 2. Update Album Covers (lines ~1687, 1701, 1715)
html = html.replace(/<img class="album-card-img" src="(images\/[^"]+\.jpg)" alt="([^"]+)" loading="lazy" \/>/g, (match, src, alt) => {
  return generatePictureTag(src, alt, 'lazy', 'album-card-img');
});

// 3. Update Video Gallery Thumbnails (lines ~1783, 1797, 1811)
html = html.replace(/<img class="video-thumbnail" src="(images\/[^"]+\.(?:jpg|png))" alt="([^"]+)"\s*loading="lazy" \/>/g, (match, src, alt) => {
  return generatePictureTag(src, alt, 'lazy', 'video-thumbnail');
});

// 4. Update Lightbox JS (lines ~2175)
const jsLightboxTarget = `      lightboxImg.src = p.src;
      lightboxImg.alt = p.alt;`;
const jsLightboxReplacement = `      // Generate picture element dynamically for lightbox
      let picture = lightboxImg.parentElement;
      if (picture.tagName !== 'PICTURE') {
        picture = document.createElement('picture');
        lightboxImg.parentNode.insertBefore(picture, lightboxImg);
        picture.appendChild(lightboxImg);
      }
      
      // Update or create source tag
      let source = picture.querySelector('source');
      if (!source) {
        source = document.createElement('source');
        source.type = 'image/webp';
        picture.insertBefore(source, lightboxImg);
      }
      
      const base = p.src.substring(0, p.src.lastIndexOf('.'));
      source.srcset = \`\${base}-small.webp 600w, \${base}-medium.webp 1200w, \${base}-large.webp 1920w\`;
      
      lightboxImg.src = p.src;
      lightboxImg.alt = p.alt;`;
html = html.replace(jsLightboxTarget, jsLightboxReplacement);

// 5. Update Album Modal Grid JS (lines ~2227)
const jsAlbumGridTarget = `<img src="\${photo.src}" alt="\${photo.alt}" loading="lazy" />`;
const jsAlbumGridReplacement = `
          <picture>
            <source srcset="\${photo.src.replace(/\\.[^/.]+$/, '')}-small.webp 600w, \${photo.src.replace(/\\.[^/.]+$/, '')}-medium.webp 1200w, \${photo.src.replace(/\\.[^/.]+$/, '')}-large.webp 1920w" type="image/webp" />
            <img src="\${photo.src}" alt="\${photo.alt}" loading="lazy" />
          </picture>`;
html = html.replace(jsAlbumGridTarget, jsAlbumGridReplacement);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('index.html updated successfully.');
