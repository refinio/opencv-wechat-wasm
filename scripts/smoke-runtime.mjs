import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Run the shipped ESM loader in a browser-like realm, with local files served through fetch.
const context = vm.createContext({
  window: {}, console, WebAssembly, performance, URL,
  fetch: async (url) => new Response(await readFile(new URL(url).pathname), { headers: { "Content-Type": url.endsWith(".wasm") ? "application/wasm" : "application/octet-stream" } }),
});
const modules = new Map();
async function load(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  const module = new vm.SourceTextModule(await readFile(url, "utf8"), {
    context, identifier: url.href,
    initializeImportMeta(meta) { meta.url = "https://package.test" + url.pathname; },
  });
  modules.set(url.href, module);
  await module.link((specifier, referencingModule) => load(new URL(specifier, referencingModule.identifier)));
  return module;
}
const entryUrl = process.argv[2] ? pathToFileURL(resolve(process.argv[2])) : new URL("../src/index.js", import.meta.url);
const entry = await load(entryUrl);
await entry.evaluate();
const { cv, detector } = await entry.namespace.createOpenCvRuntime();
for (const symbol of ["Mat", "MatVector", "Size", "cvtColor", "GaussianBlur", "resize", "morphologyEx", "getStructuringElement"]) {
  assert.equal(typeof cv[symbol], "function", symbol);
}
const image = new cv.Mat(64, 64, cv.CV_8UC1);
const points = new cv.MatVector();
image.data.fill(255);
const decoded = detector.detectAndDecode(image, points);
assert.equal(decoded.size(), 0);
decoded.delete(); points.delete(); image.delete();
const fixture = JSON.parse(await readFile(new URL("../tests/qr-fixture.json", import.meta.url), "utf8"));
const size = fixture.rows.length * 8;
const qr = new cv.Mat(size, size, cv.CV_8UC1);
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) qr.data[y * size + x] = fixture.rows[Math.floor(y / 8)][Math.floor(x / 8)] === "1" ? 0 : 255;
}
const corners = new cv.MatVector();
const result = detector.detectAndDecode(qr, corners);
assert.equal(result.size(), 1);
assert.equal(result.get(0), fixture.payload);
const cornerMat = corners.get(0);
assert.equal(cornerMat.data32F.length, 8);
for (const coordinate of cornerMat.data32F) assert.ok(coordinate >= 0 && coordinate < size);
assert.ok(Math.max(...cornerMat.data32F) - Math.min(...cornerMat.data32F) > size / 2);
cornerMat.delete(); result.delete(); corners.delete(); qr.delete(); detector.delete();
console.log("Shipped ESM, WASM, model loading, and positive/blank-image decoding verified");
