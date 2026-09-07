import { initWasm, Resvg } from "@resvg/resvg-wasm";
import satori, { init as initSatori } from "satori/standalone";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import yogaWasm from "satori/yoga.wasm";
import dmSansRegular from "../assets/fonts/DMSans-Regular.ttf?inline";
import dmSansBold from "../assets/fonts/DMSans-Bold.ttf?inline";
import { publicData } from "./store";
import {
  OG_HEIGHT,
  OG_WIDTH,
  entryCardElement,
  siteCardElement,
  type OgNode,
} from "../lib/og";

// Font di-inline Vite sebagai data URL base64. Wasm yoga dan resvg diimpor
// sebagai modul WebAssembly karena Workers melarang kompilasi wasm saat
// runtime; karena itu satori dipakai lewat entry standalone dengan versi yang
// dipin (lihat docs/CLOUDFLARE-SETUP.md). Semuanya disiapkan sekali, lazy.
function dataUrlBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

type SatoriFonts = Parameters<typeof satori>[1]["fonts"];

let prepared: Promise<{ fonts: SatoriFonts }> | null = null;

async function initResvg() {
  try {
    await initWasm(resvgWasm);
  } catch (error) {
    // Saat hot reload modul ini dimuat ulang padahal wasm-nya masih terpasang
    // di isolate yang sama; di Worker terdeploy hanya terjadi sekali.
    if (!String(error).includes("Already initialized")) throw error;
  }
}

function prepare() {
  prepared ??= (async () => {
    await Promise.all([initSatori(yogaWasm), initResvg()]);
    return {
      fonts: [
        {
          name: "DM Sans",
          data: dataUrlBytes(dmSansRegular).buffer as ArrayBuffer,
          weight: 400,
          style: "normal",
        },
        {
          name: "DM Sans",
          data: dataUrlBytes(dmSansBold).buffer as ArrayBuffer,
          weight: 700,
          style: "normal",
        },
      ] as SatoriFonts,
    };
  })();
  return prepared;
}

export async function renderCard(element: OgNode): Promise<Uint8Array> {
  const { fonts } = await prepare();
  const svg = await satori(element as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  // Satori sudah mengubah teks menjadi path, jadi resvg tidak butuh font.
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    font: { loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

export async function ogResponse(env: Env, slug?: string): Promise<Response> {
  const data = await publicData(env);
  let element: OgNode;
  if (slug) {
    const entry = data.entries.find((e) => e.slug === slug);
    if (!entry) return new Response("Not found", { status: 404 });
    element = entryCardElement(entry, data.site, env.PUBLIC_HOST);
  } else {
    if (!data.site) return new Response("Not found", { status: 404 });
    element = siteCardElement(data.site, env.PUBLIC_HOST);
  }
  const png = await renderCard(element);
  // Salin ke ArrayBuffer eksak agar valid sebagai BodyInit respons.
  const body = png.buffer.slice(
    png.byteOffset,
    png.byteOffset + png.byteLength,
  ) as ArrayBuffer;
  // Cache 1 jam mengikuti pola sitemap.xml: URL tetap, isi berubah saat publish.
  return new Response(body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
