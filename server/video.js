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
        `--device=${opt.device} -r ${opt.res} -f ${opt.fps}`, //  --format mjpeg
        `--host=0.0.0.0 --port=${opt.stream_port} --allow-origin=\\*`,
        '--workers=3 --drop-same-frames=30'
      ].join(' ');
      if (opt.format !== 'auto') {
        cmd += ` --format ${opt.format}`;
      }
      var proc_name = 'ustreamer';
    } else if (opt.backend === 'custom') {
      var cmd = opt.custom_cmd;
      cmd = cmd.replace(/\$device/g, opt.device); // replace $device with device
      cmd = cmd.replace(/\$res/g, opt.res); // replace $res with res
      cmd = cmd.replace(/\$fps/g, opt.fps); // replace $fps with fps
      cmd = cmd.replace(/\$stream_port/g, opt.stream_port); // replace $stream_port with stream_port
      var proc_name = cmd.split(' ')[0];
    } else if (opt.backend === 'none') {
      console.log('No video backend');
      resolve();
      return;
    } else {
      reject(new Error(`Unknown backend ${opt.backend}, supported: mjpg_streamer, ustreamer, custom, none`));
    }
    function run() {
      if (process.platform === 'linux') {
        var exctuter = 'bash';
      } else if (process.platform === 'win32') {
        var exctuter = 'powershell.exe';
      } else {
        var exctuter = 'bash';
        console.warn('Unknown platform, using bash as default exctuter');
      }
      shell = spawn(exctuter, ['-c', cmd]);
      shell.stdout.on('data', (data) => {
        console.log(data.toString('utf-8'));
      });

      shell.stderr.on('data', (data) => {
        const str = data.toString('utf-8');
        console.log(str);
      });

      console.log('Video backend start')
      resolve(shell);
    };
    // check if process is running
    // check if is linux
    if (process.platform !== 'linux') {
      run();
    } else {
      if (opt.sudo) {
        cmd = `sudo ${cmd}`;
      }
      const ps = spawn(`sudo pidof ${proc_name} && sleep 1`, { shell: true });
      ps.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        if (data.toString('utf-8').length > 0) {
          console.log(`${proc_name} is already running, pid: ${data.toString('utf-8')}, kill it`);
          spawn(`sudo kill ${data.toString('utf-8')}`, { shell: true });
        }
      });
      shell.on('close', (code) => {
        reject(new Error(`Video backend exited with code ${code}`));
      });
      ps.on('close', (code) => {
        run();
      });
    }
  });
}

module.exports.startVideo = startVideo;
