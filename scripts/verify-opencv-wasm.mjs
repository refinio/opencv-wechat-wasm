import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { TextDecoder, TextEncoder } from "node:util";
import vm from "node:vm";

const buildDirectory = process.argv[2] ?? ".build/opencv";
const opencvJs = path.resolve(buildDirectory, "bin/opencv_js.js");
const opencvWasm = path.resolve(buildDirectory, "bin/opencv_js.wasm");

assert.ok(existsSync(opencvJs), `OpenCV JavaScript build is missing: ${opencvJs}`);
assert.ok(existsSync(opencvWasm), `OpenCV WebAssembly build is missing: ${opencvWasm}`);

const require = createRequire(import.meta.url);
const commonJsModule = { exports: {} };
const context = vm.createContext({
  __dirname: path.dirname(opencvJs),
  __filename: opencvJs,
  console,
  exports: commonJsModule.exports,
  globalThis,
  module: commonJsModule,
  performance,
  process,
  require,
  TextDecoder,
  TextEncoder,
  WebAssembly,
});

vm.runInContext(readFileSync(opencvJs, "utf8"), context, { filename: opencvJs });

const cvFactory = commonJsModule.exports.default ?? commonJsModule.exports;
const cv =
  typeof cvFactory === "function"
    ? await cvFactory({ locateFile: (file) => path.join(path.dirname(opencvJs), file) })
    : await cvFactory;

if (cv.ready) await cv.ready;

for (const symbol of [
  "Mat",
  "MatVector",
  "Size",
  "cvtColor",
  "GaussianBlur",
  "getStructuringElement",
  "morphologyEx",
  "resize",
  "wechat_qrcode_WeChatQRCode",
]) {
  assert.notEqual(typeof cv[symbol], "undefined", `cv.${symbol}`);
}

console.log("OpenCV WebAssembly runtime verified");
