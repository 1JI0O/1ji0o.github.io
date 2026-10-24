---
aliases:
  - lecture1
创建日期: 2026-05-10
author: gpt5.5
---
# MIT 6.S184 Lecture 1 Notes

## Generative AI with Stochastic Differential Equations

## 0. 本讲主线

Lecture 1 主要回答两个问题：

1. 什么叫“生成”一个对象？
2. 为什么 flow models 和 diffusion models 可以用来生成对象？

核心逻辑：

> 生成对象  
> → 从数据分布中采样  
> → 从简单噪声分布出发  
> → 用 ODE / SDE 把噪声逐步变成数据  
> → 得到 flow model / diffusion model

本讲的重点不是训练算法，而是先搭建生成模型的数学框架。训练算法会在后面的 Flow Matching、Score Matching 中讲。

---

## 1. Generative Modeling as Sampling

> [!PDF|note] [[20260120_Lecture_01_c.pdf#page=7&selection=0,0,2,27&color=note|20260120_Lecture_01_c, p.7]]
> > Section 1: From Generation to Sampling
> 
> 

## 1.1 对象可以表示成向量

课程首先把图像、视频、蛋白质结构等对象统一表示成高维向量：
$$  
z \in \mathbb{R}^d  
$$

例如：

|对象|向量形式|
|---|---|
|图像|$z \in \mathbb{R}^{H \times W \times 3}$|
|视频|$z \in \mathbb{R}^{T \times H \times W \times 3}$|
|分子结构|$z \in \mathbb{R}^{N \times 3}$|

这里的重点不是具体维度，而是：

> 生成图像、视频、蛋白质，本质上都可以看成在高维空间中生成一个点。

这一步很重要，因为后面所有 ODE / SDE 都是在 $\mathbb{R}^d$ 这个高维空间中移动点。

---

## 1.2 Data Distribution：数据分布

假设我们想生成“一张狗的图片”。

不是所有图片都一样好：

- 纯噪声：几乎不可能是狗图
- 街景：可能是图片，但不是狗
- 猫：是动物，但不符合 prompt
- 狗：符合目标

课程把这种“好不好”的判断形式化为概率分布：
$$  
p_{\text{data}}(z)  
$$

其中：

- $z$ 是一个候选对象，比如一张图片
- $p_{\text{data}}(z)$ 表示这个对象在真实数据中出现的可能性

直观理解：

> 越像真实数据的样本，在 $p_{\text{data}}$ 下概率越高。

所以“生成一张好图”可以被改写成：
$$  
z \sim p_{\text{data}}  
$$

也就是：

> 生成 = 从数据分布中采样。

这是本讲最核心的抽象。notes 里也明确把 generation 建模为从数据分布 $p_{\text{data}}$ 中采样。

---

## 1.3 Dataset：数据集只是数据分布的有限样本

真实的 $p_{\text{data}}$ 是不知道的。

我们只有一个数据集：
$$  
z_1, z_2, \dots, z_N \sim p_{\text{data}}  
$$

比如：

- 图像：互联网图片
- 视频：YouTube 视频
- 蛋白质结构：Protein Data Bank

重点：

> 数据集不是数据分布本身，而是从数据分布中采出来的一批样本。

生成模型训练的目标，就是从有限样本中学到一个近似的数据分布，然后能产生新的样本。

---

## 1.4 Conditional Generation：条件生成

无条件生成是：

$$  
z \sim p_{\text{data}}  
$$

条件生成是：

$$  
z \sim p_{\text{data}}(\cdot \mid y)  
$$

其中 $y$ 是条件，例如：

- 类别标签：dog / cat / landscape
- 文本 prompt：“a dog running in snow”
- 图像条件、视频条件等

直观上：

> 条件生成不是从所有图片中采样，而是从“符合条件 $y$ 的图片分布”中采样。

Lecture 1 先主要讲 unconditional generation。后面会讲怎么把 unconditional model 扩展成 conditional model。

---

# 2. Generative Model 的目标

生成模型通常从一个简单分布开始：

$$  
p_{\text{init}} = \mathcal{N}(0, I_d)  
$$

也就是标准高斯噪声。

目标是构造一个过程，把：

$$  
X_0 \sim p_{\text{init}}  
$$

变成：

$$  
X_1 \sim p_{\text{data}}  
$$

可以理解成：

> 从噪声出发，经过模型的逐步变换，最后得到一个真实数据样本。

所以 flow / diffusion models 的共同目标是：

$$  
\text{noise} \rightarrow \text{data}  
$$

---

> [!PDF|note] [[20260120_Lecture_01_c.pdf#page=16&selection=0,0,2,25&color=note|20260120_Lecture_01_c, p.16]]
> > Section 2: Flow and Diffusion Models

[[lecture_notes_MIT_6.S184.pdf#page=7|lecture_notes_MIT_6.S184, p.7]]

# 3. Flow Models

## 3.1 Flow model 的核心：ODE

Flow model 基于 ODE，也就是 ordinary differential equation：

$$  
\frac{d}{dt}X_t = u_t(X_t)  
$$

初始条件：

$$  
X_0 = x_0  
$$

这里：

- $X_t$：时间 $t$ 时的位置
- $x_0$：初始位置
- $u_t(x)$：vector field，即速度场
- $\frac{d}{dt}X_t$：轨迹在时间 $t$ 的速度

直观理解：

> ODE 规定了一个点在每个时间、每个位置应该怎么移动。

---

## 3.2 难点：trajectory、vector field、ODE、flow 的关系

这几个词很容易混在一起，建议这样理解：

|概念|数学形式|直觉|
|---|---|---|
|trajectory|$X_t$|一个点实际走出来的路径|
|vector field|$u_t(x)$|每个位置、每个时间的速度箭头|
|ODE|$\frac{d}{dt}X_t = u_t(X_t)$|规定点必须沿着速度场走|
|flow|$\psi_t(x_0)$|从初始点 $x_0$ 出发，时间 $t$ 后到哪里|

最重要的是 flow：

$$  
\psi_t(x_0)  
$$

它表示：

> 从 $x_0$ 出发，按照 ODE 走到时间 $t$ 后的位置。

它满足：

$$  
\frac{d}{dt}\psi_t(x_0) = u_t(\psi_t(x_0))  
$$

以及：

$$  
\psi_0(x_0)=x_0  
$$

一句话总结：

> vector field 定义 ODE，ODE 的解形成 trajectory，所有初始点对应的 trajectory 组成 flow。

notes 也强调：vector fields、ODEs、flows 可以看作同一对象的三种描述方式。

---

## 3.3 Flow model 如何生成样本？

Flow model 用神经网络参数化 vector field：

$$  
u_t^\theta(x)  
$$

然后做三步：

1. 从简单分布采样：

$$  
X_0 \sim p_{\text{init}}  
$$

2. 模拟 ODE：

$$  
\frac{d}{dt}X_t = u_t^\theta(X_t)  
$$

3. 返回终点：

$$  
X_1  
$$

训练目标是让：

$$  
X_1 \sim p_{\text{data}}  
$$

也就是说：

> 神经网络不是直接输出图片，而是输出“当前位置应该往哪里走”的速度。

这是一个非常重要的理解点。

---

## 3.4 Euler Method：如何模拟 ODE

> [!PDF|note] [[20260120_Lecture_01_c.pdf#page=21&selection=0,0,0,39&color=note|20260120_Lecture_01_c, p.21]]
> > Numerical ODE simulation - Euler method
> 
> 

真实的 ODE 通常没有解析解，所以要用数值方法模拟。

最简单的是 Euler method：

$$  
X_{t+h} = X_t + h u_t(X_t)  
$$

其中：

$$  
h = \frac{1}{n}  
$$

直觉：

> 下一步位置 = 当前的位置 + 步长 × 当前速度

也就是沿着 vector field 给出的方向走一小步。

需要记住的 trade-off：

|步长|优点|缺点|
|---|---|---|
|大步长|快|误差大|
|小步长|精确|慢|

对于 Lecture 1，只需要理解 Euler method 的直觉，不需要深入数值分析。

---

# 4. Diffusion Models

## 4.1 从 ODE 到 SDE

Flow model 用 ODE：

$$  
dX_t = u_t(X_t)dt  
$$

Diffusion model 用 SDE，也就是 stochastic differential equation：

$$  
dX_t = u_t(X_t)dt + \sigma_t dW_t  
$$

这里多了一个随机项：

$$  
\sigma_t dW_t  
$$

其中：

- $u_t(X_t)dt$：确定性移动，叫 drift
- $\sigma_t dW_t$：随机噪声项
- $W_t$：Brownian motion / Wiener process
- $\sigma_t$：diffusion coefficient，控制噪声强度

直观对比：

| 模型              | 运动方式               |
| --------------- | ------------------ |
| ODE / Flow      | 沿着速度场确定性移动         |
| SDE / Diffusion | 沿着速度场移动，同时不断加入随机扰动 |

![[20260120_Lecture_01_c.pdf#page=30&rect=18,12,713,388&color=note|20260120_Lecture_01_c, p.30]]

**不会同时有多个不同随机过程满足同一个 SDE**

“随机”不等于“规则不唯一”。

SDE 的随机性来自 Brownian motion $W_t$。一旦你固定：
$$X_0 = x_0$$
以及整条噪声路径：
$$W_t$$
那么 SDE 的规则：
$$dX_t = u_t(X_t)dt + \sigma_t dW_t$$
就应该唯一决定 $X_t$ 怎么走。

所以唯一性说的是：

>给定同一个初始条件、同一个随机噪声来源、同一个 drift 和 diffusion coefficient，不会出现两个不同的随机过程都满足这个 SDE。


---

## 4.2 Brownian Motion：连续随机游走（布朗运动）

[[20260120_Lecture_01_c.pdf#page=29|20260120_Lecture_01_c, p.29]]

Brownian motion 可以理解成连续时间版本的随机游走。

它的离散近似是：

$$  
W_{t+h} = W_t + \sqrt{h}\epsilon_t  
$$

其中：

$$  
\epsilon_t \sim \mathcal{N}(0, I_d)  
$$

直觉：

> 每一小步都加一个随机高斯扰动。

这里的 $\sqrt{h}$ 很重要，因为 Brownian motion 的方差随时间线性增长，所以增量的标准差是 $\sqrt{h}$ 级别。

注：这里的h是步长

对，这里的 **(h)** 就是时间步长，也就是每次模拟往前走多久。如果总时间区间是：
$$  
[0,1]  
$$
把它切成 (n) 步，那么：
$$  
h=\frac{1}{n}  
$$
所以时间点是：
$$  
0,\ h,\ 2h,\ 3h,\ \dots,\ 1  
$$
在 Brownian motion 的离散模拟里：
$$  
W_{t+h}=W_t+\sqrt{h}\epsilon_t  
$$
意思是：

> 从时间 (t) 走到 (t+h)，Brownian motion 增加一个高斯随机扰动。

为什么是 ($\sqrt{h}$)，不是 (h)？因为 Brownian motion 的增量满足：
$$  
W_{t+h}-W_t \sim \mathcal{N}(0,hI_d)  
$$
也就是说方差是 (h)，标准差就是 ($\sqrt{h}$)。所以可以写成：
$$  
W_{t+h}-W_t=\sqrt{h}\epsilon_t,\quad \epsilon_t\sim \mathcal{N}(0,I_d)  
$$
slides 和 notes 都是在这个意义下定义 (h)：它是数值模拟中的 step size。

---

## 4.3 Euler-Maruyama Method：如何模拟 SDE

> [!PDF|note] [[20260120_Lecture_01_c.pdf#page=31&selection=0,0,0,48&color=note|20260120_Lecture_01_c, p.31]]
> > Numerical SDE simulation (Euler-Maruyama method)
> 
> 

SDE 对应的数值模拟方法是 Euler-Maruyama method：
$$  
X_{t+h}

X_t  
+  
h u_t(X_t)  
+  
\sqrt{h}\sigma_t \epsilon_t  
$$

其中：
$$  
\epsilon_t \sim \mathcal{N}(0, I_d)  
$$

和 Euler method 对比：

|方法|更新公式|
|---|---|
|Euler for ODE|$X_{t+h}=X_t+h u_t(X_t)$|
|Euler-Maruyama for SDE|$X_{t+h}=X_t+h u_t(X_t)+\sqrt{h}\sigma_t\epsilon_t$|

重点：

> Diffusion model 的每一步既有“朝目标方向走”的部分，也有“随机抖动”的部分。

notes 中也明确说，Euler-Maruyama 可以看作 SDE 版本的 Euler method。

---

## 4.4 Diffusion model 如何生成样本？

[[20260120_Lecture_01_c.pdf#page=34|20260120_Lecture_01_c, p.34]]

Diffusion model 同样从简单分布开始：

$$  
X_0 \sim p_{\text{init}}  
$$

然后模拟 SDE：

$$  
dX_t = u_t^\theta(X_t)dt + \sigma_t dW_t  
$$

最终希望：

$$  
X_1 \sim p_{\text{data}}  
$$

其中：

- $u_t^\theta(x)$：神经网络学到的 vector field
- $\sigma_t$：固定的 diffusion coefficient
- $dW_t$：随机噪声来源

所以 diffusion model 的生成过程可以理解为：

> 从噪声出发，在神经网络引导下，带着随机扰动逐步走向数据分布。

---

# 5. Flow Models vs Diffusion Models

|对比|Flow Model|Diffusion Model|
|---|---|---|
|数学形式|ODE|SDE|
|是否有随机项|没有|有|
|路径是否随机|给定初始点后路径确定|即使初始点相同，路径也可能不同|
|随机性来源|初始噪声 $X_0$|初始噪声 $X_0$ + 过程噪声 $dW_t$|
|数值模拟|Euler method|Euler-Maruyama method|
|更新公式|$X_{t+h}=X_t+h u_t(X_t)$|$X_{t+h}=X_t+h u_t(X_t)+\sqrt{h}\sigma_t\epsilon_t$|

一个关键关系：

$$  
\sigma_t = 0  
$$

时，SDE 退化成 ODE。

所以：

> Flow model 可以看成 diffusion model 在没有随机噪声项时的特例。

notes 也明确总结：当 $\sigma_t=0$ 时，diffusion model 就是 flow model。

---

# 6. 本讲最重要的概念层级

#### 第一层：生成问题

$$  
z \sim p_{\text{data}}  
$$

生成就是从真实数据分布中采样。

#### 第二层：从简单分布开始

$$  
X_0 \sim p_{\text{init}}  
$$

通常：

$$  
p_{\text{init}}=\mathcal{N}(0,I_d)  
$$

#### 第三层：用动态系统变换分布

Flow model：

$$  
dX_t = u_t^\theta(X_t)dt  
$$

Diffusion model：

$$  
dX_t = u_t^\theta(X_t)dt + \sigma_t dW_t  
$$

#### 第四层：最终目标

$$  
X_1 \sim p_{\text{data}}  
$$

---

# 7. 需要重点掌握的地方

## 重点 1：生成 = 采样

不要把生成理解成“模型凭空画图”。

更准确地说：

> 模型学会从一个目标概率分布中采样。

这个目标概率分布就是 $p_{\text{data}}$。

---

## 重点 2：神经网络学的是 vector field

神经网络不是直接学：

$$  
\text{noise} \mapsto \text{image}  
$$

而是学：

$$  
u_t^\theta(x)  
$$

也就是：

> 在时间 $t$、位置 $x$，样本应该往哪里移动。

真正的图像生成来自多步模拟：

$$  
X_0 \rightarrow X_h \rightarrow X_{2h} \rightarrow \cdots \rightarrow X_1  
$$

---

## 重点 3：flow 是“整体空间的变形”

一个 trajectory 只描述一个点怎么走。

flow 描述的是：

> 所有初始点如何一起被移动、扭曲、变换。

所以 flow model 的直觉不是“移动一个点”，而是：

> 把整个噪声分布逐渐变形为数据分布。

---

## 重点 4：diffusion 比 flow 多了过程噪声

Flow model 的随机性只来自初始点：

$$  
X_0 \sim p_{\text{init}}  
$$

Diffusion model 的随机性还来自每一步：

$$  
\sigma_t dW_t  
$$

所以 diffusion 的路径本身是随机的。

---

# 8. 本讲不必过度纠结的内容

以下内容 Lecture 1 只需要有直觉，不必深究证明：

- Picard–Lindelöf theorem 的严格证明
- Brownian motion 的测度论定义
- SDE 的严格 stochastic integral 定义
- Heun’s method 的数值分析细节
- ODE / SDE 的存在唯一性证明

需要记住的是：

> 在机器学习实践中，我们通常可以把神经网络 vector field 看成定义了合理的 ODE / SDE 动力系统。

---

# 9. 一句话总结 Lecture 1

> Lecture 1 把“生成图像、视频、蛋白质”形式化为“从数据分布采样”，然后说明可以从简单高斯噪声出发，用神经网络参数化的 ODE 或 SDE 逐步把噪声分布变成数据分布；ODE 对应 flow model，SDE 对应 diffusion model。