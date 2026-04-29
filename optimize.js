const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'public', 'imagens');

async function processImages() {
  const files = fs.readdirSync(imgDir);
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.png')) {
      const ext = path.extname(file);
      const base = path.basename(file, ext);
      const inputPath = path.join(imgDir, file);
      const outputPath = path.join(imgDir, `${base}.webp`);
      
      try {
        await sharp(inputPath)
          .webp({ quality: 75 })
          .toFile(outputPath);
        
        console.log(`Converted ${file} to ${base}.webp`);
        // Remove the old image to save space and force updating the HTML reference
        // fs.unlinkSync(inputPath); // Wait, if I delete it, I must update HTML. I will keep both for now, then update HTML, then delete.
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
  }
}

processImages();
