# Third-party notices

This package distributes the OpenCV 4.13.0 JavaScript and WebAssembly build.
Its Apache-2.0 license text is reproduced verbatim in `OpenCV-4.13.0.txt` from
the OpenCV 4.13.0 source vendored to build this package. The build applies the
checked-in `wechat-qrcode-emscripten-memfs.patch` to the vendored OpenCV contrib
source before compiling.

The static build also includes protobuf and zlib, whose exact vendored license
texts are reproduced in `protobuf.txt` and `zlib.txt`.

The bundled WeChat QR Caffe model and prototxt retain their upstream license at
`LICENSES/WeChatQRCode.txt`.
