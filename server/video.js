const { spawn } = require('child_process');

let shell;

function startVideo(opt) {
  if (shell) {
    return;
  }

  return new Promise((resolve, reject) => {
    if (opt.backend === 'mjpg_streamer') {
      var cmd = [
        'mjpg_streamer',
        '-i',
        `'input_uvc.so -d ${opt.device} -r ${opt.res} -f ${opt.fps} -n -q 40'`,
        '-o',
        `'output_http.so -p ${opt.stream_port} -n'`,
      ].join(' ');
    } else if (opt.backend === 'ustreamer') {
      var cmd = [
        'ustreamer',
        `--device=${opt.device} -r ${opt.res} -f ${opt.fps} --format mjpeg`,
        `--host=0.0.0.0 --port=${opt.stream_port} --allow-origin=\\*`,
        '--workers=3 --drop-same-frames=30'
      ].join(' ');
    } else {
      reject(new Error(`Unknown backend ${opt.backend}, only mjpg_streamer and ustreamer are supported`));
    }
    shell = spawn('bash', ['-c', cmd]);

    shell.stdout.on('data', (data) => {
      console.log(data.toString('utf-8'));
    });

    shell.stderr.on('data', (data) => {
      const str = data.toString('utf-8');
      console.log(str);
      if (str.indexOf('Listening HTTP on') > -1) {
        // if (str.indexOf('HTTP TCP port') > -1) {
        console.log('mjpg_streamer start')
        resolve(shell);
      }
    });

    shell.on('close', (code) => {
      reject(new Error(`mjpg_streamer exited with code ${code}`));
    });
  });
}

module.exports.startVideo = startVideo;
