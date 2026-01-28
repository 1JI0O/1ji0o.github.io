[[2025-12-12]]

RISE-2: https://arxiv.org/pdf/2503.03081 第3.2节和4.1节

https://github.com/rise-policy/RISE-2/

参见[[AirExo-2_ Scaling up Generalizable Robotic Imitation Learning with Low-Cost Exoskeletons]]

接下来需要做的
- 学学这个rise2
- 学习代码
	- 主要是适配数据，有2个方向
		- 把已经采集的数据修改目录格式，改成rise2所需要的
		- 自己实现一个dataset，能适配rise格式数据和rise2的对接，把数据读进去
	- 尝试用已有的数据训练rise2，整一个模型，然后用这个模型跑一下
	- 如果做完了，还有更有挑战性的
		- 之前发的ACT和DIFFUSION
		- 能不能写适配他们模型和我们数据的dataset
		- 还是改一版policy，把rise2的policy换成这两个的，还能正常运行
		- 不过这个是后面的事情，可以等rise2适配尝试完成后再问问具体要求

16点16分 差不多把[[AirExo-2_ Scaling up Generalizable Robotic Imitation Learning with Low-Cost Exoskeletons]]里面RISE2对应章节看完了

[RISE1的数据格式](https://github.com/rise-policy/RISE?tab=readme-ov-file#%EF%B8%8F-data-collection)

[RISE-2/assets/docs/DATA.md at main · rise-policy/RISE-2](https://github.com/rise-policy/RISE-2/blob/main/assets/docs/DATA.md)
看了看这个数据格式，貌似和[[RISE复现]]主要的不同
- calib下面的东西合并成了一个npy
- train下面多了个lowdim/，这个在rise1里面对应tcp和gripper_command 
	- robot tcp pose, gripper information and gripper action
- meta.json是个合并的文件，疑似是对应RISE1的metadata.json和timestamp.txt   
	- 不过RISE1里面timestamp.txt本来就没什么用，貌似

所以其实还好

rise2里面一些限位措施是通过config传入的，但是rise2里面是通过读取一个constant.py

考虑
- 先读懂rise2的dataset是怎么写的
- 想想哪些地方需要修改适配

[[2026-01-14]]

已经fork了一份，有待修改

[1JI0O/RISE-2 at dev-dataset](https://github.com/1JI0O/RISE-2/tree/dev-dataset)

[1JI0O (Qin Haoxiang)](https://github.com/1JI0O)

修改了名称

[rise-policy/RISE-2 | DeepWiki](https://deepwiki.com/rise-policy/RISE-2)
很好，现在gemini可以阅读这个东西了，换言之，代码可以让gemini来写，或者它可以起到很好的辅助作用，而不用非得用copilot

[rise-policy/RISE | DeepWiki](https://deepwiki.com/rise-policy/RISE)

rise1居然有人传过，很神奇

[Zihao He | 何子浩](https://alan-heoooh.github.io/)
09点16分 这个人的东西还在训练，恐怖如斯

```
def decode_gripper_width(gripper_width):
    return gripper_width / 1000. * 0.095
```

rise1的realworld里面有这么个东西，因为它的动作处理逻辑是写在realworld里面的，但是rise2的结构就更好一些，它定义了一个data_utils辅助类，里面有个load_action函数来专门干这件事情。

rise1里面的数据应该只能是单臂的

```
1. **裁剪范围不同**：RISE-2 的 Z 轴范围是 [0.90m, 1.55m]，而 RISE-1 是 [0m, 1m]。如果你用 RISE-2 的参数去裁 RISE-1 的数据，**点云会被切得干干净净，全是空的**（因为 RISE-1 的数据在 0.9m 以下）。
    
2. **归一化不同**：神经网络喜欢吃 [-1, 1] 的数据。如果归一化参数不对，动作输出就会偏离真实位置。
```

感觉ai完全是在口胡，也有可能是因为gemini被降智了，反正挺糟糕的

- **物理世界参数 (裁剪范围、归一化范围)**：听 RISE-1 的（这是你的身体）。
所以，我们在 data_utils.py 里定义的 class RISE1Params **必须完全照搬 RISE-1 论文/代码中的数值**。不要犹豫，就用我在上一步代码里写的那些参数。

就是数据的初步处理还是按照rise1的处理来

```
(base) haoxiang@aiadm-desktop:/data/haoxiang/realdata_sampled_20251206/train/task_0014_user_0020_scene_0001_cfg_0001$ ls
cam_043322070878  cam_104122063550  metadata.json  pedal_command  robot_command  timestamp.txt

```
那两个command，完全没有用到

12点16分 唉，给gemini干出限制了，妈的

尝试了一上午修改dataset
- 认为在原有逻辑上修补，比较困难，毕竟原来的主要是适配双臂，同时修改过程中还要从rise1的格式里面挑选出我要的数据
- 感觉不如整个dataset直接重写

- (single-arm) `camera_to_robot`: the transformation matrix from the camera coordinate to the robot base coordinate;
这个转换矩阵存在吗？


| 参数名                       | 对应文件 / 数据源            | 备注                                                 |
| ------------------------- | --------------------- | -------------------------------------------------- |
| **camera_serials**        | extrinsics.npy 的 Keys | 全部相机的 ID 列表                                        |
| **intrinsics**            | intrinsics.npy        | 每一个 ID 对应的 <br><br>```<br>3×33×3<br>```<br><br> 矩阵 |
| **camera_to_robot**       | extrinsics.npy        | 每一个 ID 对应的 <br><br>```<br>4×44×4<br>```<br><br> 矩阵 |
| **camera_serial_inhand**  | 需检查 devices.npy       | 找出在手上的那个 ID                                        |
| **camera_serials_global** | 需检查 devices.npy       | 剩下的固定相机 ID 列表                                      |

尝试下载样例数据，发现里面没有标定数据，唉

# 存在的一些问题

## 问题1 貌似inv了两次

通过对比你提供的 `projectors.py` 代码和你之前的转换脚本，我发现你的处理逻辑在**数据结构**上大部分是正确的，但在**具体的 Key（键名）** 和 **矩阵求逆逻辑**上存在几个关键的潜在问题。

以下是详细的核对建议：

### 1. 矩阵求逆的逻辑核对（最重要）
在 `SingleArmProjector` 的 `__init__` 函数的最后
```python
self.projector = ProjectorBase(np.linalg.inv(self.calib_file["camera_to_robot"][global_cam_serial]))
```
而在 `ProjectorBase` 的 `project_tcp_to_camera_coord`中
```python
def project_tcp_to_camera_coord(self, tcp, ...):
    tcp = mat_to_xyz_rot(
        np.linalg.inv(self.camera_pose) @ xyz_rot_to_mat(tcp, ...), 
        ...
    )
```
**这里存在一个“双重求逆”的逻辑：**
1.  你在初始化 `ProjectorBase` 时，传入的是 `inv(camera_to_robot)`。
2.  在执行转换时，`ProjectorBase` 又对传入的矩阵做了一次 `inv`。
3.  结果：`inv(inv(camera_to_robot))` = `camera_to_robot`。

**结论：**
*   如果你的 `camera_to_robot` 矩阵定义是 **相机坐标系 -> 机器人基座坐标系 ($T_{cam}^{base}$)**。
*   那么 `project_tcp_to_camera_coord` 的最终结果是 `camera_to_robot @ tcp_in_base`。
*   **数学上这是错的**。要从基座转到相机，应该是 $T_{base}^{cam} \cdot P_{base}$，即 `inv(camera_to_robot) @ tcp_in_base`。

**建议：**
检查你的标定矩阵到底是从哪转到哪。如果 `camera_to_robot` 是标定板算出的“相机在机器人坐标系下的位姿”，那么在 `ProjectorBase` 初始化时，**不要**加 `np.linalg.inv`。

## 问题2

那个metadata.json是一样的吗？

```
with open(os.path.join(demo_path, "meta.json"), "r") as f:
    meta = json.load(f)
calib_timestamp = meta["calib_timestamp"] # 这一步！
```

所以meta.json里面只需要包含时间戳就可以了，rise1里面的metadata
```
{"finish_time": 1765000049122, "rating": 1}
# scene 0001
{"finish_time": 1765000103169, "rating": 1}
# scene 0002
```

嗯，看来不是标定时间，而是确实是finish time

不对，它要的是标定时间戳，不是完成时间

```
        # get calib_timestamp
        with open(os.path.join(demo_path, "meta.json"), "r") as f:
            meta = json.load(f)
        calib_timestamp = meta["calib_timestamp"]
        calib_path = os.path.join(calib_path, "{}.npy".format(calib_timestamp))
```

看来是需要读取timestamp.txt
```
1765003071096
# 来自 scene 0002
1765003071096
# 0001
# 看来标定时间确实是一样的，这个确实是标定时间
```

```
if self.robot_type == "single": action[0: 7] = projector.project_tcp_to_camera_coord(action[0: 7], ...)
```
如果是single，会很野蛮，不像是dual那样还有左右手臂的下标区分

很好，你理解了一部分，现在请你阅读dataset中对npy的阅读，你会发现single和dual的读取是有很大区别的，换言之，single的存储格式和dual有所不同，请你找出这种不同

1. **为什么 robot_left 是 33 维？**  
    通过你提供的样例看出，RISE2 记录了极其详细的状态（包含关节角、速度、末端力矩等），虽然训练只用前 7 维，但格式必须对齐。
2. **load_action 的行为**：  
    在 Dataset 中，self.robot_type 会告诉 load_action 去取 robot_left 还是两个都取。如果你的数据是单臂，load_action 会从这个字典里抽取出 `robot_left[:7]` 和 `gripper_left[0]` 拼成一个长度为 8 的向量传给 getitem。
3. **下标一致性**：  
    你在合成时，务必保证 robot_left 的前 3 位是位置，后 4 位是四元数。这直接关系到 RealWorldDataset 第 182 行 project_tcp_to_camera_coord 坐标变换是否正确。


```
for cam_id in cam_ids: # 遍历每一个相机（比如 global 和 inhand）
    # ...
    # 获取该相机下的所有 obs_frame_ids（即该相机文件夹下的所有图片时间戳）
    obs_frame_ids_list = frame_ids[:-1] 
    
    # 重点：它把相机 ID 和 对应的时间戳 一对一地压入了大列表
    self.data_paths += [demo_path] * len(obs_frame_ids_list)
    self.cam_ids += [cam_id] * len(obs_frame_ids_list)
    self.obs_frame_ids += obs_frame_ids_list
```

所以
- 不同相机的时间戳不一样，无所谓
- 但是相机的每个时间戳必须对应一个low_dim
- 所以需要把rise1里面每个相机的tcp和gripper都合成一个npy，相当于是两倍

[RISE-2/convert_rise1_data.py at dev-dataset · 1JI0O/RISE-2](https://github.com/1JI0O/RISE-2/blob/dev-dataset/convert_rise1_data.py)

学长，我尝试写了个程序来转换之前rise1采集的数据，合成rise2的格式。我尝试转换了3组看看，感觉格式上没什么问题，现在已经在全量转换了

我之前本来想直接修改dataset实现的，但是可能太久没碰这些，遗忘了很多，以及让ai看到所有东西有点困难，所以写了一上午感觉有点红温了，仔细想了想，好像都是错的。所以我下午写了个转换数据的程序，对rise2的代码和数据更加熟悉了一些，我感觉在此基础上再去修改dataset实现会好一些

[[2026-01-16]]

看了看，发现抓玩具的teleop只有主相机的图片目录，没有inhand的目录，也许tcp也只采取主相机的

10点01分 唉，训练又遇到了问题，妈的tcp文件居然和图片的时间戳有出入，简直是见鬼了

10点47分
```

Start training from epoch 0 (step 0), max epoch 843 (step 80000).

Epoch 0
  8%|████████████████▎                                                                                                                                                                                | 8/95 [00:35<02:19,  1.61s/it
```

太好了！！

```
+-----------------------------------------------------------------------------------------+
| Processes:                                                                              |
|  GPU   GI   CI        PID   Type   Process name                              GPU Memory |
|        ID   ID                                                               Usage      |
|=========================================================================================|
|    0   N/A  N/A   3621881      C   ...ihao/anaconda3/envs/rise/bin/python       2934MiB |
|    1   N/A  N/A   3643931      C   ...ihao/anaconda3/envs/rise/bin/python       2932MiB |
|    1   N/A  N/A   3646016      C   ...ihao/anaconda3/envs/rise/bin/python       2932MiB |
|    2   N/A  N/A   1167750      C   ...ang/miniforge3/envs/rise/bin/python      25076MiB |
|    2   N/A  N/A   2678103      C   ...ihao/anaconda3/envs/rise/bin/python       3020MiB |
|    2   N/A  N/A   2684127      C   ...ihao/anaconda3/envs/rise/bin/python       3016MiB |
|    2   N/A  N/A   2691773      C   ...ihao/anaconda3/envs/rise/bin/python       3016MiB |
|    3   N/A  N/A   1167751      C   ...ang/miniforge3/envs/rise/bin/python      25044MiB |
+-----------------------------------------------------------------------------------------+

```

有点意思，之前训练一个epoch要将近6min，现在突然变成3min左右了，很好
[[2026-01-16]] 19点56分

20点14分 唉，但是现在又回到以前的速度了

[[2026-01-17]] 00点04分
- 貌似是有个人在2号卡上又起了个什么东西
- 于是cuda out of memory
- 发现1，3卡还可以用，于是改参数，从12500恢复

11点08分 不知道为什么，现在一个epoch基本上是2min10多s一个了，持续了好几组，基本上都是1.4s/iter的样子

13点06分 越来越离谱了，现在1min30s左右就可以跑完一个epoch了，原来是服务器上只有我一个人的进程在跑了。于是就是1s/it



```
python eval.py --type local --ckpt logs/collect_toys/policy_last.ckpt --calib calib/1738122909049.npy --config configs/dual_teleop_dino.yaml

/data/haoxiang/logs/rise2_2601/policy_last.ckpt

/data/haoxiang/realdata_rise2_ready/calib/1765003071096.npy

/home/haoxiang/RISE2_modified/configs/single_rise1.yaml


```

18点10分

感觉应该是标定有问题

23点59分

明天可以先读一下代码，datset，train和eval，读懂逻辑，然后深入函数的细节。貌似原来rise2真的是基于相机系读数据和训练和测试的，但是我目前的标定是把相机转到base，如果修改npy让它也是斜着看的，那么工作区域就需要基于斜着的来修改，不好。gemini的建议是把原来代码的奇怪的映射全部改成基于base系的，我感觉很合理，但是我不确定原来的代码是否有某种深意，或者某些我没看明白，gemini也不明白的转换在里面，那么建议还是读一遍，理解逻辑，然后再修改，然后跑可视化，然后问学长能不能用这种大改的方式。

>原生 RISE2 之所以能跑，是因为他们的相机通常是 **垂直向下** 安装的。在那种特殊情况下，相机系和基座系高度重合，掩盖了这些深层矛盾。

这个可以去论文里面确定一下

你他妈的，还真是，看了看Figure 8: Hardware Design of AirExo-2，global相机在最上面，垂直照射最下面。但是参见[[2026-01-17]]的手机相册收藏，rise1硬件的相机是斜着的

[[2026-01-18]]

学长，我发现rise1那套设备的摄像头是俯视倾斜照射工作台的，但是论文里面rise2的摄像头是垂直向下照射工作台的，而rise2原本的逻辑是在相机系下工作的，所以rise1数据画出来的点云是倾斜的，原来框出来的工作区域也不能直接用

我感觉可以换成在base系下工作，但是这样dataset和eval都要改，原来的projector也不太能用，虽然改得不多，但是这样貌似和rise2原本相机系下工作的想法差别有点大

还有就是rise2代码里面好像要求四元数的顺序是xyzw，但是rise1采集的数据顺序是wxyz，转换比较容易，但是我感觉有点诡异

学长，我又看了看，我还有一个不理解的点是 projector.py 中 ProjectorBase 类的 project_tcp_to_camera_coord 函数中，执行了 np.linalg.inv(self.camera_pose)，但是 SingleArmProjector 在构造时，`self.projector = ProjectorBase(np.linalg.inv(self.calib_file["camera_to_robot"][global_cam_serial]))`
相当于是对 camera_pose 求逆两次，这个变换我不是很理解

关于 normalization

你可以调一下，然后就可以看vis的外面那个框
应该一个颜色是workspace 另一个颜色是normalization
一般normalization每边比workspace多0.2
就是norm的框会比workspace大一圈

哦哦 倾斜是因为开了augmentation

```
(rise2) haoxiang@aiadm-desktop:/data/haoxiang/logs/rise2_2601$ ls
policy_last.ckpt                 policy_step_17500_seed_233.ckpt  policy_step_2500_seed_233.ckpt   policy_step_35000_seed_233.ckpt  policy_step_45000_seed_233.ckpt  policy_step_52500_seed_233.ckpt  train_seed_233.png
policy_step_10000_seed_233.ckpt  policy_step_20000_seed_233.ckpt  policy_step_27500_seed_233.ckpt  policy_step_37500_seed_233.ckpt  policy_step_47500_seed_233.ckpt  policy_step_55000_seed_233.ckpt
policy_step_12500_seed_233.ckpt  policy_step_22500_seed_233.ckpt  policy_step_30000_seed_233.ckpt  policy_step_40000_seed_233.ckpt  policy_step_50000_seed_233.ckpt  policy_step_57500_seed_233.ckpt
policy_step_15000_seed_233.ckpt  policy_step_25000_seed_233.ckpt  policy_step_32500_seed_233.ckpt  policy_step_42500_seed_233.ckpt  policy_step_5000_seed_233.ckpt   policy_step_7500_seed_233.ckpt

```

```
(rise2) haoxiang@aiadm-desktop:~/RISE-2/configs$ ls
dual_teleop_dino.yaml  dual_teleop_resnet.yaml  dual_wild_dino.yaml  single_rise1.yaml
(rise2) haoxiang@aiadm-desktop:~/RISE-2/configs$ pwd
/home/haoxiang/RISE-2/configs

```

```
execute [ 0.5028865   0.05290668  0.19673812 -0.9962581   0.07114269  0.04907723
  0.07131553  0.9974522   0.00177732  0.        ]

```

部署机器上agent看到的，传给服务器eval，输出的动作基本是正常的，那他妈的见鬼了

学长，我发现一个很严峻的问题，我仔细看了看dataset实现，发现它读入动作时默认读取夹爪数组的第1位，但是我转化出来的数据中，夹爪宽度放在第0位，所以模型其实根本没有学习夹爪宽度，它学到的也应该基本是0

我之前只检查了calib部分的问题，没想到数据处理那块的问题更大

**关于如何修改rise2原来的eval代码，让它能够在部署机器上跑起来**
- yaml中，serial和端口设置对
- arm.py中 from device import flxeiv，不要from device，直接import
- eval_agent，那一堆import，全部换成easyrobot实现，参考home/hongjie/RISE-2，或者看看haoxiang/RISE-2，应该是一样的
- eval_agent，self.robot.cali_sensor()，不要，注释掉

max_gripper_width: 0.095
yaml这里也改了

[[2026-01-22]] 17点55分，那么重新开始训练！
```
Start training from epoch 0 (step 0), max epoch 1936 (step 60000).
```

有一说一，排除没有主人的tcp npy文件，数据处理起来很快，大概5min左右就处理完了

[[2026-01-26]]

```
Epoch 1935
100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 31/31 [02:24<00:00,  4.66s/it]
# Steps: 59992. Average train loss at epoch 1935: 0.001964

Final checkpoint saved at step 59992.

```

很好，rise2训练完了，有时间就去跑一下