梦开始的地方：[[2025-01-05]]

#### [[2025-01-06]]

https://www.youtube.com/watch?v=Xo8VhT1_VwM
https://www.youtube.com/watch?v=2Ry-ck0fhfw
t-deck

https://www.youtube.com/watch?v=1Gyg51ySmrI
https://www.youtube.com/watch?v=1gDLTuShVPY
https://www.youtube.com/watch?v=_joKagNha1A
https://www.youtube.com/watch?v=nM7vVtxGVpc
https://www.youtube.com/watch?v=Y7V54jMnmOg
t-echo

https://www.youtube.com/watch?v=EMPFFG3Gdu8
3个设备，电池连接线路方式，透明外壳，techo美化与拆解和加电池

lilygo t-echo与t-deck

t-echo辅助外壳
https://www.printables.com/model/676803-lilygo-t-echo-bracket-case
https://www.printables.com/model/874116-lilygo-t-echo-backplate-bracket
https://www.printables.com/model/929033-lilygo-t-echo-bracket-with-14-tripod-mount




注意到包含bme280的techo会在正面打两个孔

https://www.youtube.com/watch?v=Y7V54jMnmOg&t=186s
techo送测，包含拆解，bme280运行观看，界面观看，以及thingsverse上可容纳扩大电池的打印后盖壳子

https://www.youtube.com/watch?v=mhN_YwUloM0&pp=ygUGdC1lY2hv
刷meshtastic固件

https://www.youtube.com/watch?v=6yr7QQw5JGM
拆解t-echo

现在我比较混乱的：
1. 我应该买什么料，比如 lora module，选 ebyte 的话应该买哪个型号、选 heltec 要哪个型号
2. 对应型号要烧哪个固件

所以我那个https://www.mess.host/setup 就是尝试解决这些问题的。


认为techo又丑又贵，考虑自己组装，考虑nrf52开发版方案，参照小红书教程
https://makerworld.com/zh/models/416199#profileId-318468
外壳3d打印


https://www.printables.com/model/982046-h2t-case-for-heltec-t114-with-gps-running-meshtast
t114外壳，可以考虑透明打印，或者碳纤维。

认为nrf52适合把玩小设备，而esp32驱动的东西应该是独立的，例如t-deck，可以脱离手机使用。

分享一下T114待机测试情况，1500mah电池，运行模式是client角色+power saving+智能定位,可接收GPS信号，显示屏在开机五分钟左右不显示；设备蓝牙可随时接入，即可以具有发送和接收能力。28个小时。全程未进行消息收发，设备状态灯正常闪动，手机APP调试面板可显示debug信息，可正常输出telemetry遥测信息和position位置信息。电池电压初电压4080mV

https://meshcn.net/heltec-t114-portable-meshtastic-node/
t114方案
https://ameow.xyz/archives/meshtastic-heltec-t114
包含组装过程

https://meshcn.net/bluetooth-ota-nrf52-meshtastic-tutorial/
蓝牙升级

https://meshcn.net/meshtastic-atak-tutorial/
https://github.com/meshtastic/ATAK-Plugin/releases
atak插件

【这段日子里，电话服务商，你们做得很好。 | It’s Been a Good Run, Phone Providers.-哔哩哔哩】 https://b23.tv/Rh3VIj0
esp32版的详细制作，以及meshtastic固件使用方法，以及手机meshtastic应用界面与使用，以及web客户端使用

【电话服务供应商, 你们的好日子到头了（第三部分） | It’s Been a Good Run, Phone Providers (Part 3)-哔哩哔哩】 https://b23.tv/dAGQogy
t114版本的，和esp32的一样详细，包含特殊的刷机方法

[https://flasher.meshtastic.org](https://flasher.meshtastic.org/)
web写入固件

尼龙后挡板和树脂正面，可以嘉立创打印

突然发现nrf52方案一套下来和techo也差不多了，但是我整lora是为了折腾，直接买成品没意思，而且techo非常的丑。

注意到尼龙打印出来表面有粗糙的效果，这是我想要的。

可以白嫖嘉立创高性能打印券，但是后盖有薄壁风险，不能用券，所以前盖和按钮用尼龙打印并用券，后盖单独付钱，也还行。

突然发现，前盖和按钮好像也有不符合白嫖的地方，妈的，只有等审核结果。实在不行画个100元左右打印也可以接受。

结果出来了，确实不通过。既然这样，那也没必要白嫖嘉立创的，考虑找微信里那个3d打印商家打印，可以问一下她尼龙有哪些颜色可选。

但是话说回来，还是嘉立创打印的放心。并且微信商家那里尼龙打印只能黑白两色，无灰黑色。

看了下群友发的图片，认为正面尼龙看起来一般，因为正面细节比较多。还是考虑正面树脂，背面和按钮尼龙，都是灰黑色（不过可能因材料不同略有差异），这个在ytb上有图片案例（见qq群-我们），看起来不错。以及需要找一下好看的螺丝。考虑内六角螺栓，或者黑色的螺丝帽较小的十字螺丝。

https://meshcn.net/common-tools/

https://t.me/+hmKN0xOR73ExOTU6

T114 太阳能后盖，兼容 Muzi Works 的外壳。直接更换原本的电池外壳就行。
链接：
https://www.printables.com/model/1006257-h2t-solar-mod-case-of-heltec-t114-with-solar-panel

map.mess.host

外壳参见[[2025-01-17]] [[2025-01-16]]


#### [[2025-01-21]]
除了螺丝都到了，按照教程拼装，本来都很顺利，知道发现电池接口不对，根据群主建议，结合自己理解，把接头拔下来，然后用买开发板送的转接线单独连接，为了防止中途短路，用另一块电池上的脚步分别包裹连接处，成功装入壳子。更换了mqtt服务器为国内，很快接收到了回复。认为尼龙打印后盖不太好，一方面连接处看着有点违和，另一方面据说尼龙粉尘有害。考虑以后都用树脂打印。

此外，天线松松垮垮的，考虑换个好天线。

再此外，需要了解一下导线如何安全牢固连接。

再再此外，需要给屏幕弄个保护。

考虑正面背面都拿半透明材料打印试试。

长按长条按钮（用户编程按钮）9秒可以关机

#reg 设置了屏幕120秒熄灭，以及display mode为inverted，即顶栏一条反色，同时开启heading bold，顶栏加粗。

#reg 尝试安装螺丝，但发现孔位大了，不能卡住。临时拿卫生纸把螺丝包住塞进去，考虑以后重新打印壳子（例如透明），然后看能不能正常旋入。

注意到连按3下可以切换gps开启状态

更改时区为CST-8，结合开启的gps，使得时间显示正常。

【帮 Heltec V3 Meshtastic加上一堆功能】 https://www.bilibili.com/video/BV1wd4keSEJH/?share_source=copy_web&vd_source=278a61d55ec01fcfa1504d3f39f06bbe

把t114名称改为neko

[Introducing the T-Deck Plus](https://www.youtube.com/watch?v=qshLuCqOn3I)

考虑下次拆开壳子时，在显示屏前面放一块膜，保护屏幕，尺寸要大一点，方便卡住。

https://richonguzman.github.io/lora-tracker-web-flasher/installer.html
LoRa APRS Tracker - Web Flasher

APRS.fi
aprs map

正面透明，背面白色说不定也挺好看的，我觉得现在的尼龙也还可以，不过印象中尼龙有浅色的，下次可以试试。在此之前，先把电池解决了再说。

[[2025-02-12]]
嘉立创打印的透明外壳到了，精度非常糟糕，完全不能用。注意到重启后已搜索到的节点不会丢失。考虑有机会把背板用树脂打印，或者整个新的模型。此外还考虑重新买一批螺丝，因为现在的不匹配。

[[2025-03-01]]
GT-7702-1 470 MHz SMA 公头 
下单了天线

参见[[2025-03-03]]

参见[[2025-03-05]]

#### [[2025-03-07]]
更新了2.6版本，之前发现的节点全没了。后来连上了mqtt服务器（需要先导入备份的设置，然后在频道设置里点允许上传下载），还是熟悉的人在聊天。但是一部分显示不出昵称，显示的是设备自带名称，也许需要嗅探一会儿节点才可以。

public key
wpoWw1Lt4eBRmWB5kGorVMb6muRYSVko6BK35NCKjDs=

private key
aIoqKwuYKddJRFcaVmiuFaBm3hTsVT/mv2WoS+yr6FA=

参见[[2025-03-09]]，关于键盘

参见[[2025-03-10]]，换了黑色胶带

参见[[2025-03-23]]，把长天线换回去了

#### [[2025-07-09]]

把meshtastic安卓客户端新节点通知关了，这个东西老烦人了。此外，现在客户端挺好看的，动画不错，设计美观，符合material design，而且安卓端也有回复功能了，之前错误渲染的一些东西也正常了。

#### [[2025-09-06|2025-09-06]]

https://meshcn.net/meshtastic-cjk-display-breakthrough/
再见乱码，欢迎汉字：Meshtastic 的 CJK 中文字符适配来了
> 这次由上海-农药完成的适配，覆盖范围极广，几乎囊括了目前中文社区用户最常用的设备。包括 Heltec V3、Heltec T114、Heltec Pocket 系列

在 GitHub 的 [csrutil/Meshtastic CJK Releases 的 Releases 页面](https://github.com/csrutil/meshtastic-releases)，用户可以直接下载相应的固件。每个固件又分为 简体中文（-sc） 与 繁体中文（-tc） 版本，以满足不同用户的语言习惯，比如中国大陆、新加坡使用简体中文，台湾、香港、澳门使用繁体中文。

https://meshcn.net/meshtastic-2-7-preview/
Meshtastic 2.7 预览版登场：BaseUI 全新界面上线！支持更多输入方式，TFT 统一大升级！

这个base ui也是支持t114的

貌似第一个中文版是单独的分支，不会和官方一起更新。

#### [[2025-09-06]]

开学后考虑做的
- [3D打印](https://make.sjtu.edu.cn/thdprint/upload),学校pla 3d打印 白色 80%填充率 打印正面壳子试试，可以的话背面也打白色的
- 之前的电池排线，再剪短一点，能弄点热缩管也不错
- 更新系统
	- 中文分支系统
	- 官方base ui系统


如果有闲钱，以及这个t114实在是玩腻了，可以考虑购买一个gat562，这个可以说是stand alone的节点，不错，甚至可以在校内和t114组网

#### [[2025-09-07]]

https://meshcn.net/diy-node-without-soldering/
零焊接也能玩 Meshtastic：用闲置的 ESP32/nRF52 开发板搭建 LoRa 节点
正好我有个esp32s3，可以利用起来

#### [[2025-09-09]]

《破解 🔌 充电假象！Meshtastic 电池电压校准全指南》

https://meshcn.net/meshtastic-ADC-Multiplier-Override/
考虑给t114节点电池校准一下

#### [[2025-09-13]]

提交了白色pla打印订单，希望明天能拿到

设置了adv系数为4.916，感觉不错

更新了2.7.7.5固件，感觉不错

我测，现在可以在节点上设置一些东西，通过长按按钮。例如，现在设置了屏幕颜色为红色，不错。

后面又换成了紫色，感觉也很好看

#### [[2025-09-14]]

打印的外壳取到了，pla不错，白色更是不错。第一次剪短线，发现壳子会拱起来合不上，再次剪短线，现在可以合上了，效果和之前的差不多。注意到螺丝确实短了，无法伸到下面去，考虑买长一点的螺丝。

感觉白色外壳质感确实很好，而且配上紫色显示很有味道。设置成粉色也很有感觉。

测量了back case的孔深度，有8mm，这样m3x20比较合适，稍微短一点也行

更新了adv系数后，现在掉电正常，充电正常，而且充到4.12v左右电量96%，然后拔掉充电头，不会立即掉电压，开gps过了4h左右，还有91%的电，不错

此外，这个白色外壳是真的好看，很有质感

#### [[2025-09-16]]

新买的螺丝到了，是m3x16的，太长了，差点把瑞士军刀整滑牙了，最后还是有一截露在外面，还是算了，不要螺丝也罢。不过螺丝确实能起到紧密连接前后盖的作用，缝隙小了很多。

#### [[2025-12-03]]

尝试在nova 8 pro上安装meshtastic，居然成功了，而且配对之后会自动导入已有频道、节点、设备配置信息，看来这些是存储在节点本地的。这样就可以把t114节点放在宿舍内，n8p常开，不错。

本来想配置短信转发器转发消息的，但是meshtastic会有一条常驻的状态显示通知，而且会变化，那就算了，等一天回来后再看收到了什么吧。

[[2025-12-05]]
firmware-heltec-mesh-node-t114-2.7.15.567b8ea.uf2
更新了这一版稳定固件，之前好像是2.7.7不稳定版的样子

现在知道规则要怎么配置了
```
并且 是 APP包名 包含 mesh
 并且 不是 通知标题 包含 已连接
 并且 不是 通知标题 包含 新设备
```
关键点
- 同一层级规则，需要换行，换行后首行要加空格
- 通知标题，通知内容，是不同的值

复盘
- 之前没有换行，于是匹配是一条语句
- [文档预览 - Gitee.com](https://gitee.com/pp/SmsForwarder/wikis/pages?sort_id=5327356&doc_id=1821427) 参见这个文档

16点00分 很好，真实测试发现这条规则可以过滤掉常驻的状态信息栏，同时新消息可以正常推送。

19点51分
- 新节点的通知，“新节点“不在标题，而在内容中
- 感觉需要找一个关闭推送的方法，有时候频道消息频率比较高

妈的，他们怎么在8点台网点名了，好像这个是每周五的习俗，但是我开了消息转发，妈的。

本来在下院上自习，赶快跑回去拿设备，把控制权从n8p交给14u。此外，即使退出了mechtastic应用，如果蓝牙还是连接在旧设备上，那么控制权不会被移交，需要手动蓝牙断连才行。

```
并且 是 APP包名 包含 mesh
 并且 不是 通知标题 包含 已连接
 并且 不是 通知标题 包含 正在连接
 并且 不是 通知内容 包含 新节点
 并且 不是 通知标题 包含 新节点
```
这是更新后的规则

妈的，要改成新节点!

[[2025-12-06]] 改了改上面的规则

此外，之前t114节点上的功能按键老是凹陷下去，于是在下面垫了一点A4纸，现在这个按键手感不错，是凸出来的，反而还要当心误触。

基于此，可以下单一点螺丝，反正不贵，之前的尺寸老是有问题，奇怪。

妈的，电池连线又断掉了，于是只能再截短一点。

[[2025-12-09]]
买的螺丝到了，还是松松垮垮的，无法起到固定作用，那就算了吧。