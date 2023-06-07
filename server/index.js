const path = require('path');
const url = require('url');

const config = require("./config.json");

config.app_title = config.app_title || 'Open IP-KVM';
config.mjpg_streamer.stream_port = config.mjpg_streamer.stream_port || 8010;

const ws = require('ws');
const Koa = require('koa');
const KoaStaic = require('koa-static');

const { HIDController } = require('./hid.js');
const { startMJPGStreamer } = require('./mjpg-streamer.js');


async function start() {

  try {
    var hid = new HIDController()
    await startMJPGStreamer(config.mjpg_streamer);
    function websocketHandler(ws) {
      console.log('new websocket connection');
      ws.on('message', function message(data) {
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
          case 'write_WS2812':
            var r = msg.payload[0];
            var g = msg.payload[1];
            var b = msg.payload[2];
            hid.WriteWS2812(r, g, b);
            break;
          case 'write_keyboard':
            var key = msg.payload[0];
            var state = msg.payload[1];
            hid.WriteKeyboard(key, state);
            break;
          case 'write_mouse_pos':
            var x = msg.payload[0];
            var y = msg.payload[1];
            hid.WriteMousePos(x, y);
            break;
          case 'write_mouse_button':
            var button = msg.payload[0];
            var state = msg.payload[1];
            hid.WriteMouseButtons(button, state);
            break;
          case 'write_mouse_wheel':
            var wheel = msg.payload[0];
            hid.WriteMouseWheel(wheel);
            break;
          case 'write_mouse_offset':
            var x = msg.payload[0];
            var y = msg.payload[1];
            hid.WriteMouseOffset(x, y);
            break;
        }
      });

      ws.send(JSON.stringify({
        type: 'welcome',
        payload: 'Open IP-KVM Server'
      }));
    }


    const app = new Koa();
    app.use(KoaStaic(path.join(__dirname, '../public')));

    const server = app.listen(config.listen_port);
    console.log(`listen on ${config.listen_port}...`);

    app.use(async function router(ctx) {
      if (ctx.path === '/api/config') {
        ctx.body = config;
      }
    });

    const wsInstance = new ws.WebSocketServer({ noServer: true });
    server.on('upgrade', function upgrade(request, socket, head) {
      const { pathname } = url.parse(request.url);

      if (pathname === '/websocket') {
        wsInstance.handleUpgrade(request, socket, head, function done(ws) {
          wsInstance.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    wsInstance.on('connection', websocketHandler);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

}

start();
