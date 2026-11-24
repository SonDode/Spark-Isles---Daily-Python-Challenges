import * as THREE from "three";

// Seeded pixel-art textures so every load looks the same.
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
}

function make(draw: (ctx: CanvasRenderingContext2D, r: () => number) => void, seed: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 16;
  const ctx = c.getContext("2d")!;
  draw(ctx, rng(seed));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function noise(ctx: CanvasRenderingContext2D, r: () => number, palette: string[], y0 = 0, y1 = 16) {
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < 16; x++) {
      ctx.fillStyle = palette[Math.floor(r() * palette.length)]!;
      ctx.fillRect(x, y, 1, 1);
    }
}

const GRASS = ["#5d9b3a", "#6aab44", "#7bbd4f", "#57923a"];
const DIRT = ["#86603a", "#7a5532", "#966b42", "#6e4b2c"];

export function makeTextures() {
  const grassTop = make((ctx, r) => noise(ctx, r, GRASS), 3);
  const dirt = make((ctx, r) => noise(ctx, r, DIRT), 7);
  const grassSide = make((ctx, r) => {
    noise(ctx, r, DIRT);
    noise(ctx, r, GRASS, 0, 3);
    for (let x = 0; x < 16; x++) if (r() > 0.5) { ctx.fillStyle = GRASS[1]!; ctx.fillRect(x, 3, 1, 1 + Math.floor(r() * 2)); }
  }, 11);
  const stone = make((ctx, r) => noise(ctx, r, ["#7d7d7d", "#8a8a8a", "#6f6f6f", "#949494"]), 13);
  const planks = make((ctx, r) => {
    noise(ctx, r, ["#b08850", "#a37c48", "#bb935a"]);
    ctx.fillStyle = "#6e5030";
    for (const y of [3, 7, 11, 15]) ctx.fillRect(0, y, 16, 1);
  }, 17);
  const log = make((ctx, r) => {
    noise(ctx, r, ["#6b4f2e", "#5c4226", "#7a5a35"]);
    ctx.fillStyle = "#4a3520";
    for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 0, 1, 16);
  }, 19);
  const leaves = make((ctx, r) => noise(ctx, r, ["#3f7f2a", "#4c9133", "#356d24", "#2c5c1e", "#5aa13c"]), 23);
  const gold = make((ctx, r) => noise(ctx, r, ["#f5c542", "#e8b530", "#ffd75e", "#d9a521"]), 29);
  const SAND = ["#e3d59c", "#d9c98c", "#ecdfa8", "#cfbf82"];
  const sand = make((ctx, r) => noise(ctx, r, SAND), 31);
  const sandstone = make((ctx, r) => { noise(ctx, r, ["#d8c58a", "#cbb87c", "#e0cf96"]); ctx.fillStyle = "#b9a46a"; for (const y of [5, 10]) ctx.fillRect(0, y, 16, 1); }, 37);
  const SNOW = ["#f4f8fb", "#e8f0f5", "#ffffff", "#dde8ef"];
  const snowTop = make((ctx, r) => noise(ctx, r, SNOW), 41);
  const snowSide = make((ctx, r) => { noise(ctx, r, DIRT); noise(ctx, r, SNOW, 0, 4); }, 43);
  const spruce = make((ctx, r) => noise(ctx, r, ["#2f4f2f", "#264326", "#3a5c37", "#1f381f"]), 47);
  const cactus = make((ctx, r) => { noise(ctx, r, ["#3f8a2f", "#4a9a36", "#367a28"]); ctx.fillStyle = "#e8e0b0"; for (let k = 0; k < 6; k++) ctx.fillRect(Math.floor(r() * 16), Math.floor(r() * 16), 1, 1); }, 53);
  const MYC = ["#8a7290", "#7d6585", "#977f9c", "#6f5a77"];
  const myceliumTop = make((ctx, r) => noise(ctx, r, MYC), 59);
  const myceliumSide = make((ctx, r) => { noise(ctx, r, DIRT); noise(ctx, r, MYC, 0, 3); }, 61);
  const mushroomStem = make((ctx, r) => noise(ctx, r, ["#e8e2d0", "#dcd5c0", "#f2ecdc"]), 67);
  const mushroomCap = make((ctx, r) => { noise(ctx, r, ["#c0302a", "#b02820", "#cc3a30"]); ctx.fillStyle = "#f2ecdc"; for (let k = 0; k < 7; k++) ctx.fillRect(Math.floor(r() * 15), Math.floor(r() * 15), 2, 2); }, 71);
  const netherrack = make((ctx, r) => noise(ctx, r, ["#7a2a2a", "#6a2020", "#8a3434", "#5c1a1a"]), 73);
  const crimsonTop = make((ctx, r) => noise(ctx, r, ["#a8242b", "#931c22", "#bb3036"]), 79);
  const crimsonSide = make((ctx, r) => { noise(ctx, r, ["#7a2a2a", "#6a2020", "#8a3434"]); noise(ctx, r, ["#a8242b", "#931c22"], 0, 3); }, 83);
  const crimsonStem = make((ctx, r) => { noise(ctx, r, ["#5a2a3a", "#6b3245", "#4c2232"]); ctx.fillStyle = "#c04060"; for (let x = 2; x < 16; x += 5) ctx.fillRect(x, 0, 1, 16); }, 89);
  const wart = make((ctx, r) => noise(ctx, r, ["#8a1010", "#a01818", "#741010", "#b52020"]), 97);
  const glowstone = make((ctx, r) => noise(ctx, r, ["#f8d878", "#e0b050", "#fff0a0", "#c89040"]), 101);
  const endstone = make((ctx, r) => noise(ctx, r, ["#dfe0a6", "#d3d498", "#e9eab4", "#c8c98c"]), 103);
  const obsidian = make((ctx, r) => noise(ctx, r, ["#140c1f", "#1d1230", "#2a1a45", "#0e0818"]), 107);
  const chorus = make((ctx, r) => noise(ctx, r, ["#8b6a8f", "#9c7aa0", "#7a5a7f"]), 109);
  return { grassTop, grassSide, dirt, stone, planks, log, leaves, gold, sand, sandstone, snowTop, snowSide, spruce, cactus, myceliumTop, myceliumSide, mushroomStem, mushroomCap, netherrack, crimsonTop, crimsonSide, crimsonStem, wart, glowstone, endstone, obsidian, chorus };
}
export type Textures = ReturnType<typeof makeTextures>;
