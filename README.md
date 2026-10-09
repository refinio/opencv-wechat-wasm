# OpenCV WeChat WASM

A browser and module-worker OpenCV 4.13.0 runtime with SIMD, a reduced JavaScript API, and bundled WeChat QR detector models. No runtime dependencies. Consumers install precompiled assets; Docker is only needed by maintainers rebuilding them.

```js
import { createOpenCvRuntime } from "@refinio/opencv-wechat-wasm";
const { cv, detector } = await createOpenCvRuntime();
// Allocate cv.Mat and cv.MatVector, then call detector.detectAndDecode(image, points).
// Delete all allocated native objects when finished, including detector.
```

The default URLs work when the package files are served with their directory structure intact. Bundlers can supply asset URLs explicitly. For Vite:

```js
import { createOpenCvRuntime } from "@refinio/opencv-wechat-wasm";
import wasmUrl from "@refinio/opencv-wechat-wasm/assets/opencv/opencv_js.wasm?url";
import detectorPrototxtUrl from "@refinio/opencv-wechat-wasm/assets/wechat_qrcode/detect.prototxt?url";
import detectorModelUrl from "@refinio/opencv-wechat-wasm/assets/wechat_qrcode/detect.caffemodel?url";
const { cv, detector } = await createOpenCvRuntime({ wasmUrl, detectorPrototxtUrl, detectorModelUrl });
```

Each call creates an independent runtime. Cache the promise in the consumer if a shared instance is wanted. This package does not resize, smooth, apply morphology, choose detection scales, or map QR coordinates. It loads only the detection model, with super-resolution disabled. The raw OpenCV API remains available through `cv`.

## Build and release

Install Vite+ for package-manager commands. Run `vp install`, `vp run build`, `vp run test`, and `vp pm pack`. The build needs Docker, Git, curl, Node, and sha256sum. OpenCV and contrib are pinned to 4.13.0; Emscripten is pinned by image digest; model downloads are checksum-verified. Set `OPENCV_DOCKER_NETWORK=host` on Linux hosts where Docker bridge networking is unavailable. The generated manifest verifies cached artifacts against the recipe and file checksums.

The whitelist exposes core matrices and containers, selected imgproc operations, and WeChatQRCode. Native DNN and objdetect modules are included as build dependencies, along with the transitive calib3d, features2d, and flann modules. These do not gain additional JavaScript bindings beyond the whitelist. The contrib patch skips filesystem existence checks when native filesystem support is disabled, so models can load from Emscripten MEMFS. WASM uses SIMD and O3 without pthreads. Supported runtimes are modern browsers and module workers, not Node.

GitHub Actions builds and checks the package and uploads a tarball. Version tags also publish that tarball to a GitHub Release. Release assets are immutable: reruns fill missing assets without replacing existing tarballs, preserving consumer lockfile integrity. npm publication can use the same tarball; no install or postinstall build runs in consuming projects.

Wrapper code is MIT licensed. OpenCV, models, and linked third-party notices are in `LICENSES/`.
