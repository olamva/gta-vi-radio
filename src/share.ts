import { matchLabel, type Ranking, type Station } from "@/match.ts";

const WIDTH = 1080;
const HEIGHT = 1350;
const PAD = 80;
const ART = 440;
const SMALL_ART = 110;
const DISPLAY = "Archivo";
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

type Context = CanvasRenderingContext2D;

const token = (name: string) =>
  getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();

const loadImage = async (src: string) => {
  const image = new Image();
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

export const renderCard = async (rankings: Ranking[]) => {
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
  await drawArt(ctx, top.station, PAD, 310, ART);

  const column = PAD + ART + 48;
  if (runnersUp.length) {
    ctx.fillStyle = token("muted-foreground");
    ctx.font = `700 32px ${DISPLAY}`;
    ctx.fillText("ALSO ON MY DIAL", column, 345);
  }
  for (const [index, { station }] of runnersUp.entries()) {
    const y = 380 + index * 130;
    await drawArt(ctx, station, column, y, SMALL_ART);
    const x = column + SMALL_ART + 24;
    ctx.fillStyle = station.color;
    ctx.font = `700 28px ${DISPLAY}`;
    ctx.fillText(`#${index + 2}`, x, y + 30);
    ctx.fillStyle = token("foreground");
    const name = fit(ctx, station.name.toUpperCase(), WIDTH - PAD - x, 34, 2);
    drawLines(ctx, name.lines, x, y + 70, name.size);
  }

  const width = WIDTH - PAD * 2;
  ctx.fillStyle = token("foreground");
  const title = fit(ctx, top.station.name.toUpperCase(), width, 150, 2);
  const titleY = 790 + title.size * 0.75;
  drawLines(ctx, title.lines, PAD, titleY, title.size * 0.88);
  const labelY = titleY + (title.lines.length - 1) * title.size * 0.88 + 70;
  ctx.fillStyle = token("muted-foreground");
  ctx.font = `500 40px ${SANS}`;
  ctx.fillText(matchLabel(top.hits), PAD, labelY);
  ctx.fillStyle = token("foreground");
  const artists = fit(
    ctx,
    top.hits
      .slice(0, 3)
      .map(({ artist }) => artist)
      .join(" · "),
    width,
    40,
    1,
    700,
    SANS,
  );
  drawLines(ctx, artists.lines, PAD, labelY + 64, artists.size);

  ctx.font = `700 36px ${DISPLAY}`;
  ctx.fillStyle = token("muted-foreground");
  ctx.fillText(location.host.toUpperCase(), PAD, HEIGHT - PAD);
  ctx.fillStyle = token("sunset");
  ctx.textAlign = "right";
  ctx.fillText("FIND YOUR STATION", WIDTH - PAD, HEIGHT - PAD);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve),
  );
  return new File([blob!], "gta-vi-radio-match.png", { type: "image/png" });
};

export const shareCard = async (file: File, station: string) => {
  const data = {
    files: [file],
    title: "GTA VI Radio Match",
    text: `My GTA VI radio station is ${station}. Find yours:`,
    url: location.origin,
  };
  if (navigator.canShare?.(data))
    return navigator.share(data).catch(() => undefined);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
};
