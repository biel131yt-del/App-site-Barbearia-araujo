// Gera os PNGs do PWA a partir do icon.svg — rode 1x: node scripts/gerar-icones.mjs
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = path.join(raiz, "icon.svg");

for (const tamanho of [192, 512]) {
  await sharp(svg, { density: 512 })
    .resize(tamanho, tamanho)
    .png()
    .toFile(path.join(raiz, `icon-${tamanho}.png`));
  console.log(`icon-${tamanho}.png OK`);
}
await sharp(svg, { density: 512 })
  .resize(180, 180)
  .png()
  .toFile(path.join(raiz, "apple-touch-icon.png"));
console.log("apple-touch-icon.png OK");
