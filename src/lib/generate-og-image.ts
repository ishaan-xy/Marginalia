/**
 * Build-time OG image generator using CanvasKit (Google's Skia WASM port).
 *
 * Renders a 1200×630 PNG for each post with:
 *   - Gradient background (paper → accent-pale)
 *   - Left border in accent color
 *   - Series name (top-left) + "Part X of Y" (top-right) — if series post
 *   - Title in Lora Bold (centered vertically)
 *   - Description in Inter Regular (below title)
 *   - Author + date in Inter Regular (bottom-left)
 *
 * No runtime dependency on canvaskit-wasm — it's build-time only.
 * The WASM binary doesn't ship to the browser; only the generated PNGs do.
 */
import { CanvasKit, FontMgr } from 'canvaskit-wasm/full';
import fs from 'node:fs/promises';
import path from 'node:path';

const WIDTH = 1200;
const HEIGHT = 630;

// Colors (RGB tuples matching our CSS variables)
const PAPER: [number, number, number] = [253, 252, 250];        // #fdfcfa
const ACCENT_PALE: [number, number, number] = [245, 230, 229];  // #f5e6e5
const ACCENT: [number, number, number] = [181, 65, 63];         // #b5413f
const INK: [number, number, number] = [26, 26, 26];             // #1a1a1a
const INK_SOFT: [number, number, number] = [74, 74, 74];       // #4a4a4a
const INK_FAINT: [number, number, number] = [136, 136, 136];    // #888888

export interface OGImageOptions {
  title: string;
  description?: string;
  author: string;
  date: string;
  series?: { name: string; part: number; total: number };
}

let _canvasKit: CanvasKit | null = null;
let _fontMgr: FontMgr | null = null;

async function getCanvasKit(): Promise<CanvasKit> {
  if (_canvasKit) return _canvasKit;
  const ck = await import('canvaskit-wasm/full');
  _canvasKit = await ck.default();
  return _canvasKit;
}

async function getFontMgr(ck: CanvasKit): Promise<FontMgr> {
  if (_fontMgr) return _fontMgr;
  const fontDir = path.join(process.cwd(), 'src', 'fonts');
  const fontFiles = [
    'Lora-Bold.ttf',
    'Lora-Regular.ttf',
    'Inter-Bold.ttf',
    'Inter-Medium.ttf',
    'Inter-Regular.ttf',
  ];
  const buffers: Uint8Array[] = [];
  for (const file of fontFiles) {
    const data = await fs.readFile(path.join(fontDir, file));
    buffers.push(new Uint8Array(data));
  }
  _fontMgr = ck.FontMgr.FromData(...buffers);
  if (!_fontMgr) throw new Error('Failed to load fonts');
  return _fontMgr;
}

function rgb(ck: CanvasKit, [r, g, b]: [number, number, number]) {
  return ck.Color(r / 255, g / 255, b / 255, 1);
}

export async function generateOGImage(opts: OGImageOptions): Promise<Buffer> {
  const ck = await getCanvasKit();
  const fontMgr = await getFontMgr(ck);

  const surface = ck.MakeSurface(WIDTH, HEIGHT);
  if (!surface) throw new Error('Failed to create canvas surface');
  const canvas = surface.getCanvas();

  // 1. Background gradient (paper → accent-pale, top to bottom)
  const bgPaint = new ck.Paint();
  bgPaint.setShader(
    ck.Shader.MakeLinearGradient(
      [0, 0],
      [0, HEIGHT],
      [rgb(ck, PAPER), rgb(ck, ACCENT_PALE)],
      null,
      ck.TileMode.Clamp
    )
  );
  canvas.drawRect(ck.XYWHRect(0, 0, WIDTH, HEIGHT), bgPaint);

  // 2. Left border (accent color, 6px wide)
  const borderPaint = new ck.Paint();
  borderPaint.setStyle(ck.PaintStyle.Stroke);
  borderPaint.setColor(rgb(ck, ACCENT));
  borderPaint.setStrokeWidth(6);
  canvas.drawLine(3, 0, 3, HEIGHT, borderPaint);

  const padding = 60;

  // 3. Corner labels (only for series posts)
  if (opts.series) {
    const seriesName = opts.series.name.length > 30
      ? opts.series.name.slice(0, 27) + '…'
      : opts.series.name;

    // Top-left: series name (accent color, Inter Bold, 26px)
    const seriesPara = buildParagraph(ck, fontMgr, {
      text: seriesName,
      fontSize: 26,
      fontWeight: 700,
      fontFamily: 'Inter',
      color: ACCENT,
      maxWidth: WIDTH / 2,
      lineHeight: 1,
    });
    canvas.drawParagraph(seriesPara, padding, padding);

    // Top-right: "Part X of Y" (faint gray, Inter Medium, 22px)
    // Use a right-aligned paragraph to position it in the top-right corner
    const partLabel = `Part ${opts.series.part} of ${opts.series.total}`;
    const partPara = buildRightAlignedParagraph(ck, fontMgr, {
      text: partLabel,
      fontSize: 22,
      fontWeight: 500,
      fontFamily: 'Inter',
      color: INK_FAINT,
      maxWidth: WIDTH / 2,
      lineHeight: 1,
    });
    // Position at right half of the image
    canvas.drawParagraph(partPara, WIDTH / 2, padding + 2);
  }

  // 4. Title (Lora Bold, 56px, left-aligned, vertically centered)
  const titlePara = buildParagraph(ck, fontMgr, {
    text: opts.title,
    fontSize: 56,
    fontWeight: 700,
    fontFamily: 'Lora',
    color: INK,
    maxWidth: WIDTH - padding * 2,
    lineHeight: 1.15,
  });

  // 5. Description (Inter Regular, 28px, below title)
  const descPara = opts.description
    ? buildParagraph(ck, fontMgr, {
        text: opts.description,
        fontSize: 28,
        fontWeight: 400,
        fontFamily: 'Inter',
        color: INK_SOFT,
        maxWidth: WIDTH - padding * 2,
        lineHeight: 1.4,
      })
    : null;

  // 6. Author + date (Inter Regular, 22px, bottom-left)
  const footerPara = buildParagraph(ck, fontMgr, {
    text: `${opts.author} · ${opts.date}`,
    fontSize: 22,
    fontWeight: 400,
    fontFamily: 'Inter',
    color: INK_FAINT,
    maxWidth: WIDTH - padding * 2,
    lineHeight: 1,
  });

  // Layout: title + description vertically centered, footer at bottom
  const titleHeight = titlePara.getHeight();
  const descHeight = descPara?.getHeight() ?? 0;
  const footerHeight = footerPara.getHeight();
  const gapBetween = 20;

  const totalContentHeight = titleHeight + (descHeight ? gapBetween + descHeight : 0);
  const contentTop = (HEIGHT - totalContentHeight) / 2;

  // Draw title
  canvas.drawParagraph(titlePara, padding, contentTop);

  // Draw description (below title, with gap)
  if (descPara) {
    canvas.drawParagraph(descPara, padding, contentTop + titleHeight + gapBetween);
  }

  // Draw footer (bottom-left, with padding from bottom)
  const footerY = HEIGHT - padding - footerHeight;
  canvas.drawParagraph(footerPara, padding, footerY);

  // Encode to PNG
  const image = surface.makeImageSnapshot();
  const bytes = image.encodeToBytes(ck.ImageFormat.PNG, 90);
  surface.dispose();

  return Buffer.from(bytes);
}

// ─── Text helpers ───────────────────────────────────────

interface ParaOpts {
  text: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  color: [number, number, number];
  maxWidth: number;
  lineHeight: number;
}

function buildParagraph(ck: CanvasKit, fontMgr: FontMgr, opts: ParaOpts) {
  const paraStyle = new ck.ParagraphStyle({
    textAlign: ck.TextAlign.Left,
    textStyle: {
      color: rgb(ck, opts.color),
      fontFamilies: [opts.fontFamily],
      fontSize: opts.fontSize,
      fontStyle: { weight: opts.fontWeight },
      heightMultiplier: opts.lineHeight,
    },
  });

  const builder = ck.ParagraphBuilder.Make(paraStyle, fontMgr);
  builder.addText(opts.text);
  const para = builder.build();
  para.layout(opts.maxWidth);
  return para;
}

function buildRightAlignedParagraph(ck: CanvasKit, fontMgr: FontMgr, opts: ParaOpts) {
  const paraStyle = new ck.ParagraphStyle({
    textAlign: ck.TextAlign.Right,
    textStyle: {
      color: rgb(ck, opts.color),
      fontFamilies: [opts.fontFamily],
      fontSize: opts.fontSize,
      fontStyle: { weight: opts.fontWeight },
      heightMultiplier: opts.lineHeight,
    },
  });

  const builder = ck.ParagraphBuilder.Make(paraStyle, fontMgr);
  builder.addText(opts.text);
  const para = builder.build();
  para.layout(opts.maxWidth - 60); // subtract right padding
  return para;
}
