[[2026-01-21]]
# 总架构参考

将 **Adaptive Compliance Policy (ACP)** 的模型权重迁移到 **RISE 风格** 的部署架构中，是一个非常好的工程实践。RISE 的部署代码（特别是 RISE-2）结构清晰、模块化程度高，非常适合作为通用的机器人推理框架。

由于 ACP 的核心特性在于**自适应顺应性（同时输出位置和刚度/阻尼）**，而 RISE 主要是**位姿控制**，因此在适配时，你需要重点关注**输入数据的对齐**和**输出指令的解析**。

以下是分模块的适配思路：

### 1. 核心类替换：Model Wrapper (大脑)

RISE 的 `eval.py` 中初始化的是 `RISE` 或 `RISE2` 类。你需要将其替换为 ACP 的模型类。

*   **思路**：
    *   保留 RISE 的 `load_checkpoint` 逻辑，但要实例化 ACP 的网络定义（通常是一个 MLP 或 RNN/Transformer）。
    *   **注意 Config 的映射**：RISE 使用 `config.yaml` 来定义网络超参（层数、维度）。你需要为 ACP 也创建一个类似的 `.yaml` 配置文件，或者解析 ACP 训练时保存的 `variant.json` / `args.json`，确保加载模型时网络结构参数与权重文件完全一致。
    *   **接口封装**：建议编写一个 Wrapper 类，让 ACP 模型的 `forward` 函数看起来像 RISE 一样。例如，ACP 可能需要 `(obs, h_state)`，而 RISE 只需要 `(obs)`，你可以在 Wrapper 里维护隐藏状态（如果是 RNN）。

### 2. 输入处理：Observation Adapter (眼睛与感知)

这是最容易出错的地方。RISE 极度依赖视觉（点云/图像），而 ACP 通常强依赖**本体感知（Proprioception）**和**力/力矩（Force/Torque）**。

*   **数据流改造**：
    *   **RISE 逻辑**：`Get RGB-D -> Point Cloud -> Voxel -> Tensor`。
    *   **ACP 适配逻辑**：你需要去查看 ACP 的 `Dataloader` 或 `Env` 里的 `get_observation()` 函数。
    *   **构建 Tensor**：
        1.  **Joint State**：从 `Agent` 获取关节角度 `q` 和速度 `dq`。
        2.  **EE Pose**：从 `Agent` 获取末端位姿（注意是四元数还是旋转矩阵，顺序是 `xyzw` 还是 `wxyz`，这必须与 ACP 训练时完全一致）。
        3.  **Force/Torque**：这是 ACP 的灵魂。你需要确保 `Agent` 类能读取 F/T 传感器数据，并且进行**去重力补偿（Gravity Compensation）**和**坐标系转换**（F/T 传感器坐标系 -> 末端坐标系）。
*   **归一化（Normalization）**：
    *   RISE 使用 `process_state` 或 `ImageProcessor` 进行归一化。
    *   ACP 训练时一定计算了 `state_mean`, `state_std`。你需要将这些统计数据加载进来，在送入模型前手动对 `(q, dq, force)` 进行 `(x - mean) / std` 处理。

### 3. 输出解析：Action Decoder (手与执行)

这是两者区别最大的地方。RISE 输出的是 `Target Pose`，而 ACP 输出的是 `Target Pose` + `Impedance Parameters`。

*   **维度拆解**：
    *   RISE 的输出通常是 `[x, y, z, rot..., gripper]`。
    *   ACP 的输出通常是一个拼接向量，你需要根据训练代码将其切片（Slicing）。
    *   **Slice 1**: `Delta Pose` 或 `Next Pose`（期望位置）。
    *   **Slice 2**: `Stiffness` (刚度 K) 和 `Damping` (阻尼 D)。
*   **反归一化**：
    *   同样需要使用 ACP 训练时的 Action 统计数据将模型输出还原为物理单位（N/m, Ns/m, m）。
*   **后处理**：
    *   RISE 有 `EnsembleBuffer` 做时序平滑。如果 ACP 是单步 RL/IL 策略，可能不需要 Ensemble，直接取最新一帧即可；如果 ACP 也是预测轨迹块（Chunking），则可以复用 RISE 的 Ensemble 逻辑。

### 4. 硬件接口改造：Agent Class (驱动层)

RISE 的 `Agent` 类通常只实现了 `set_tcp_pose(pose)`。要部署 ACP，你的机器人控制器必须支持**阻抗控制（Impedance Control）**或**导纳控制（Admittance Control）**。

*   **改造思路**：
    *   在 `Agent` 类中新增一个方法，例如 `step_impedance(pose, stiffness, damping)`。
    *   **如果机器人支持原生阻抗**（如 Franka, Kuka）：直接将 ACP 输��的 K/D 参数下发给底层控制器。
    *   **如果机器人仅支持位置控制**（如 UR 的标准模式）：你可能需要在 Python 层实现一个简化的**导纳控制器（Admittance Controller）**。
        *   逻辑是：`Target_Real_Robot = Target_Model + (Force_Measured - Force_Desired) / K`。
        *   但 ACP 的初衷就是变刚度，所以最好使用支持力控接口的机器人。

### 5. 坐标系对齐：Projector (空间变换)

RISE 的 `Projector` 非常复杂，因为它要处理 相机 -> 基座 的变换。

*   **ACP 的简化**：
    *   如果 ACP 是基于状态（State-based）训练的，它通常直接在**基座坐标系（Base Frame）**或**末端坐标系（End-effector Frame）**下工作。
    *   **任务**：确认 ACP 训练数据中的 Force 和 Pose 是相对于哪个坐标系的。
    *   如果是相对于基座的，确保你的 `Agent` 读取的状态也是相对于基座的。
    *   如果是相对于当前末端的（Delta Action），确保执行时是在当前末端坐标系下叠加增量。

### 总结适配路线图

1.  **Config 迁移**：把 ACP 的参数做成 YAML，套用 RISE 的配置读取流程。
2.  **Agent 升级**：重写 `eval_agent.py`，增加读取 F/T 传感器和下发刚度参数的接口。
3.  **预处理移植**：把 ACP 训练代码中的 `dataset.py` 里的归一化逻辑扣出来，塞进 `eval.py` 的循环里。
4.  **推理替换**：在 `inference_mode` 下，把 `RISE(cloud)` 换成 `ACP(state, force)`。
5.  **执行改造**：解析输出，同时发送位置和刚度指令。

通过这种方式，你实际上是借用了 RISE 优秀的代码骨架（Loop结构、Logger、配置管理、可视化流程），但填充了 ACP 的“灵魂”（输入特征和控制策略）。


---
# 深入到细节

你找到的线索非常关键，`train_diffusion_unet_image_workspace.py` 确实是入口，而且你提到的 `unwrap_model` 也印证了它使用了 HuggingFace Accelerate 库。

经过深入代码库（特别是 `PyriteML` 子模块），我找到了你最想知道的答案：**ACP 的 Policy 到底在哪里接收参数并返回动作**。

### 1. 核心代码位置

ACP 的核心推理逻辑隐藏在 **`PyriteML/diffusion_policy/policy/diffusion_unet_timm_mod1_policy.py`** 文件中（注意文件名里的 `mod1`）。

在这个类中，有一个专门用于推理的方法 **`predict_action`**。这就是你在寻找的那个“给参数、拿结果”的地方。

### 2. ACP 的“那行代码”长什么样？

不像 RISE 那么直接的 `policy(cloud)`，ACP 的调用方式是这样的：

```python
# 假设你已经像这样加载了模型：
# policy = hydra.utils.instantiate(cfg.policy)
# policy.load_state_dict(torch.load("checkpoint.ckpt"))
# policy.eval()

# 1. 构造输入字典 (这是最恶心的部分，必须嵌套 'sparse' 键)
# 假设 obs_dict 是你的原始观测数据（图像、力、位姿），还没有归一化
obs_input = {
    "sparse": obs_dict  # <--- 必须包这一层！
}

# 2. 调用推理 (这就对应你的 pred_raw_action = policy(...))
with torch.inference_mode():
    result = policy.predict_action(obs_input)

# 3. 获取结果
# ACP 内部已经帮你做了归一化和反归一化，出来的直接就是物理动作
action = result["sparse"] 
```

### 3. 为什么说它“架构诡异”？

你的感觉非常准确，ACP 的封装确实比 RISE 厚重很多，主要原因如下：

1.  **内置归一化**：
    *   RISE 在 `eval.py` 里手动算 `(val - min) / (max - min)`。
    *   ACP 把归一化逻辑**写死在 Policy 类里了**。`predict_action` 函数的第一行代码就是调用 `self.sparse_normalizer.normalize(obs)`。这意味着你**必须**传入原始数据（Raw Data），千万别自己在外面手动归一化，否则就重复了。

2.  **字典套娃**：
    *   它使用了 `obs["sparse"]` 这种键名，是因为 ACP 设计时考虑了“稀疏（Sparse）”和“稠密（Dense）”两种模态的混合，虽然绝大多数时候你只用 Sparse。

3.  **Encoder 内置**：
    *   RISE 是在外面算好 Point Cloud 特征再送进去。
    *   ACP 的 `policy` 内部包含了一个 `TimmObsEncoderWithForce`，它会在 `predict_action` 内部自动把图像跑一遍 ResNet/ViT，把力数据跑一遍 MLP，然后拼接起来。

### 4. 给你的 RISE 风格部署代码建议

既然你想用 RISE 的风格写，你可以把 ACP 的这个 Policy 当作一个“黑盒”，这样写：

```python
# ==========================================
# 你的新 eval.py (伪代码)
# ==========================================

# ... 初始化 Robot, Camera 等 ...

# 加载 ACP 模型 (这一步最难，建议直接复用 workspace 的加载逻辑)
from PyriteML.diffusion_policy.workspace.train_diffusion_unet_image_workspace import TrainDiffusionUnetImageWorkspace
workspace = TrainDiffusionUnetImageWorkspace(cfg)
workspace.load_checkpoint("path/to/ckpt")
policy = workspace.model
policy.eval()

# 你的控制循环
with torch.inference_mode():
    for t in range(max_steps):
        # 1. 获取数据 (RISE 风格)
        img = camera.get_image()       # (C, H, W)
        proprio = robot.get_state()    # (N,)
        force = robot.get_force()      # (6,)
        
        # 2. 拼凑 ACP 需要的字典 (这是关键！)
        # 具体的键名必须去查你的 yaml 配置文件 (shape_meta)
        obs_dict = {
            "camera_0": torch.from_numpy(img).unsqueeze(0).to(device),
            "robot_state": torch.from_numpy(proprio).unsqueeze(0).to(device),
            "wrench": torch.from_numpy(force).unsqueeze(0).to(device)
        }
        
        # 3. 核心调用 (一行代码解决)
        # 注意：这里不需要手动归一化！Policy 内部会做！
        result = policy.predict_action({"sparse": obs_dict})
        
        # 4. 获取动作
        # result["sparse"] 已经是反归一化后的物理动作了 (B, Horizon, Action_Dim)
        raw_action_sequence = result["sparse"].squeeze(0).cpu().numpy()
        
        # 5. 执行 (取第一个动作，或者做 Receding Horizon)
        action_to_execute = raw_action_sequence[0]
        robot.step(action_to_execute)
```

**总结**：
不用去管 `forward` 或者 `__call__`，死死盯住 **`policy.predict_action(obs)`** 这个方法即可。它就是你要找的那个“输入参数、返回结果”的接口。

---

# 更细节的参考

感谢你提供的 `shape_meta`！这是拼图中最关键的一块。现在我们可以清晰地构建出 `eval.py` 中构造 `obs_dict` 的完整逻辑。

这个配置���息量非常大，它揭示了：
1.  **输入模态**：你需要采集图像、末端位置、末端旋转（需要转为 6D）、力数据。
2.  **输入 Key**：`rgb_0`, `robot0_eef_pos`, `robot0_eef_rot_axis_angle`, `robot0_eef_wrench`。
3.  **时序要求**：`horizon` 参数决定了你需要维护多长的历史 Buffer。
4.  **输出含义**：Action 是 19 维向量，包含了 `Reference Pose (9)` + `Virtual Target (9)` + `Stiffness (1)`。

---

### 针对你的配置，完整的 RISE 风格数据构造逻辑

请将以下代码逻辑替换掉你 `eval.py` 里的数据准备部分。

#### 1. 准备阶段：Buffer 和 Converter

首先，你需要根据配置里的 `horizon` 初始化 Buffer。你需要去你的 `task` 配置里查一下 `${task.sparse_obs_low_dim_horizon}` 具体是多少（通常是 2 或 4）。假设是 `N_OBS`。

```python
from collections import deque
import numpy as np
import torch
from utils.transformation import xyz_rot_transform  # 复用 RISE 的工具函数

# === 配置参数 (请从你的 yaml 中读取真实值) ===
N_OBS_RGB = 1         # sparse_obs_rgb_horizon
N_OBS_LOWDIM = 2      # sparse_obs_low_dim_horizon (假设值，请确认)
N_OBS_WRENCH = 16     # sparse_obs_wrench_horizon (对于 causal conv，这个通常比较长，比如 16)

# === 初始化 Buffer ===
# 使用 deque 来自动维护滑动窗口
buffer_rgb = deque(maxlen=N_OBS_RGB)
buffer_pos = deque(maxlen=N_OBS_LOWDIM)
buffer_rot = deque(maxlen=N_OBS_LOWDIM)
buffer_wrench = deque(maxlen=N_OBS_WRENCH)

def reset_buffers():
    buffer_rgb.clear()
    buffer_pos.clear()
    buffer_rot.clear()
    buffer_wrench.clear()
```

#### 2. 循环阶段：采集与构造字典

这是最核心的部分。注意 `robot0_eef_rot_axis_angle` 需要特殊处理，因为机器人的原始反馈通常是四元数，而模型输入要的是 6D 旋转。

```python
# === 在 eval 循环内部 ===
with torch.inference_mode():
    # 1. --- 采集原始数据 ---
    # 图像: (C, H, W), float32, range [0, 1]
    raw_img = camera.get_image() # 假设返回 numpy (H, W, C) uint8
    img_tensor = torch.from_numpy(raw_img.transpose(2, 0, 1)).float() / 255.0
    
    # 机器人状态: Pos (3), Quat (4)
    tcp_pose = robot.get_tcp_pose() # [x, y, z, qx, qy, qz, qw]
    raw_pos = tcp_pose[:3]
    raw_quat = tcp_pose[3:]
    
    # 力数据: Wrench (6)
    raw_wrench = robot.get_wrench() # [Fx, Fy, Fz, Tx, Ty, Tz] (务必去重力!)

    # 2. --- 预处理 (转换旋转表示) ---
    # 利用 RISE 的工具函数将 Quat -> Rotation 6D
    # 注意：ACP 配置里写的是 robot0_eef_rot_axis_angle，但下面 type 是 rotation_6d
    # 这是一个命名坑，实际上要看 rotation_rep: rotation_6d
    rot_6d = xyz_rot_transform(
        raw_quat, 
        from_rep="quaternion", 
        to_rep="rotation_6d"
    ).flatten() # 应该是 6 维向量

    # 3. --- 更新 Buffer ---
    buffer_rgb.append(img_tensor)
    buffer_pos.append(raw_pos)
    buffer_rot.append(rot_6d)
    buffer_wrench.append(raw_wrench)

    # Padding: 如果是第一帧，把 Buffer 填满，防止长度不够报错
    if len(buffer_pos) == 1:
        while len(buffer_rgb) < N_OBS_RGB: buffer_rgb.append(img_tensor)
        while len(buffer_pos) < N_OBS_LOWDIM: buffer_pos.append(raw_pos)
        while len(buffer_rot) < N_OBS_LOWDIM: buffer_rot.append(rot_6d)
        while len(buffer_wrench) < N_OBS_WRENCH: buffer_wrench.append(raw_wrench)

    # 4. --- 拼装 Batch 输入 (关键步骤) ---
    # 目标结构: Dict["sparse"][Key] -> Tensor(B, T, D)
    
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

    # 5. --- 推理 ---
    # policy.predict_action 内部会自动调用 Normalizer
    result = policy.predict_action(obs_batch)
    
    # 6. --- 解析输出 ---
    # result['sparse'] shape: (1, Horizon, 19)
    raw_action = result['sparse'].squeeze(0).cpu().numpy()[0] # 取第一步动作

    # 7. --- 动作解码 (根据你的 shape: 19) ---
    # 9 (Ref Pose) + 9 (Virtual Target) + 1 (Stiffness)
    
    # Slice 1: Reference Pose (通常用于普通位置控制)
    ref_pos = raw_action[0:3]
    ref_rot_6d = raw_action[3:9]
    
    # Slice 2: Virtual Target (用于阻抗控制的平衡点)
    vt_pos = raw_action[9:12]
    vt_rot_6d = raw_action[12:18]
    
    # Slice 3: Stiffness (刚度)
    stiffness_val = raw_action[18] # 这是一个归一化的值还是物理值？
    # 注意：ACP 的 VirtualTargetDataset 可能对 stiffness 做了特殊处理
    # 如果输出是 [0, 1]，你可能需要映射回 [K_min, K_max]

    # 8. --- 执行 ---
    # 如果你的机器人支持阻抗控制，把 vt_pos, vt_rot, stiffness 发下去
    # 记得把 6D rot 转回 quaternion
    vt_quat = xyz_rot_transform(vt_rot_6d, from_rep="rotation_6d", to_rep="quaternion")
    
    robot.impedance_control(pos=vt_pos, quat=vt_quat, stiffness=stiffness_val)
```

### 特别提醒

1.  **关于 `N_OBS_WRENCH`**：
    *   如果你的模型是 `causalconv` (w.o. FFT)，这个 horizon 通常比 `rgb` 和 `pos` 长得多（例如 16 帧或 32 帧）。
    *   **千万不要写成 1 或 2**，否则卷积层会报错尺寸不匹配，或者 Padding 太多导致推理结果也是错的。
    *   请务必去 `config/task/flip_new_v3.yaml` 里找 `sparse_obs_wrench_horizon` 的值。

2.  **关于 `rotation_rep` 的坑**：
    *   配置里的 Key 叫 `robot0_eef_rot_axis_angle`，这个名字极具误导性，听起来像轴角（Axis-Angle, 3维）。
    *   但是下面的 `type` 和 `rotation_rep: rotation_6d` 明确指出了它实际上存储的是 **6D 旋转表示**。
    *   所以你在上面的代码第 2 步中，必须把机器人的四元数转成 6D 向量（长度为 6），而不能只给 3 维或 4 维。

3.  **Action 的 19 维**：
    *   ACP 同时输出了 `Reference Pose` 和 `Virtual Target`。在实际部署时，你应该**只使用 Virtual Target** 发给阻抗控制器。Reference Pose 往往是用于辅助训练或者做前馈的，除非你的控制器明确需要这两个输入。

---

For each key, set T equal to that key’s configured observation horizon
说明那个T就是horizon

