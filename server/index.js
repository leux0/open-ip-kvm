const path = require('path');
const url = require('url');

const config = require("./config.json");

config.app_title = config.app_title || 'Open IP-KVM';
config.video.stream_port = config.video.stream_port || 8010;

const ws = require('ws');
const Koa = require('koa');
const KoaStaic = require('koa-static');

const { HIDController } = require('./hid.js');
const { startVideo } = require('./video.js');


async function start() {

  try {
    var hid = new HIDController()
    await startVideo(config.video);
    function websocketHandler(ws) {
      console.log('new websocket connection');
      ws.on('message', function message(data) {
        const msg = JSON.parse(data.toString());
        switch (msg.type) {
          //case 'write_WS2812':
            //var r = msg.payload[0];
            //var g = msg.payload[1];
            //var b = msg.payload[2];
            //hid.WriteWS2812(r, g, b);
            //break;
          case 'write_keyboard':				// 键盘数据
            var key = msg.payload[0];
            var state = msg.payload[1];
            hid.WriteKeyboard(key, state);
            break;
          /*case 'write_mouse_pos':				// 鼠标绝对位置
            var x = msg.payload[0];
            var y = msg.payload[1];
            //hid.WriteMousePos(x, y);
            console.log('位置：', x, y);
            break;*/
          case 'write_mouse_button':			// 鼠标按键
            var button = msg.payload[0];
            var state = msg.payload[1];
            hid.WriteMouseButtons(button, state);
            //console.log('按键：', button, state);
            break;
          case 'write_mouse_wheel':				// 鼠标滚轮
            var wheel = msg.payload[0];
            hid.WriteMouseWheel(wheel);
            //console.log('滚轮：', wheel);
            break;
          case 'write_mouse_offset':			// 鼠标相对位置
            var x = msg.payload[0];
            var y = msg.payload[1];
            hid.WriteMouseOffset(x, y);
            //console.log('偏移：', x, y);
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
