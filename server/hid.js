// 需要用支持HID的kb.mjs mouse.mjs才能起作用
const fs = require('fs');
const config = require("./config.json");

var Keyboard_Report	= Buffer.alloc(8);						// 定义HID的上报值
var Mouse_Report	= Buffer.alloc(4);						// 定义HID的上报值

const hid_to_b2 = {
	0XE0: 1,	// Left Control
	0XE1: 2,	// Left Shift
	0XE2: 4,	// Left Alt
	0XE3: 8,	// Left GUI
	0XE4: 16,	// Right Control
	0XE5: 32,	// Right Shift
	0XE6: 64,	// Right Alt
	0XE7: 128,	// Right GUI
}

function sleep(ms = 100) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

class HIDController {
	WriteHID(Port, Report) {
		fs.access(Port, fs.constants.F_OK | fs.constants.W_OK, (err) => {
			if (err) {
				console.log("HID设备不存在或无写入权限：", err);
				return;
			}
		fs.writeFile(Port, Report,  function(err) {			// 将转换过的HID键值上报 ，即格式化写入到/dev/hidg*
			if (err) {
				console.log("HID上报出现问题: ", err);		// 如果写入HID设备失败则输出原因
			}
			//console.log("HID Gadget Port ready: ", Port);
		});
	});
	}

	WriteKeyboard(key, state) {								// state 1 按下， 2 松开，3 失去焦点
		if (state == 3) {									// reset all keys
		  for (var i = 0; i < 8; i++) {
				Keyboard_Report[i] = 0;						// 如果state参数为3（失去焦点），将按键全部松开
			}
		} else {											// set key
			if (hid_to_b2[key] != undefined) {				// 如果hid_to_b2已经声明并定义了
				if (state == 1) {
					Keyboard_Report[0] |= hid_to_b2[key];	// 如果是特殊按键且为按下状态，将该特殊按键的值放到 HID上报的第一字节中
				} else if (state == 2) {
					Keyboard_Report[0] &= ~hid_to_b2[key];	// 如果是特殊按键且为松开状态，将该特殊按键的值放到 HID上报的第一字节中
				}
			} else {
				var i = 2
				if (state == 1) {							// 如果按住某键，那么后续按键值写到后续空间
					for (; i < 8; i++) {
						if (Keyboard_Report[i] == 0) {
							Keyboard_Report[i] = key;
							break;
						}
					}
				  if (i == 8) {
					  console.warn("warn: keyboard buffer full");
					  return;
					}
				}
				else if (state == 2) {						// 如果松开按键，把按键值清零
					for (; i < 8; i++) {
						if (Keyboard_Report[i] == key) {
							Keyboard_Report[i] = 0;
							break;
						}
					}
					if (i == 8) {
						console.warn("Warn: key not found in buffer");
						return;
					}
				}
			}
		}
		this.WriteHID(config.keyboard_port, Keyboard_Report);
	}

	WriteMouseButtons(key, state) {
        if (state == 2) {				// 如果鼠标按键按下。1失焦，2按下，3松开
            Mouse_Report[0] |= key;
        } else if (state == 3) {
            Mouse_Report[0] &= ~key;
        } else if (state == 1) {		// 如果鼠标按键失焦
            Mouse_Report[0] = 0;
        }
        this.WriteHID(config.mouse_port, Mouse_Report);
    }

    WriteMouseWheel(wheel) {			// 滚轮不移动，下拉负，上推正
		if (wheel > 0) {				// 滚轮上推
            Mouse_Report[3] = 1;
        } else if (wheel < 0) {			// 滚轮下拉
            Mouse_Report[3] = 255;
        } else {						// 滚轮归零
            Mouse_Report[3] = 0;
        }
		//console.log(Mouse_Report);
        this.WriteHID(config.mouse_port, Mouse_Report);
        if (wheel != 0) {				// 滚轮延迟100毫秒后松开
            setTimeout(function () {
                Mouse_Report[3] = 0;
                this.WriteHID(config.mouse_port, Mouse_Report);
            }.bind(this), 100);
        }
    }

    WriteMouseOffset(x, y) {			// 相对位置（先点击页面，然后按住 CTRL + ALT + 左键）
		if (x == 0) {					// X轴不移动，左负右正
			Mouse_Report[1] = 0;
		} else if (x > 0 && x < 128) {	// X轴往右移   1~127 (0x01~0x7F)
			Mouse_Report[1] = x;
		} else if (x > 128) {		
			Mouse_Report[1] = 127;
		} else if (x < 0 && x > -128) {	// X轴往左移 255~129 (0xFF~0x81)
			Mouse_Report[1] = x + 255;
		} else if (x < -128) {
			Mouse_Report[1] = 129;
		}
		if (y == 0) {					// Y轴不移动，上负下正
			Mouse_Report[2] = 0;
		} else if (y > 0 && y < 128) {	// Y轴往下移   1~127 (0x01~0x7F)
			Mouse_Report[2] = y;
		} else if (y > 128) {		
			Mouse_Report[2] = 127;
		} else if (y < 0 && y > -128) {	// Y轴往上移 255~129 (0xFF~0x81)
			Mouse_Report[2] = y + 255;
		} else if (y < -128) {
			Mouse_Report[2] = 129;
		}
		//console.log(Mouse_Report);
        this.WriteHID(config.mouse_port, Mouse_Report);
    }
}

module.exports.HIDController = HIDController;
