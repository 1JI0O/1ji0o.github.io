[Note.ms](https://note.ms/1ji0o)
[[2026-01-24]]
```
https://github.com/1JI0O/adaptive_compliance_policy.git

from scipy.spatial.transform import Rotation as R

stiffness_vector = [k_x, K_MAX, K_MAX, K_ROT, K_ROT, K_ROT]

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

/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230/.hydra


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


Xet Storage is enabled for this repo, but the 'hf_xet' package is not installed. Falling back to regular HTTP download. For better performance, install the package with: `pip install huggingface_hub[hf_xet]` or `pip install hf_xet`
pytorch_model.bin: 100%|████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 605M/605M [00:47<00:00, 12.9MB/s]
key_model_map adding wrench key: robot0_eef_wrench
rgb keys:          ['rgb_0']
low_dim_keys keys: ['robot0_eef_pos', 'robot0_eef_rot_axis_angle']
vit will use the CLS token. feature_aggregation (avg) is ignored!
/home/flexiv/git/adaptive_compliance_policy/eval/eval.py:133: FutureWarning:

You are using `torch.load` with `weights_only=False` (the current default value), which uses the default pickle module implicitly. It is possible to construct malicious pickle data which will execute arbitrary code during unpickling (See https://github.com/pytorch/pytorch/blob/main/SECURITY.md#untrusted-models for more details). In a future release, the default value for `weights_only` will be flipped to `True`. This limits the functions that could be executed during unpickling. Arbitrary objects will no longer be allowed to be loaded via this mode unless they are explicitly allowlisted by the user via `torch.serialization.add_safe_globals`. We recommend you start setting `weights_only=True` for any use case where you don't have full control of the loaded file. Please open an issue on GitHub for any issues related to this experimental feature.

Executing Action: [ 4.00913414e-04  1.26073360e-02  3.20339985e-02  9.42723632e-01
 -2.12446854e-01  3.04849803e-01  1.02356255e-01  7.55791843e-01
  1.76310882e-01] 
 Force Frame: [ 0.          0.          0.          3.14159265 -0.87228285  2.58101821]
 Stiffness: [4901.207482814789, 10000, 10000, 500, 500, 500]



```
(pyrite) haoxiang@aiadm-desktop:/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230$ ls
checkpoints  logs.json.txt  sparse_normalizer.pkl  train.log
```
很好，我找到这个pkl文件了，那么理论上讲加载进去就可以了

/data/haoxiang/logs/acp_logs/2026.01.20_04.50.05_flip_new_v3_conv_230/sparse_normalizer.pkl


    def predict_action(
        self,
        obs: Dict,
    ) -> Dict[str, torch.Tensor]:
        """
        obs: include keys from shape_meta['sample']['obs'],
        """
        obs_dict_sparse = obs["sparse"]

        ##
        ## =================  Part one: Sparse =================
        ##
        nobs_sparse = self.sparse_normalizer.normalize(obs_dict_sparse)

        batch_size = next(iter(nobs_sparse.values())).shape[0]

        # condition through global feature
        sparse_nobs_encode = self.obs_encoder(nobs_sparse)

        # empty data for action
        cond_data = torch.zeros(
            size=(batch_size, self.sparse_action_horizon, self.action_dim),
            device=self.device,
            dtype=self.dtype,
        )
        cond_mask = torch.zeros_like(cond_data, dtype=torch.bool)

        # run sampling
        sparse_naction_pred = self.conditional_sample(
            condition_data=cond_data,
            condition_mask=cond_mask,
            local_cond=None,
            global_cond=sparse_nobs_encode,
            **self.kwargs,
        )

        # unnormalize prediction
        assert sparse_naction_pred.shape == (
            batch_size,
            self.sparse_action_horizon,
            self.action_dim,
        )
        sparse_action_pred = self.sparse_normalizer["action"].unnormalize(
            sparse_naction_pred
        )

        self.sparse_nobs_encode = sparse_nobs_encode
        self.sparse_naction_pred = sparse_naction_pred
        
        # action
        # 9 for reference pose, 9 for virtual target, 1 for stiffness

        result = {"sparse": sparse_action_pred}
        return result, sparse_naction_pred[..., 18], sparse_naction_pred



    if os.path.exists(normalizer_path):
        with open(normalizer_path, 'rb') as f:
            normalizer_data = pickle.load(f)
        
        # 调用 ACP Policy 里的 set_normalizer 方法
        # 这会让模型知道如何把 [-1, 1] 的预测值映射回真实单位（如 0.45米）
        policy.set_normalizer(normalizer_data)

        p_dict = normalizer_data.params_dict
        print(p_dict)
        input("Press Enter to continue...")
    

ParameterDict(
    (action): Object of type: ParameterDict
    (rgb_0): Object of type: ParameterDict
    (robot0_eef_pos): Object of type: ParameterDict
    (robot0_eef_rot_axis_angle): Object of type: ParameterDict
    (robot0_eef_wrench): Object of type: ParameterDict
  (action): ParameterDict(
      (input_stats): Object of type: ParameterDict
      (offset): Parameter containing: [torch.FloatTensor of size 19]
      (scale): Parameter containing: [torch.FloatTensor of size 19]
    (input_stats): ParameterDict(
        (max): Parameter containing: [torch.FloatTensor of size 19]
        (mean): Parameter containing: [torch.FloatTensor of size 19]
        (min): Parameter containing: [torch.FloatTensor of size 19]
        (std): Parameter containing: [torch.FloatTensor of size 19]
    )
  )
  (rgb_0): ParameterDict(
      (input_stats): Object of type: ParameterDict
      (offset): Parameter containing: [torch.FloatTensor of size 1]
      (scale): Parameter containing: [torch.FloatTensor of size 1]
    (input_stats): ParameterDict(
        (max): Parameter containing: [torch.FloatTensor of size 1]
        (mean): Parameter containing: [torch.FloatTensor of size 1]
        (min): Parameter containing: [torch.FloatTensor of size 1]
        (std): Parameter containing: [torch.FloatTensor of size 1]
    )
  )
  (robot0_eef_pos): ParameterDict(
      (input_stats): Object of type: ParameterDict
      (offset): Parameter containing: [torch.FloatTensor of size 3]
      (scale): Parameter containing: [torch.FloatTensor of size 3]
    (input_stats): ParameterDict(
        (max): Parameter containing: [torch.FloatTensor of size 3]
        (mean): Parameter containing: [torch.FloatTensor of size 3]
        (min): Parameter containing: [torch.FloatTensor of size 3]
        (std): Parameter containing: [torch.FloatTensor of size 3]
    )
  )
  (robot0_eef_rot_axis_angle): ParameterDict(
      (input_stats): Object of type: ParameterDict
      (offset): Parameter containing: [torch.FloatTensor of size 6]
      (scale): Parameter containing: [torch.FloatTensor of size 6]
    (input_stats): ParameterDict(
        (max): Parameter containing: [torch.FloatTensor of size 6]
        (mean): Parameter containing: [torch.FloatTensor of size 6]
        (min): Parameter containing: [torch.FloatTensor of size 6]
        (std): Parameter containing: [torch.FloatTensor of size 6]
    )
  )
  (robot0_eef_wrench): ParameterDict(
      (input_stats): Object of type: ParameterDict
      (offset): Parameter containing: [torch.FloatTensor of size 6]
      (scale): Parameter containing: [torch.FloatTensor of size 6]
    (input_stats): ParameterDict(
        (max): Parameter containing: [torch.FloatTensor of size 6]
        (mean): Parameter containing: [torch.FloatTensor of size 6]
        (min): Parameter containing: [torch.FloatTensor of size 6]
        (std): Parameter containing: [torch.FloatTensor of size 6]
    )
  )
)

========================================
📊 训练数据物理边界揭秘:
X (前后) Range: [-0.1715, 0.1698]
Y (左右) Range: [-0.1588, 0.0290]
Z (上下) Range: [-0.1548, 0.1080]
========================================

Step 0 ---------------------
Predicted raw action: tensor([[[-2.1900e-01,  8.7473e-01,  3.1791e-01,  8.9020e-01,  4.7854e-04,
           6.2013e-02,  3.3547e-01,  8.7590e-01, -1.7360e-01, -4.4253e-01,
           1.8554e-01,  1.9168e-01,  9.6330e-01, -5.8761e-02, -1.2764e-01,
          -9.8967e-02,  8.1024e-01,  1.6708e-01,  8.2502e-01],
         [-7.0264e-01,  4.3527e-01,  3.1064e-01,  9.6259e-01,  1.8183e-03,
          -1.0877e-01,  1.6359e-01,  7.6203e-01, -2.0910e-02, -8.1361e-01,
           4.4645e-01,  4.8947e-01,  8.1722e-01,  5.5530e-02, -1.7354e-01,
          -3.6153e-02,  5.4503e-01,  1.5827e-01,  4.7358e-01],
         [-8.8565e-01,  1.5646e-01,  2.8012e-01,  9.6905e-01,  1.4756e-01,
          -4.9672e-01, -6.6962e-02,  1.0000e+00, -1.3717e-02, -8.1826e-01,
           3.5556e-01,  3.6741e-01,  9.9035e-01, -1.6827e-02, -6.2930e-02,
           1.3018e-01,  9.6704e-01,  8.8354e-02,  3.9711e-01],
         [-9.4823e-01,  1.1221e-01,  3.8020e-01,  8.4518e-01, -6.7618e-02,
          -2.7968e-01,  3.0928e-01,  9.8198e-01,  2.6731e-01, -8.8413e-01,
           1.7829e-01,  5.7114e-01,  7.7988e-01, -9.2388e-02, -4.3836e-01,
          -7.1735e-02,  9.8149e-01,  3.0025e-01,  7.2882e-01],
         [-9.4753e-01,  2.4918e-01,  2.6215e-01,  9.5410e-01, -2.2843e-01,
          -6.3379e-01, -9.1400e-02,  9.0451e-01,  2.6744e-01, -9.3927e-01,
           3.6605e-01,  4.1339e-01,  9.9072e-01, -2.7001e-01, -3.2628e-01,
          -2.6993e-01,  9.9952e-01,  6.4371e-01,  7.7554e-01],
         [-9.9323e-01,  1.5656e-01,  2.8490e-01,  9.8371e-01, -9.7908e-02,
          -2.0810e-01,  3.9103e-01,  1.0000e+00,  3.7869e-01, -9.9092e-01,
           5.2236e-02,  6.0181e-01,  8.9050e-01,  2.2604e-01, -6.3010e-01,
           4.1416e-02,  8.9451e-01,  1.2984e-01,  5.3181e-01],
         [-9.8801e-01,  3.5298e-01,  4.4356e-01,  8.0355e-01, -1.2455e-01,
          -4.4600e-01,  1.1588e-01,  8.0480e-01,  6.5933e-03, -8.9611e-01,
           3.5144e-01,  2.2624e-01,  9.5133e-01, -1.5355e-01, -3.0701e-01,
          -9.0374e-02,  9.9645e-01, -1.4865e-01,  5.6605e-01],
         [-9.9246e-01,  4.4451e-01,  2.6690e-01,  9.6452e-01, -4.4393e-01,
          -2.3134e-01,  2.1239e-01,  1.0000e+00,  1.5143e-01, -8.9002e-01,
           4.1285e-01,  7.3343e-01,  8.5036e-01, -1.4368e-01, -1.6521e-01,
          -2.7198e-01,  9.4934e-01,  4.7040e-01,  4.8615e-01],
         [-9.9330e-01,  2.8288e-01,  3.3609e-01,  8.0237e-01, -8.2232e-02,
          -2.4138e-02,  1.4322e-02,  1.0000e+00,  1.8627e-01, -9.9398e-01,
           1.1223e-01,  4.9268e-01,  8.2358e-01, -2.7733e-01, -3.3761e-01,
          -8.1982e-02,  7.8368e-01,  4.2350e-01,  6.5917e-01],
         [-9.9710e-01,  2.4024e-01,  2.4636e-01,  7.5434e-01, -1.3255e-01,
          -5.6871e-01,  1.0403e-01,  1.0000e+00,  2.2313e-01, -9.6721e-01,
           1.4859e-01,  4.2878e-01,  8.3014e-01, -2.6014e-02, -1.3957e-01,
          -1.1932e-01,  7.8332e-01,  1.7507e-01,  9.8125e-01],
         [-9.9939e-01, -4.0154e-01,  6.5581e-01,  9.1970e-01,  9.8825e-02,
          -3.5168e-01,  2.8955e-01,  1.0000e+00,  6.5170e-01, -1.0000e+00,
          -1.9919e-01,  6.5064e-01,  8.0126e-01, -3.3938e-01, -4.0874e-01,
           9.4255e-02,  1.0000e+00, -1.1094e-01,  5.1613e-01],
         [-9.9434e-01, -2.5601e-01,  4.6382e-01,  9.1475e-01, -2.5051e-01,
          -7.3016e-01,  1.4010e-01,  8.5387e-01, -1.7512e-01, -1.0000e+00,
           1.7689e-01,  5.4561e-01,  7.5900e-01, -3.1111e-01, -4.7202e-01,
          -2.1535e-02,  9.9979e-01,  2.1564e-01,  4.6238e-01],
         [-9.7796e-01,  9.7125e-03,  2.9722e-01,  4.8287e-01,  1.5129e-02,
          -4.9425e-01, -1.3273e-01,  1.0000e+00,  3.2991e-01, -8.4110e-01,
          -1.2334e-01,  3.0975e-01,  9.7194e-01, -5.5000e-01, -2.1708e-01,
          -1.2603e-01,  7.9370e-01,  4.5810e-01,  6.0581e-01],
         [-1.0000e+00, -5.3198e-02,  6.8362e-01,  1.0000e+00,  1.2357e-01,
          -5.7999e-01,  2.6753e-01,  9.0002e-01,  3.7472e-01, -7.7797e-01,
           2.7867e-01,  2.1856e-01,  9.8426e-01,  9.6792e-02, -3.9724e-01,
           1.1916e-01,  9.8231e-01, -1.1422e-01,  5.2878e-01],
         [-1.0000e+00, -2.1699e-01,  3.3812e-01,  6.0966e-01,  1.6779e-01,
          -5.6638e-01,  4.7878e-01,  7.6381e-01,  1.8711e-01, -1.0000e+00,
          -9.5275e-02,  7.5797e-01,  7.0330e-01, -2.1882e-01, -7.0035e-01,
           2.3950e-01,  8.0476e-01,  5.0412e-01,  2.1970e-01],
         [-1.0000e+00, -2.1220e-01,  7.9242e-01,  7.7966e-01,  2.5444e-01,
          -6.6998e-01,  3.9664e-02,  9.7242e-01,  1.2834e-01, -9.2151e-01,
           3.8851e-02,  8.4682e-01,  6.8923e-01, -5.1482e-01, -2.9939e-01,
          -8.3907e-02,  9.6614e-01,  2.2498e-01,  7.5205e-01]]])
Raw action to execute: [-3.8258251e-02  1.7193310e-02  1.8351575e-02  8.9020264e-01
  4.7853787e-04  6.2013313e-02  3.3547184e-01  8.7590432e-01
 -1.7359771e-01 -7.6343626e-02 -4.7609739e-02  1.6280090e-03
  9.6329600e-01 -5.8760591e-02 -1.2763779e-01 -9.8967396e-02
  8.1023842e-01  1.6707514e-01  4.5800483e+03]
Step 0:
Executing Action: [-0.07634363 -0.04760974  0.00162801  0.963296   -0.05876059 -0.12763779
 -0.0989674   0.8102384   0.16707514] 
 Force Frame: [ 0.          0.          0.         -3.14159265  0.21892256 -2.10212976]
 Stiffness: [44884673.73046875, 10000, 10000, 500, 500, 500]
```

```
"""
Evaluation.
"""
import sys
import pathlib
import os
import hydra
import torch
from omegaconf import OmegaConf
from torch.utils.data import DataLoader
import copy
import random
import wandb
import pickle
import tqdm
import numpy as np
import shutil
from collections import deque
from datetime import datetime
import cv2

import yaml
from easydict import EasyDict as edict

# 1. 算出根目录
ROOT_DIR = str(pathlib.Path(__file__).parent.parent.absolute())
# 2. 算出 PyriteML 所在的目录
PYRITE_ML_DIR = os.path.join(ROOT_DIR, 'PyriteML')

# 将这两个都加入环境变量
sys.path.append(ROOT_DIR)
sys.path.append(PYRITE_ML_DIR)

os.chdir(ROOT_DIR)

from PyriteML.diffusion_policy.workspace.base_workspace import BaseWorkspace
from PyriteML.diffusion_policy.policy.diffusion_unet_timm_mod1_policy import (
    DiffusionUnetTimmMod1Policy,
)

import PyriteUtility.spatial_math.spatial_utilities as su

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")



# from diffusion_policy.policy.diffusion_unet_image_policy import DiffusionUnetImagePolicy
from PyriteML.diffusion_policy.dataset.base_dataset import BaseImageDataset, BaseDataset

# from diffusion_policy.env_runner.base_image_runner import BaseImageRunner
from diffusion_policy.common.checkpoint_util import TopKCheckpointManager
from diffusion_policy.common.json_logger import JsonLogger
from diffusion_policy.common.pytorch_util import dict_apply, optimizer_to
from diffusion_policy.model.diffusion.ema_model import EMAModel
from diffusion_policy.model.common.lr_scheduler import get_scheduler
from accelerate import Accelerator

from scipy.spatial.transform import Rotation as R

from eval_agent import SingleArmAgent

# 图像观测：看最近 2 帧，步长为 1 (间隔约 50ms)
sparse_obs_rgb_down_sample_steps = 1
sparse_obs_rgb_horizon = 2

# 低维状态（Pose）：看最近 3 帧
sparse_obs_low_dim_down_sample_steps = 1
sparse_obs_low_dim_horizon = 3

# 力矩（Wrench）：力矩通常需要更长的历史信息。
sparse_obs_wrench_down_sample_steps = 1
sparse_obs_wrench_horizon = 32
# 动作预测（Action）：预测未来 16 帧（约 0.8s 的动作轨迹）
sparse_action_down_sample_steps = 1
sparse_action_horizon = 16

# 以上这些参数可以从yaml里面读取，先实现主干逻辑

# yaml_path = "/home/flexiv/git/adaptive_compliance_policy/PyriteML/diffusion_policy/config/train_conv_workspace.yaml"
yaml_path = "/home/flexiv/data/acp/.hydra/config.yaml"
ckpt_path = "/home/flexiv/data/acp/latest.ckpt"
max_steps = 3000
# eval_config_path = "/home/flexiv/git/adaptive_compliance_policy/eval/eval_config.yaml"
eval_config_path = "/home/flexiv/git/adaptive_compliance_policy/eval/eval_config.yaml"
normalizer_path = "/home/flexiv/data/acp/sparse_normalizer.pkl"


n_action_steps = 8  

# === 初始化 Buffer ===
# 使用 deque 来自动维护滑动窗口
buffer_rgb = deque(maxlen=sparse_obs_rgb_horizon)
buffer_pos = deque(maxlen=sparse_obs_low_dim_horizon)
buffer_rot = deque(maxlen=sparse_obs_low_dim_horizon)
buffer_wrench = deque(maxlen=sparse_obs_wrench_horizon)

action_queue = deque(maxlen=100)

# export PYRITE_CHECKPOINT_FOLDERS=/home/flexiv/data/acp

def reset_buffers():
    buffer_rgb.clear()
    buffer_pos.clear()
    buffer_rot.clear()
    buffer_wrench.clear()

OmegaConf.register_new_resolver(
    "now", 
    lambda pattern: datetime.now().strftime(pattern), 
    replace=True
)

def evaluate():

    # cfg = OmegaConf.load(yaml_path)
    # policy = hydra.utils.instantiate(cfg.policy)

    # with open(eval_config_path, "r") as f:
    #     eval_config = edict(yaml.load(f, Loader = yaml.FullLoader))
    #     # 这个主要是agent相关的config

    # # load checkpoint
    # ckpt = torch.load(ckpt_path, map_location='cpu')
    # if "state_dicts" in ckpt:
    #     policy.load_state_dict(ckpt["state_dicts"]["policy"], strict=False)
    # else:
    #     print("abnormal ckpt load!")
    #     policy.load_state_dict(ckpt, strict=False)

	# 这个 config_path 需要指定为config.yaml的位置

    # 2. 加载并解析配置
    cfg = OmegaConf.load(yaml_path)
    OmegaConf.resolve(cfg) # 这一步必不可少，解析所有 ${task.name} 等变量

    # 3. 利用 Hydra 实例化整个 Policy 网络结构
    # 它会自动创建 TimmObsEncoderWithForce, DDIMScheduler, 以及 DiffusionUnet
    policy = hydra.utils.instantiate(cfg.policy)

        # --- 关键步骤：加载并传入 Normalizer ---
    if os.path.exists(normalizer_path):
        with open(normalizer_path, 'rb') as f:
            normalizer_data = pickle.load(f)
        
        # 调用 ACP Policy 里的 set_normalizer 方法
        # 这会让模型知道如何把 [-1, 1] 的预测值映射回真实单位（如 0.45米）
        policy.set_normalizer(normalizer_data)

        # p_dict = normalizer_data.params_dict
        # print(p_dict)

        # # 1. 进入 action -> input_stats 层级
        # stats = p_dict['action']['input_stats']

        # # 2. 提取 Tensor 并转为 numpy (前3位是 XYZ)
        # min_vals = stats['min'].detach().cpu().numpy()
        # max_vals = stats['max'].detach().cpu().numpy()

        # # 3. 打印真相
        # print("\n" + "="*40)
        # print("📊 训练数据物理边界揭秘:")
        # print(f"X (前后) Range: [{min_vals[0]:.4f}, {max_vals[0]:.4f}]")
        # print(f"Y (左右) Range: [{min_vals[1]:.4f}, {max_vals[1]:.4f}]")
        # print(f"Z (上下) Range: [{min_vals[2]:.4f}, {max_vals[2]:.4f}]")
        # print("="*40 + "\n")
        
        # input("Press Enter to continue...")
    
    # 4. 加载权重
    payload = torch.load(ckpt_path, map_location=device)
    policy.load_state_dict(payload['state_dicts']['ema_model'])
    policy = policy.to(device)
    

    # set evaluation
    policy.eval()

    with open(eval_config_path, "r") as f:
        eval_config = edict(yaml.load(f, Loader = yaml.FullLoader))
        # 这个主要是agent相关的config

    # initialize agent
    Agent = SingleArmAgent
    agent = Agent(**eval_config.deploy.agent)

    # evaluation rollout
    print("Ready for rollout. Press Enter to continue...")
    input()
    
    with torch.inference_mode():
        for t in range(max_steps):

            print(f"Step {t} ---------------------")
           
            # rgb_raw,_ = agent.get_global_observation() # (H, W, 3), np.uint8
            # rgb = rgb_raw.transpose(2, 0, 1)         # (3, H, W)
            # rgb = rgb.astype(np.float32) / 255.0   # (3, H, W), float32 in [0, 1]

            rgb_raw, _ = agent.get_global_observation() # (H_raw, W_raw, 3), uint8

            # --- 新增步骤：强制缩放到 224x224 ---
            # 注意 cv2.resize 接受的是 (Width, Height)
            rgb_resized = cv2.resize(rgb_raw, (224, 224), interpolation=cv2.INTER_AREA)

            # --- 原有步骤：HWC 转 CHW ---
            rgb = rgb_resized.transpose(2, 0, 1)        # (3, 224, 224)

            # --- 原有步骤：归一化 ---
            # rgb = rgb.astype(np.float32) / 255.0        # (3, 224, 224), float32
            # 这个地方要不要除以255，需要确认


            proprio = agent.get_proprio() # [x, y, z, rot6d, gripper]
            # get_proprio 已经 xyz_rot_transform 到六元数了，不用再次转换
            end_pos = proprio[:3]
            end_rot6d = proprio[3:9]

            wrench = agent.get_wrench()
            
            # 考虑steps
            if t % sparse_obs_rgb_down_sample_steps == 0:
                buffer_rgb.append(rgb)
            if t % sparse_obs_low_dim_down_sample_steps == 0:
                buffer_pos.append(end_pos)
                buffer_rot.append(end_rot6d)
            if t % sparse_obs_wrench_down_sample_steps == 0:
                buffer_wrench.append(wrench)

            # Padding: 如果是第一帧，把 Buffer 填满，防止长度不够报错
            if len(buffer_pos) == 1:
                while len(buffer_rgb) < sparse_obs_rgb_horizon: buffer_rgb.append(rgb)
                while len(buffer_pos) < sparse_obs_low_dim_horizon: buffer_pos.append(end_pos)
                while len(buffer_rot) < sparse_obs_low_dim_horizon: buffer_rot.append(end_rot6d)
                while len(buffer_wrench) < sparse_obs_wrench_horizon: buffer_wrench.append(wrench)

            # 动作队列为空，上一批动作全部执行完后再预测
            if len(action_queue) == 0:

                # 拼装batch输入 堆叠 numpy 数组并转 Tensor
                obs_batch = {
                    "sparse": {
                        "rgb_0": torch.from_numpy(np.stack(list(buffer_rgb))).unsqueeze(0).float().to(device),                       # (1, T, 3, H, W)
                        "robot0_eef_pos": torch.from_numpy(np.stack(list(buffer_pos))).unsqueeze(0).float().to(device),  # (1, T, 3)
                        "robot0_eef_rot_axis_angle": torch.from_numpy(np.stack(list(buffer_rot))).unsqueeze(0).float().to(device), # (1, T, 6)
                        "robot0_eef_wrench": torch.from_numpy(np.stack(list(buffer_wrench))).unsqueeze(0).float().to(device)       # (1, T, 6)
                    }
                }

                result,stiffness_unnorm,raw_pred = policy.predict_action(obs_batch)
                # print("Predicted raw action:", raw_pred)
                # time 维长度是 sparse_action_horizon

                all_pred_actions = result['sparse'].squeeze(0).cpu().numpy()
                # 9 for reference pose, 9 for virtual target, 1 for stiffness

                all_pred_stiff_raw = stiffness_unnorm.squeeze(0).cpu().numpy()

                # 强制替换！把大数替换回小数
                # 刚度在第 18 位 (index 18)
                # all_pred_actions[:, 18] = all_pred_stiff_raw

                # ========================================
                # 🔥 新增：将相对动作转换为绝对动作
                # ========================================
                # 获取当前机器人的绝对位姿（用于转换基准）
                current_pose9 = np.concatenate([end_pos, end_rot6d])  # (9,)
                current_SE3 = su.pose9_to_SE3(current_pose9)  # (4, 4)

                # 遍历每一步动作，转换为绝对坐标
                all_pred_actions_absolute = []
                for i, relative_action in enumerate(all_pred_actions):
                    # 提取相对位姿和刚度
                    ref_pose9_rel = relative_action[0:9]
                    vt_pose9_rel = relative_action[9:18]
                    stiffness_val = relative_action[18]

                    # 转换为 SE3 矩阵
                    ref_SE3_rel = su.pose9_to_SE3(ref_pose9_rel)
                    vt_SE3_rel = su.pose9_to_SE3(vt_pose9_rel)

                    # 🔥 关键操作：相对 → 绝对
                    ref_SE3_abs = current_SE3 @ ref_SE3_rel
                    vt_SE3_abs = current_SE3 @ vt_SE3_rel

                    # 转回 pose9 格式
                    ref_pose9_abs = su.SE3_to_pose9(ref_SE3_abs)
                    vt_pose9_abs = su.SE3_to_pose9(vt_SE3_abs)

                    # 拼接成完整动作
                    absolute_action = np.concatenate([
                        ref_pose9_abs,      # 参考位姿（绝对）
                        vt_pose9_abs,       # 虚拟目标（绝对）
                        [stiffness_val]     # 刚度保持不变
                    ])
                    all_pred_actions_absolute.append(absolute_action)

                all_pred_actions_absolute = np.array(all_pred_actions_absolute)

                print(all_pred_actions)
                print("=" * 60)
                print(all_pred_actions_absolute)

                # 只执行前 n_action_steps
                # steps_to_execute = all_pred_actions[:n_action_steps]
                steps_to_execute = all_pred_actions_absolute[:n_action_steps]

                # 将动作推入队列
                for act in steps_to_execute:
                    action_queue.append(act)

            
            # 执行动作

            # 从队列中出队一个动作执行
            raw_action = action_queue.popleft() 

            # print("Raw action to execute:", raw_action)

            # Slice 1: Reference Pose 
            ref_pos = raw_action[0:3]
            ref_rot_6d = raw_action[3:9]

            # Slice 2: Virtual Target
            vt_pos = raw_action[9:12]
            vt_rot_6d = raw_action[12:18]

            # get step_actiion
            step_action = raw_action[9:18]

            # Slice 3: Stiffness
            stiffness_val = raw_action[18]

            # process stiffness

            # diff = np.array(vt_pos) - np.array(ref_pos)  # 原始方向向量
            # dist = np.linalg.norm(diff) # 长度
            
            # if dist < 1e-6:
            #     pass
            #     # 不能除0, 此处virtual target和ref pose重合
            #     # 此时3个方向都应该保持k_high
            # else:   
            #     low_stiff_direction = diff / dist


            # 2. 准备刚度参数
            K_MAX = 10000  # 硬
            K_MIN = 200.0   # 软
            K_ROT = 500   # 旋转刚度

            # 计算 k_low (模型输出 0~1 映射到 K_MIN~K_MAX)
            k_low = K_MIN + stiffness_val * (K_MAX - K_MIN)
            # k_low = K_MIN + stiffness_unnorm * (K_MAX - K_MIN)

            # print("stiffness raw:", stiffness_unnorm)
            

            # 3. --- 核心：计算 Force Frame ---
            # 向量方向：从 Ref 指向 VT
            diff = np.array(vt_pos) - np.array(ref_pos)
            dist = np.linalg.norm(diff)

            if dist < 1e-6:
                # 如果重合，没有特定方向，就用默认的世界坐标系（无旋转）
                # 刚度全向设为最硬
                rotation_matrix = np.eye(3)
                k_x = K_MAX 
            else:
                # --- 构建旋转矩阵 ---
                # 1. X轴：主方向
                x_axis = diff / dist
                
                # 2. Y轴：找一个辅助向量做叉乘
                temp_vec = np.array([0, 0, 1.0])
                if np.abs(np.dot(x_axis, temp_vec)) > 0.99: # 防止共线
                    temp_vec = np.array([0, 1.0, 0])
                
                y_axis = np.cross(x_axis, temp_vec)
                y_axis /= np.linalg.norm(y_axis)
                
                # 3. Z轴
                z_axis = np.cross(x_axis, y_axis)
                
                # 4. 组合成矩阵 (列向量)
                rotation_matrix = np.column_stack((x_axis, y_axis, z_axis))
                
                # 刚度：只有 X 轴是软的
                # k_x = k_low
                k_x = stiffness_val
                # 由于 policy 输出 pred_action 已经 unnorm 了，这里直接用

            if k_x > K_MAX:
                k_x = K_MAX

            force_frame = np.eye(4)
            force_frame[0:3, 0:3] = rotation_matrix
            stiffness_vector = [k_x, K_MAX, K_MAX, K_ROT, K_ROT, K_ROT]

            print(f"Step {t}:")
            print(f"Executing Action: {step_action} \n Force Frame: {force_frame}\n Stiffness: {stiffness_vector}")
            input("press Enter to continue...")

            # 接下来需要把数据（处理后）传给agent
            agent.action(step_action,force_frame,stiffness_vector,rotation_rep = "rotation_6d")

            # time.sleep(0.1) 在 action 
            # 可能有点长了，也可以把sleep放在这里
    
        agent.stop()


if __name__ == '__main__':
    reset_buffers()
    evaluate()
    # 考虑改成传参数的调用方法
```

