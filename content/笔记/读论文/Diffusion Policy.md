---
title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion"
---
Diffusion Policy: Visuomotor Policy Learning via Action Diffusion
建立于[[2025-11-29]]

关于这个和[[ACT]]的关系

- 两篇不是「谁绝对更好」，而是**侧重点和技术路线不同**。
- ACT 是较早的一条路线：**用 Transformer 学动作“块”（action chunks）的生成模型**。
- Diffusion Policy 是后来的一条路线：**用扩散模型学动作序列的生成模型**。
- 从后续社区实验和 benchmark（包括这篇 Diffusion Policy 自己的实验）来看，**在不少任务上，扩散式策略往往比 ACT 这类直接生成动作序列的模型更强、更稳定，尤其在多模态、高难度任务上**，但代价是计算开销更大、推理更慢。

也难怪，ACT是2023-04-23的成果，扩散的这篇是2024-03-14的

我是弱智，我看不懂，但是身残志坚要学习，请你说说这个论文讲了什么，详细介绍introduction部分，然后我会开始阅读，并且将过程中我遇到的不会的地方展示给你看，然后请你详细解释那些地方

[Google AI Studio](https://aistudio.google.com/prompts/1JiFkJhrbaZMpMKUaPBKNwwo1mr60u8pM)

# Abstract

## receding horizon control 和 ACT 中 chunk

虽然都是“预测一整块”，但两者的侧重点略有不同（特别是在典型实现上）：

#### A. Diffusion Policy 的做法：侧重“滚动更新” (Receding Horizon)
- **预测：** 算出未来 16 步。
- **执行：** **只执行前 8 步**（或者更少，比如前 4 步）。
- **扔掉：** 剩下的 8 步直接作废。
- **重算：** 马上开始新一轮预测。
- **原因：** 主要是因为 Diffusion 生成速度相对慢，而且环境会变，它希望通过频繁的“再预测”来纠正误差。就像开车，虽然看得很远，但随时准备修方向。
#### B. ACT 的做法：侧重“时间平滑” (Temporal Ensembling)

ACT 虽然也用了 Chunking，但它在推理（Inference）时通常有一个更高级的技巧，叫 **Temporal Ensembling（时间系综/时间平均）**。

- **时刻 1：** 预测了第 1~100 步。
- **时刻 2：** 预测了第 2~101 步。
- **时刻 3：** 预测了第 3~102 步。
- **执行时：** 机器人在第 5 步该怎么动？它会把之前几次预测里**覆盖到第 5 步的那个动作拿来取平均**。
- **原因：** ACT 里的 Transformer 算得比较快，通过这种“叠加平均”，能把动作做得丝般顺滑，把任何可能的抖动都抹平了。

你可以把它们的关系理解为：

- **核心思想（一样）：** 拒绝短视，都要**预测未来的一整段（Chunk / Horizon）**。
- **ACT (Chunking)：** 像是一个为了**极致丝滑**而生的策略，经常把多次预测重叠起来取平均（Temporal Ensembling）。
- **Diffusion Policy (RHC)：** 像是一个为了**稳健和抗干扰**而生的策略，看一段，走一半，赶紧再看一段，确保自己没走偏。

## policy learning

**Policy Learning 的两种主流玩法：**

#### A. 也是这篇论文用的：Imitation Learning (模仿学习 / Behavior Cloning)

- **比喻：** **“跟教练学”**。
- **怎么做：** 找个奥运冠军（人类专家）来骑车，记录下他每一秒看到的画面和他手上的动作。
- **学习过程：** 机器人拿着这些数据，死记硬背。
    - “哦，冠军在这个弯道（画面）是这么转把的（动作），我也这么转。”
    - “冠军在这个坑（画面）是捏了刹车的（动作），我也捏。”
- **Diffusion Policy 就是这一类。** 它通过学习人类专家的演示数据，学会了一个能生成动作的“策略”。
#### B. 另一种常见玩法：Reinforcement Learning (强化学习)
- **比喻：** **“摔打中自学”**。
- **怎么做：** 没人教，直接让机器人上车骑。
    - 没骑好摔了 
         扣分（惩罚） 
         机器人记住了：“刚才那个动作不行，下次换一个”。
    - 骑了一百米没倒 
         加分（奖励） 
		 机器人记住了：“刚才那个动作很棒，下次还这么干”。
- **学习过程：** 通过无数次的试错（Trial and Error），慢慢练出一个好策略。

# 1 Introduction

【【公开课·2025春季】李飞飞·斯坦福CS231n计算机视觉课程（全18讲）】 https://www.bilibili.com/video/BV1b1agz5ERC/?p=14&share_source=copy_web&vd_source=278a61d55ec01fcfa1504d3f39f06bbe
这一集是关于扩散模型的
但是这里面是Rectified Flow，和本论文用的DDPM不同，前者好很多。

你说的这种“直接预测动作”的方法，在强化学习（RL）里通常被称为 **Deterministic Policy（确定性策略）**，比如著名的算法 **DDPG (Deep Deterministic Policy Gradient)** 或者 **TD3** 里的 Actor 网络。

它和论文 Figure 1 中的 **(a) Explicit Policy（显式策略）** **完全就是同一个东西**。

此外，在你的回答中，你除了给出详细的例子，也应该用更理性的语言描述总结下，我是弱智，但是我也能同时也需要看一些专业性的好懂的话

# 2 Diffusion Policy Formulation

## 2.1 Denoising Diffusion Probabilistic Models

这里的关键参数（后面会用到）：

$\epsilon_{\theta}$ (Noise Prediction Network)：那个聪明的大厨（神经网络），这是我们要训练的核心。

$\gamma$ (Learning Rate)：每次修补的步子迈多大。

$\sigma$ (Noise)：每次手抖的幅度有多大。

## 2.3 Diffusion for Visuomotor Policy Learning

关于horizon
  
在机器人、控制理论和人工智能的语境下，**"Horizon"** 这个词千万不要翻译成“地平线”。

它最准确的翻译应该是：**“视界”** 或者 **“时间窗”**。

在 AI 论文里看到 **Horizon**，直接把它替换成 **“时长”** 或 **“步数”** 就能读通了。

- **Observation Horizon:** 看了过去多少步。
    
- **Prediction Horizon:** 猜了未来多少步。
    
- **Execution Horizon:** 走了实际多少步。

Visual observation conditioning:
把$O_t$输入进去了，作为条件，也就是在给定当前画面的条件下，只预测动作。这样十分节省算力

**为了让机器人控制实时、精准，我们果断放弃了“预测未来画面”这个看起来很酷但很慢的功能。我们只把画面当成“参考条件”，哪怕去噪 100 次，画面也只看一次，算力全部集中在打磨动作上。**

# 3 Key Design Decisions

## 3.1 Network Architecture Options

### Note that the choice of noise prediction network εθ is independent of visual encoders

- **Visual Encoders（眼睛/Sec 3.2）**：
  - 负责看图的。比如 ResNet。
  - 它的任务是把几百万个像素变成一串特征向量（Observation Embedding）。

- **Noise Prediction Network $\epsilon_\theta$（大脑/Sec 3.1）**：
  - 负责思考的。就是上面说的 CNN 或 Transformer。
  - 它的任务是拿着眼睛给的特征，去修补动作。


作者的意思是：
这就像配电脑。

- 你可以选 ResNet（眼睛）搭配 CNN（大脑）。
- 你也可以选 ResNet（眼睛）搭配 Transformer（大脑）。
- 这一节（3.1）我们只讨论怎么选大脑（CPU），下一节（3.2）再讨论怎么选眼睛（显卡/摄像头）。互不干扰。

### FiLM 技术

#### FiLM (Feature-wise Linear Modulation) 核心笔记
##### 1. 本质定义
- 全称：Feature-wise Linear Modulation（特征级线性调制）。
- 角色：一种强力的条件注入机制 (Conditioning Mechanism)。
- 一句话概括：将外部信息（如视觉观察 $O_t$）转化为一套“缩放”和“平移”参数，去动态修改主干网络（如动作生成 CNN）的内部特征分布。

##### 2. 核心公式
$h_{out} = \gamma(z) \cdot h_{in} + \beta(z)$

- $h_{in}$：主干输入（正在处理的动作特征，经过 Normalization 归一化后的）。
- $z$：条件输入（视觉特征向量 + 时间步 $k$）。
- $\gamma(z)$：缩放系数 (Scale/Gain)，相当于“音量旋钮”，放大或抑制某类特征。
- $\beta(z)$：平移系数 (Shift/Bias)，相当于“基准滑块”，改变特征的底数或趋势。

##### 3. 运作流程 (Pipeline)
1. 提取条件：视觉编码器提取图像特征向量 $z$。
2. 生成参数：一个小的 MLP 网络接收 $z$，算出针对每一层卷积、每一个通道的 $\gamma$ 和 $\beta$。
3. 特征清零：主干 CNN 的动作特征先经过 GroupNorm，消除原有统计特征（均值归0，方差归1）。
4. 强制改写：使用生成的 $\gamma$ 和 $\beta$ 对动作特征进行通道级 (Channel-wise) 的线性变换，注入视觉意图。

##### 4. 核心特性：Feature-wise (通道级)
- 操作粒度：针对 特征通道 (Channel)，而非时间步 (Time Step)。
- 影响范围：全局性影响。一旦某个通道（例如控制“向左”）被 FiLM 激活，该通道下的整条时间序列（所有 16 步动作）都会受到同等程度的影响。
- 比喻：像是戴上有色眼镜，给整张画面（整个动作序列）染上了一层底色（视觉倾向）。

##### 5. 优缺点分析 (在 Diffusion Policy 中)
###### 优点 (Pros)
- 控制力强：是一种“主动”的干预，比简单的 Concat（拼接）更有效。
- 稳定性高：类似于风格迁移，能稳定地将视觉风格迁移到动作上。
- 实现简单：也就是几个矩阵乘法和加法。

###### 缺点 (Cons)
- 缺乏细腻度：因为是对整个通道做统一调整，很难处理高频变化（High-frequency）的动作细节（例如：第 1 步向左，第 2 步突然向右）。这也导致了 CNN 版本容易出现 Over-smoothing（过度平滑）现象。

##### 6. 总结词
“移花接木” —— 把图片的特征变成网络的参数，强行改写动作的特征分布。
把一张图变成两个参数，然后再去改网络

==图2-b的流程==
旧的动作特征 ($x_{in}$) 进来了 $\rightarrow$ 经过 FiLM 工序被图片参数 ($a,b$) 狠狠修改了一番 ($a \cdot x + b$) $\rightarrow$ 变成了新的动作特征 ($x_{out}$) 出去了（准备进入下一层继续被改）。

所以film把图像特征转化成ab，动作x通过执行ax+b，实现被图像特征修正
原本乱七八糟的动作特征 x，经过这一下计算，就被打上了视觉的烙印。下一层网络再处理它时，就是在处理一个“包含了视觉信息”的动作了。

### shared mlp

**Shared MLP** 的意思就是：

> **“虽然我有一堆数据（比如一连串照片）要处理，但我并不为每一个数据单独建一个神经网络。**
> 
> **我只训练‘一个’神经网络（MLP），然后把这堆数据‘排着队’一个接一个地送进去处理。这就叫参数共享（Shared Weights）。”**

在论文里，它的作用就是把一连串的**原始图像特征**，统统转换成 Transformer 能够理解的 **Token 序列**。
同时用于处理的网络是一样的，可以保证一致性

## 3.2 Visual Encoder

关于这个和shared mlp
1. 第一步：摄像头拍到一张图。
2. 第二步：图送进 Visual Encoder (ResNet) $\rightarrow$ 变成 粗特征。
3. 第三步：粗特征送进 Shared MLP $\rightarrow$ 变成 精细 Token。
4. 第四步：精细 Token 送进 Transformer $\rightarrow$ 开始决策动作。

[[2025-12-03]]批注：==这个是transformer版的结构，不是cnn的==

对于cnn的
visual encoder之后，送进**FiLM Generator**，输出变成了 $\gamma$ (缩放) 和 $\beta$ (平移) 这两个参数，这些参数被“注射”进 CNN (1D Conv) 的每一层里。 执行 $a \cdot x + b$ 的操作。

---

你可能会问：“为什么不让 ResNet 直接输出 256 维的 Token？还要中间加个 MLP 多此一举？”

- **解耦（Decoupling）：**
    - **ResNet** 是个通用的“眼睛”。也许今天我想用 Transformer（需要 256 维），明天想换个别的模型（需要 128 维）。
    - 如果不加 MLP，每次换大脑都得去改 ResNet 的结构，太麻烦。
    - 加了 MLP，ResNet 就不用动了，只需要调整 MLP 这个“转接头”的大小就行。
- **非线性变换：**
    - MLP 里面带有激活函数（ReLU）。它能对特征再进行一次非线性的“揉搓”，让特征的表达能力更强，更适合 Transformer 消化。

# 4 Intriguing Properties of Diffusion Policy

## 4.1 Model Multi-Modal Action Distributions

Intuitively, multi-modality in action generation for diffusion policy arises from two sources – an underlying stochastic sampling procedure and a stochastic initialization.

一开始位置随机，每一步去噪都加入一点随机噪声。这样可以解决多模态问题。
随机初始化和过程随机性，

## 4.2 Synergy with Position Control

- **速度控制 (Velocity Control)：**
    - **指令：** “向前走 1 米/秒，向左走 0.5 米/秒。”
    - **特点：** 这是一个**相对指令**。如果你上一秒走歪了，下一秒继续按这个速度走，你会**越走越歪**（误差累积）。
- **位置控制 (Position Control)：**
    - **指令：** “去坐标 (10, 5) 的地方。”
    - **特点：** 这是一个**绝对指令**。不管你上一秒在哪，不管你有没有走歪，只要听到这个指令，你都会强行修正路线，走到那个绝对坐标去。

- **图 4 (Figure 4) 的现象：**
    - 灰色的柱子（LSTM-GMM, BET）：换成位置控制后，性能**大幅下降**（掉到了负数区域）。
    - 蓝色的柱子（Diffusion Policy）：换成位置控制后，性能**反而提升了**！

在 AI 领域，“多模态”这个词有两个完全不同的含义，很容易搞混。

**第一种含义（大家常听到的）**：指多种媒体形式。比如 GPT-4V 既能看图（视觉模态）也能读字（语言模态），这叫多模态模型（Large Multimodal Model）。但这篇论文里的“多模态动作”不是指这个！

**第二种含义（这篇论文讲的）**：指数学概率分布上的“多个山峰”。
- 在控制和统计学里，Mode（模）指的是“最高点”或者“最可能的那个值”。
- 单模态（Unimodal）：只有一个正确答案。
- 多模态（Multimodal）：有好几个正确答案，而且它们完全不同。


## 4.3 Benefits of Action-Sequence Prediction

**Temporal action consistency:**

场景（还是推箱子）：既可以从左边绕，也可以从右边绕。

单步预测的机器人（精神分裂）：
1. 第 1 步：我觉得左边好。（迈左腿）
2. 第 2 步：我觉得右边好。（迈右腿）
3. 第 3 步：我觉得左边好。（迈左腿）
**结果**：机器人就在原地左右鬼畜抽搐（Jittery），哪边也去不了。因为每一步都是独立采样的，它没有记忆，也没有承诺。

序列预测的机器人（Diffusion Policy）：
- 它不是预测一步，而是一次性画出未来 16 步的路线图。
- 这张图画出来的时候，要么全是左，要么全是右（因为 Diffusion 的连贯性）。
**结果**：机器人会坚定地执行这一条路线，动作丝般顺滑。


## 4.4 Training Stability

EBM (隐式策略) 说：“我要算出这座山上海拔绝对高度是多少。但我不知道海平面在哪里（不知道 $Z$），所以我只能瞎猜海平面，导致我算的高度一会儿高一会儿低，训练极其不稳定。”

Diffusion Policy 说：“谁在乎海平面在哪？我只关心脚下的路是上坡还是下坡（计算梯度 $\nabla$）。因为求导数会把常数消掉，所以我根本不需要去算那个该死的 $Z$！”

**结论**：因为避开了计算 $Z$ 这个大坑，Diffusion Policy 的训练过程不需要负采样，也不需要估算常数，所以稳得一批。

Figure 6 右边那个图
**灰线 (IBC)**：
- 虽然它也能达到 0.9 左右的高分，但它一直在抖。
- 第 500 轮可能是 90 分，第 600 轮突然掉到 70 分，第 700 轮又回去。
- **意义**：这叫“Checkpoint Selection Difficult”。如果你运气不好，刚好在它“抽风”的那一轮保存了模型，那你拿到的就是一个垃圾模型。你必须每时每刻都盯着它，非常累心。

# 9 Limitations and Future Work

Diffusion policy can be applied to other paradigms, such as reinforcement learning

现在是模仿学习，将来可以应用到强化学习，就可以超越“suboptimal performance with inadequate demonstration data”的限制

# 10 Conclusion

## Diffusion Policy 的三大法宝
### 法宝一：Receding-horizon Action Prediction（滚动视界动作预测）
- **一句话总结**：“深谋远虑，步步为营。”
- **以前的做法**：鼠目寸光。看一眼图，只算下一步怎么动。
- **后果**：动作抖动，像帕金森。
- **这里的做法**：
  1. 深谋远虑 (Prediction)：一口气算出未来 16 步 的完美连招。
  2. 步步为营 (Receding)：虽然算好了 16 步，但我只自信地走 8 步。
  3. 循环：走完 8 步，马上根据新情况，重新再算未来 16 步。
- **好处**：既保证了动作像流水一样连贯（因为想得远），又能随时应对突发情况（因为更新快）。

### 法宝二：End-effector Position Control（末端执行器位置控制）
- **一句话总结**：“告诉我去哪里，别告诉我跑多快。”
- **以前的做法（速度控制）**：给指令说“向左速度 1米/秒”。
- **后果**：一旦网卡了或者反应慢了，就会走过头（漂移），误差越积越大。
- **这里的做法（位置控制）**：给指令说“去坐标 $(X, Y, Z)$”。
- **逻辑**：Diffusion 模型强大的多模态能力，让它敢于直接跳跃到目标点，而不怕算错平均值。
- **好处**：精准、不漂移。哪怕网卡了，指令指的那个点还是那个点，机器人会自己修正过去。

### 法宝三：Efficient Visual Conditioning（高效的视觉条件化）
- **一句话总结**：“只看一眼，过目不忘。”
- **以前的做法（联合分布）**：一边想动作，一边脑补画面。
- **后果**：太累了！每修一步动作都要重新算一遍几百万像素的图，慢得像蜗牛。
- **这里的做法（条件化）**：
  1. 只看一眼：先把图片丢进 ResNet，提取出特征（比如“杯子在左边”）。
  2. 反复使用：在接下来 100 次的去噪过程中，不再看图了，只反复用这个特征来指导动作生成。
- **好处**：极速！ 省下了巨大的算力，让机器人能做到 0.1 秒反应一次（实时控制）。


