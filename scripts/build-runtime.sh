#!/usr/bin/env bash
set -euo pipefail

readonly OPENCV_VERSION="4.13.0"
readonly EMSDK_IMAGE="emscripten/emsdk@sha256:33e992367f721747d8008c9141c04fa017139e3557a60e0c80be93a0870fe462"
readonly ROOT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly SOURCE_DIRECTORY="${ROOT_DIRECTORY}/.cache/opencv"
readonly DOWNLOAD_CACHE_DIRECTORY="${ROOT_DIRECTORY}/.cache/downloads"
readonly BUILD_DIRECTORY="${ROOT_DIRECTORY}/.build/opencv"
readonly GENERATED_DIRECTORY="${ROOT_DIRECTORY}/generated"
readonly GENERATED_MANIFEST="${GENERATED_DIRECTORY}/.build-manifest"
readonly PATCH_FILE="${ROOT_DIRECTORY}/patches/wechat-qrcode-emscripten-memfs.patch"
readonly CONFIG_FILE="${ROOT_DIRECTORY}/config/opencv_js_wechat.config.py"
readonly -a GENERATED_ASSETS=(
  "opencv/opencv.mjs"
  "opencv/opencv_js.wasm"
  "wechat_qrcode/detect.caffemodel"
  "wechat_qrcode/detect.prototxt"
)

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command is unavailable: $1" >&2
    exit 1
  fi
}

for command in node sha256sum; do
  require_command "$command"
done

runtime_recipe_hash() {
  {
    printf 'opencv=%s\nemsdk=%s\n' "$OPENCV_VERSION" "$EMSDK_IMAGE"
    sha256sum "$BASH_SOURCE" "$PATCH_FILE" "$CONFIG_FILE" \
      "$ROOT_DIRECTORY/scripts/fetch-models.sh" \
      "$ROOT_DIRECTORY/scripts/verify-opencv-wasm.mjs" | cut -d ' ' -f 1
  } | sha256sum | cut -d ' ' -f 1
}

has_current_runtime() {
  local directory="$1"
  local manifest="${directory}/.build-manifest"
  [[ -f "$manifest" ]] || return 1

  local manifest_recipe
  IFS= read -r manifest_recipe < "$manifest"
  [[ "$manifest_recipe" == "recipe $(runtime_recipe_hash)" ]] || return 1

  (
    cd "$directory"
    tail -n +2 "$(basename "$manifest")" | sha256sum --check --status
  )
}

write_generated_manifest() {
  {
    printf 'recipe %s\n' "$(runtime_recipe_hash)"
    (
      cd "$GENERATED_DIRECTORY"
      sha256sum "${GENERATED_ASSETS[@]}"
    )
  } > "$GENERATED_MANIFEST"
}

if has_current_runtime "$GENERATED_DIRECTORY"; then
  echo "OpenCV WeChat QR generated runtime is current"
  exit 0
fi

for command in curl docker git; do
  require_command "$command"
done

checkout_source() {
  local repository="$1"
  local target="$2"

  if [[ -d "${target}/.git" ]]; then
    git -C "$target" fetch --depth 1 origin "refs/tags/${OPENCV_VERSION}:refs/tags/${OPENCV_VERSION}"
  else
    git clone --branch "$OPENCV_VERSION" --depth 1 "$repository" "$target"
  fi
  git -C "$target" checkout --force --detach "$OPENCV_VERSION"
}

mkdir -p "$SOURCE_DIRECTORY" "$DOWNLOAD_CACHE_DIRECTORY"
checkout_source "https://github.com/opencv/opencv.git" "${SOURCE_DIRECTORY}/opencv"
checkout_source "https://github.com/opencv/opencv_contrib.git" "${SOURCE_DIRECTORY}/opencv_contrib"

if git -C "${SOURCE_DIRECTORY}/opencv_contrib" apply --check "$PATCH_FILE" >/dev/null 2>&1; then
  git -C "${SOURCE_DIRECTORY}/opencv_contrib" apply "$PATCH_FILE"
else
  echo "The WeChat QR Emscripten patch does not match OpenCV contrib ${OPENCV_VERSION}." >&2
  exit 1
fi

if [[ -e "$BUILD_DIRECTORY" || -e "$GENERATED_DIRECTORY" ]]; then
  docker run --rm --network "${OPENCV_DOCKER_NETWORK:-bridge}" \
    -v "${ROOT_DIRECTORY}:/work" \
    -w /work \
    "$EMSDK_IMAGE" \
    rm -rf .build/opencv generated
fi
mkdir -p "$BUILD_DIRECTORY" "$GENERATED_DIRECTORY/opencv" "$GENERATED_DIRECTORY/wechat_qrcode"

docker run --rm --network "${OPENCV_DOCKER_NETWORK:-bridge}" \
  -v "${ROOT_DIRECTORY}:/work" \
  -v "${SOURCE_DIRECTORY}/opencv:/src:ro" \
  -v "${SOURCE_DIRECTORY}/opencv_contrib:/opencv_contrib:ro" \
  -w /work \
  "$EMSDK_IMAGE" \
  python3 /src/platforms/js/build_js.py "/work/.build/opencv" \
    --build_wasm \
    --disable_single_file \
    --simd \
    --config="/work/config/opencv_js_wechat.config.py" \
    --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=/opencv_contrib/modules" \
    --cmake_option="-DOPENCV_DOWNLOAD_PATH=/work/.cache/downloads" \
    --cmake_option="-DBUILD_LIST=core,imgproc,objdetect,dnn,wechat_qrcode,js,js_bindings_generator" \
    --cmake_option="-DBUILD_TESTS=OFF" \
    --cmake_option="-DBUILD_PERF_TESTS=OFF" \
    --cmake_option="-DBUILD_EXAMPLES=OFF" \
    --cmake_option="-DCMAKE_CXX_STANDARD=17" \
    --cmake_option="-DCMAKE_C_FLAGS_RELEASE=-O3 -DNDEBUG" \
    --cmake_option="-DCMAKE_CXX_FLAGS_RELEASE=-O3 -DNDEBUG" \
    --cmake_option="-DCMAKE_EXE_LINKER_FLAGS_RELEASE=-O3"

node "$ROOT_DIRECTORY/scripts/verify-opencv-wasm.mjs" "$BUILD_DIRECTORY"

cp "$BUILD_DIRECTORY/bin/opencv_js.js" "$GENERATED_DIRECTORY/opencv/opencv.mjs"
printf '\nexport default cv;\n' >> "$GENERATED_DIRECTORY/opencv/opencv.mjs"
install -m 0644 "$BUILD_DIRECTORY/bin/opencv_js.wasm" "$GENERATED_DIRECTORY/opencv/opencv_js.wasm"
bash "$ROOT_DIRECTORY/scripts/fetch-models.sh" "$GENERATED_DIRECTORY/wechat_qrcode"
write_generated_manifest
