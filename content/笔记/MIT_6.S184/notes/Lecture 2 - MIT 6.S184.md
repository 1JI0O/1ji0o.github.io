---
创建日期: 2026-05-10
author: gpt5.5
---
# MIT 6.S184 Lecture 2：Flow Matching

> [!info] 来源  
> 本笔记基于 `Lecture 2 Flow Matching` slides 与 MIT 6.S184 lecture notes 中 Flow / Diffusion Models、Flow Matching 相关章节整理。Slides 的主线是推导 flow model 的训练算法；lecture notes 给出了更完整的定义、定理和训练算法。

参见：
- [[20260122_Lecture_02.pdf]]
- [[lecture_notes_MIT_6.S184.pdf]]
- [[MIT_6.S184]]

## 0. 本讲主线

一句话总结：

> Flow Matching 的目标是：  
> **不用在训练时模拟 ODE，而是把训练 flow model 变成一个简单的 supervised regression 问题。**

我们最终想训练一个 neural network vector field：

$$  
u_t^\theta(x)  
$$

使得从简单噪声分布出发，沿着 ODE 走到 $t=1$ 时，得到数据分布：

$$  
X_0 \sim p_{\text{init}},  
\qquad  
dX_t = u_t^\theta(X_t)dt,  
\qquad  
X_1 \sim p_{\text{data}}  
$$

Slides 里把本讲目标说得很直接：训练就是找到参数 $\theta$，让从 $p_{\text{init}}$ 出发、沿着 vector field 走到终点后的分布等于 $p_{\text{data}}$。

---

## 1. 学习优先级

### 必须掌握

- Probability Path：从噪声到数据的一族分布。
- conditional vs marginal 的区别。
- Conditional Flow Matching loss 为什么可训练。
- Gaussian / CondOT path 下的核心公式：

$$  
x_t = tz + (1-t)\epsilon  
$$

$$  
u_t^{\text{target}}(x_t|z) = z - \epsilon  
$$

- Flow Matching 训练不需要模拟 ODE；采样时才需要模拟 ODE。

### 需要理解，但不必死磕证明

- marginalization trick。
- continuity equation。
- 为什么 conditional loss 和 marginal loss 的梯度相同。

### 可以一笔带过

- ODE / SDE 的严格存在唯一性证明。
- continuity equation 的完整 PDE 推导。
- 复杂 numerical solver，例如 Heun method。Euler method 理解即可。

---

## 2. Recap：Flow Model 和 Diffusion Model

Slides 开头回顾了两个模型：

### Flow Model

$$  
X_0 \sim p_{\text{init}}  
$$

$$  
dX_t = u_t^\theta(X_t)dt  
$$

其中 $u_t^\theta$ 是 neural network vector field。采样时，从 $t=0$ 模拟到 $t=1$，返回 $X_1$。

### Diffusion Model

$$  
X_0 \sim p_{\text{init}}  
$$

$$  
dX_t = u_t^\theta(X_t)dt + \sigma_t dW_t  
$$

相比 flow model，多了 stochastic noise term $\sigma_t dW_t$。

> [!note] 这节课主要关注 Flow Model  
> 本讲的训练算法是 Flow Matching，所以重点是 ODE 版本：
> 
> $$  
> dX_t = u_t^\theta(X_t)dt  
> $$

---

## 3. Flow Matching Matrix：本讲的概念地图

Slides 用一个矩阵组织 Flow Matching 的核心对象：

|层次|Conditional|Marginal|
|---|---|---|
|Probability Path|$p_t(x \mid z)$|$p_t(x)$|
|Vector Field|$u_t^{\text{target}}(x \mid z)$|$u_t^{\text{target}}(x)$|
|Flow Matching Loss|$L_{\text{CFM}}$|$L_{\text{FM}}$|

关键理解：

- **Conditional**：针对单个 data point $z$。
- **Marginal**：对整个 data distribution $p_{\text{data}}$ 做平均。
- Conditional objects 通常可计算。
- Marginal objects 才是我们真正想要的，但通常不可直接计算。
- Flow Matching 的核心技巧是：  
    **训练 conditional loss，却等价于优化 marginal loss。**

---

## 4. Probability Path：只规定分布快照，不规定粒子轨迹

### 4.1 Conditional Probability Path

给定一个数据点 $z$，conditional probability path 是一族分布：

$$  
p_t(x|z), \qquad t \in [0,1]  
$$

满足：

$$  
p_0(\cdot|z)=p_{\text{init}}  
$$

$$  
p_1(\cdot|z)=\delta_z  
$$

意思是：

- $t=0$：还是噪声分布。
- $t=1$：坍缩到单个数据点 $z$。
- 中间的 $t$：从噪声逐渐过渡到数据点。

> [!important] 容易误解  
> Probability path 只规定每个时间点的 marginal distribution，也就是每一帧长什么样。  
> 它本身**不规定单个 particle 如何随时间运动**。Slides 也特别强调：probability path says nothing about the evolution of a single particle in time.

---

### 4.2 Marginal Probability Path

如果先采样一个数据点：

$$  
z \sim p_{\text{data}}  
$$

再从 conditional path 采样：

$$  
x \sim p_t(\cdot|z)  
$$

那么 $x$ 的分布就是 marginal probability path：

$$  
p_t(x)=\int p_t(x|z)p_{\text{data}}(z)dz  
$$

它满足：

$$  
p_0 = p_{\text{init}}  
$$

$$  
p_1 = p_{\text{data}}  
$$

> [!summary] 直觉  
> Conditional path 是“从噪声到某一个具体数据点 $z$”。  
> Marginal path 是“从噪声到整个数据分布 $p_{\text{data}}$”。

---

## 5. Gaussian Probability Path：最重要的例子

Gaussian conditional probability path 定义为：

$$  
p_t(\cdot|z)=\mathcal{N}(\alpha_t z, \beta_t^2 I_d)  
$$

其中 $\alpha_t,\beta_t$ 是 noise schedule，满足：

$$  
\alpha_0=0,\quad \alpha_1=1  
$$

$$  
\beta_0=1,\quad \beta_1=0  
$$

因此：

- $t=0$：

$$  
p_0(\cdot|z)=\mathcal{N}(0,I_d)  
$$

- $t=1$：

$$  
p_1(\cdot|z)=\delta_z  
$$

也就是说，它确实从标准高斯噪声走到数据点 $z$。

实际采样时：

$$  
\epsilon \sim \mathcal{N}(0,I_d)  
$$

$$  
x_t = \alpha_t z + \beta_t \epsilon  
$$

lecture notes 指出 Gaussian probability path 是最重要的例子，也是很多 state-of-the-art 模型使用的路径形式。

---

## 6. Vector Field：让粒子真的动起来

Probability path 只告诉我们“每个时间点的分布应该是什么”，但还没有告诉我们：

> 粒子 $X_t$ 应该怎么移动，才能让 $X_t \sim p_t$？

这就需要 vector field。

---

### 6.1 Conditional Vector Field

Conditional vector field 记作：

$$  
u_t^{\text{target}}(x|z)  
$$

它的作用是：如果

$$  
X_0 \sim p_{\text{init}}  
$$

并且

$$  
\frac{d}{dt}X_t = u_t^{\text{target}}(X_t|z)  
$$

那么：

$$  
X_t \sim p_t(\cdot|z)  
$$

也就是说，它让 ODE 的分布跟随 conditional probability path。

---

### 6.2 Gaussian Path 下的 Conditional Vector Field

对于：

$$  
p_t(\cdot|z)=\mathcal{N}(\alpha_t z,\beta_t^2I_d)  
$$

Conditional target vector field 是：

$$
u_t^{\text{target}}(x \mid z)
=
\left(
\dot{\alpha}_t
-
\frac{\dot{\beta}_t}{\beta_t}\alpha_t
\right)z
+
\frac{\dot{\beta}_t}{\beta_t}x
$$

其中：

$$  
\dot{\alpha}_t = \partial_t \alpha_t  
$$

$$  
\dot{\beta}_t = \partial_t \beta_t  
$$

lecture notes 给出了这个公式，并说明它的 ODE 轨迹会产生 Gaussian conditional probability path。

---

### 6.3 更好记的形式

因为：

$$  
x_t=\alpha_t z+\beta_t\epsilon  
$$

所以它的时间导数是：
$$  
\frac{d}{dt}x_t

\dot{\alpha}_t z+\dot{\beta}_t\epsilon  
$$

因此 Gaussian path 下的训练 target 可以写成：

$$  
u_t^{\text{target}}(x_t|z)

\dot{\alpha}_t z+\dot{\beta}_t\epsilon  
$$

这个形式在实现时更直接。

---

## 7. CondOT Path：最常用、最简单的特例

取：

$$  
\alpha_t=t  
$$

$$  
\beta_t=1-t  
$$

则：

$$  
x_t = tz + (1-t)\epsilon  
$$

并且：

$$  
\dot{\alpha}_t = 1  
$$

$$  
\dot{\beta}_t = -1  
$$

所以 target velocity 是：

$$  
u_t^{\text{target}}(x_t|z)

z-\epsilon  
$$

> [!important] 这是本讲最应该记住的公式  
> 对 CondOT path：
> 
> $$  
> x_t = tz + (1-t)\epsilon  
> $$
> 
> $$  
> \text{target velocity} = z-\epsilon  
> $$

这就是 Flow Matching 训练可以变得非常简单的原因。lecture notes 也把这个特例总结为简单有效的训练过程。

---

## 8. Marginal Vector Field：真正想学，但不可直接算

我们真正想要的是一个 vector field：

$$  
u_t^{\text{target}}(x)  
$$

使得：

$$  
X_0 \sim p_{\text{init}}  
$$

$$  
dX_t = u_t^{\text{target}}(X_t)dt  
$$

推出：

$$  
X_t \sim p_t  
$$

特别是：

$$  
X_1 \sim p_{\text{data}}  
$$

这个 marginal vector field 由 conditional vector field 加权平均得到：

$$  
u_t^{\text{target}}(x)

\int  
u_t^{\text{target}}(x|z)  
\frac{  
p_t(x|z)p_{\text{data}}(z)  
}{  
p_t(x)  
}  
dz  
$$

可以把它理解成：

$$  
u_t^{\text{target}}(x)

\mathbb{E}  
[  
u_t^{\text{target}}(x|Z)  
\mid X_t=x  
]  
$$

> [!warning] 关键困难  
> 这个 marginal vector field 才是我们采样时想要的，但它通常不可直接计算，因为里面有对整个数据分布的积分，而且 $p_t(x)$ 本身也难算。

Slides 后半部分也强调：marginal probability path、marginal vector field、marginal FM loss 都是我们想要的对象，但它们本身不可 tractable；不过仍然可以通过 conditional objects 学到。

---

## 9. Continuity Equation：理解即可

Continuity equation 说的是：

$$  
\partial_t p_t(x)

-\operatorname{div}(p_tu_t)(x)  
$$

直觉：

- 左边 $\partial_t p_t(x)$：位置 $x$ 附近概率质量随时间的变化。
    
- 右边 $-\operatorname{div}(p_tu_t)(x)$：净流入的概率质量。
    
- 如果一个 vector field 真能让分布沿着 $p_t$ 走，那么概率质量的变化必须满足这个守恒关系。

lecture notes 用 continuity equation 证明了 marginalization trick：由 conditional vector field 可以构造出 follows marginal path 的 marginal vector field。

> [!note] 学习建议  
> 这里不需要第一次就掌握完整 PDE 证明。  
> 你只需要记住它的作用：  
> **用来证明某个 vector field 的 ODE 轨迹确实会产生指定 probability path。**

---

## 10. Flow Matching Loss

### 10.1 理想目标：Marginal Flow Matching Loss

理想情况下，我们想让 neural network 学到：

$$  
u_t^\theta(x) \approx u_t^{\text{target}}(x)  
$$

自然的 MSE loss 是：

$$  
L_{\text{FM}}(\theta)

\mathbb{E}_{t\sim \text{Unif}, x\sim p_t}  
\left[  
\left|  
u_t^\theta(x)-u_t^{\text{target}}(x)  
\right|^2  
\right]  
$$

问题是：

$$  
u_t^{\text{target}}(x)  
$$

不可直接计算。

---

### 10.2 可训练目标：Conditional Flow Matching Loss

于是改用：

$$  
L_{\text{CFM}}(\theta)

\mathbb{E}_{t\sim \text{Unif}, z\sim p_{\text{data}}, x\sim p_t(\cdot|z)}  
\left[  
\left|  
u_t^\theta(x)-u_t^{\text{target}}(x|z)  
\right|^2  
\right]  
$$

这个 loss 是 tractable 的，因为：

- $z$ 可以从 dataset 取。
    
- $t$ 可以从 $[0,1]$ 均匀采样。
    
- $x$ 可以通过加噪采样出来。
    
- $u_t^{\text{target}}(x|z)$ 有解析公式。

lecture notes 明确指出，虽然我们真正想最小化 marginal loss，但 conditional velocity field 是 tractable 的，因此可以最小化 conditional loss。

---

## 11. 为什么 conditional loss 可以替代 marginal loss？

核心定理：

$$  
L_{\text{FM}}(\theta)

L_{\text{CFM}}(\theta)+C  
$$

其中 $C$ 与 $\theta$ 无关。

因此：

$$  
\nabla_\theta L_{\text{FM}}(\theta)

\nabla_\theta L_{\text{CFM}}(\theta)  
$$

这意味着：

> 最小化 conditional flow matching loss，等价于最小化 marginal flow matching loss。

这就是 Flow Matching 的核心理论保证。lecture notes 将其表述为 Theorem 12，并强调二者梯度一致。

---

## 12. Gaussian Path 下的最终训练目标

一般 Gaussian path：

$$  
x_t=\alpha_tz+\beta_t\epsilon  
$$

$$  
\epsilon\sim\mathcal{N}(0,I_d)  
$$
训练 loss：

$$
L_{\text{CFM}}(\theta)
=
\mathbb{E}_{t,z,\epsilon}
\left[
\left\|
u_t^\theta(\alpha_t z+\beta_t \epsilon)
-
(\dot{\alpha}_t z+\dot{\beta}_t \epsilon)
\right\|^2
\right]
$$

对于 CondOT path：

$$  
\alpha_t=t,\qquad \beta_t=1-t  
$$

得到：

$$
L_{\text{CFM}}(\theta)
=
\mathbb{E}_{t,z,\epsilon}
\left[
\left\|
u_t^\theta(tz+(1-t)\epsilon)
-
(z-\epsilon)
\right\|^2
\right]
$$

> [!tip] 实现视角  
> 训练时模型输入是：
> $$  
> (x_t,t)  
> $$
> 
> 模型输出是：
> $$  
> u_t^\theta(x_t)  
> $$
> 监督信号是：
> $$  
> z-\epsilon  
> $$

---

## 13. Flow Matching Training Algorithm

以 Gaussian CondOT path 为例：

1. 从 dataset 采样数据：

$$  
z \sim p_{\text{data}}  
$$

2. 采样时间：

$$  
t\sim \text{Unif}[0,1]  
$$

3. 采样噪声：

$$  
\epsilon\sim\mathcal{N}(0,I_d)  
$$

4. 构造 noisy sample：

$$  
x_t=tz+(1-t)\epsilon  
$$

5. 构造 target velocity：

$$  
v_t=z-\epsilon  
$$

6. 计算 loss：

$$  
L(\theta)

\left|  
u_t^\theta(x_t)-v_t  
\right|^2  
$$

7. 对 $\theta$ 做 gradient update。

lecture notes 中的 Algorithm 3 正是这个过程，并指出 Flow Matching 训练有几个重要特点：不需要在训练时模拟 ODE，是一个简单的 regression objective，且非常适合大规模模型训练。

---

## 14. 训练 vs 采样：不要混淆

### 训练时

不模拟 ODE。

只做：

$$  
z,\epsilon,t \rightarrow x_t  
$$

然后回归：

$$  
u_t^\theta(x_t) \approx z-\epsilon  
$$

### 采样时

才需要模拟 ODE：

$$  
X_0\sim p_{\text{init}}  
$$

$$  
dX_t=u_t^\theta(X_t)dt  
$$

从 $t=0$ 积分到 $t=1$，返回：

$$  
X_1  
$$

> [!important] 核心区别  
> Flow Matching 的训练是 simulation-free。  
> 但生成样本时仍然要 solve / simulate ODE。

---

## 15. 和 Stable Diffusion 3 / MovieGen 的关系

Slides 后面提到，Stable Diffusion 3 和 Meta MovieGen 的生成网络使用了前面介绍的 Flow Matching 类训练算法。

这里不需要深究模型架构。当前阶段只要理解：

> 大模型里的核心训练目标，本质上可以简化成：  
> 在 noisy data $x_t$ 上预测从 noise 指向 data 的 velocity。

---

## 16. 常见误区

### 误区 1：Probability path 就是 particle trajectory

不是。

Probability path 只是每个时间点的分布快照。  
Trajectory 是由 vector field / ODE 决定的。

---

### 误区 2：Conditional vector field 就够了

不够。

Conditional vector field 是针对某个固定数据点 $z$ 的。  
如果直接用它，终点会坍缩到这个 $z$，不是生成新的 data sample。

真正用于生成的是 marginal vector field。

---

### 误区 3：训练时要 rollout ODE

不需要。

Flow Matching 的优势正是训练时不 rollout。  
只需要采样 $t$、采样 noise、构造 $x_t$，然后做 MSE regression。

---

### 误区 4：Conditional loss 和 marginal loss 是一样的函数

严格说不是。

它们相差一个与参数 $\theta$ 无关的常数：

$$  
L_{\text{FM}}(\theta)

L_{\text{CFM}}(\theta)+C  
$$

所以优化时等价，因为梯度相同。

---

## 17. 记忆版总结

> [!summary] Flow Matching in one page
> 
> 目标：
> 
> $$  
> X_0\sim p_{\text{init}},  
> \qquad  
> dX_t=u_t^\theta(X_t)dt,  
> \qquad  
> X_1\sim p_{\text{data}}  
> $$
> 
> 先设计 probability path：
> 
> $$  
> p_t(x|z)  
> $$
> 
> Gaussian path：
> 
> $$  
> x_t=\alpha_tz+\beta_t\epsilon  
> $$
> 
> CondOT path：
> 
> $$  
> x_t=tz+(1-t)\epsilon  
> $$
> 
> target velocity：
> 
> $$  
> v_t=z-\epsilon  
> $$
> 
> 训练目标：
> 
> $$  
> \min_\theta  
> \mathbb{E}_{t,z,\epsilon}  
> \left[  
> \left|  
> u_t^\theta(tz+(1-t)\epsilon)
> 
> (z-\epsilon)  
> \right|^2  
> \right]  
> $$
> 
> 训练后采样：
> 
> $$  
> X_0\sim\mathcal{N}(0,I)  
> $$
> 
> $$  
> dX_t=u_t^\theta(X_t)dt  
> $$
> 
> 返回：
> 
> $$  
> X_1  
> $$

---

## 18. 和后续内容的连接

Flow Matching 学的是：

$$  
u_t^{\text{target}}(x)  
$$

后续 Score Matching 会学习：

$$  
\nabla_x \log p_t(x)  
$$

对于 Gaussian probability path，lecture notes 说明 vector field 和 score function 可以互相转换，所以 Flow Matching 和 Diffusion / Score Matching 之间有很深的联系。

---

## 19. 复习问题

1. 为什么 probability path 本身不等于 ODE trajectory？
2. Conditional probability path 和 marginal probability path 的区别是什么？
3. 为什么 marginal vector field 是真正想学的对象？
4. 为什么 marginal vector field 不 tractable？
5. CondOT path 下，为什么 target velocity 是 $z-\epsilon$？
6. 为什么训练 conditional flow matching loss 等价于训练 marginal flow matching loss？
7. Flow Matching 训练时为什么不需要模拟 ODE？
8. 采样时为什么又必须模拟 ODE？

---

## 20. 最小实现伪代码

假设使用 CondOT path：

```python
for z in dataloader:
    t = Uniform(0, 1).sample()
    eps = Normal(0, 1).sample(shape=z.shape)

    x_t = t * z + (1 - t) * eps
    target = z - eps

    pred = model(x_t, t)
    loss = mse(pred, target)

    loss.backward()
    optimizer.step()
```

采样时：

```python
x = Normal(0, 1).sample(shape)
for t in time_grid_from_0_to_1:
    x = x + dt * model(x, t)
return x
```
