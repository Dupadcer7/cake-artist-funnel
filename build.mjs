import tailwind from "bun-plugin-tailwind";
import { mkdir, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const result = await Bun.build({
  entrypoints: ["./client/src/main.tsx"],
  outdir: "./dist",
  target: "browser",
  format: "esm",
  minify: true,
  sourcemap: "none",
  naming: { entry: "app.[ext]", chunk: "assets/[name]-[hash].[ext]", asset: "assets/[name]-[hash].[ext]" },
  plugins: [tailwind],
  define: { "process.env.NODE_ENV": '"production"' },
});
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
const META_PIXEL_ID = "3805999569695684";
const META_PIXEL_SNIPPET = `<!-- Meta Pixel Code --><script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');fbq('track','PageView');</script><!-- End Meta Pixel Code -->`;
await writeFile("dist/index.html", `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no"><meta name="color-scheme" content="light dark"><link rel="icon" href="data:,">${result.outputs.some((o)=>o.path.endsWith("app.css"))?'<link rel="stylesheet" href="/app.css">':''}<title>Vale — Cake Artist</title>${META_PIXEL_SNIPPET}<script type="module" src="/app.js"></script></head><body><div data-generated-space-root></div></body></html>`);
console.log("Cliente compilado en dist/");
