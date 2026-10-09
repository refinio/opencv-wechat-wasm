#!/usr/bin/env bash
set -euo pipefail

readonly MODEL_REVISION="a8b69ccc738421293254aec5ddb38bd523503252"
readonly MODEL_BASE_URL="https://raw.githubusercontent.com/WeChatCV/opencv_3rdparty/${MODEL_REVISION}"
readonly DETECT_CAFFE_MODEL_SHA256="cc49b8c9babaf45f3037610fe499df38c8819ebda29e90ca9f2e33270f6ef809"
readonly DETECT_PROTOTXT_SHA256="e8acfc395caf443a47f15686a9b9207b36cb8f7e6ceb8fbaf6466665e68a9466"

output_directory="$1"
mkdir -p "$output_directory"

model_matches_checksum() {
  local destination="$1"
  local expected_sha256="$2"

  [[ -f "$destination" ]] &&
    printf '%s  %s\n' "$expected_sha256" "$destination" | sha256sum --check --status
}

download_model() {
  local file_name="$1"
  local expected_sha256="$2"
  local destination="${output_directory}/${file_name}"
  local temporary_destination

  if model_matches_checksum "$destination" "$expected_sha256"; then
    echo "WeChat QR model is current: ${file_name}"
    return
  fi

  temporary_destination="$(mktemp "${output_directory}/.${file_name}.XXXXXX")"

  trap 'rm -f "$temporary_destination"' RETURN
  curl --fail --location --silent --show-error "${MODEL_BASE_URL}/${file_name}" -o "$temporary_destination"
  printf '%s  %s\n' "$expected_sha256" "$temporary_destination" | sha256sum --check --status
  mv "$temporary_destination" "$destination"
  trap - RETURN
}

download_model "detect.caffemodel" "$DETECT_CAFFE_MODEL_SHA256"
download_model "detect.prototxt" "$DETECT_PROTOTXT_SHA256"
