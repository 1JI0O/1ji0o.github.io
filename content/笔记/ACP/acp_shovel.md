[[2026-01-26]]
```
(base) haoxiang@aiadm-desktop:~/acp_bicam$ cd /data/zihao/data/foar
(base) haoxiang@aiadm-desktop:/data/zihao/data/foar$ ls
charger_v2  chop  peel  shovel  shovel.tar  wipe  wipe_general

```

```
tmux new -s acp_shovel
```

```
/data/haoxiang/data/shovel
```

```bash
# where the collected raw data folders are
export PYRITE_RAW_DATASET_FOLDERS=/data/haoxiang/data
# where the post-processed data folders are
export PYRITE_DATASET_FOLDERS=/data/haoxiang/data/
# Each training session will create a folder here.
export PYRITE_CHECKPOINT_FOLDERS=/data/haoxiang/logs/acp_shovel_logs

# 下面这两个我觉得可以不用管
# Hardware configs.
export PYRITE_HARDWARE_CONFIG_FOLDERS=$HOME/git/RobotTestBench/applications/ur_test_bench/config
# Logging folder.
export PYRITE_CONTROL_LOG_FOLDERS=$HOME/data/control_log
```

cam_104122060902
global 0

cam_104122064489
inhand 1

```
Structure of /data/haoxiang/data/shovel/train/scene_0001/lowdim/lowdim_filled.h5:
Dataset: ee_command_062046 (shape=(17422, 1), dtype=float32)
Dataset: ee_state_062046 (shape=(17422, 1), dtype=float32)
Dataset: force_torque_062046 (shape=(17422, 6), dtype=float32)
Dataset: tcp_pose_062046 (shape=(17422, 7), dtype=float32)
Dataset: tcp_vel_062046 (shape=(17422, 6), dtype=float32)
Dataset: timestamp (shape=(17422,), dtype=int64)
```

```
# 初始化子模块配置
git submodule init

# 拉取所有子模块的代码
git submodule update
```

```
(pyrite) haoxiang@aiadm-desktop:~/acp_shovel/PyriteML$ wandb offline
W&B offline. Running your script from this directory will only write metadata locally. Use wandb disabled to completely turn off W&B.
(pyrite) haoxiang@aiadm-desktop:~/acp_shovel/PyriteML$ wandb disabled
W&B disabled.

```

```
HYDRA_FULL_ERROR=1 accelerate launch --gpu_ids 5 --num_processes=1 train.py \
    --config-name=train_spec_workspace \
```


```
(pyrite) haoxiang@aiadm-desktop:~/acp_shovel/PyriteML$ HYDRA_FULL_ERROR=1 accelerate launch --gpu_ids 5 --num_processes=1 train.py     --config-name=train_conv_workspace 

```
22点36分 唉，妈的，之前写成conv了，我是说怎么一直关不掉