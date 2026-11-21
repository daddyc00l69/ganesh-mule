import fs from 'fs';
import path from 'path';

const brandDir = path.join(process.cwd(), 'public', 'images', 'honey-brand');
const categories = ['Forest Honey', 'Sesame Honey', 'Ajwain Honey', 'Multiflora Honey', 'Ber Honey', 'Sheesham Honey'];
const sizes = ['250g', '500g', '1kg'];
const expectedImages = [
  'image_1_amazon_main.jpg',
  'image_2_lifestyle.jpg',
  'image_3_texture.jpg',
  'image_6_size_comparison.jpg'
];

let missing = [];
for (const cat of categories) {
  for (const s of sizes) {
    for (const img of expectedImages) {
      const p = path.join(brandDir, cat, s, img);
      if (!fs.existsSync(p)) {
        missing.push(`${cat}/${s}/${img}`);
      }
    }
  }
}
console.log('Total checked:', categories.length * sizes.length * expectedImages.length);
console.log('Missing images count:', missing.length);
if (missing.length > 0) {
  console.log('Missing images:', missing);
}
