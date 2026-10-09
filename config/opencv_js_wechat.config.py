# Minimal OpenCV.js whitelist for the project-owned WeChat QRCode runtime.

exec(compile(open("/src/platforms/js/opencv_js.config.py").read(), "/src/platforms/js/opencv_js.config.py", "exec"))

core = {
    "": [],
    "Algorithm": [],
}

imgproc = {
    "": ["GaussianBlur", "cvtColor", "getStructuringElement", "morphologyEx", "resize"],
}

wechat_qrcode = {
    "wechat_qrcode_WeChatQRCode": [
        "WeChatQRCode",
        "detectAndDecode",
        "setScaleFactor",
        "getScaleFactor",
    ],
}

white_list = makeWhiteList([core, imgproc, wechat_qrcode])
