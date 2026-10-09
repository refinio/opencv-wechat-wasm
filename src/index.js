import opencvFactory from "../generated/opencv/opencv.mjs";

/** Create an independent OpenCV module and its WeChat QR detector. */
export async function createOpenCvRuntime({
  wasmUrl = new URL("../generated/opencv/opencv_js.wasm", import.meta.url).href,
  detectorPrototxtUrl = new URL("../generated/wechat_qrcode/detect.prototxt", import.meta.url).href,
  detectorModelUrl = new URL("../generated/wechat_qrcode/detect.caffemodel", import.meta.url).href,
} = {}) {
  const cv = await opencvFactory({ locateFile: () => wasmUrl });
  if (cv.ready) await cv.ready;
  const [prototxt, model] = await Promise.all([
    fetchAsset(detectorPrototxtUrl),
    fetchAsset(detectorModelUrl),
  ]);
  cv.FS_createDataFile("/", "detect.prototxt", prototxt, true, false, false);
  cv.FS_createDataFile("/", "detect.caffemodel", model, true, false, false);
  const detector = new cv.wechat_qrcode_WeChatQRCode("/detect.prototxt", "/detect.caffemodel", "", "");
  return { cv, detector };
}

async function fetchAsset(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load WeChat QR asset ${url}: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
