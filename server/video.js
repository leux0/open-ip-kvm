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
      var proc_name = 'mjpg_streamer';
    } else if (opt.backend === 'ustreamer') {
      var cmd = [
        'ustreamer',
        `--device=${opt.device} -r ${opt.res} -f ${opt.fps} --format mjpeg`,
        `--host=0.0.0.0 --port=${opt.stream_port} --allow-origin=\\*`,
        '--workers=3 --drop-same-frames=30'
      ].join(' ');
      var proc_name = 'ustreamer';
    } else {
      reject(new Error(`Unknown backend ${opt.backend}, only mjpg_streamer and ustreamer are supported`));
    }
    // check if process is running
    const ps = spawn(`sudo pidof ${proc_name} && sleep 1`, { shell: true });
    ps.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      if (data.toString('utf-8').length > 0) {
        console.log(`${proc_name} is already running, pid: ${data.toString('utf-8')}, kill it`);
        spawn(`sudo kill ${data.toString('utf-8')}`, { shell: true });
      }
    });
    // wait ps to exit
    ps.on('close', (code) => {
      shell = spawn('bash', ['-c', cmd]);

      shell.stdout.on('data', (data) => {
        console.log(data.toString('utf-8'));
      });

      shell.stderr.on('data', (data) => {
        const str = data.toString('utf-8');
        console.log(str);
        if (str.indexOf('Listening HTTP on') > -1) {
          // if (str.indexOf('HTTP TCP port') > -1) {
          console.log('Video backend start')
          resolve(shell);
        }
      });

      shell.on('close', (code) => {
        reject(new Error(`Video backend exited with code ${code}`));
      });
    });
  });
}

module.exports.startVideo = startVideo;
