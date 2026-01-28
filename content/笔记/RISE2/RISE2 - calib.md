### 1. 核心物理链条

我们的目标是建立一条从 **全局相机** 到 **机器人基座** 的路径。
由于标定板（Marker）是静止放在桌面上的，它是连接两者的桥梁。

**路径：**
`全局相机` $\xrightarrow{观测}$ `标定板` $\xleftarrow{观测}$ `手眼相机` $\xrightarrow{固定}$ `机械臂末端(TCP)` $\xrightarrow{运动学}$ `机器人基座`

### 2. 数学公式推导 (右乘规则)

在矩阵运算中（$P_{new} = T \times P_{old}$），变换矩阵是从右向左累积的。我们要计算的是 $T_{global\_cam \to base}$。

#### 第一阶段：计算标定板在基座下的位置 ($T_{marker \to base}$)
我们先从机器人这端推导，因为这端的链条是已知的。

$$T_{marker \to base} = T_{tcp \to base} \times T_{inhand \to tcp} \times T_{marker \to inhand}$$

*   $T_{tcp \to base}$：即 `tcp.npy`（机器人基座到末端的位姿）。
*   $T_{inhand \to tcp}$：即 `constants.py` 中的 `INHAND_CAM_TCP`（手眼相机到末端的固定偏移）。
*   $T_{marker \to inhand}$：即 `extrinsics.npy` 中手眼相机的条目（手眼相机看到的标定板）。
    *   *注：假设 extrinsics 存储的是标准 OpenCV 结果 ($T_{marker \to cam}$)，这里直接乘即可。*

#### 第二阶段：计算全局相机到基座的变换 ($T_{global\_cam \to base}$)
现在我们要把全局相机接入链条。
我们知道：$P_{base} = T_{marker \to base} \times P_{marker}$
我们也知道：$P_{marker} = T_{global\_cam \to marker} \times P_{global\_cam}$

代入得到：
$$P_{base} = T_{marker \to base} \times (T_{global\_cam \to marker}) \times P_{global\_cam}$$

所以最终变换矩阵是：
$$T_{global\_cam \to base} = T_{marker \to base} \times T_{global\_cam \to marker}$$

**关键点来了：**
`extrinsics.npy` 里的全局相机数据通常是 $T_{marker \to global\_cam}$（即标定板在相机系下的位姿）。
因此，$T_{global\_cam \to marker}$ 是它的**逆矩阵**。

---

```
(rise) haoxiang@aiadm-desktop:/data/haoxiang/realdata_sampled_20251206/calib/1765003071096$ ls
2025126.txt  devices.npy  extrinsics.npy  imgs  intrinsics.npy  task_ids.txt  tcp.npy
(rise) haoxiang@aiadm-desktop:/data/haoxiang/realdata_sampled_20251206/calib/1765003071096$ python
Python 3.8.20 | packaged by conda-forge | (default, Sep 30 2024, 17:52:49) 
[GCC 13.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import numpy as np
>>> data1=np.load("devices.npy")
>>> data2=np.load("extrinsics.npy",allow_pickle=True)
>>> data3=np.load("intrinsics.npy",allow_pickle=True)
>>> print(data1)
['104122063550' '750612070851' '043322070878']
>>> print(data2)
{'104122063550': [array([[ 0.99800987,  0.0473839 , -0.04160596,  0.09131218],
       [ 0.01259173, -0.79627006, -0.60481025, -0.02083665],
       [-0.06178785,  0.60308271, -0.79528203,  0.81078743],
       [ 0.        ,  0.        ,  0.        ,  1.        ]])], '750612070851': [array([[ 0.99976273, -0.01776386, -0.01260671,  0.03190299],
       [-0.02163389, -0.74221963, -0.66980743, -0.04119657],
       [ 0.00254142,  0.66992124, -0.74242782,  0.71301011],
       [ 0.        ,  0.        ,  0.        ,  1.        ]])], '043322070878': [array([[-0.99165932, -0.11323355, -0.06156257, -0.01839625],
       [-0.11445517,  0.99328834,  0.01668173, -0.07886141],
       [ 0.05926045,  0.02358875, -0.99796381,  0.41037016],
       [ 0.        ,  0.        ,  0.        ,  1.        ]])]}
>>> print(data3)
{'104122063550': array([[914.81945801,   0.        , 630.63891602,   0.        ],
       [  0.        , 913.88464355, 352.51571655,   0.        ],
       [  0.        ,   0.        ,   1.        ,   0.        ]]), '750612070851': array([[922.37457275,   0.        , 637.55419922,   0.        ],
       [  0.        , 922.46069336, 368.37557983,   0.        ],
       [  0.        ,   0.        ,   1.        ,   0.        ]]), '043322070878': array([[909.7265625 ,   0.        , 645.75042725,   0.        ],
       [  0.        , 909.66497803, 349.66162109,   0.        ],
       [  0.        ,   0.        ,   1.        ,   0.        ]])}

>>> data4=np.load("tcp.npy",allow_pickle=True)
>>> print(data4)
[ 4.00511920e-01 -8.16337997e-05  1.70088246e-01 -4.94665815e-04
  6.80938028e-05  9.99999821e-01  3.17835365e-04]


```

[rise-policy/RISE-2: [CoRL 2025] RISE-2: A Generalizable Imitation Learning Policy](https://github.com/rise-policy/RISE-2/)
# Calibration Guide

[](https://github.com/rise-policy/RISE-2/blob/main/assets/docs/CALIB.md#-calibration-guide)

As a 3D policy, we need to determine the transformation matrix between the robot base and the global camera. The calibration files are essential for both policy training and policy deployment. Here we provide sample calibration files for both single-arm and dual-arm platforms. The following fields are required for this codebase:

- `camera_serials`: a list of camera serials;
- `camera_serials_global`: a list of global camera serials;
- (single-arm) `camera_serial_inhand`: the camera serial of the in-hand camera;
- (dual-arm) `camera_serial_inhand_left` and `camera_serial_inhand_right`: the camera serial of the left / right in-hand camera;
- `intrinsics`: the dictionary that contains the 3x3 intrinsics of all cameras;
- (single-arm) `camera_to_robot`: the transformation matrix from the camera coordinate to the robot base coordinate;
- (dual-arm) `camera_to_robot_left` and `camera_to_robot_right`: the 4x4 transformation matrix from the camera coordinate to the left/right robot base coordinate.

The calibration results are stored in a dictionary in a `npy` file, using `np.save(..., allow_pickle = True)`.

Here, we provide an example of dual-arm calibration results.

```
{
    'type': 'robot',
    'camera_serials': ['105422061350', '104122064161', '104122061330'],
    'camera_serials_global': ['105422061350'],
    'camera_serial_inhand_left': '104122064161',
    'camera_serial_inhand_right': '104122061330',
    'intrinsics': {
        '105422061350': 
            array([[912.4466 ,   0.     , 633.4127 ],
                   [  0.     , 911.4704 , 364.21265],
                   [  0.     ,   0.     ,   1.     ]], dtype=float32),
        '104122064161': 
            array([[915.71423,   0.     , 638.86804],
                   [  0.     , 915.29736, 357.55472],
                   [  0.     ,   0.     ,   1.     ]], dtype=float32),
        '104122061330': 
            array([[909.9401 ,   0.     , 626.91187],
                   [  0.     , 909.0405 , 354.72583],
                   [  0.     ,   0.     ,   1.     ]], dtype=float32)
    },
    'camera_to_robot_left': {
        '105422061350': 
            array([[ 0.02733019, -0.99962234,  0.00270202, -0.12419845],
                   [-0.92083234, -0.02622826, -0.38907513,  0.5822531 ],
                   [ 0.38899893,  0.00814523, -0.9212016 ,  0.69930893],
                   [ 0.        ,  0.        ,  0.        ,  1.        ]], dtype=float32)
    },
    'camera_to_robot_right': {
        '105422061350': 
            array([[-0.00864751, -0.9971284 ,  0.07523859,  0.16229412],
                   [-0.92715275, -0.02019016, -0.37413925,  0.5794803 ],
                   [ 0.37458393, -0.07299308, -0.9243155 ,  0.70862824],
                   [ 0.        ,  0.        ,  0.        ,  1.        ]], dtype=float32)}
    }
```


[rise-policy/RISE: [IROS 2024] 📈 RISE: 3D Perception Makes Real-World Robot Imitation Simple and Effective](https://github.com/rise-policy/rise)
# Calibration Guide

[](https://github.com/rise-policy/RISE/blob/main/assets/docs/CALIB.md#-calibration-guide)

Our experimental platform includes an inhand camera and several global cameras. Here are the recommended calibration steps.

1. **Hand-Eye Calibration**. The transformation matrix from the inhand camera to the robot's tool center point (tcp), denoted as `INHAND_CAM_TCP`, remains constant and is established through hand-eye calibration techniques. After hand-eye calibration, this matrix is stored in `dataset/constants.py`. Generally, this matrix remains unchanged, so hand-eye calibration is typically required only once. Subsequent recalibration is necessary only if the position of the inhand camera relative to the robotic arm is altered.
    
2. **Camera Calibration**. We utilize ArUco markers for camera calibration. The opencv-python package includes an ArUco detector, enabling us to derive the transformation matrix from the camera to the marker. To proceed, move the robot to a specific pose, print out the marker, and place it where all cameras can detect it. Save the robot's pose in `tcp.npy` within the calibration folder, and store the transformation matrices from all cameras to the marker as a dictionary in `extrinsics.npy` in the calibration folder. Whenever there's a change in the camera position, this step needs to be repeated for recalibration. Please refer to the calibration directory in our sample data for details.
    
3. **Fetch Camera Intrinsics**. Camera intrinsics usually can be obtained via the camera api. Store all camera intrinsics as a dict in `INTRINSICS` in `dataset/constants.py`. For deployment, please also modify the `intrinsic` property of `Agent` in `eval_agent.py`.


来自rise1的constants.py
```
import numpy as np

from utils.constants import *


TO_TENSOR_KEYS = ['input_coords_list', 'input_feats_list', 'action', 'action_normalized']

# camera intrinsics
INTRINSICS = {
    "043322070878": np.array([[909.72656250, 0, 645.75042725, 0],
                              [0, 909.66497803, 349.66162109, 0],
                              [0, 0, 1, 0]]),
    "750612070851": np.array([[922.37457275, 0, 637.55419922, 0],
                              [0, 922.46069336, 368.37557983, 0],
                              [0, 0, 1, 0]])
}

# inhand camera serial
INHAND_CAM = ["043322070878"]

# transformation matrix from inhand camera (corresponds to INHAND_CAM[0]) to tcp
INHAND_CAM_TCP = np.array([
    [0, -1, 0, 0],
    [1, 0, 0, 0.077],
    [0, 0, 1, 0.2665],
    [0, 0, 0, 1]
])

```

以上是给出的已有信息。我要做的事情是
- 我正在将rise1格式采集的单臂数据转化为rise2格式，正在进行calib标定转化阶段
- 你需要做的
	- 确定如何通过一个矩阵乘法链条，基于已有的数据，生成camera_to_robot矩阵
	- 生成一段代码，基于给定的npy文件路径，生成camera_to_robot矩阵
- 以上步骤需要分布完成，现在，请你进行第一步