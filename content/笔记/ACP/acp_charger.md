[[2026-01-26]]
```
(base) haoxiang@aiadm-desktop:~/acp_bicam$ cd /data/zihao/data/foar
(base) haoxiang@aiadm-desktop:/data/zihao/data/foar$ ls
charger_v2  chop  peel  shovel  shovel.tar  wipe  wipe_general

```

虽然一共有3个相机目录，但是有2个global，还有1个inhand
cam_035622060973
这个是最上面的global相机，用这个，还有inhand，一起去训练

cam_104122062823
这个是inhand，要用

cam_840412062188
这个是斜着的，不要用

```
tmux new -s acp_charger
```

```
/data/haoxiang/data/charger_v2
```

```bash
# where the collected raw data folders are
export PYRITE_RAW_DATASET_FOLDERS=/data/haoxiang/data
# where the post-processed data folders are
export PYRITE_DATASET_FOLDERS=/data/haoxiang/data/
# Each training session will create a folder here.
export PYRITE_CHECKPOINT_FOLDERS=/data/haoxiang/logs/acp_charger_logs

```

```
input_dir = pathlib.Path(
    os.environ.get("PYRITE_RAW_DATASET_FOLDERS") + "/charger_v2"
)
output_dir = pathlib.Path(os.environ.get("PYRITE_DATASET_FOLDERS") + "/charger_v2_acp_processed")
```

```
Structure of /data/haoxiang/data/charger_v2/train/scene_0001/lowdim/lowdim.h5:
Dataset: force_torque_063047 (shape=(8637, 6), dtype=float32)
Dataset: joint_positions_063047 (shape=(8637, 7), dtype=float32)
Dataset: tcp_pose_063047 (shape=(8637, 7), dtype=float32)
Dataset: tcp_vel_063047 (shape=(8637, 6), dtype=float32)
Dataset: timestamp (shape=(8637,), dtype=int64)
```

还是global是0，inhand是1

```
# 初始化子模块配置
git submodule init

# 拉取所有子模块的代码
git submodule update
```

sampler里面最大时间差改成了20
只要是5和10的，都改成了20
后来改成了100，这个基本就是极限了

