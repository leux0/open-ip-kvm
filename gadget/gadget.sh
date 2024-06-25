#!/bin/bash

#modprobe libcomposite											# 加入驱动
#mount -t configfs none /sys/kernel/config

# 定义USB产品的VID和PID
mkdir -p /sys/kernel/config/usb_gadget/g1						# 在usb_gadget 中创建我们设备的文件夹
cd /sys/kernel/config/usb_gadget/g1								# 当我们创建完这个文件夹之后，系统自动的在这个文件夹中创建usb相关的内容 ，这些内容需要由创建者自己填写。
echo "0x046d" > idVendor										# Linux Foundation
echo "0xc53f" > idProduct										# Multifunction Composite Gadget
echo "0x0100" > bcdDevice										# v1.0.0
echo "0x0200" > bcdUSB											# USB2

mkdir -p strings/0x409											# 实例化英语语言ID（0x409是USB language ID 美国英语）
echo "08659527822a9a3b" > strings/0x409/serialnumber			# 将序列号和制造商等信息字符串写入内核
echo "Logitech" > strings/0x409/manufacturer
echo "Logitech USB Receiver" > strings/0x409/product


# 创建 `Function` 功能实例，需要注意的是，一个功能如果有多个实例的话，扩展名必须用数字编号
# 创建HID鼠标设备功能的描述 /dev/hidg0
mkdir -p functions/hid.mouse
echo 0 > functions/hid.mouse/subclass							# 0 No subclass
echo 2 > functions/hid.mouse/protocol							# 2 Mouse
echo 4 > functions/hid.mouse/report_length						# 鼠标报告的长度
echo -ne \\x05\\x01\\x09\\x02\\xa1\\x01\\x09\\x01\\xa1\\x00\\x05\\x09\\x19\\x01\\x29\\x03\\x15\\x00\\x25\\x01\\x95\\x03\\x75\\x01\\x81\\x02\\x95\\x01\\x75\\x05\\x81\\x03\\x05\\x01\\x09\\x30\\x09\\x31\\x09\\x38\\x15\\x81\\x25\\x7f\\x75\\x08\\x95\\x03\\x81\\x06\\xc0\\xc0 > functions/hid.mouse/report_desc

# 创建HID键盘设备功能的描述 /dev/hidg1
mkdir -p  functions/hid.keyboard
echo 1 >  functions/hid.keyboard/subclass						# 1 Boot Interface Subclass
echo 1 >  functions/hid.keyboard/protocol						# 1 Keyboard
echo 8 >  functions/hid.keyboard/report_length					# 键盘报告的长度
echo -ne \\x05\\x01\\x09\\x06\\xa1\\x01\\x05\\x07\\x19\\xe0\\x29\\xe7\\x15\\x00\\x25\\x01\\x75\\x01\\x95\\x08\\x81\\x02\\x95\\x01\\x75\\x08\\x81\\x03\\x95\\x05\\x75\\x01\\x05\\x08\\x19\\x01\\x29\\x05\\x91\\x02\\x95\\x01\\x75\\x03\\x91\\x03\\x95\\x06\\x75\\x08\\x15\\x00\\x25\\x65\\x05\\x07\\x19\\x00\\x29\\x65\\x81\\x00\\xc0 > functions/hid.keyboard/report_desc


# 创建一个USB Configuration配置实例并定义配置描述符使用的字符串
mkdir -p configs/c.1/strings/0x409
echo 250 > configs/c.1/MaxPower									# 当设备采用总线供电时，设备可从主机提取的最大功率
#echo 0x80 > configs/c.1/bmAttributes							# 配置是否支持远程唤醒功能，以及设备是总线供电还是自供电
#echo "Config 1" > configs/c.1/strings/0x409/configuration
# bmAttributes：一个字节大小，BIT7：保留，必须为1。BIT6：1表示设备是自己供电，0表示是总线供电。BIT5：1表示支持远程唤醒。BIT4~BIT0：保留，必须为0
# bMaxPower：总线供电时的最大电流，单位以2mA为基准，例如0x32为50*2=100mA。USB设备可以从USB总线上获得最大的电流为500mA（所以最大值为250）

# 关联配置和功能的文件夹和启用设备
ln -s functions/hid.mouse configs/c.1							# 捆绑功能 Function 实例到配置 Configuration
ln -s functions/hid.keyboard configs/c.1						# 当我们执行完这段命令后，系统就自动的帮我们创建了hid设备

#echo otg > /sys/kernel/debug/usb/fe500000.dwc3/mode			# 配置USB3.0/2.0 OTG0的工作模式为Device(设备)
#sleep 3s
ls /sys/class/udc > UDC											# 将gadget驱动注册到UDC上，插上USB线到电脑上，电脑就会枚举USB设备

#chmod 777 /dev/hidg0
#chmod 777 /dev/hidg1
