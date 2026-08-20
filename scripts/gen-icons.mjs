#!/usr/bin/env node
/**
 * 앱 아이콘 생성.
 *
 * 이미지 라이브러리 없이 PNG 를 직접 쓴다 (zlib 만 사용). 도형이 사각형뿐이라
 * 이 정도면 충분하고, 빌드 환경에 그래픽 도구를 요구하지 않아도 된다.
 *
 * 모티프: 문장 세 줄 중 한 칸이 비어 있는 모양 — 이 앱이 하는 일 그 자체.
 */
import zlib from "node:zlib";
import fs from "node:fs";

const BRAND = [0x5a, 0x83, 0x77];
const PAPER = [0xf7, 0xf4, 0xed];
const OCHRE = [0xe0, 0xc8, 0x96];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      raw[o++] = r; raw[o++] = g; raw[o++] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // truecolor
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** 세 줄 중 가운데 줄에 빈칸(다른 색)이 있는 모양. 마스크(원형 크롭)를 견디도록 여백을 넉넉히 둔다. */
function draw(size) {
  const u = size / 100;
  const bars = [
    { y: 34, x: 24, w: 52, color: PAPER },
    { y: 48, x: 24, w: 22, color: PAPER },
    { y: 48, x: 50, w: 26, color: OCHRE },
    { y: 62, x: 24, w: 36, color: PAPER },
  ].map((b) => ({
    x0: b.x * u, x1: (b.x + b.w) * u,
    y0: b.y * u, y1: (b.y + 7) * u,
    color: b.color,
  }));

  return (x, y) => {
    for (const b of bars) {
      if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1) return b.color;
    }
    return BRAND;
  };
}

for (const size of [180, 192, 512]) {
  fs.writeFileSync(`public/icon-${size}.png`, png(size, draw(size)));
}
// 파비콘은 배경 없이 같은 모양을 작게
fs.writeFileSync("public/favicon-64.png", png(64, draw(64)));

console.log("아이콘 생성 — 64 / 180 / 192 / 512");
