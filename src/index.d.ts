import type { OpenCvRuntime } from "./opencv-types.js";
export type * from "./opencv-types.js";

export interface OpenCvAssetUrls {
  wasmUrl?: string;
  detectorPrototxtUrl?: string;
  detectorModelUrl?: string;
}

/** Browser/window/module-worker runtime. Delete the detector and allocated Mats when finished. */
export function createOpenCvRuntime(assets?: OpenCvAssetUrls): Promise<OpenCvRuntime>;
