---
title: "RISE: 3D Perception Makes Real-World Robot  Imitation Simple and Effective"
---
RISE: 3D Perception Makes Real-World Robot  Imitation Simple and Effective
[[2025-11-29]]

[RISE: 3D Perception Makes Real-World Robot Imitation Simple and Effective](https://rise-policy.github.io/)

**结性对比：**
- **相同点：** 两者都利用了 **Diffusion Model** 强大的分布建模能力来预测**连续的多模态动作轨迹**，从而避免了关键帧方法的卡顿和单一性。
- **不同点（核心创新）：** RISE 将 Diffusion Policy 的“眼睛”从 **2D 平面视觉** 换成了 **3D 空间视觉**
    - **Diffusion Policy** 认为“只要我看过足够多的图片，我就能模仿动作”。
    - **RISE** 认为“仅仅看图片不够，我需要理解三维几何结构，这样即使换个角度看，我也知道杯子在哪里”。

**一句话概括：** RISE 就是把 Diffusion Policy 强大的动作生成头，接在了一个高效的 3D 点云感知头之后，从而解决了原版 Diffusion Policy 对摄像头视角敏感和空间理解不足的问题。

[rise-policy/RISE: [IROS 2024] 📈 RISE: 3D Perception Makes Real-World Robot Imitation Simple and Effective](https://github.com/rise-policy/rise)
我怀疑要理解的代码是这个

[[2025-12-03]] 19点48分 clone了一份在D:\my_programs\RISE

---

# I. INTRODUCTION

Finally, the action features are decoded into continuous trajectories by a diffusion head

### 3. "Diffusion head" 与 Diffusion Policy 的区别和联系

**简短结论：** 它们的**“发动机”（生成动作的方式）是一样的**，区别在于**“燃料”（输入的视觉信息）不同**。

- **联系 (Connection)：**
    - **核心算法一致：** RISE 这里的 "Diffusion Head" 指的就是直接沿用了 **Diffusion Policy (Chi et al., 2023)** 这篇论文里提出的动作生成机制。
    - **工作原理一致：** 它们都把“做动作”看作一个**去噪过程**。从高斯噪声开始，经过几十步迭代，像画画一样慢慢“画”出一条平滑的机器人运动轨迹。
- **区别 (Difference)：**
    - **Diffusion Policy (原版)：** 它的输入（Conditioning）通常是 **2D 图片**。它根据 2D 图片特征来去噪生成动作。它像是一个**看照片**干活的工人。
    - **RISE (本文方法)：** 它的输入（Conditioning）是经过稀疏编码器处理后的 **3D 点云特征**。它根据 3D 空间特征来去噪生成动作。它像是一个**戴着 3D 眼镜**干活的工人。

**总结：**  
RISE 并没有重新发明动作生成器，它直接借用了 Diffusion Policy 强大的**解码头 (Decoder)**，但是把前面负责“看世界”的**编码器 (Encoder)** 从 2D 换成了更强的 3D 稀疏感知架构。

```
Thus, many researchers learn such mapping in an end-to-end manner [1, 4, 21, 28, 32, 40, 47, 59, 63] and have demonstrated impressive performance across many tasks. Specifically, ACT [59] adopts a CVAE scheme [44] with transformer backbones [48] and ResNet image encoders [17] to model the variability of human data, while Diffusion Policy [4] directly utilizes diffusion process [18] to express multimodal action distributions generatively.
```
原来如此，看来这篇文章是集大成者

# II. RELATED WORK

## B. 3D Perception

### Point-based.

#### using octrees for memory footprint reduction

**Octrees（八叉树）是什么？**
想象你有一个巨大的正方体箱子（代表整个 3D 空间）。

**传统稠密方法**：把大箱子切成 $1000 \times 1000 \times 1000$ 个极小的方块。不管里面有没有东西，这 10 亿个方块的数据你都要存下来。这就叫“内存爆炸”。

**八叉树方法**：
1. 先看大箱子，里面有东西吗？有。
2. 把它切成 8 个小箱子（$2 \times 2 \times 2$）。
3. 检查这 8 个小箱子，其中 7 个是空的（空气），只有 1 个里面有物体。
4. 关键点：那 7 个空的就不管了（不存数据），只把那个有东西的箱子再切成 8 份。
5. 一直切下去，直到精度足够。

**总结**：这种“只切有东西的地方”的方法，就是八叉树。它避免了存储大量的“0”（空气），从而极大地节省了内存。


#### aggregating features across point sets directly using different network architectures

这句话的意思是：使用（与传统 CNN 不同的）网络架构，直接在点集上进行特征聚合。
这里指的是以 PointNet / PointNet++ 为代表的一类方法。

##### Point Sets (点集)
之前的 CNN 方法（包括八叉树）都是把点变成“方块”或“树”这种规则的结构。
这里的“Point Sets”是指不进行任何变形，直接把一堆坐标点 $(x_1, y_1, z_1), (x_2, y_2, z_2) \dots$ 喂给网络。

##### Different Network Architectures (不同的网络架构)
因为点是一堆没有顺序的坐标（Unordered），传统的卷积核（Convolution Kernel）没法直接在上面滑。所以需要设计全新的网络结构（比如 MLP + Max Pooling）。

##### Aggregating Features (聚合特征)
- **问题**：假设一个杯子由 1000 个点组成，每个点经过神经网络处理后都有了自己的特征（比如“我是杯底的一部分”）。
- **聚合**：机器人不需要知道 1000 个独立的特征，它需要知道“这到底是个什么东西”。
- **做法**：这一步就是把这 1000 个点的特征总结（Aggregate）成一个全局特征向量（比如取所有特征的最大值 Max Pooling）。这个全局特征就代表了“这是一个杯子”。


1. **八叉树派：** 通过优化数据结构省内存。
    
2. **稀疏卷积派（本文采用）：** 通过跳过空白计算省时间。
    
3. **直接点处理派（PointNet）：** 放弃网格化，直接由点聚合出特征。

# III. METHOD

## B. Transformer with Sparse Point Tokens

### sparse positional encoding

**Transformer 的缺陷：**
Transformer（最初是处理文字的）处理数据时是并行的。如果你给它一堆数据（Token A, Token B, Token C），它默认不知道 A 在 B 的左边，还是 B 在 C 的上面。它只把它们看作一袋散乱的珠子。

**图像的处理（2D）：**
处理图片时，像素是排列整齐的网格（Grid），位置编码很容易做（比如第一行第一列）。

**点云的难点（3D Sparse）：**
点云是稀疏且无序的。这里有一个点，那里有一个点，中间全是空气。你不能像图片那样数格子。

**RISE 的方案：**
既然不能数格子，那就直接把每个点的 $(x, y, z)$ 真实坐标变成一种 Transformer 能看懂的“身份证”，贴在每个点的数据上。这就是 Sparse Positional Encoding（稀疏位置编码）。

#### 第二步：数学公式详细拆解
这里涉及到了如何把坐标变成向量。

##### 1. 坐标归一化
**公式**：
$$pos_k = \frac{k}{v} + c, \quad k \in \{x,y,z\}$$

**含义**：这是一个简单的线性变换，把物理世界的米（m）转换成适合神经网络处理的数值。
- $k$：原始坐标，比如 $x=0.5$ 米。
- $v$ (Voxel Size)：体素大小（步长）。比如 $v=0.01$，意味着每 1 厘米算一格。这把连续的坐标变成了离散的索引。
- $c$ (Center Offset)：偏移量。为了保证坐标都是正数或者在特定范围内，不让负数影响计算。
- $pos_k$：算出来的新坐标索引。

##### 2. 维度分配 (Splitting Dimensions)
**公式**：
$$d_x = d_y = \lfloor d/3 \rfloor, \quad d_z = d - d_x - d_y$$

**含义**：Transformer 的特征向量长度是 $d$（比如 512 维）。我们需要把这 512 维分配给 X、Y、Z 三个轴。
- **做法**：平均分。X轴拿 1/3，Y轴拿 1/3，Z轴拿剩下的。
- 最终的位置编码向量：$SPE = [SPE_x, SPE_y, SPE_z]$（由三个轴的编码向量拼接而成）。

##### 3. 正弦/余弦编码 (The Sine/Cosine Magic)
**公式**：
$$SPE^k_{(pos,2i)} = \sin(\dots)$$
$$SPE^k_{(pos,2i+1)} = \cos(\dots)$$

**这是什么？** 这是经典的 Transformer 位置编码（Sinusoidal Positional Encoding）。

**为什么要用 Sin/Cos？**
- 如果你直接把坐标数字（比如 100）喂给网络，数值太大，网络很难学。
- Sin/Cos 把位置变成了频率。这就好比用一组不同频率的波形来标记位置。
- 这种编码方式能够让模型很好地理解**“相对距离”**（比如 A 和 B 离得有多近）。

**解释**：对于每一个轴（比如 X轴），它生成一个向量。向量的偶数位用 $\sin$ 算，奇数位用 $\cos$ 算。

**总结这一步**：
我们把一个点 $(0.5, 0.2, 1.0)$ 变成了三个长长的向量，拼在一起，形成了一个独一无二的“位置指纹”。


### encoder and decoder

#### 1. Transformer Encoder（编码器）：场景理解与特征融合
- **角色**：全局信息的“阅读者”和“整合者”。
- **输入 (Input)**：
  - 源头：来自稀疏 3D CNN 提取的点云特征（$N$ 个 Token）。
  - 身份证：加上了 稀疏位置编码 (Sparse Positional Encoding)。如果没有这个，Encoder 就不知点在何处。
  - 特点：输入是一个不定长、无序的点集序列。
- **核心机制 (Process)**：自注意力机制 (Self-Attention)
  - 它让每一个孤立的点去“观察”所有其他的点。
  - 目的：搞清楚点与点之间的几何与语义关系（例如：点 A 发现它和点 B 组成了杯柄，且位于点 C 代表的桌面上）。
- **输出 (Output)**：
  - 上下文感知的点云特征 (Context-Aware Tokens)。
  - 特点：形状没变（还是 $N$ 个 Token），但内容变了。现在的每个点都包含了全局的环境信息。

#### 2. Transformer Decoder（解码器）：关键信息提取与动作映射
- **角色**：带着问题的“提问者”和“决策者”。
- **输入 (Input)**：
  - 参考资料 (K/V)：Encoder 输出的那 $N$ 个已经理解了环境的点云特征。
  - 查询探针 (Q)：一个可学习的、固定的 Readout Token（读出令牌）。
- **核心机制 (Process)**：交叉注意力机制 (Cross-Attention)
  - Readout Token 作为一个“探针”进入 Decoder。
  - 它向 Encoder 的结果发起“查询”：“为了执行下一步动作，我需要关注环境里的哪些部分？”
  - 通过注意力权重，它自动聚焦于关键物体（如杯子），并忽略无关背景（如墙壁）。
- **输出 (Output)**：
  - 动作特征 (Action Feature)。
  - 特点：从 $N$ 个点被压缩成了 1 个 固定长度的向量。这个向量高度浓缩了“我要做什么”的意图。

#### 3. 为什么是这种架构？（核心逻辑）
RISE 之所以采用 Encoder-Decoder 结构，是为了解决两个空间的“不匹配”问题：
- **Encoder 解决“无序到有序”**：
  它处理的是 3D 几何空间（散乱的点），它的任务是不遗漏任何环境细节，建立全局认知。
- **Decoder 解决“发散到聚焦”**：
  它处理的是 动作意图空间（单一指令），它的任务是从繁杂的环境信息中，通过 Readout Token 精准提纯出对动作有用的信息，并将其格式化为 Diffusion Head 能够接受的输入。

# V. CONCLUSION

“消融实验”（Ablation Study）在深度学习论文中通常指：**控制变量法**。即通过替换、删除或修改模型的一部分，来看看这一部分到底有多重要。
主要体现在实验F和G

# APPENDIX

## B. Implementation Details

Network.
The sparse 3D encoder is implemented based on MinkowskiEngine with a voxel size of 5mm, which outputs a set of point feature vectors at the dimension of 512

Encoder 的作用是提取**特征（Feature）**。这 512 个数字不再是坐标或颜色，而是高度抽象的**语义信息**。
- 含义： 这 512 个数字组合起来，可能代表：“这不仅是一个点，它是**杯子把手**的一部分，它表面是**光滑**的，它是**弯曲**的，而且它适合**被抓取**。”
- 要描述这么丰富的信息（形状、材质、曲率、功能、它属于哪个物体），6 个数字肯定不够，需要 512 个“神经元”同时激活来表达。

---
>那么sparse positional encoding干了什么，它的输入究竟是xyz点坐标还是什么

这是一个非常关键的区分。很多时候大家会把“网络提取的特征”和“位置编码”搞混。

简单直接的回答：
Sparse Positional Encoding (SPE) 的输入，纯粹就是点云中每个点的 $(x, y, z)$ 几何坐标，没有别的。
它完全不看这个点是红是绿，也不看这个点属于杯子还是桌子，它只关心这个点在哪里。

为了让你彻底看清它的工作流程，我们把它和 Encoder（MinkowskiEngine） 放在一起对比，看它们是怎么**“兵分两路”最后又“殊途同归”**的。

### 1. 流程图解：兵分两路
想象一个点云数据 $P$，它包含几百个点。对于其中的某一个点（假设索引为 $i$），它有两个属性：
- 特征属性： 它是红色的，它是圆的（颜色、形状）。
- 几何属性： 它的坐标是 $(0.5, 0.2, 0.8)$。

在 RISE 模型中，这两个属性是分开处理的：

**第一路：视觉特征流 (Visual Stream) —— 由 Encoder 负责**
- 输入： 整个点云数据（包含坐标和颜色）。
- 处理者： Sparse 3D Encoder (MinkowskiEngine)。
- 干了什么： 经过层层卷积，提取语义。
- 输出： 一个 512 维的向量 $F_{feature}$。
- 含义： “这是一个杯把手，表面光滑。”（注意：CNN 具有平移不变性，它可能不太清楚这个杯把手绝对位置在哪，只知道它长什么样）。

**第二路：位置编码流 (Position Stream) —— 由 SPE 负责**
- 输入： 仅仅是该点的坐标 $(x, y, z)$。
- 处理者： Sparse Positional Encoding 模块（就是那堆 $\sin/\cos$ 数学公式）。
- 干了什么： 把 3 个坐标数字，通过正弦波扩充，变成 512 个数字。
- 输出： 一个 512 维的向量 $F_{pos}$。
- 含义： “这个位置在左上方，坐标是 x=0.5...”。

### 2. 殊途同归：融合 (Fusion)
在进入 Transformer 之前，这两路数据汇合了。
- 操作：相加 (Element-wise Addition)
$$\text{Transformer Input} = F_{feature} + F_{pos}$$

原来的 $F_{feature}$： 我知道我是个杯把手，但我不知道我在哪。
原来的 $F_{pos}$： 我知道这里有个位置坐标，但我不知道这里是啥东西。

相加后： “我是个杯把手（特征），而且我位于桌子的左上角（位置）。”


---

[[2025-12-04]]
参见[[RISE复现]]
