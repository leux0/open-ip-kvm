import argparse

import cv2
from flask import Flask, Response, request
from flask_cors import CORS
from gevent.pywsgi import WSGIServer

parser = argparse.ArgumentParser(description="Video Server")
parser.add_argument("-p", "--port", type=int, default=10120, help="Running on the given port")
parser.add_argument("-d", "--device", type=int, default=-1, help="Camera device(-1 for auto)")
parser.add_argument("-r", "--res", type=str, default="1280x720", help="Camera resolution")
parser.add_argument("-f", "--fps", type=int, default=30, help="Camera FPS")
parser.add_argument("-q", "--quality", type=int, default=80, help="JPEG quality")
args = parser.parse_args()
video_device = args.device
video_width = int(args.res.split("x")[0])
video_height = int(args.res.split("x")[1])
video_fps = args.fps

running = True

if video_device < 0:
    cap = cv2.VideoCapture()
    for i in range(10):
        cap.open(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            video_device = i
            break
else:
    cap = cv2.VideoCapture(int(video_device), cv2.CAP_DSHOW)
if not cap.isOpened():
    print("Cannot open camera, streamer exit")
    exit()
cap.set(cv2.CAP_PROP_FRAME_WIDTH, video_width)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, video_height)
cap.set(cv2.CAP_PROP_FPS, video_fps)
print(
    f"Opend camera-{video_device}: {cap.get(cv2.CAP_PROP_FRAME_WIDTH)}x{cap.get(cv2.CAP_PROP_FRAME_HEIGHT)}@{cap.get(cv2.CAP_PROP_FPS)}"
)


def get_stream():
    while running:
        status, frame = cap.read()
        if not status:
            break
        image = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, args.quality])[1]
        yield (b"Content-Type: image/jpeg\r\n\r\n" + image.tobytes() + b"\r\n\r\n--frame\r\n")


def get_snapshot():
    status, frame = cap.read()
    if not status:
        return b""
    image = cv2.imencode(".jpg", frame)[1]
    return image.tobytes()


app = Flask(__name__)
CORS(app, supports_credentials=True, allow_headers="*")


@app.route("/")
def index():
    action = request.args.get("action", None)
    if action == "stream":
        return Response(get_stream(), mimetype="multipart/x-mixed-replace; boundary=frame")
    elif action == "snapshot":
        return Response(get_snapshot(), mimetype="image/jpeg")
    return Response("server online", status=200)


@app.route("/stream")
def http_stream():
    return Response(get_stream(), mimetype="multipart/x-mixed-replace; boundary=frame")


@app.route("/snapshot")
def http_snapshot():
    return Response(get_snapshot(), mimetype="image/jpeg")

print(f"Running streamer on port {args.port}")
# server = WSGIServer(("0.0.0.0", args.port), app)
# server.serve_forever()
app.run(host="0.0.0.0", port=args.port, debug=False, threaded=True)
cap.release()
running = False
