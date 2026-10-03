// Ícone otimizado p/ notificação (com margem — Android corta as bordas)
// Rode 1x: node scripts/gerar-icone-notify.mjs
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = path.join(raiz, "icon.svg");

// tesoura centralizada num quadrado maior (margem de ~20%)
const miolo = await sharp(svg, { density: 512 }).resize(150, 150).png().toBuffer();
await sharp({
  create: { width: 192, height: 192, channels: 4, background: { r: 10, g: 37, b: 64, alpha: 1 } },
})
  .composite([{ input: miolo, left: 21, top: 21 }])
  .png()
  .toFile(path.join(raiz, "icon-notify.png"));
console.log("icon-notify.png OK");
