[[2026-01-18]]

话说你这两天有空的话，看看这一篇文章 https://adaptive-compliance.github.io/ 和他的代码，看看能不能用他的代码训练一下我们的数据哈

嗯嗯 我们准备在这次投的论文里也加一个这个baseline，所以可以看看能不能适配一下

[yifan-hou/adaptive_compliance_policy: Official implementation for paper "Adaptive Compliance Policy Learning Approximate Compliance for Diffusion Guided Control".](https://github.com/yifan-hou/adaptive_compliance_policy)

[yifan-hou/adaptive_compliance_policy | DeepWiki](https://deepwiki.com/yifan-hou/adaptive_compliance_policy?tab=readme-ov-file)

```
git clone --recursive git@github.com:1JI0O/adaptive_compliance_policy.git

conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/pytorch/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/nvidia/


```

[[2026-01-19]]

4. Setup environment variables: add the following to your .bashrc or .zshrc, edit according to your local path.
这一坨，gemini的建议是“将环境变量“绑定”到 Conda 环境”

```bash
# where the collected raw data folders are
export PYRITE_RAW_DATASET_FOLDERS=/data/haoxiang/acp
# where the post-processed data folders are
export PYRITE_DATASET_FOLDERS=/data/haoxiang/acp/acp_processed
# Each training session will create a folder here.
export PYRITE_CHECKPOINT_FOLDERS=/data/haoxiang/logs/acp_logs

# 下面这两个我觉得可以不用管
# Hardware configs.
export PYRITE_HARDWARE_CONFIG_FOLDERS=$HOME/git/RobotTestBench/applications/ur_test_bench/config
# Logging folder.
export PYRITE_CONTROL_LOG_FOLDERS=$HOME/data/control_log
```

唉，他们把数据集删掉了，真是该死！

大概是要参照 ## Data collection 那个小节，反推出来他们代码训练所需要的数据格式，然后转化我们的数据

需要参考 hardware_interfaces 里的数据结构，把你现有的数据转成它要求的 JSON 格式。
算了，还是直接看看dataset是怎么阅读的吧

/home/haoxiang/adaptive_compliance_policy/PyriteUtility/data_pipeline
核心文件：PyriteUtility/data_pipeline/real_data_processing.py
这是最关键的文件。它负责读取原始的 robot_data_0.json 和 wrench_data_0.json 并将它们压入 Zarr 数据库。

```
current_dataset/
    episode_1727294514
    episode_1727294689
    episode_1727308394/
        rgb_0
        rgb_1/
            img_count_timestamp.jpg
            ...
        robot_data_0.json
        wrench_data_0.json
    ...
```

Within an episode, each file/folder corresponds to a device. Every frame of data is saved with a timestamp that was calibrated across all devices. For rgb images, its timestamp is saved in its file name, e.g.

```
img_000695_29345.186724_ms
```

means that this image is the 695th frame saved in this episode, and it is saved at 29345.186724ms since the program launched.

此外关于哪个_0
- `id_list = [0]  # single robot`
- 表示第几个手臂
- 目前样例数据里面都是单臂的，那就行

```bash
(pyrite) haoxiang@aiadm-desktop:~/adaptive_compliance_policy$ python read_h5.py 
Structure of /data/haoxiang/acp/flip_v3/scene_0001/lowdim/lowdim_filled.h5:
Dataset: ee_command_062046 (shape=(12349, 1), dtype=float32)
Dataset: ee_state_062046 (shape=(12349, 1), dtype=float32)
Dataset: force_torque_062046 (shape=(12349, 6), dtype=float32)
Dataset: tcp_pose_062046 (shape=(12349, 7), dtype=float32)
Dataset: tcp_vel_062046 (shape=(12349, 6), dtype=float32)
Dataset: timestamp (shape=(12349,), dtype=int64)
```

学长，请问lowdim_filled.h5就是对原始lowdim.h5裁剪暂停，帧率对齐后的结果吗？以及请问lowdim_labeled.h5是做了什么处理呀
>labeled跟这个没什么关系，可以不管

关于那个filled干了什么
>是的，用插值补充了之前可能缺失的帧，保证严格1000hz

cam902是全局相机，cam489是夹爪上的相机

关于数据的转换
- rgb图片部分
	- 这个好搞，可以直接修改real_data_processing.py里面的读取路径逻辑
	- 但是可能也没那么好搞，因为2个相机的帧没有对齐
	- 需要看看是2个相机都要用，还是只用一个相机
- h5 to json
	- 用到filled.h5
	- 这个需要看看json的读取逻辑

我记得之前学长演示的时候，是从照片目录下面找了个时间戳，然后在h5里面检索，可以找到这个时间戳对应h5里面的一个数组的第几项
好像还有就是因为是补帧的，所以应该h5里面的timestamp会比cam/color里面的多很多，需要通过color里面的时间戳去筛选h5的timestamp

去filled的timestamp里面寻找了，发现
- 里面的时间戳很多
- 里面的时间戳最大和最小都符合cam902
- cam902里面随便找一个时间戳，都可以检索到
- cam902是全局相机

基于此
- 从cam902里面提取时间戳，把这些时间戳检索出来的动作什么的放到json里面

```
(base) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001$ ls
cam_104122060902  cam_104122064489  lowdim

```
对于每一个scene，读取lowdim里面的h5，根绝cam902里面的时间戳

此外，process_one_episode的read rgb部分，里面对于rgb相机目录的检索是for id in id_list:，如果是单臂，那么id_list只有0，这个应该是全局相机

>在单臂 setup 下，rgb_0 就是**主相机**。它到底是全局还是腕部，代码不关心，只要你把最想让 AI 看到的画面放在 rgb_0 文件夹里，并确保文件名里的时间戳和 robot_data_0.json 里的时间戳是在同一个时间体系（Time Base）下即可。

14点59分
```
json_path = episode_dir.joinpath("robot_data_" + str(id) + ".json")
```
接下来要做的就是合成这个json，把他放到episode_dir，也就是scene_0001这种文件夹里面

我接下来要开始生成lowdim所需要的json文件了，请你先阅读上下文

首先，我需要确定哪些时间戳所对应的动作要被提取出来
```
(base) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/cam_104122060902/color$ 1768287143577.png  1768287144635.png  1768287145674.png  1768287146737.png  1768287147754.png
```
/data/haoxiang/acp/flip_v3 是基础工作目录，需要扫描下面有哪些子目录，存到一个容器里面，然后开个循环，遍历每一个子目录

首先，读取cam_104122060902/color子目录，把那些png文件的名称，也就是时间戳提取出来，作为索引
然后，在lowdim目录中
```
(base) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/lowdim$ ls
lowdim_filled.h5  lowdim.h5  lowdim_labeled.h5  vis.png
```
读取lowdim_filled.h5，基于那些索引，提取出对应时间戳的动作，也就是tcp_pose_062046，把时间戳和动作组合成格式如下的文件

```
[
  {
    "robot_time_stamps": 1768287148124,
    "ts_pose_fb": [0.452, -0.012, 0.355, 0.0, 0.7071, 0.0, 0.7071]
  },
  {
    "robot_time_stamps": 1768287149351,
    "ts_pose_fb": [0.453, -0.012, 0.356, 0.0, 0.7071, 0.0, 0.7071]
  },

]
```

请你先尝试生成一版代码，注意可读性好，不要冗长，只做要做的
一些基本工作目录应该定义为全局变量，放在最上面
cam_104122060902/color
这个相机目录是写死的，你可以认为没有别的相机目录

唉，还是有问题
ACP 原版代码期望的时间戳格式是 **毫秒 (ms)** 且为 **浮点数 (float)**。

1. Generate virtual target labels using `adaptive_compliance_policy/PyriteEnvSuites/scripts/postprocess_add_virtual_target_label.py` Specify `id_list` and `dataset_path`, then run the script. You can set `flag_plot=True` to check 3D visualizations of the reference/virtual target trajectories, episode by episode. This step does not create a new folder, instead, it only adds new fields to the input dataset.

[[2026-01-20]]

1. **一定要先用 num_of_process = 1 跑一个 Episode 看看图**（把 flag_plot 设为 True），检查红线（实际位姿）和蓝线（虚拟目标点）的相对位置是否符合物理逻辑（蓝线应该在红线“前方”或者受力方向的另一侧）。

**红线 (Red) = 真实轨迹 (Actual Trajectory / Feedback)**
**蓝线 (Blue) = 虚拟目标点 (Virtual Target)**

虽然现在的参数看起来“很好”，但如果你在后续训练中发现效果不够好，可以回来微调这几个参数：

- **wrench_moving_average_window_size (目前是 15)**：
    - 如果你的“推上去”动作非常快（比如瞬间发力），15 帧（约 0.75s）可能把力的峰值给平滑掉了，导致蓝线“跳”得不够远。
    - **建议**：如果动作极其迅速，可以减小到 **5-8**；如果动作很慢且力传感器毛刺多，保持 **15**。
- **stiffness_estimation_para 中的 characteristic_length (目前是 0.02)**：
    - 这个参数决定了系统对“位置偏差”和“力”之间关系的敏感度。
    - 如果蓝线和红线分得**太开**（超出了实际末端可能达到的范围），调大这个值；如果分得**太近**，调小这个值。
- **Noffset = 10**：
    - 请务必确认你的 50 个 Episode 里的**前 10 帧**都是静止且不触碰物体的。如果有某个 Episode 机器人一启动就在接触物体，这 10 帧的平均值就会把真实的力给扣掉。

我发现还有一个机械臂推着方块在桌面上走，直到抵住墙角的过程，这个有在图中体现吗

```
export HF_ENDPOINT=https://hf-mirror.com
```
配置hugging face镜像站

---

关于适配高频数据

我自己采集了一些1000hz的高频数据，但是格式和acp官方的不一样，我希望能修改一下数据格式，让acp也能训练这一批数据。我主要不是很理解的点在于，不确定他的convert需要怎么给输入以及对应关系，比方说rgb,lowdim,wrench时间戳没有对齐，它是怎么处理的，我们要怎么预先处理我们的数据，才能匹配他们的逻辑。这部分请你讲解一下，尤其是讲解一下其中的处理逻辑，逻辑的环节介绍一下在什么地方实现的

关于存储结构
- **`output_dir/`** (这是 buffer)
    - **`data/`** (这是存储图片、力矩原始数据的组)
    - **`meta/`** (这是存储长度索引信息的组)
        - **`episode_robot0_len`** (这是一个 Zarr 数组文件)
        - **`episode_rgb0_len`** (这也是一个 Zarr 数组文件)

```python
for id in id_list:
    meta[f"episode_robot{id}_len"] = zarr.array(episode_robot_len[id])
    meta[f"episode_wrench{id}_len"] = zarr.array(episode_wrench_len[id])
    meta[f"episode_rgb{id}_len"] = zarr.array(episode_rgb_len[id])
```
既然需要这么存，认为三类数据的采样个数不一样也是可以的，需要后面处理

```
/你的输出目录/ (Zarr Root) 这个是buffer
├── data/                      <-- 这是一个 Zarr Group (大文件夹)
│   ├── episode_0/             <-- 一个 Episode (子文件夹)
│   │   ├── rgb_0              <-- 图像数据 (被压缩过的 N 维数组)
│   │   ├── ts_pose_fb_0       <-- 机器人反馈位姿 (N x 7 数组)
│   │   ├── wrench_0           <-- 原始力矩数据 (N x 6 数组)
│   │   ├── wrench_filtered_0  <-- 滤波后的力矩 (N x 6 数组)
│   │   ├── robot_time_stamps_0 <-- 机器人的时间戳
│   │   └── wrench_time_stamps_0<-- 力矩的时间戳
│   ├── episode_1/
│   └── ...
└── meta/                      <-- 另一个 Group (存放索引的小文件夹)
    ├── episode_rgb0_len       <-- 存储所有 episode 图片长度的数组
    ├── episode_robot0_len     <-- 存储所有 episode 位姿长度的数组
    └── ...
```

```
# find the id in wrench_time_stamps where the time is closest to robot_time_stamps[t]
t_wrench = np.argmin(np.abs(wrench_time_stamps - robot_time_stamps[t]))
```

```
# 第一步：在“力”的时间轴里，找到离“机器人位姿”当前时间点最近的那一瞬间
t_wrench = np.argmin(np.abs(wrench_time_stamps - robot_time_stamps[t]))

# 第二步：直接取那一瞬间对应的、平滑后的力矩数据
wrench_T = wrench_moving_average[t_wrench]
```

以机器人姿态的时间戳为主，去寻找最近的力的时间戳，把这个力作为这个位姿对应的力
所以算出来的 virtual target 是和 robot_time_stamps 对齐的
```
ts_pose_virtual_target_0[t] 对应的时间戳就是 robot_time_stamps[t]
stiffness_0 也是
```

我很疑惑，虽然realdataprocess里面把时间都移到0为参考了，但是这些东西的0时刻不一定对应真实世界里同一个时间点啊，万一这个设备开启顺序时间之类的不一样怎么办

>Every frame of data is saved with a timestamp that was calibrated across all devices

acp里面，时间的0点对应一个东西，不同采集设备间标定过的

我们的时间戳都是unix时间戳，那么时间0点本来就是一样的，所以可以直接用他们的逻辑
（但是他们为啥不直接用unix时间戳，而是要在不同设备间标定呢？很奇怪）

这个hydra架构还挺高级的，实现了配置和训练的解耦合，比如train_spec_workspace.yaml里面是一些基础配置，flip_up_conv.yaml里面才是具体的配置

flip_up_spec.yaml 里面，这些东西很有用
```
# rgb vs. low_dim: raw data are either rgb images or low_dim vectors. frames are aligned within each type.
# obs vs. action: obs data are used as policy input; action are used as labels for policy output.

# down_sample_steps: how many steps to skip in the raw data for the given usage
# horizon: how many steps to look ahead(action) or back(obs) after downsample for the given usage
sparse_obs_rgb_down_sample_steps: 10
sparse_obs_rgb_horizon: 2

sparse_obs_low_dim_down_sample_steps: 5
sparse_obs_low_dim_horizon: 3

sparse_obs_wrench_down_sample_steps: 1
sparse_obs_wrench_horizon: 7000

sparse_action_down_sample_steps: 50
sparse_action_horizon: 16
```

对齐的核心在于getitem的
`obs_dict, action_array = self.sampler.sample_sequence(idx)`
那个函数的介绍
"""Sample a sequence of observations and actions at idx."""

`__init__` 计算出哪些时间点可以作为“现在” → 存入 `self.indices` → `sample_sequence` 根据这些点去抓取“过去”的观察和“未来”的动作。

转换逻辑示例：
- **输入** `idx = 500`
- **查表结果**：`epi_id = 2` (属于第 2 段录像), `rgb_id = 120` (是这段录像里的第 120 帧图像)。
- **物理动作**：
    - 拿着 `epi_id=2`，去硬盘找 `episode_2` 这个文件夹。
    - 拿着 `rgb_id=120`，去 `rgb_time_stamps_0` 数组里找到第 120 帧的时间戳（比如 1715832000.500s）。
    - 这就是我们之前讨论的所有对齐逻辑的起点！

```
# indices are counted for the rgb0 obs data.
# To get others (rgb, low dim, action), we need to find their id
query_time = data_episode["obs"]["rgb_time_stamps_0"][rgb_id]
```

通过rgb_id，就是rgb图片在数组的第几个位置，获得这个rgb图片的时间戳（应该是处理之后的0起点时间，反正时间是对齐了的），通过这个时间戳，去找这个时间戳的 wrench 和 pose ，获得他们的下标id，建立id关联

>无论有多少个模态，都共用同一套“基于时间锚点”的搜索逻辑。

在`for key, attr in self.shape_meta["sample"]["obs"]["sparse"].items():`这个大循环中

关于那个key

```
sample:
  obs:
    sparse:
      rgb_0:                     # <--- 第一次循环，key 是 "rgb_0"
        horizon: 2
        ...
      robot0_eef_pos:            # <--- 第二次循环，key 是 "robot0_eef_pos"
        horizon: 3
        ...
      robot0_eef_wrench:         # <--- 第三次循环，key 是 "robot0_eef_wrench"
        horizon: 7000
        ...
```

关于不同分支
```
elif "wrench" in key:
	query_id = np.searchsorted(
		data_episode["obs"][f"wrench_time_stamps_{id}"], query_time
	)
	found_time = data_episode["obs"][f"wrench_time_stamps_{id}"][query_id]
```

后面都是类似的查询逻辑
- 去找 wrench时间戳中 和 rgb时间戳 最接近的，返回其下标
- found_time 就是下标对应wrench时间戳，也就是和rgb时间戳最接近的wrench时间戳
- 有可能频率不同，所以时间戳不能精确一对一，后面也有确保两个时间戳差距在合理范围内的逻辑
- 这种逻辑，处理了
	- （可能）多个相机
	- wrench_time_stamps
	- robot_time_stamps

然后是截取序列，获取slice

sample every this_downsample_steps frames from slice_start to id+1
这一部分，用到了yaml里面配置的steps和horizon
- steps 跳几步取
- horizon 取几步

后面还有个 solve padding 逻辑，防止一开始前面的帧数凑不够 horizon

最终获得了 `sparse_obs_unprocessed[key] = output`
循环结束后，sparse_obs_unprocessed 就变成了一个**字典**，它的结构如下：
```
{
  "rgb_0": (2, 3, 224, 224),         # 2帧图像
  "robot0_eef_pos": (3, 3),          # 3帧位置
  "robot0_eef_wrench": (7000, 6),    # 7000帧高频力矩
  ...
}
```

在这个循环结束后，进行# sparse action

关于 action 是啥
在 VirtualTargetDataset.py 的 raw_episodes_conversion 函数里：

raw_to_action19 函数定义在 PyriteConfig.tasks.common.common_type_conversions
需要注意的是，raw_to_action19函数有2个，sampler.py里面调用的是第二个

这段代码清晰地展示了 **action**（神经网络的预测目标）是由三部分组成的：
- **`ts_pose9_command`** (9维)：机器人原本的指令位姿（位置3 + 6D旋转6）。
- **`ts_pose9_virtual_target`** (9维)：这就是你用第二个脚本算出来的、基于高频力矩生成的虚拟目标！
- **`stiffness`** (1维)：对应的刚度系数。

此外，时间戳确实是对齐的，和 postprocess_add_virtual_target_label.py 一致
```
# action timestamps is set according to robot 0
episode_data["action_time_stamps"] = raw_data["robot_time_stamps_0"][:action_len]
```

言归正传，分析 sparse action 部分

这部分逻辑和上面那个循环里面的切片逻辑差不多，基本一样，主要的区别是

- **逻辑**：它从 action_id（现在）开始，每隔 50 帧往后跳，直到抓够 16 个点。
- **注意方向**：Observation（观察量）是往**过去**截取的，而 Action（标签）是往**未来**截取的。

所以后面的填充也是在末尾向后填充

```
时间轴 ------------------------------------------------------------------------>
[ Observation (过去)][ T (当前图像采样点) ][ Action (未来预测序列) ]
<-- 7000ms Wrench --|                   |-- 未来 16 个预测点 (每0.5s一个) -->
<-- 2 帧图像 --------|                   |-- 每个点包含: 9维位姿 + 9维虚拟目标 + 1维刚度
```

学长，我感觉大概的逻辑是这样的
- 我们给进去：rgb图片，robot_pose，wrench
	- 这些东西频率可以不同，时间戳可以不对应，但是时刻0点要是同一个现实时间
	- 既然我们时间戳是unix时间戳，这点满足
- 原始数据送入 real_data_processing.py
	- time_offset = np.min(time_offsets) 那一块
	- 即使开始记录的时间不一样，通过offsets，至少有一个时间戳数组从0开始，其他的应该也接近0
- 处理后的数据送入 postprocess_add_virtual_target_label.py，算virtual target
	- 以 pose 的时间戳为主，去寻找最近的力的时间戳，把这个力作为这个位姿对应的力
	- 算出来的 virtual target 和 stiffness 的时间戳是和 robot_time_stamps 对齐的，就是和pose一致
- 训练时开始读入数据，具体处理在 VirtualTargetDataset.py 的 getitem
	- 时间对齐的核心在 `obs_dict, action_array = self.sampler.sample_sequence(idx)`
	- 这个函数是 基于idx对应的rgb时间戳，获取一个切片，返回一系列数据
	- 对齐是基于 rgb 图片，它的时间戳作为 query_time
		- indices are counted for the rgb0 obs data.
		- To get others (rgb, low dim, action), we need to find their id
	- 一个循环，处理各种 obs 的 keys，包含"rgb_0" "robot0_eef_pos" "robot0_eef_wrench"
		- 对于不同keys，去找 keys时间戳中 和 rgb时间戳 最接近的，返回其下标，再读取整个下标对应的 keys时间戳，确保和 rgb时间戳 相差不大
		- 基于找到的时间戳，向前截取序列，获取slice
			- 这一部分，用到了yaml里面配置的steps和horizon
			- steps 跳几步取 ；horizon 取几步
			- 后面还有个 solve padding 逻辑，防止一开始前面的帧数凑不够 horizon
	- 进行 sparse action
		- PyriteConfig.tasks.common.common_type_conversions 的 第二个raw_to_action19函数，把pose, virtual target, stiffness 合成 action，也就是"are used as labels for policy output."
			- action_time_stamps 被设置成 robot_time_stamps_0，和算virtual target的程序一致
		- 这部分的处理和上面的循环逻辑类似，区别在于 action 切片是往后抓取的，所以最后也是向后padding

总而言之就是，1000hz可以处理，3种数据频率不同也可以，只是需要相应修改滤波的参数，以及修改steps和horizon，acp原来的代码可以自动对应上。（至少目前我觉得可以）

```bash
train dataset: 10899 train dataloader: 86
val dataset: 422 val dataloader: 4
batch_size: 128
obs.sparse.key:  rgb_0 torch.Size([128, 2, 3, 224, 224])
obs.sparse.key:  robot0_eef_pos torch.Size([128, 3, 3])
obs.sparse.key:  robot0_eef_rot_axis_angle torch.Size([128, 3, 6])
obs.sparse.key:  robot0_eef_wrench torch.Size([128, 32, 6])
obs.sparse:  torch.Size([128, 16, 19])
action:  torch.Size([128, 16, 19])
dataset.action_type:  pose9pose9s1
wandb:                                                                                                                                                                                                                               
wandb: Run history:
wandb:                              epoch ▁▁▁▂▂▂▂▂▂▂▃▃▃▄▄▄▄▄▄▄▄▅▅▆▆▆▆▆▆▆▆▇▇▇▇▇████
wandb:                        global_step ▁▁▁▁▁▂▂▂▂▂▃▄▄▄▄▄▄▄▄▄▅▅▅▆▆▆▆▆▆▆▇▇▇▇▇█████
wandb:                                 lr ▂▃▅▆███▇▇▇▆▆▆▆▆▄▄▄▄▄▄▄▃▃▃▃▃▃▃▂▂▂▁▁▁▁▁▁▁▁
wandb:                        sparse_loss █▂▂▂▂▂▂▂▂▂▂▁▂▂▂▂▂▂▁▂▁▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:                         train_loss █▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb: train_sparse_cmd_naction_mse_error █▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:     train_sparse_naction_mse_error █▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:   train_sparse_stiffness_mse_error █▅▅▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:  train_sparse_vt_naction_mse_error █▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:   val_sparse_cmd_naction_mse_error █▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁
wandb:                                 +3 ...
wandb: 
wandb: Run summary:
wandb:                              epoch 299
wandb:                        global_step 25799
wandb:                                 lr 0
wandb:                        sparse_loss 0.01113
wandb:                         train_loss 0.01055
wandb: train_sparse_cmd_naction_mse_error 0.00017
wandb:     train_sparse_naction_mse_error 0.00037
wandb:   train_sparse_stiffness_mse_error 0.00367
wandb:  train_sparse_vt_naction_mse_error 0.0002
wandb:   val_sparse_cmd_naction_mse_error 0.00043
wandb:                                 +3 ...

```


---

接下来要做的

>然后你可以尝试着写一下部署的代码，可以看看rise/rise2部署的时候是怎么写的，看一看是不是能类似的写一下

参见[[acp_eval]]

---

哦哦哦这样 可以的 那要不训一下两个相机的 可以把第二个相机按照时间戳和第一个相机对齐 找一个nearest的就好啦

```
# RGB（15 Hz 相机）
sparse_obs_rgb_down_sample_steps = 1
sparse_obs_rgb_horizon = 2

# Pose（1000 Hz，但只需要短期）
sparse_obs_low_dim_down_sample_steps = 1
sparse_obs_low_dim_horizon = 3

# Wrench（1000 Hz，需要长期历史 + 1D Conv 处理）
sparse_obs_wrench_down_sample_steps = 5   # 🔥 关键：扩大时间感受野
sparse_obs_wrench_horizon = 32            # 🔥 关键：足够的样本给 1D Conv

# Action
sparse_action_down_sample_steps = 1
sparse_action_horizon = 16
```

啊，很好，计算 virtual target 时是不用相机数据的，同时 diffusion policy 原生支持给2个相机数据，那就可以了，很好

21点48分 居然真的训练起来了，不可思议

```
[ReplayBuffer] copying data to memory store.
copied to replaybuffer:  27006 0 1500272698
[VirtualTargetDataset] raw to obs/action conversion
[VirtualTargetDataset] creating SequenceSampler.
iterating dataset to get normalization: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 182/182 [00:04<00:00, 43.23it/s]
data_cache_sparse['action'] (186224, 19)
train dataset: 11639 train dataloader: 91
val dataset: 454 val dataloader: 4
batch_size: 128
obs.sparse.key:  rgb_0 torch.Size([128, 2, 3, 224, 224])
obs.sparse.key:  rgb_1 torch.Size([128, 2, 3, 224, 224])
obs.sparse.key:  robot0_eef_pos torch.Size([128, 3, 3])
obs.sparse.key:  robot0_eef_rot_axis_angle torch.Size([128, 3, 6])
obs.sparse.key:  robot0_eef_wrench torch.Size([128, 32, 6])
obs.sparse:  torch.Size([128, 16, 19])
action:  torch.Size([128, 16, 19])
dataset.action_type:  pose9pose9s1

```

[[2026-01-26]]

唉
```
Message from syslogd@aiadm-desktop at Jan 26 01:43:06 ...
 kernel:[7569703.588578] watchdog: BUG: soft lockup - CPU#12 stuck for 22s! [pt_data_pin:4071178]
```

17点42分
很好，又回到原点了，现在正在研究时间戳匹配和对齐的逻辑，如果还是不行，那么

双相机采样训练
- 首先，以rgb0，global相机为主
	- rgb1，inhand相机，不能和它完全匹配，那么就最近相连搜索，改名字创建软链接
- 其次，lowdim数据，按照类似于单相机的处理方法，筛选对应时间戳的数据
- 最后，yaml配置，还是按照单相机计算逻辑来

我感觉手动对齐还是可以，因为本来照理来说相机数据和lowdim数据就应该是对齐的

感觉可以再看看之前的对齐逻辑问题在哪里，如果8点之前没找到，那么就开始写手动对齐的逻辑

[1JI0O/adaptive_compliance_policy at bicam](https://github.com/1JI0O/adaptive_compliance_policy/tree/bicam)

唉妈的！又开了个分支
- 它要融合main分支对于lowdim数据的筛选
- 它要融合high_freq分支对于双相机的逻辑处理和修改
- 它还要手动对齐两个相机的时间戳

```
output_dir = pathlib.Path(os.environ.get("PYRITE_DATASET_FOLDERS") + "/flip_new_v3")

改成

output_dir = pathlib.Path(os.environ.get("PYRITE_DATASET_FOLDERS") + "/flip_bicam")
```

可以把第二个相机按照时间戳和第一个相机对齐 找一个nearest的就好啦

```
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp$ cd flip_v3/
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3$ ls
scene_0001  scene_0004  scene_0007  scene_0010  scene_0013  scene_0016  scene_0019  scene_0022  scene_0025  scene_0028  scene_0031  scene_0034  scene_0037  scene_0040  scene_0043  scene_0046  scene_0049
scene_0002  scene_0005  scene_0008  scene_0011  scene_0014  scene_0017  scene_0020  scene_0023  scene_0026  scene_0029  scene_0032  scene_0035  scene_0038  scene_0041  scene_0044  scene_0047  scene_0050
scene_0003  scene_0006  scene_0009  scene_0012  scene_0015  scene_0018  scene_0021  scene_0024  scene_0027  scene_0030  scene_0033  scene_0036  scene_0039  scene_0042  scene_0045  scene_0048
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3$ cd scene_0001/
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001$ ls
cam_104122060902  cam_104122064489  lowdim  robot_data_0.json  robot_pose_data_0.json  wrench_data_0.json
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001$ cd cam_104122060902/color/
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/cam_104122060902/color$ ls
1768287143577.png  1768287144494.png  1768287145425.png  1768287146370.png  1768287147270.png  1768287148186.png  1768287149106.png  1768287150008.png  1768287150925.png  1768287151866.png  1768287152800.png  1768287153712.png  1768287154615.png  1768287155517.png
1768287143647.png  1768287144561.png  1768287145486.png  1768287146433.png  1768287147325.png  1768287148248.png  1768287149169.png  1768287150067.png  1768287150986.png  1768287151926.png  1768287152860.png  1768287153773.png  1768287154671.png  1768287155655.png
1768287143708.png  1768287144635.png  1768287145546.png  1768287146495.png  1768287147382.png  1768287148309.png  1768287149235.png  1768287150130.png  1768287151046.png  1768287151985.png  1768287152921.png  1768287153830.png  1768287154731.png  1768287155717.png
1768287143769.png  1768287144697.png  1768287145610.png  1768287146556.png  1768287147443.png  1768287148371.png  1768287149293.png  1768287150192.png  1768287151110.png  1768287152050.png  1768287152983.png  1768287153892.png  1768287154789.png  1768287155775.png
1768287143828.png  1768287144757.png  1768287145674.png  1768287146617.png  1768287147508.png  1768287148432.png  1768287149351.png  1768287150255.png  1768287151169.png  1768287152117.png  1768287153044.png  1768287153951.png  1768287154850.png  1768287155837.png
1768287143887.png  1768287144819.png  1768287145735.png  1768287146678.png  1768287147566.png  1768287148493.png  1768287149408.png  1768287150318.png  1768287151230.png  1768287152173.png  1768287153105.png  1768287154013.png  1768287154915.png  1768287155896.png
1768287143947.png  1768287144879.png  1768287145797.png  1768287146737.png  1768287147627.png  1768287148555.png  1768287149466.png  1768287150383.png  1768287151292.png  1768287152234.png  1768287153166.png  1768287154072.png  1768287154982.png
1768287144010.png  1768287144940.png  1768287145860.png  1768287146795.png  1768287147691.png  1768287148616.png  1768287149523.png  1768287150449.png  1768287151355.png  1768287152294.png  1768287153227.png  1768287154130.png  1768287155045.png
1768287144083.png  1768287145005.png  1768287145922.png  1768287146856.png  1768287147754.png  1768287148677.png  1768287149580.png  1768287150508.png  1768287151418.png  1768287152356.png  1768287153288.png  1768287154193.png  1768287155102.png
1768287144147.png  1768287145069.png  1768287145986.png  1768287146923.png  1768287147812.png  1768287148736.png  1768287149636.png  1768287150565.png  1768287151480.png  1768287152419.png  1768287153351.png  1768287154259.png  1768287155160.png
1768287144203.png  1768287145126.png  1768287146055.png  1768287146980.png  1768287147875.png  1768287148799.png  1768287149696.png  1768287150622.png  1768287151543.png  1768287152480.png  1768287153412.png  1768287154321.png  1768287155225.png
1768287144259.png  1768287145184.png  1768287146123.png  1768287147037.png  1768287147941.png  1768287148860.png  1768287149759.png  1768287150679.png  1768287151605.png  1768287152543.png  1768287153475.png  1768287154378.png  1768287155283.png
1768287144315.png  1768287145241.png  1768287146183.png  1768287147093.png  1768287148004.png  1768287148920.png  1768287149819.png  1768287150740.png  1768287151668.png  1768287152608.png  1768287153533.png  1768287154435.png  1768287155340.png
1768287144373.png  1768287145304.png  1768287146239.png  1768287147151.png  1768287148064.png  1768287148982.png  1768287149880.png  1768287150800.png  1768287151740.png  1768287152671.png  1768287153592.png  1768287154498.png  1768287155398.png
1768287144436.png  1768287145365.png  1768287146303.png  1768287147209.png  1768287148124.png  1768287149045.png  1768287149941.png  1768287150864.png  1768287151805.png  1768287152733.png  1768287153654.png  1768287154559.png  1768287155455.png
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/cam_104122060902/color$ cd ../..
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001$ cd cam_104122064489/color/
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/cam_104122064489/color$ ls
1768287143571.png  1768287144501.png  1768287145425.png  1768287146379.png  1768287147287.png  1768287148247.png  1768287149201.png  1768287150132.png  1768287151045.png  1768287152024.png  1768287152920.png  1768287153859.png  1768287154754.png  1768287155759.png
1768287143630.png  1768287144561.png  1768287145485.png  1768287146434.png  1768287147349.png  1768287148308.png  1768287149259.png  1768287150191.png  1768287151102.png  1768287152082.png  1768287152982.png  1768287153922.png  1768287154812.png  1768287155812.png
1768287143682.png  1768287144624.png  1768287145546.png  1768287146494.png  1768287147406.png  1768287148364.png  1768287149317.png  1768287150254.png  1768287151168.png  1768287152135.png  1768287153044.png  1768287153975.png  1768287154863.png  1768287155869.png
1768287143741.png  1768287144677.png  1768287145610.png  1768287146556.png  1768287147460.png  1768287148431.png  1768287149374.png  1768287150309.png  1768287151230.png  1768287152190.png  1768287153105.png  1768287154031.png  1768287154915.png  1768287155919.png
1768287143803.png  1768287144732.png  1768287145673.png  1768287146611.png  1768287147515.png  1768287148493.png  1768287149441.png  1768287150362.png  1768287151292.png  1768287152245.png  1768287153167.png  1768287154087.png  1768287154968.png
1768287143854.png  1768287144793.png  1768287145734.png  1768287146670.png  1768287147578.png  1768287148554.png  1768287149497.png  1768287150416.png  1768287151354.png  1768287152301.png  1768287153226.png  1768287154138.png  1768287155018.png
1768287143913.png  1768287144853.png  1768287145790.png  1768287146723.png  1768287147635.png  1768287148616.png  1768287149554.png  1768287150473.png  1768287151417.png  1768287152357.png  1768287153289.png  1768287154193.png  1768287155077.png
1768287143971.png  1768287144913.png  1768287145849.png  1768287146776.png  1768287147692.png  1768287148676.png  1768287149612.png  1768287150532.png  1768287151480.png  1768287152418.png  1768287153350.png  1768287154244.png  1768287155134.png
1768287144025.png  1768287144972.png  1768287145903.png  1768287146831.png  1768287147747.png  1768287148737.png  1768287149669.png  1768287150589.png  1768287151543.png  1768287152473.png  1768287153412.png  1768287154294.png  1768287155191.png
1768287144094.png  1768287145029.png  1768287145961.png  1768287146889.png  1768287147806.png  1768287148799.png  1768287149731.png  1768287150646.png  1768287151605.png  1768287152530.png  1768287153472.png  1768287154351.png  1768287155249.png
1768287144154.png  1768287145082.png  1768287146020.png  1768287146947.png  1768287147869.png  1768287148860.png  1768287149783.png  1768287150697.png  1768287151667.png  1768287152581.png  1768287153527.png  1768287154409.png  1768287155307.png
1768287144215.png  1768287145139.png  1768287146089.png  1768287147004.png  1768287147940.png  1768287148920.png  1768287149843.png  1768287150752.png  1768287151739.png  1768287152637.png  1768287153586.png  1768287154463.png  1768287155363.png
1768287144274.png  1768287145195.png  1768287146148.png  1768287147060.png  1768287147996.png  1768287148981.png  1768287149898.png  1768287150807.png  1768287151794.png  1768287152686.png  1768287153644.png  1768287154523.png  1768287155422.png
1768287144332.png  1768287145250.png  1768287146207.png  1768287147117.png  1768287148057.png  1768287149036.png  1768287149955.png  1768287150864.png  1768287151848.png  1768287152740.png  1768287153704.png  1768287154583.png  1768287155490.png
1768287144389.png  1768287145305.png  1768287146267.png  1768287147176.png  1768287148124.png  1768287149091.png  1768287150018.png  1768287150925.png  1768287151902.png  1768287152799.png  1768287153756.png  1768287154640.png  1768287155646.png
1768287144444.png  1768287145364.png  1768287146321.png  1768287147233.png  1768287148185.png  1768287149142.png  1768287150075.png  1768287150986.png  1768287151960.png  1768287152860.png  1768287153809.png  1768287154696.png  1768287155703.png
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/acp/flip_v3/scene_0001/cam_104122064489/color$ 

```

我希望修改这个process程序里面读取图片的逻辑，rgb0，也就是902那个global相机，不动，作为索引；读入第二个相机，489，inhand相机时，存储进去时不要使用它自己原来的时间戳，而是“可以把第二个相机按照时间戳和第一个相机对齐 找一个nearest的就好啦”，存储时间戳就按照它对齐的那个。帮我修改函数和逻辑，最小修改，不要乱动

[[2026-01-27]] 18点19分

唉，还真的有可能
- 训练少了，比如单相机，训练了300轮，不准确
- 训练多了，双相机这里用的是600还是700轮的东西，就过拟合
- 反正就是有毛病

