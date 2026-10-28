import {
  BEARD_STYLES,
  EYE_PALETTE,
  EYE_STYLES,
  HAIR_PALETTE,
  HAIR_STYLES,
  SKIN_PALETTE,
} from '@/lib/avatar-options';
import type { AvatarConfig } from '@/lib/types';

/**
 * Générateur d'avatar pixel art "paper doll", façon LaBrute : le personnage
 * est assemblé couche par couche (cheveux arrière, corps, tête, visage,
 * barbe, cheveux avant) à partir des traits choisis, recoloré par palette,
 * puis contour et ombrage sont calculés automatiquement.
 *
 * La grille fait 40×44 pixels ; l'axe de symétrie passe entre les colonnes
 * 19 et 20, ce qui permet de dessiner une moitié et d'en déduire l'autre.
 * Proportions "chibi" à la LaBrute : grosse tête, gros poings, jambes courtes.
 */

export const GRID_W = 40;
export const GRID_H = 44;
const CX = 20;

const OUTLINE = '#1B1420';
const WHITE = '#FFFFFF';
const SHADOW = 'rgba(0,0,0,0.35)';

/** Tenue par grade (0 Novice → 4 Hero). */
const OUTFITS = [
  { gi: '#EDE6D6', trim: '#CFC5AE', belt: '#F3EAD8', headband: null as string | null },
  { gi: '#EDE6D6', trim: '#CFC5AE', belt: '#D9A441', headband: null },
  { gi: '#E3DCCB', trim: '#C9BFA6', belt: '#5B84B1', headband: '#F3EAD8' },
  { gi: '#3A3A48', trim: '#5A5A70', belt: '#C9403A', headband: '#C9403A' },
  { gi: '#1E1E28', trim: '#D9A441', belt: '#2A2A36', headband: '#C9403A' },
];

/** Morphologie au grade Novice selon la corpulence (demi-largeurs en pixels). */
const BUILD_START = {
  maigre: { shoulder: 6, waist: 5, belly: 0, arm: 2, leg: 3 },
  moyen: { shoulder: 8, waist: 6, belly: 0, arm: 3, leg: 4 },
  rond: { shoulder: 8, waist: 8, belly: 3, arm: 3, leg: 5 },
} as const;

/** Physique cible au grade Hero, vers lequel toutes les corpulences convergent. */
const HERO_BODY = {
  homme: { shoulder: 11, waist: 6, arm: 5, leg: 5 },
  femme: { shoulder: 9, waist: 5, arm: 4, leg: 4 },
} as const;

type Grid = (string | null)[];

export function shade(hex: string, factor = 0.75): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

class Canvas {
  px: Grid = new Array(GRID_W * GRID_H).fill(null);

  set(x: number, y: number, c: string) {
    if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) this.px[y * GRID_W + x] = c;
  }

  get(x: number, y: number): string | null {
    if (x < 0 || x >= GRID_W || y < 0 || y >= GRID_H) return null;
    return this.px[y * GRID_W + x];
  }

  rect(x: number, y: number, w: number, h: number, c: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Bande centrée sur l'axe de symétrie, de demi-largeur `half`. */
  band(half: number, y: number, h: number, c: string) {
    this.rect(CX - half, y, half * 2, h, c);
  }

  /** Deux blocs symétriques, à `off` pixels de l'axe, de largeur `w`. */
  pair(off: number, w: number, y: number, h: number, c: string) {
    this.rect(CX - off - w, y, w, h, c);
    this.rect(CX + off, y, w, h, c);
  }

  /** Pixel et son reflet symétrique (x donné pour la moitié gauche). */
  mirror(x: number, y: number, c: string) {
    this.set(x, y, c);
    this.set(2 * CX - 1 - x, y, c);
  }
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

// --- Cheveux : couche arrière (derrière le corps) et couche avant (sur la tête).

function hairCap(c: Canvas, color: string) {
  c.band(5, 3, 1, color);
  c.band(6, 4, 1, color);
  c.band(7, 5, 2, color);
  c.pair(6, 1, 7, 2, color);
}

function drawHairBack(c: Canvas, style: string, color: string) {
  switch (style) {
    case 'afro':
      c.band(6, 0, 1, color);
      c.band(8, 1, 1, color);
      c.band(9, 2, 1, color);
      c.band(10, 3, 7, color);
      c.band(9, 10, 1, color);
      c.band(8, 11, 1, color);
      break;
    case 'long':
      c.band(8, 6, 15, color);
      c.band(7, 21, 1, color);
      break;
    case 'carre':
      c.band(8, 5, 11, color);
      break;
    case 'queue':
      c.rect(27, 6, 2, 3, color);
      c.rect(28, 9, 3, 5, color);
      c.rect(28, 14, 2, 3, color);
      c.rect(29, 17, 1, 1, color);
      break;
    case 'couettes':
      c.pair(8, 3, 8, 7, color);
      c.pair(8, 2, 15, 2, color);
      break;
  }
}

function drawHairFront(c: Canvas, style: string, color: string) {
  switch (style) {
    case 'rase':
      c.band(5, 4, 1, color);
      c.band(6, 5, 1, color);
      break;
    case 'court':
      hairCap(c, color);
      c.band(6, 7, 1, color);
      c.mirror(15, 7, shade(color, 0.85));
      break;
    case 'pics':
      hairCap(c, color);
      for (const x of [14, 17]) {
        c.mirror(x, 2, color);
        c.mirror(x + 1, 2, color);
        c.mirror(x, 1, color);
        c.mirror(x, 0, color);
      }
      c.band(6, 7, 1, color);
      break;
    case 'crete':
      c.band(2, 0, 7, color);
      c.band(6, 5, 1, shade(color, 0.6));
      break;
    case 'meche':
      hairCap(c, color);
      c.rect(13, 7, 8, 1, color);
      c.rect(13, 8, 5, 1, color);
      c.rect(13, 9, 3, 1, color);
      break;
    case 'chignon':
      c.band(6, 4, 1, color);
      c.band(7, 5, 2, color);
      c.pair(6, 1, 7, 2, color);
      c.band(2, 0, 1, color);
      c.band(3, 1, 2, color);
      c.band(1, 3, 1, '#C9403A');
      break;
    case 'afro':
      c.band(7, 4, 3, color);
      break;
    case 'long':
      hairCap(c, color);
      c.band(5, 7, 1, color);
      c.pair(6, 1, 7, 8, color);
      break;
    case 'queue':
      hairCap(c, color);
      c.band(6, 7, 1, color);
      c.rect(26, 6, 2, 2, '#C9403A');
      break;
    case 'couettes':
      hairCap(c, color);
      c.band(6, 7, 1, color);
      c.pair(7, 1, 8, 1, '#C9403A');
      break;
    case 'carre':
      hairCap(c, color);
      c.band(7, 7, 1, color);
      c.pair(6, 1, 8, 7, color);
      break;
  }
}

// --- Visage.

function drawEyes(c: Canvas, style: string, iris: string, brow: string, isF: boolean) {
  const dark = shade(iris, 0.6);
  switch (style) {
    case 'rieurs':
      for (const [x, y] of [[15, 11], [16, 10], [17, 11]]) c.mirror(x, y, OUTLINE);
      break;
    case 'grands':
      c.pair(2, 2, 9, 3, iris);
      c.pair(2, 2, 11, 1, dark);
      c.set(16, 9, WHITE);
      c.set(22, 9, WHITE);
      c.pair(2, 2, 7, 1, brow);
      break;
    case 'determines':
      c.pair(2, 2, 10, 2, iris);
      c.pair(2, 2, 11, 1, dark);
      c.set(16, 10, WHITE);
      c.set(22, 10, WHITE);
      for (const [x, y] of [[15, 8], [16, 8], [17, 9]]) c.mirror(x, y, brow);
      break;
    default:
      c.pair(2, 2, 10, 2, iris);
      c.pair(2, 2, 11, 1, dark);
      c.set(16, 10, WHITE);
      c.set(22, 10, WHITE);
      c.pair(2, 2, 8, 1, brow);
  }
  if (isF && style !== 'rieurs') c.mirror(15, style === 'grands' ? 8 : 9, OUTLINE);
}

function drawMouth(c: Canvas, eyeStyle: string, skin: string) {
  if (eyeStyle === 'rieurs') {
    c.mirror(18, 13, OUTLINE);
    c.band(1, 14, 1, OUTLINE);
  } else {
    c.band(1, 14, 1, shade(skin, 0.55));
  }
  c.set(19, 12, shade(skin, 0.82));
}

function drawBeard(c: Canvas, style: string, color: string) {
  switch (style) {
    case 'moustache':
      c.band(3, 13, 1, color);
      break;
    case 'courte':
      c.pair(5, 2, 11, 4, color);
      c.band(6, 15, 1, color);
      c.band(5, 16, 1, color);
      c.band(2, 13, 1, color);
      break;
    case 'longue':
      c.pair(5, 2, 11, 4, color);
      c.band(6, 15, 1, color);
      c.band(5, 16, 2, color);
      c.band(4, 18, 1, color);
      c.band(2, 19, 1, color);
      c.band(2, 13, 1, color);
      break;
    case 'bouc':
      c.band(2, 13, 1, color);
      c.band(1, 15, 3, color);
      break;
  }
}

// --- Passes automatiques : contour puis ombrage (lumière venant du haut-gauche).

function outlinePass(c: Canvas) {
  const toOutline: number[] = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (c.get(x, y)) continue;
      if (c.get(x - 1, y) || c.get(x + 1, y) || c.get(x, y - 1) || c.get(x, y + 1)) {
        toOutline.push(y * GRID_W + x);
      }
    }
  }
  for (const i of toOutline) c.px[i] = OUTLINE;
}

function shadePass(c: Canvas, noShade: Set<string>) {
  const next = c.px.slice();
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const col = c.get(x, y);
      if (!col || col === OUTLINE || noShade.has(col) || !col.startsWith('#')) continue;
      if (c.get(x + 1, y) === OUTLINE || c.get(x, y + 1) === OUTLINE) {
        next[y * GRID_W + x] = shade(col, 0.8);
      }
    }
  }
  c.px = next;
}

export type AvatarGrid = { pixels: Grid };

/** Construit la grille de pixels de l'avatar pour une config et un grade (0-4). */
export function buildAvatarGrid(cfg: AvatarConfig, tierIdx: number): AvatarGrid {
  const c = new Canvas();
  const t = tierIdx / 4;
  const isF = cfg.gender === 'femme';
  const outfit = OUTFITS[tierIdx];

  const skin = SKIN_PALETTE[cfg.skin];
  const hair = HAIR_PALETTE[cfg.hairColor];
  const iris = EYE_PALETTE[cfg.eyeColor];
  const hairStyle = HAIR_STYLES[cfg.gender][cfg.hair]?.key ?? 'court';
  const eyeStyle = EYE_STYLES[cfg.eyes]?.key ?? 'normaux';
  const beardStyle = isF ? 'aucune' : (BEARD_STYLES[cfg.beard]?.key ?? 'aucune');

  // Morphologie interpolée entre la corpulence de départ et le physique Hero.
  const start = BUILD_START[cfg.build];
  const hero = HERO_BODY[cfg.gender];
  const S = lerp(start.shoulder - (isF ? 1 : 0), hero.shoulder, t);
  const W = lerp(start.waist, hero.waist, t);
  const B = lerp(start.belly, 0, t);
  const A = lerp(start.arm, hero.arm, t);
  const L = lerp(start.leg - (isF ? 1 : 0), hero.leg, t);
  const hips = W + (isF ? 1 : 0);

  const bodyHalf = (row: number) => {
    const k = (row - 18) / 9;
    const base = Math.round(S + (W - S) * k);
    const bulge = row >= 20 && row <= 27 ? Math.round(B * Math.sin((Math.PI * (row - 20)) / 7)) : 0;
    return base + bulge;
  };
  let maxBody = 0;
  for (let r = 18; r <= 27; r++) maxBody = Math.max(maxBody, bodyHalf(r));
  const armOff = Math.max(S, maxBody) + 1;

  // 1. Cheveux arrière.
  drawHairBack(c, hairStyle, hair);

  // 2. Jambes (pantalon de kimono) et pieds nus.
  const legOff = Math.max(1, hips - L);
  c.band(hips, 28, 3, outfit.gi);
  c.pair(legOff, L, 31, 6, outfit.gi);
  c.pair(legOff, L + 1, 37, 2, skin);

  // 3. Torse avec ventre éventuel.
  for (let r = 18; r <= 27; r++) c.band(bodyHalf(r), r, 1, outfit.gi);

  // Encolure en V : plus ouverte aux grades élevés, pectoraux dessinés en haut.
  const vDepth = 3 + Math.round(2 * t);
  const vHalf = 2 + Math.round(2 * t);
  for (let i = 0; i < vDepth; i++) {
    const h = Math.max(0, Math.round(vHalf * (1 - i / vDepth)));
    if (h > 0) c.band(h, 18 + i, 1, skin);
    c.mirror(CX - h - 1, 18 + i, outfit.trim);
  }
  if (t >= 0.75) {
    c.set(19, 19, shade(skin, 0.8));
    c.set(20, 19, shade(skin, 0.8));
  }

  // 4. Ceinture de grade avec nœud.
  const beltHalf = bodyHalf(27);
  c.band(beltHalf, 26, 2, outfit.belt);
  c.band(1, 26, 2, shade(outfit.belt, 0.8));
  for (const [x, y] of [[18, 28], [18, 29], [17, 30]]) c.mirror(x, y, outfit.belt);
  if (tierIdx === 4) c.band(beltHalf, 25, 1, outfit.trim);

  // 5. Épaules arrondies et bras : manches longues jusqu'à Intermédiaire,
  //    courtes ensuite pour montrer les biceps ; gros poings façon LaBrute.
  c.band(armOff + A - 1, 18, 1, outfit.gi);
  c.band(armOff + A, 19, 1, outfit.gi);
  const sleeve = t >= 0.75 ? 3 : 5;
  c.pair(armOff, A, 18, sleeve, outfit.gi);
  c.pair(armOff, A, 18 + sleeve, 8 - sleeve, skin);
  if (t >= 0.5) {
    c.pair(armOff + A, 1, 20, 2, t >= 0.75 ? skin : outfit.gi);
  }
  c.pair(armOff, A + 1, 26, 3, skin);
  c.pair(armOff, A + 1, 28, 1, shade(skin, 0.85));

  // 6. Cou et tête.
  c.band(2, 16, 2, skin);
  c.band(5, 4, 1, skin);
  c.band(6, 5, 1, skin);
  c.band(7, 6, 9, skin);
  c.band(6, 15, 1, skin);
  c.band(5, 16, 1, skin);
  c.pair(7, 1, 10, 2, skin);

  // 7. Visage.
  drawEyes(c, eyeStyle, iris, shade(hair, 0.7), isF);
  drawMouth(c, eyeStyle, skin);
  if (isF) c.pair(4, 1, 12, 1, '#E8857A');

  // 8. Barbe, cheveux avant, bandeau.
  drawBeard(c, beardStyle, hair);
  drawHairFront(c, hairStyle, hair);
  if (outfit.headband) {
    c.band(7, 6, 1, outfit.headband);
    c.rect(27, 6, 2, 1, outfit.headband);
    c.rect(28, 7, 2, 1, outfit.headband);
  }

  // 9. Contour, ombrage, ombre au sol et éclat du grade Hero.
  outlinePass(c);
  shadePass(c, new Set([WHITE, iris, '#E8857A']));
  for (let x = CX - (hips + 5); x < CX + hips + 5; x++) if (!c.get(x, 40)) c.set(x, 40, SHADOW);
  if (tierIdx === 4) {
    for (const [x, y] of [[4, 12], [35, 9], [3, 30], [36, 25], [8, 4], [33, 34]]) {
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!c.get(x + dx, y + dy)) c.set(x + dx, y + dy, dx === 0 && dy === 0 ? '#FFF6D8' : '#EFC97E');
      }
    }
  }

  return { pixels: c.px };
}

/** Décor de dojo minimaliste : mur à panneaux shoji et parquet. */
export function buildDojoScene(): AvatarGrid {
  const c = new Canvas();
  c.rect(0, 0, GRID_W, 38, '#23232F');
  for (const x of [0, 13, 26, 39]) c.rect(x, 0, 1, 38, '#2C2C3A');
  for (const y of [12, 25]) c.rect(0, y, GRID_W, 1, '#2C2C3A');
  c.rect(0, 38, GRID_W, 1, '#3A2A20');
  c.rect(0, 39, GRID_W, 5, '#6B4A33');
  c.rect(0, 41, GRID_W, 1, '#5A3E2B');
  for (const x of [7, 21, 33]) c.rect(x, 39, 1, 2, '#5A3E2B');
  for (const x of [14, 28]) c.rect(x, 42, 1, 2, '#5A3E2B');
  return { pixels: c.px };
}

/**
 * Convertit une grille en chemins SVG, un par couleur : chaque segment
 * horizontal de même couleur devient un petit rectangle. Un léger
 * débordement masque les liserés d'anticrénelage entre pixels voisins.
 */
export function gridToPaths(grid: AvatarGrid): { color: string; d: string }[] {
  const byColor = new Map<string, string[]>();
  const o = 0.04;
  for (let y = 0; y < GRID_H; y++) {
    let x = 0;
    while (x < GRID_W) {
      const col = grid.pixels[y * GRID_W + x];
      let run = 1;
      while (x + run < GRID_W && grid.pixels[y * GRID_W + x + run] === col) run++;
      if (col) {
        const list = byColor.get(col) ?? [];
        list.push(`M${x} ${y}h${run + o}v${1 + o}h${-(run + o)}z`);
        byColor.set(col, list);
      }
      x += run;
    }
  }
  return [...byColor.entries()].map(([color, parts]) => ({ color, d: parts.join('') }));
}
