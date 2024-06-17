# 关于项目

本项目最初为 [Nihiue/open-ip-kvm](https://github.com/Nihiue/open-ip-kvm) 创建，由 [ElluIFX/open-ip-kvm](https://github.com/ElluIFX/open-ip-kvm) 添加HID支持。

删除了所有 arduino串口代码 和 Node-HID 因此它与原始 arduino硬件 不兼容。

本项目为在RK3588 OPENWRT上运行为目的，因为在OPENWRT MUSL上安装Node-HID需要编译安装，会缺少依赖导致安装失败所以去除了它。

通过RK3588的HDMI IN来采集HIDMI输入，通过USB OTG Gadget来实现键盘鼠标输入。


## 项目功能

[原项目演示视频](https://www.bilibili.com/video/BV1c841177hF/)

* Web浏览器作为客户端
* 1080P 30fps 视频流
* 支持鼠标和键盘
* UI显示
* 远程粘贴：仅限 ASCII 字符

![screenshot](https://user-images.githubusercontent.com/5763301/198885015-f1cd83d7-6717-410c-8837-68b347f4b29c.png)

![diagram](https://user-images.githubusercontent.com/5763301/198833599-87af1bec-92c7-4c87-80cf-8658b842cff5.jpg)


## 部署和运行

### 1. 配置文件

* 编辑 `open-ip-kvm/server/config.json`
  * `keyboard_port`: Gadget模拟的HID键盘设备节点路径
  * `mouse_port`: Gadget模拟的HID鼠标设备节点路径
  * `listen_port`: WEB界面端口
  * `video.device`: HDMI采集设备节点的路径
  * `video.res/fps`: 取决于您的采集设备
  * `video.stream_port`: 推流的端口
  * `video.backend`: 视频推流的后端程序, `mjpg-streamer` 或 `ustreamer`


### 2. 模拟键鼠

* 1. 修改内核源码，通过加载内核模块来使用Gadget模拟HID键鼠
  * 根据 `gadget/hid.patch` 修改 `linux/drivers/usb/gadget/legacy/hid.c` 来添加键鼠
  * 然后在编译内核
  * 最后将生成的 `linux/drivers/usb/gadget/legacy/g_hid.ko` 拷贝到RK3588上加载

* 2. 也可以自行使用脚本通过 `configfs` 来使用Gadget模拟HID键鼠
  * 参考本项目提供的HID键鼠描述符和上报格式修改，如无意外可见 `/dev/hidg*` 设备节点
  * 一定要用本项目提供的HID键鼠描述符，否则需要自行修改 `server/hid.js` 来适配

* 3. HID键盘鼠标描述符和上报格式参考教程
  * [HID键盘的学习](https://leux.cc/doc/HID%E9%94%AE%E7%9B%98%E7%9A%84%E5%AD%A6%E4%B9%A0.html)
  * [HID鼠标的学习](https://leux.cc/doc/HID%E9%BC%A0%E6%A0%87%E7%9A%84%E5%AD%A6%E4%B9%A0.html)


### 3. 运行项目

1. 在OPENWRT上安装NODE：`opkg update && opkg install node-npm`
2. 将目标设备的 HDMI输出口 连接到RK3588的 HDMI-IN接口
3. 通过USB将目标设备与RK3588的USB OTG口相连
4. 然后 `加载添加了键鼠的 g_hid.ko` 或 `脚本` 来使用Gadget模拟HID键鼠（/dev/hidg*）
5. 首次运行需要先安装依赖 `cd open-ip-kvm && npm install`
6. 再运行 `cd open-ip-kvm && npm run start` 来运行项目
7. 现在可在PC上WEB浏览器中打开RK3588的地址来访问，例如：http://[IP of RK3588]:8000


### 4. 注意事项

1. 需要使用支持RK3588的NV24编码的 [ustreamer](https://github.com/Vincent056/ustreamer/tree/rk3588-b) ，pikvm官方的不支持
2. 上面的ustreamer编译后添加到 `$PATH` 即可，该程序运行需要root权限
3. 由于本项目目标是在OPENWRT上运行，所以去除了sudo命令。其他系统上可能需要在root用户下运行
4. 本人完全不会JS，只是在网络上边搜边学，所以可能有大量问题需要各位修复


### 5. 如何控制

* 鼠标
  * 先单击 `网页任意位置` 来进入鼠标捕获模式
  * 再按下`Ctrl + Alt`并点击`网页任意位置`来使用鼠标
* 键盘
  * 按下 `Enter` 进入按键捕获模式
  * 按下 `Shift + ESC` 退出按键捕获模式


## 特别鸣谢

[Pi-KVM](https://pikvm.org/)

[ustreamer](https://github.com/Vincent056/ustreamer/tree/rk3588-b)

[mjpg_streamer](https://github.com/jacksonliam/mjpg-streamer)

