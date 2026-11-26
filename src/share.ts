import { matchLabel, normalize, type Ranking, type Station } from "@/match.ts";
import type { Profiles } from "@/spotify.ts";

const WIDTH = 1080;
const HEIGHT = 1350;
const PAD = 80;
const ART = 480;
const SMALL_ART = 124;
const CHIP = 72;
const DISPLAY = "Archivo";
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

type Context = CanvasRenderingContext2D;

const token = (name: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();

const loadImage = async (src: string) => {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  return image;
};

const fit = (
  ctx: Context,
  text: string,
  width: number,
  size: number,
  maxLines: number,
  weight = 900,
  family = DISPLAY,
): { lines: string[]; size: number } => {
  ctx.font = `${weight} ${size}px ${family}`;
  const lines = text
    .split(" ")
    .reduce<string[]>(
      (all, word) =>
        all.length && ctx.measureText(`${all.at(-1)} ${word}`).width <= width
          ? [...all.slice(0, -1), `${all.at(-1)} ${word}`]
          : [...all, word],
      [],
    );
  const fits =
    lines.length <= maxLines &&
    lines.every((line) => ctx.measureText(line).width <= width);
  return fits || size <= 12
    ? { lines, size }
    : fit(ctx, text, width, size - 2, maxLines, weight, family);
};

const drawLines = (
  ctx: Context,
  lines: string[],
  x: number,
  y: number,
  lineHeight: number,
) =>
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));

const drawArt = async (
  ctx: Context,
  station: Station,
  x: number,
  y: number,
  size: number,
) => {
  if (station.icon)
    return ctx.drawImage(await loadImage(station.icon), x, y, size, size);
  ctx.fillStyle = `${station.color}1a`;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = station.color;
  ctx.textAlign = "center";
  const { lines, size: fontSize } = fit(
    ctx,
    station.name.toUpperCase(),
    size * 0.84,
    size * 0.19,
    3,
    800,
  );
  const lineHeight = fontSize * 0.9;
  drawLines(
    ctx,
    lines,
    x + size / 2,
    y + size / 2 - ((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35,
    lineHeight,
  );
  ctx.textAlign = "left";
};

const drawAvatar = async (
  ctx: Context,
  name: string,
  image: string | undefined,
  x: number,
  y: number,
) => {
  const loaded = image && (await loadImage(image).catch(() => undefined));
  if (loaded) return ctx.drawImage(loaded, x, y, CHIP, CHIP);
  ctx.fillStyle = token("muted");
  ctx.fillRect(x, y, CHIP, CHIP);
  ctx.fillStyle = token("muted-foreground");
  ctx.font = `600 30px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText(name.slice(0, 1), x + CHIP / 2, y + CHIP / 2 + 11);
  ctx.textAlign = "left";
};

export const renderCard = async (rankings: Ranking[], profiles: Profiles) => {
  await document.fonts.load(`900 100px ${DISPLAY}`);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const [top, ...rest] = rankings;
  const runnersUp = rest.slice(0, 3);

  ctx.fillStyle = token("background");
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  const glow = ctx.createRadialGradient(WIDTH, 0, 0, WIDTH, 0, WIDTH);
  glow.addColorStop(0, `${top.station.color}55`);
  glow.addColorStop(1, `${top.station.color}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.drawImage(await loadImage("/favicon.svg"), PAD, 72, 105, 80);
  ctx.fillStyle = token("foreground");
  ctx.font = `900 44px ${DISPLAY}`;
  ctx.fillText("RADIO MATCH", PAD + 129, 128);

  ctx.fillStyle = token("sunset");
  ctx.font = `700 48px ${DISPLAY}`;
  ctx.fillText("MY GTA VI STATION", PAD, 270);
  await drawArt(
    ctx,
    top.station,
    runnersUp.length ? PAD : (WIDTH - ART) / 2,
    310,
    ART,
  );

  const column = PAD + ART + 40;
  if (runnersUp.length) {
    ctx.fillStyle = token("muted-foreground");
    ctx.font = `700 32px ${DISPLAY}`;
    ctx.fillText("ALSO ON MY DIAL", column, 345);
  }
  for (const [index, { station }] of runnersUp.entries()) {
    const y = 370 + index * 148;
    await drawArt(ctx, station, column, y, SMALL_ART);
    const x = column + SMALL_ART + 24;
    const name = fit(ctx, station.name.toUpperCase(), WIDTH - PAD - x, 38, 2);
    const offset = name.lines.length > 1 ? 20 : 0;
    ctx.fillStyle = station.color;
    ctx.font = `700 30px ${DISPLAY}`;
    ctx.fillText(`#${index + 2}`, x, y + 48 - offset);
    ctx.fillStyle = token("foreground");
    ctx.font = `900 ${name.size}px ${DISPLAY}`;
    drawLines(ctx, name.lines, x, y + 88 - offset, name.size);
  }

  ctx.fillStyle = token("foreground");
  const title = fit(
    ctx,
    top.station.name.toUpperCase(),
    WIDTH - PAD * 2,
    150,
    2,
  );
  const titleLine = title.size * 0.88;
  const block =
    title.size * 0.75 + (title.lines.length - 1) * titleLine + 106 + CHIP;
  const titleY = 790 + (440 - block) / 2 + title.size * 0.75;
  drawLines(ctx, title.lines, PAD, titleY, titleLine);
  const labelY = titleY + (title.lines.length - 1) * titleLine + 70;
  ctx.fillStyle = token("muted-foreground");
  ctx.font = `500 40px ${SANS}`;
  ctx.fillText(
    matchLabel(top.hits).replace("yours", "mine").replace("your", "my"),
    PAD,
    labelY,
  );
  const chipY = labelY + 36;
  let chipX = PAD;
  for (const { artist } of top.hits.slice(0, 4)) {
    ctx.font = `700 30px ${SANS}`;
    const chip = CHIP + ctx.measureText(artist).width + 44;
    if (chipX + chip > WIDTH - PAD) break;
    ctx.fillStyle = "#ffffff0d";
    ctx.fillRect(chipX, chipY, chip, CHIP);
    ctx.fillStyle = token("foreground");
    ctx.fillText(artist, chipX + CHIP + 20, chipY + CHIP / 2 + 11);
    const image = profiles.get(normalize(artist))?.image;
    await drawAvatar(ctx, artist, image, chipX, chipY);
    chipX += chip + 16;
  }

  ctx.font = `700 34px ${DISPLAY}`;
  ctx.fillStyle = token("sunset");
  ctx.fillText("FIND YOUR STATION", PAD, HEIGHT - PAD);
  ctx.font = `500 32px ${SANS}`;
  ctx.fillStyle = token("muted-foreground");
  ctx.textAlign = "right";
  ctx.fillText(location.host, WIDTH - PAD, HEIGHT - PAD);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve),
  );
  return new File([blob!], "gta-vi-radio-match.png", { type: "image/png" });
};

export const shareData = (file: File, station: string) => ({
  files: [file],
  title: "GTA VI Radio Match",
  text: `My GTA VI radio station is ${station}. Find yours.`,
  url: location.origin,
});

export const canShare = (data: ShareData) => !!navigator.canShare?.(data);

export const isTouch = () => matchMedia("(pointer: coarse)").matches;
