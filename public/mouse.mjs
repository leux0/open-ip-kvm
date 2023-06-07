export function sendEvent(channel, data, type) {
  let payload = new Array(2);
  console.debug('sendEvent mouse', channel, data, type);
  payload.fill(0);
  if (type === 'move') {
    var type_msg = 'write_mouse_offset'
    payload[0] = data[0] * 15;
    payload[1] = data[1] * 15;
  } else if (type === 'abs') {
    var type_msg = 'write_mouse_pos'
    payload[0] = data[0];
    payload[1] = data[1];
  }else if (type === 'mousedown') {
    var type_msg = 'write_mouse_button'
    payload[1] = 2;
    switch (data) {
      case 0:
        payload[0] = 1;
        break;
      case 1:
        payload[0] = 4;
        break;
      case 2:
        payload[0] = 2;
        break;
      default:
        return;
    }
  } else if (type === 'mouseup') {
    var type_msg = 'write_mouse_button'
    payload[1] = 3;
    switch (data) {
      case 0:
        payload[0] = 1;
        break;
      case 1:
        payload[0] = 4;
        break;
      case 2:
        payload[0] = 2;
        break;
      default:
        return;
    }
  } else if(type === 'wheel') {
    var type_msg = 'write_mouse_wheel'
    payload[0] = Math.round(data / 40);
  } else if(type === 'reset') {
    var type_msg = 'write_mouse_button'
    payload[1] = 1;
  } else {
    return;
  }

  var msg = {
    type: type_msg,
    payload,
  };

  channel.send(JSON.stringify(msg));
}
