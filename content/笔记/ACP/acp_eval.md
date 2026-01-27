>然后你可以尝试着写一下部署的代码，可以看看rise/rise2部署的时候是怎么写的，看一看是不是能类似的写一下

[[2026-01-21]] 10点02分

唉，目前还能用289次copilot，然后就要收费了，但是正好，现在是一月后1/3，所以理论上讲可以放开用，每天大概能用20次左右
10点36分 但是话说回来，发现不是每一次请求都耗费0.3%，有时候是0.1%

[yifan-hou/adaptive_compliance_policy: Official implementation for paper "Adaptive Compliance Policy Learning Approximate Compliance for Diffusion Guided Control".](https://github.com/yifan-hou/adaptive_compliance_policy)

[[acp_eval_copilot的建议]]

在acp库里面搜索eval()
- 看来acp里面有类似于model.eval()这种东西
- 开启eval模式，然后把当前看到的，提取出policy需要的输入，按照参数格式传给policy，policy就会返回一串东西，rise里面是action，acp里面是啥有待了解

[RISE-2/assets/docs/DEPLOY.md at main · rise-policy/RISE-2](https://github.com/rise-policy/RISE-2/blob/main/assets/docs/DEPLOY.md)
- Modify `eval_agent.py` to accomodate your own device.

关于传什么给机器人去动，还是得看arm.py里面控制移动需要什么参数，它可能需要一个tcp_pose

`mat_to_xyz_rot` 是**领域自定义函数**，核心是把 4x4 变换矩阵转成 “XYZ 平移 + 旋转角”

```
[ R11  R12  R13  Tx ]  ← 第1行：X轴旋转+X方向平移
[ R21  R22  R23  Ty ]  ← 第2行：Y轴旋转+Y方向平移
[ R31  R32  R33  Tz ]  ← 第3行：Z轴旋转+Z方向平移
[  0    0    0   1 ]  ← 第4行：齐次坐标的固定项（永远是 [0,0,0,1]）
```



```bash
(base) haoxiang@aiadm-desktop:/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230/.hydra$ ls
config.yaml  hydra.yaml  overrides.yaml

```

train_conv_workspace.yaml 中
```
policy:
  _target_: diffusion_policy.policy.diffusion_unet_timm_mod1_policy.DiffusionUnetTimmMod1Policy
```
说明确实用的 diffusion_unet_timm_mod1_policy.py 这个policy

大概要做的
- 那个policy需要传入什么数据
	- 格式是什么，xyz+四元数，还是什么矩阵
	- 需不需要我事先归一化
- policy返回什么数据
	- 什么格式
	- 是action？
	- 是虚拟目标和reference target？
- policy返回的数据如何喂给机器人
	- 这个就参考rise的代码了


输入的格式
```
# 目标结构: Dict["sparse"][Key] -> Tensor(B, T, D)

"""
obs: include keys from shape_meta['sample']['obs'],
"""

# 堆叠 numpy 数组并转 Tensor
obs_batch = {
	"sparse": {
		# rgb_0: (B, T, C, H, W) -> ACP policy 内部通常处理 T=1 或 T>1
		"rgb_0": torch.stack(list(buffer_rgb)).unsqueeze(0).to(device),
		
		# robot0_eef_pos: (B, T, 3)
		"robot0_eef_pos": torch.from_numpy(np.stack(list(buffer_pos))).float().unsqueeze(0).to(device),
		
		# robot0_eef_rot_axis_angle: (B, T, 6)
		"robot0_eef_rot_axis_angle": torch.from_numpy(np.stack(list(buffer_rot))).float().unsqueeze(0).to(device),
		
		# robot0_eef_wrench: (B, T, 6)
		"robot0_eef_wrench": torch.from_numpy(np.stack(list(buffer_wrench))).float().unsqueeze(0).to(device)
	}
}
```

唉，记错了，原来acp在部署推理时也是需要力数据的，我还以为不需要呢

>"The policy runs in a receding-horizon manner... predicted using recent observations: 1) fisheye RGB images, 2) robot end-effector poses, and **3) force/torque data**."

此外，基于
```
obs_dict_sparse = obs["sparse"]
nobs_sparse = self.sparse_normalizer.normalize(obs_dict_sparse)

# condition through global feature
sparse_nobs_encode = self.obs_encoder(nobs_sparse)
```
传进去的那个字典，原始数据，是不需要我事先normalize的，pred_action里面会自己处理

关于需要传进policy的数据的格式
```
    rgb_0:
      shape: [3, 224, 224]
      type: rgb
    robot0_eef_pos:
      shape: [3]
      type: low_dim
    robot0_eef_rot_axis_angle:
      shape: [6]
      type: low_dim
      rotation_rep: rotation_6d
    robot0_eef_wrench:
      shape: [6]
      type: low_dim
```

那个eef就是tcp

17点58分 还需要弄懂的
- acp原来的normalization究竟在什么情况下执行了
	- eval时，传进去的数据会经过normalize，那么rgb图片需不需要normalize，这个应该和训练时传进去的数据有关
	- policy吐出来的东西是什么，貌似经过了unnormalize，但是不确定
		- 吐出来的动作都是unnormalized的，可以直接用（也许）反正至少不用再次unnorm


在 PyriteConfig/tasks/common/common_type_conversions.py
```
def obs_rgb_preprocess(
    obs: dict,
    obs_output: dict,
    reshape_mode: str,
    shape_meta: dict,
):
    """Pre-process the rgb data in the obs dictionary as inputs to policy network.

    This function does the following to the rgb keys in the obs dictionary:
    * Unpack/unzip it, if the rgb data is still stored as a compressed zarr array (not recommended)
    * Reshape the rgb image, or just check its shape.
    * Convert uint8 (0~255) to float32 (0~1)
    * Move its axes from THWC to TCHW.
    Since this function unpacks the whole key, it should only be used for online inference.
    If used in training, so the data length is the obs horizon instead of the whole episode len.

    Args:
        obs: dict with keys from shape_meta.obs
        obs_output: dict with the same keys but processed images
        reshape_mode: One of 'reshape', 'check', or 'none'.
        shape_meta: the shape_meta from task.yaml
    """
```

Convert uint8 (0~255) to float32 (0~1)！！！

>在本repo的`PyriteEnvSuites/env_runners/virtual_target_real_env_runner.py`里，policy的推理结果是以batch形式（N步MPC horizon的动作序列）**全部下发给机器人环境(scheduler_controls)**，而不是只取第0步执行。  
>这是MPC/horizon控制的高效部署，和只取一步的经典Diffusion Policy方案在部署策略上有差别。

学长，我大概写了个部署脚本出来，但是我不知道部署的机器上面如何获取当前状态和观测，以及机器人到底能接收什么数据，可能得再处理一下policy吐出来的东西才能用。请问有官方文档之类的我可以参考一下吗

>硬件api可以看这里，现在是arm.flexiv和arm.gripper

就是gripper和robot都是flexiv的

参见[[acp_stiffness设置]]

关于那个action如何设置
- 先设置刚度，后发送位姿
- 必须使用非阻塞模式 (blocking=False)

[[2026-01-22]]

参见[[acp_stiffness设置]]
```
# 范围映射到 [100, 200] 先试试
# 原文其实是 150-300，但是硬件不一样
k_rot = 100.0 + stiffness_val * (200.0 - 100.0)
```

学长，数据改完后训练已经跑起来了；请问我写的的acp部署代码要去测试一下吗，我感觉这个代码的问题很大，训练出来模型的问题也很大，6楼的机器好像也挺忙的

[[2026-01-23]]

>有一个问题你可以先改一下，就是现在这个代码你是不是没用到virtual target，他实际上是通过算virtual target和预测action的差来找到一个方向，定义这个方向的stiffness是他预测的值，而不是三个方向统一设为这个值

>其他方向的stiffness默认为high

所以模型预测的stiffness是均一化后的结果，把它映射到k_min和k_max之间，就是k_low的预测值，就是 **C.2 Stiffness Magnitude(7)** 那个公式的用模型近似预测

总之就是好像要把方向传进去，然后设置是tcp还是global，然后传进去就可以了

看了看论文里面的东西，它吐出来的都是基于global坐标系的数据

"...reconstructed following Eq. 6 by replacing the force direction with the **direction from the reference pose to the virtual target**."  
（通过将力方向替换为**从参考位姿到虚拟目标的方向**来重构公式 6。）

好吧，我之前写反了

但是那个矩阵运算，貌似正向反向算出来的结果是一样的，这个是线性代数的技巧

见他妈的鬼了，这该死的hydra框架，flip_up_v3有个yaml，然后workspace conv好像也有个yaml，他妈的megaconf读取时是不会自动读取的，该死！

```
import os
from hydra import initialize, compose
from omegaconf import OmegaConf

# 1. 初始化 Hydra 配置路径（相对路径，指向存放 yaml 的文件夹）
# 假设你的 yaml 在 PyriteML/diffusion_policy/config 目录下
with initialize(config_path="PyriteML/diffusion_policy/config", version_base=None):
    # 2. 调用 compose，它会自动解析 defaults 并合并 flip_new_v3_conv.yaml
    # overrides 可以用来手动指定或覆盖变量
    cfg = compose(
        config_name="train_conv_workspace", 
        overrides=[
            "task=flip_new_v3_conv" # 对应 defaults 里的 task
        ]
    )

# 现在 cfg.task.name 和 cfg.shape_meta 都能正常读取了
print(cfg.task.name)
print(cfg.shape_meta)
```

以上是使用hydra框架初始化文件，也可以调用.hydra/config.yaml，把这个传进去，也可以的哈

```
def get_policy(ckpt_path):
	# 这个 config_path 需要指定为config.yaml的位置

    # 2. 加载并解析配置
    cfg = OmegaConf.load(config_path)
    OmegaConf.resolve(cfg) # 这一步必不可少，解析所有 ${task.name} 等变量

    # 3. 利用 Hydra 实例化整个 Policy 网络结构
    # 它会自动创建 TimmObsEncoderWithForce, DDIMScheduler, 以及 DiffusionUnet
    policy = hydra.utils.instantiate(cfg.policy)
    
    # 4. 加载权重
    payload = torch.load(ckpt_path, map_location='cpu')
    policy.load_state_dict(payload['state_dicts']['ema_model'])
        
    return policy, cfg
```

主要是policy load那个地方需要修改

```
>>> payload = torch.load("/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230/checkpoints/latest.ckpt", map_location='cpu')
>>> print(payload.keys())
dict_keys(['cfg', 'state_dicts', 'pickles'])
>>> print(payload['state_dicts'].keys())
dict_keys(['model', 'ema_model'])

```

```
policy.load_state_dict(payload['state_dicts']['ema_model'])
```

```
Executing Action: [ 4.00913414e-04  1.26073360e-02  3.20339985e-02  9.42723632e-01
 -2.12446854e-01  3.04849803e-01  1.02356255e-01  7.55791843e-01
  1.76310882e-01] 
 Force Frame: [ 0.          0.          0.          3.14159265 -0.87228285  2.58101821]
 Stiffness: [4901.207482814789, 10000, 10000, 500, 500, 500]
```

需要了解
- 训练时喂进去的数据，框架自己处理时有均一化过吗，有没有别的处理
- inference时，那个pred_action里面的normalize函数，以及取得预测后的unnormalize函数是怎么工作的，基于什么参数

在virtual target dataset那个py里面，有个`def get_normalizer(self, **kwargs) -> tuple:`
- 我怀疑就是这里造成了normalize
- 但是不确定没有完全基于它的框架走，eval时这里的normalizer可能没有被定义
```
"""
Compute normalizer for each key in the dataset.
Note: only low_dim and action are considered. Image does not need normalization.
"""
```
- return sparse_normalizer

在workspace里面

```
# compute normalizer on the main process and save to disk
sparse_normalizer_path = os.path.join(self.output_dir, "sparse_normalizer.pkl")
if accelerator.is_main_process:
	sparse_normalizer = dataset.get_normalizer()
	pickle.dump(sparse_normalizer, open(sparse_normalizer_path, "wb"))
```

"sparse_normalizer.pkl"
这玩意居然被保存到了一个地方！？

基于此，推测
- 这个东西dataset读取数据时初始化了一个normalizer
	- 这个应该是基于读进去的那一批数据算出来的
- 然后训练时就用这个normalizer

在policy里面
```
# ========= training  ============
def set_normalizer(
	self,
	sparse_normalizer: LinearNormalizer,
):
	self.sparse_normalizer.load_state_dict(sparse_normalizer.state_dict())
```

```
def get_normalizer(self, **kwargs) -> tuple:
	"""Compute normalizer for each key in the dataset.
	Note: only low_dim and action are considered. Image does not need normalization.
	"""
	sparse_normalizer = LinearNormalizer()     
```
所以这个sparse normalizer还是linerxxx的一个实例
还是需要参见 PyriteML/diffusion_policy/model/common/normalizer.py

所以这个东西的unnorm和norm应该都是基于训练时的真实数据算出来的
但是这个东西根本没有被保存啊，推理时框架应该是不知道训练时数据的内容的，除非他把normalizer参数保存在了ckpt里面，但是不太可能

那么很有可能

你在 `eval.py` 中虽然实例化了 `policy`，但你没有把这个 `normalizer` 给它！

**问题的逻辑链：**
1.  **训练时**：代码计算了 `sparse_normalizer` 并保存。
2.  **加载时**：你用 `instantiate(cfg.policy)` 创建了一个空的 `policy` 对象。这个对象内部的 `normalizer` 模块是初始状态（通常均值为 0，方差为 1，或者干脆是空的）。
3.  **预测时**：你调用 `predict_action`。模型内部执行 `self.normalizer.unnormalize(action)`。由于 `normalizer` 没有加载之前训练的数据，它没有执行任何实际的转换，直接把网络吐出的原始 \[-1, 1] 范围的小数给你了。

```
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230$ ls
checkpoints  logs.json.txt  sparse_normalizer.pkl  train.log
```
很好，我找到这个pkl文件了，那么理论上讲加载进去就可以了

```
    # --- 关键步骤：加载并传入 Normalizer ---
    if os.path.exists(normalizer_path):
        with open(normalizer_path, 'rb') as f:
            normalizer_data = pickle.load(f)
        
        # 调用 ACP Policy 里的 set_normalizer 方法
        # 这会让模型知道如何把 [-1, 1] 的预测值映射回真实单位（如 0.45米）
        policy.set_normalizer(normalizer_data)
```

应该是这么加载吧

[[2026-01-24]]

参见[[saved_from_notems_260124]]

结论：这就证实了我之前的猜测。虽然你录制时是绝对坐标，但在把数据存入 Zarr 之前，数据处理脚本（Data Pipeline）已经预先减去了一个 Offset（通常是减去第一帧的位置）。
原因：这样做是为了让模型学到“如何翻转这个物体”，而不是“如何在
x=0.456
这个特定的地点翻转这个物体”。
坏了妈的，我记得它还真的减去了，而且还说什么建议前几帧保持静止，方便减去

```
# 打印 action 的 scale (19维)
# 如果第 4 到第 9 位全都是 1.0，那就实锤了
print(normalizer_data.params_dict['action']['scale'].detach().cpu().numpy())

# 打印 action 的 offset (19维)
# 如果第 4 到第 9 位全都是 0.0，那就实锤了
print(normalizer_data.params_dict['action']['offset'].detach().cpu().numpy())

[5.8597617e+00 1.0651612e+01 7.6124768e+00 1.0000000e+00 1.0000000e+00
 1.0000000e+00 1.0000000e+00 1.0000000e+00 1.0000000e+00 5.8612380e+00
 1.0658196e+01 7.6193757e+00 1.0000000e+00 1.0000000e+00 1.0000000e+00
 1.0000000e+00 1.0000000e+00 1.0000000e+00 4.1666668e-04]
[ 0.00518501  0.691591    0.17821062  0.          0.          0.
  0.          0.          0.          0.00493455  0.69297457  0.17927837
  1.          0.          0.          0.          0.          0.
 -1.0833334 ]
```

**关于旋转（第 4-9 位 & 第 13-18 位）**

看这两个区间的数值：

- **Scale**: 1.0000000e+00, 1.0000000e+00, 1.0000000e+00, 1.0000000e+00, 1.0000000e+00, 1.0000000e+00
- **Offset**: 0.0, 0.0, 0.0, 0.0, 0.0, 0.0

结论：这就是我说的“单位映射（Identity Mapping）”。这几位的反归一化公式是：
$$
Action_{real} = Action_{raw} \times 1.0 + 0.0
$$
这证明了 6D 旋转确实是完全不经过归一化、直接透传的。你的模型吐出的原始旋转值就是物理上的旋转值。

---

如果没法3d画图，直接看那个值也能看出来

```
def sparse_obs_to_obs_sample(...):
    # ...
    base_SE3_WT.append(SE3_WT[-1])  # ← 取最后一帧
    SE3_base_i = su.SE3_inv(base_SE3_WT[id]) @ SE3_WT  # ← 相对化
    
    pose9_relative = su.SE3_to_pose9(SE3_base_i)
    sparse_obs_processed[f"robot{id}_eef_pos"] = pose9_relative[..., :3]  # ← 位置相对化
    sparse_obs_processed[f"robot{id}_eef_rot_axis_angle"] = pose9_relative[..., 3:]  # ← 旋转相对化
```

claude说相对化了

**一句话总结**：

> 训练时用的是**相对坐标**，推理时也必须用**相对坐标**，而且**基准帧必须一致**（都是观测窗口的最后一帧）。

主要是喂进去的数据也需要转换成相对坐标，不能直接把观测的绝对坐标喂进去

[[2026-01-26]]

/data/haoxiang/logs/acp_logs/2026.01.25_02.48.48_flipup_v3_conv_230/checkpoints/epoch=0600-train_loss=0.011.ckpt

/data/haoxiang/logs/acp_logs/2026.01.25_02.48.48_flipup_v3_conv_230/sparse_normalizer.pkl

```
        if id == 0:
            cam_name = "cam_104122060902"
        elif id == 1:
            cam_name = "cam_104122064489"
        else:  
            print("id error")
            break
```

rgb_0 是 global
rgb_1 是 inhand

```
git clone -b high_freq --recurse-submodules https://github.com/1JI0O/adaptive_compliance_policy.git acp_two_cam
```

eval_test 的 各种export
```bash
export PYRITE_CHECKPOINT_FOLDERS=/data/haoxiang/logs/acp_logs
export PYRITE_DATASET_FOLDERS=/data/haoxiang/acp/acp_processed
export PYRITE_RAW_DATASET_FOLDERS=/data/haoxiang/acp
```

我在尝试实现acp adaptive_compliance_policy的eval，我之前训练了一个只使用单相机的模型，它在eval时动起来比较正常。但是我尝试训练一个同时使用inhand和global相机的模型，它的表现很诡异，我在训练数据上尝试跑，基本正常，至少能动起来；但是真实部署时，它基本保持不动，推理多少轮都是如此。我将会提供单相机和多相机的eval代码，请你帮我看看

17点18分
我发现一个很严重的问题
- 之前用训练数据跑出来的图标
- 它跑完200轮，以X轴为例，也才从0.4605m移动到了0.4635m
- 但是这217轮是因为照片有217张

之前单相机训练，画出来的轨迹
- 从0.50m移动到了0.70m
- 而且有明显的弧度，最后有明显的把箱子推起来的倾向

但是双相机训练
- 画出来轨迹明显有问题，只是移动了一小段，见鬼了
- 说明训练时读进去的位置就不对

20点26分

```
(base) haoxiang@aiadm-desktop:~/acp_eval_data_logs$ ls
rollout_step_0.npy    rollout_step_112.npy  rollout_step_128.npy  rollout_step_16.npy  rollout_step_32.npy  rollout_step_48.npy  rollout_step_64.npy  rollout_step_80.npy  rollout_step_8.npy
rollout_step_104.npy  rollout_step_120.npy  rollout_step_136.npy  rollout_step_24.npy  rollout_step_40.npy  rollout_step_56.npy  rollout_step_72.npy  rollout_step_88.npy  rollout_step_96.npy

/home/haoxiang/acp_eval_data_logs

```

```
# 🔥 [改进版] 保存数据用于本地分析和训练
# =======================================================
save_dir = "eval_data_logs"
os.makedirs(save_dir, exist_ok=True)

# 1. 准备输入数据 (Numpy 格式)
numpy_batch = {k: v.detach().cpu().numpy() for k, v in obs_batch['sparse'].items()}

# 2. 打包所有信息
save_data = {
	'obs_batch': numpy_batch,           # 输入
	'base_pose9': base_pose9,            # 还原基准
	'pred_action_rel': all_pred_actions, # 模型原始输出
	'pred_action_abs': all_pred_actions_absolute, # 最终执行指令
	'step_t': t
}

# 3. 保存 (建议使用 .npz 压缩，或者 .npy)
save_path = os.path.join(save_dir, f"rollout_step_{t}.npy")
np.save(save_path, save_data)

print(f"💾 Full debug data saved to {save_path}")
```

[[2026-01-27]]

```
=== RGB_0 Statistics ===
    Min: [0.]
    Max: [1.]
    Mean: [0.5]
    Std: [0.28867513]

🚨🚨 严重警告 🚨🚨
Normalizer 记录的 RGB 最大值是 1.0 (接近 1.0)。
这说明训练数据是 [0, 1] 的 Float。
👉 你在 eval.py 中必须把图片除以 255.0！
   rgb_0 = rgb_raw.transpose(...) / 255.0

=== EEF Position Statistics ===
    Min: [-0.00066032 -0.00010771 -0.00043002]
    Max: [0.00045925 0.00040329 0.00039154]

✅ 正常
位置最大值是 0.00045925378799438477。这看起来像是米 (m)。

```

```
========================================
🔍 [DEBUG] Zarr Raw Data Statistics
========================================
RGB_0 Type: uint8
RGB_0 Range: Min=0, Max=255
RGB_0 Shape: (201, 720, 1280, 3)
👉 Zarr stores images as [0, 255] (uint8).
========================================
```

```
========================================
🔍 [DEBUG] Pre-Buffer Data Stats (Step 0)
========================================
Processed RGB_0 Shape: (3, 224, 224)
Processed RGB_0 Max:   207
Processed RGB_0 Type:  uint8
👉 Data entering buffer is [0, 255].
❌  THIS IS WRONG if normalizer expects [0, 1].
========================================
```

真相大白！这就是导致"真机不动"的根本原因。

我们现在有了完整的证据链：

1.  **Normalizer** (`check_normalizer.py`): 明确记录 RGB 图像的最大值是 1.0。这意味着模型训练时，输入是 \[0, 1] 的浮点数。
2.  **Dataset** (`eval_test.py`): 明确显示从 Zarr 读取并在 Buffer 里的数据是 \[0, 255] 的 `uint8`。

**后果：**
在推理（eval）时，你喂给模型的像素值是它预期值的 **255 倍**。

- 对于模型来说，这不仅仅是"过曝"，这是**数值爆炸**。
- 神经网络的中间层（Activation）会瞬间饱和，导致输出无效动作（通常是死区内的极小值或 0），所以机器人纹丝不动。

```
common_type_conversions.py

def obs_rgb_preprocess(
    obs: dict,
    obs_output: dict,
    reshape_mode: str,
    shape_meta: dict,
):
    """Pre-process the rgb data in the obs dictionary as inputs to policy network.

    This function does the following to the rgb keys in the obs dictionary:
    * Unpack/unzip it, if the rgb data is still stored as a compressed zarr array (not recommended)
    * Reshape the rgb image, or just check its shape.
    * Convert uint8 (0~255) to float32 (0~1)
    * Move its axes from THWC to TCHW.
    Since this function unpacks the whole key, it should only be used for online inference.
    If used in training, so the data length is the obs horizon instead of the whole episode len.

    Args:
        obs: dict with keys from shape_meta.obs
        obs_output: dict with the same keys but processed images
        reshape_mode: One of 'reshape', 'check', or 'none'.
        shape_meta: the shape_meta from task.yaml
    """
```

```
Step 0 Action Detail:
  Current Pos:     [0.470932, -0.325791, -0.319381]
  Pred VT (Goal):  [0.470959, -0.325821, -0.319391]
  👉 Pulling (mm): [0.027, -0.030, -0.010]
  Pred Stiffness:  9973.22
  (Ref Motion mm): [0.003, -0.005, -0.004]
press enter

Step 1/201 ---------------------

Step 1 Action Detail:
  Current Pos:     [0.477214, -0.320283, -0.316584]
  Pred VT (Goal):  [0.484102, -0.313637, -0.327693]
  👉 Pulling (mm): [6.888, 6.646, -11.109]
  Pred Stiffness:  8721.33
  (Ref Motion mm): [0.685, 0.563, 0.591]
  
Step 3/201 ---------------------

Step 3 Action Detail:
  Current Pos:     [0.490347, -0.308009, -0.309824]
  Pred VT (Goal):  [0.498137, -0.291829, -0.316616]
  👉 Pulling (mm): [7.790, 16.181, -6.792]
  Pred Stiffness:  9871.64
  (Ref Motion mm): [0.716, 0.604, 0.158]
press enter

```
这个是用训练数据推理跑出来的，我感觉有点奇怪
- 第0步，模型预测不要动
- 第1步，模型开始有大的移动了
- 但是在真实部署环境中，如果第0步预测不动，那么后续填入队列的都是一样的位置，那么就回到了第0步预测的情况
- 这个和训练数据测试的情况不一样，训练数据每一步喂进去的都是真实位置，所以肯定会动

11点55分
学长，我按照eval流程用测试数据推理了一下，我感觉问题可能是这个

step0的预测位置和当前位置基本没差别，位置差只有\[0.003, -0.005, -0.004]
step1的当前位置读取的是真实数据，和step0的位置不一样，然后基于此的预测位置和当前位置就有区别了，位置差变成了\[0.685, 0.563, 0.591]

对于部署情况，step0的预测位置基本没动，这个预测位置又会被填充进动作队列，一轮推理完成后取动作时还是这个位置，等同于回到了step0的情况，就进入了死循环

我感觉可能要先人为让机械臂动一下，然后模型才能正常预测

你再去看一下，训练时有没有对喂进去的数据进行padding
我的意思是，它有没有默认对第一帧padding，即使长度是足够的，这涉及到模型是否能学到冷启动

看看有没有padding！

参见[[saved_npy_logs]]，里面记录了很多后来修改的信息