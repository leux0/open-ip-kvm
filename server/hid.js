
// product_id = 0x2107
// vendor_id = 0x413D
// usage_page = 0xFF00

var HID = require("node-hid");
var util = require('util');
var events = require('events');
HID.setDriverType('hidraw');

const PRODUCT_ID = 0x2107;
const VENDOR_ID = 0x413D;
var USAGE_PAGE = 0xFF00;
const hid_to_b2 = {
    0XE0: 1,  // Left Control
    0XE1: 2,  // Left Shift
    0XE2: 4,  // Left Alt
    0XE3: 8,  // Left GUI
    0XE4: 16,  // Right Control
    0XE5: 32,  // Right Shift
    0XE6: 64,  // Right Alt
    0XE7: 128,  // Right GUI
}


function sleep(ms = 100) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// wrap all the HID functions in a class
// the constructor opens the device
// the destructor closes the device
// the other functions call WriteHID
class HIDController {
    constructor() {
        this.device = new HID.HID(VENDOR_ID, PRODUCT_ID);
        // var device = new HID.HID('/dev/hidraw2');
        console.log("Opened device: ", VENDOR_ID, PRODUCT_ID);
        this.WriteWS2812(20, 50, 30)
        this.keyboard_data = [0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this.mouse_data = [0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        this.mouse_x = 0;
        this.mouse_y = 0;
    }

    WriteHID(data) {
        // add 0x00 to the beginning of the data
        // console.debug("Write data: ", data);
        this.device.write([0x00].concat(data));
    }

    WriteWS2812(r, g, b) {
        var data = [0x05, 0x00, 0x00, 0x00, 0x00];
        data[2] = r;
        data[3] = g;
        data[4] = b;
        this.WriteHID(data);
    }

    WriteKeyboard(key, state) {
        if (state == 3) { // reset all keys
            for (var i = 1; i < 10; i++) {
                this.keyboard_data[i] = 0;
            }
        } else { // set key
            if (hid_to_b2[key] != undefined) {
                if (state == 1) {
                    this.keyboard_data[2] |= hid_to_b2[key];
                } else if (state == 2) {
                    this.keyboard_data[2] &= ~hid_to_b2[key];
                }
            } else {
                var i = 4
                if (state == 1) {
                    for (; i < 10; i++) {
                        if (this.keyboard_data[i] == 0) {
                            this.keyboard_data[i] = key;
                            break;
                        }
                    }
                    if (i == 10) {
                        console.warn("warn: keyboard buffer full");
                        return;
                    }
                }
                else if (state == 2) {
                    for (; i < 10; i++) {
                        if (this.keyboard_data[i] == key) {
                            this.keyboard_data[i] = 0;
                            break;
                        }
                    }
                    if (i == 10) {
                        console.warn("warn: key not found in buffer");
                        return;
                    }
                }

            }
        }
        this.WriteHID(this.keyboard_data);
    }


    WriteMousePos(x, y) {
        // x and y are 0~0x7FFF
        this.mouse_data[3] = x & 0xFF;
        this.mouse_data[4] = (x >> 8) & 0xFF;
        this.mouse_data[5] = y & 0xFF;
        this.mouse_data[6] = (y >> 8) & 0xFF;
        this.WriteHID(this.mouse_data);
        this.mouse_x = x;
        this.mouse_y = y;
    }

    WriteMouseOffset(dx, dy) {
        this.mouse_x += dx;
        this.mouse_y += dy;
        // limit mouse position to 0~0x7FFF
        if (this.mouse_x < 0) {
            this.mouse_x = 0;
        }
        if (this.mouse_x > 0x7FFF) {
            this.mouse_x = 0x7FFF;
        }
        if (this.mouse_y < 0) {
            this.mouse_y = 0;
        }
        if (this.mouse_y > 0x7FFF) {
            this.mouse_y = 0x7FFF;
        }
        this.WriteMousePos(this.mouse_x, this.mouse_y);
    }

    WriteMouseButtons(key, state) {
        if (state == 2) {
            this.mouse_data[2] |= key;
        } else if (state == 3) {
            this.mouse_data[2] &= ~key;
        } else if (state == 1) {
            this.mouse_data[2] = 0;
        }
        this.WriteHID(this.mouse_data);
    }

    WriteMouseWheel(wheel) {
        if (wheel > 0) {
            this.mouse_data[7] = 0x01;
        } else if (wheel < 0) {
            this.mouse_data[7] = 0xFF;
        } else {
            this.mouse_data[7] = 0x00;
        }
        this.WriteHID(this.mouse_data);
        if (wheel != 0) {
            setTimeout(function () {
                this.mouse_data[7] = 0x00;
                this.WriteHID(this.mouse_data);
            }.bind(this), 100);
        }
    }

}

module.exports.HIDController = HIDController;
// var hid = new HIDController();
// hid.WriteMouseWheel(1);
