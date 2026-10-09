export interface OpenCv {
  COLOR_RGB2GRAY: number;
  COLOR_RGBA2GRAY: number;
  CV_8UC1: number;
  CV_8UC3: number;
  CV_8UC4: number;
  FS_createDataFile?: (...args: unknown[]) => unknown;
  INTER_AREA: number;
  INTER_LINEAR: number;
  BORDER_REFLECT_101: number;
  GaussianBlur: (
    src: CvMat,
    dst: CvMat,
    ksize: CvSize,
    sigmaX: number,
    sigmaY: number,
    borderType: number,
  ) => void;
  INTER_CUBIC: number;
  MORPH_OPEN: number;
  MORPH_RECT: number;
  Mat: {
    new (): CvMat;
    new (rows: number, cols: number, type: number): CvMat;
  };
  MatVector: new () => CvMatVector;
  Size: new (width: number, height: number) => CvSize;
  cvtColor: (src: CvMat, dst: CvMat, code: number) => void;
  getStructuringElement: (shape: number, ksize: CvSize) => CvMat;
  matFromImageData: (imageData: ImageDataLikeForOpenCv) => CvMat;
  morphologyEx: (source: CvMat, destination: CvMat, operation: number, kernel: CvMat) => void;
  resize: (
    src: CvMat,
    dst: CvMat,
    dsize: CvSize,
    fx?: number,
    fy?: number,
    interpolation?: number,
  ) => void;
  wechat_qrcode_WeChatQRCode: new (
    detectorPrototxtPath: string,
    detectorCaffeModelPath: string,
    superResolutionPrototxtPath: string,
    superResolutionCaffeModelPath: string,
  ) => WeChatQRCode;
  ready?: Promise<OpenCv>;
}

export interface ImageDataLikeForOpenCv {
  data: Uint8ClampedArray;
  height: number;
  width: number;
}

export interface CvMat {
  cols: number;
  data: Uint8Array;
  data32F: Float32Array;
  delete: () => void;
  rows: number;
}

export interface CvSize {
  height: number;
  width: number;
}

export interface CvMatVector {
  delete: () => void;
  get: (index: number) => CvMat;
  size: () => number;
}

export interface StringVector {
  delete: () => void;
  get: (index: number) => string;
  size: () => number;
}

export interface WeChatQRCode {
  delete: () => void;
  detectAndDecode: (image: CvMat, points: CvMatVector) => StringVector;
  getScaleFactor: () => number;
  setScaleFactor: (scaleFactor: number) => void;
}

export interface OpenCvRuntime {
  cv: OpenCv;
  detector: WeChatQRCode;
}
