---
title: MIT 6.S184 Lecture 05 - Discrete Diffusion Models and Discrete Flow Matching
创建日期: 2026-05-19
author: gpt5.5
---
# Lecture 05：Discrete Diffusion Models and Discrete Flow Matching

> [!summary] 本讲主线
> 前几讲主要讨论连续空间 $
> \mathbb{R}^d
> $ 上的 flow / diffusion：用 ODE、SDE、vector field、score 来从 noise 生成 data。本讲把这些思想搬到**离散数据**上，例如语言 token、蛋白质序列、DNA 序列等。
>
> 关键变化是：离散空间里没有真正的 ODE / SDE，也没有“沿着某个方向移动”的 vector field。我们改用 **continuous-time Markov chain, CTMC**，并把连续 flow matching 中的 probability path、conditional target、marginalization trick、simulation-free training 翻译成离散版本。

---

## 0. 和前几讲的连接

连续空间里的生成模型目标是：

$$
X_0 \sim p_{\mathrm{init}}, \qquad \frac{d}{dt}X_t = u_t^\theta(X_t), \qquad X_1 \sim p_{\mathrm{data}}.
$$

或者使用 SDE：

$$
dX_t = u_t^\theta(X_t)dt + \sigma_t dW_t.
$$

这里 $X_t \in \mathbb{R}^d$，所以可以谈“速度”“方向”“梯度”“扩散”。但语言模型里的对象通常是 token 序列：

$$
z = (z_1,\dots,z_d) \in \mathcal{V}^d,
$$

其中 $\mathcal{V}$ 是词表，$d$ 是序列长度。这个空间是离散的，所以不能直接写：

$$
\frac{d}{dt}X_t = u_t(X_t)
$$

因为 token 没有连续坐标，也没有可以求导的路径。

> [!important] 本讲核心替换
> 连续空间：vector field / ODE / SDE 负责让样本在空间中移动。
>
> 离散空间：rate matrix / CTMC 负责让样本在不同离散状态之间跳转。

---

# 1. 离散 diffusion 的基本设定

## 1.1 数据空间

设离散状态空间为：

$$
\mathcal{S}.
$$

对于长度为 $d$ 的 token 序列，通常有：

$$
\mathcal{S} = \mathcal{V}^d.
$$

数据分布是离散概率质量函数：

$$
p_{\mathrm{data}} : \mathcal{S} \to \mathbb{R}_{\ge 0}, \qquad \sum_{z\in\mathcal{S}}p_{\mathrm{data}}(z)=1.
$$

训练时我们不知道完整的 $p_{\mathrm{data}}$，只拿到样本：

$$
z \sim p_{\mathrm{data}}.
$$

例如：

- 自然语言：互联网上的文本序列。
- 蛋白质：氨基酸序列。
- DNA：碱基序列。

目标仍然是生成：

$$
z \sim p_{\mathrm{data}}.
$$

## 1.2 为什么不能直接说 diffusion / flow？

严格数学意义上：

- 离散空间没有 Brownian motion 驱动的 SDE。
- 离散空间没有 ODE 中的连续轨迹。
- 离散空间没有“从当前位置沿某个方向走一点”的 vector field。

所以这里的 “discrete diffusion models” 是机器学习中的叫法；数学上更准确的模型是：

$$
\text{continuous-time Markov chains, CTMCs}.
$$

> [!note] 直觉
> 连续 diffusion：概率质量像流体一样在空间里移动、扩散。
>
> 离散 diffusion：概率质量不是连续移动，而是在状态之间“跳跃”或“传送”。slides 中也强调：probability is teleported, not moved through space。

---

# 2. Continuous-Time Markov Chain（CTMC）

## 2.1 CTMC 的直觉

CTMC 是一个连续时间随机过程：

$$
(X_t)_{0\le t\le 1}, \qquad X_t \in \mathcal{S}.
$$

它的轨迹是分段常数的：

- 大部分时间停在某个离散状态。
- 随机时刻发生跳跃。
- 跳到另一个离散状态。

例如状态空间是 $\{S_1,S_2,S_3\}$ 时，一条路径可能是：

$$
S_3 \to S_1 \to S_2 \to S_1 \to S_3.
$$

这和连续 ODE 轨迹非常不同：CTMC 的路径不是平滑曲线，而是 piecewise constant jumps。

## 2.2 Rate matrix：离散版 vector field

CTMC 的核心对象是 rate matrix：

$$
Q_t(y \mid x).
$$

含义是：在时间 $t$，当前状态为 $x$ 时，跳到状态 $y$ 的瞬时速率。

rate matrix 满足两个条件：

$$
Q_t(y \mid x) \ge 0 \qquad y \ne x,
$$

$$
Q_t(x \mid x) = -\sum_{y\ne x}Q_t(y \mid x).
$$

因此对固定起点 $x$：

$$
\sum_{y\in\mathcal{S}}Q_t(y \mid x)=0.
$$

> [!warning] 记号方向很重要
> $Q_t(y \mid x)$ 表示从 $x$ 跳到 $y$ 的 rate。不要把 $x$ 和 $y$ 的方向写反。
>
> 如果把 $Q_t$ 看成矩阵，并用列表示当前状态 $x$，那么每一列求和为 $0$。

## 2.3 小时间步近似

对于很小的 $h>0$，CTMC 的转移概率可以近似写成：

$$
p_{t+h\mid t}(y \mid x) = \mathbf{1}_{y=x}+hQ_t(y \mid x)+o(h).
$$

忽略高阶项时得到 Euler 近似：

$$
\widetilde p_{t+h\mid t}(y \mid x)=\mathbf{1}_{y=x}+hQ_t(y \mid x).
$$

这就是 CTMC 采样的基本数值方法：当前位置是 $x$，构造离散分布 $\widetilde p_{t+h\mid t}(\cdot \mid x)$，然后从这个 categorical distribution 采样下一状态。

## 2.4 二状态 CTMC 例子

设：

$$
\mathcal{S}=\{a,b\}.
$$

若从 $a$ 跳到 $b$ 的 rate 是 $\lambda$，从 $b$ 跳到 $a$ 的 rate 也是 $\lambda$，则 rate matrix 可以写成：

$$
Q =
\begin{pmatrix}
-\lambda & \lambda \\
\lambda & -\lambda
\end{pmatrix}.
$$

经过时间 $h$ 的转移概率为：

$$
\begin{pmatrix}
\mathbb{P}(X_{t+h}=a \mid X_t=a) & \mathbb{P}(X_{t+h}=a \mid X_t=b) \\
\mathbb{P}(X_{t+h}=b \mid X_t=a) & \mathbb{P}(X_{t+h}=b \mid X_t=b)
\end{pmatrix}
=
\frac12
\begin{pmatrix}
1+e^{-2\lambda h} & 1-e^{-2\lambda h} \\
1-e^{-2\lambda h} & 1+e^{-2\lambda h}
\end{pmatrix}.
$$

当 $h\to\infty$ 时，转移概率收敛到：

$$
\frac12
\begin{pmatrix}
1 & 1 \\
1 & 1
\end{pmatrix}.
$$

也就是说，不管起点是 $a$ 还是 $b$，长期分布都会变成 uniform distribution。

---

# 3. 用 CTMC 做生成模型

## 3.1 目标：从 noise 到 data

离散生成模型的目标与连续情形完全平行：

$$
X_0 \sim p_{\mathrm{init}}, \qquad X_t \text{ follows a CTMC with rate matrix } Q_t^\theta, \qquad X_1 \sim p_{\mathrm{data}}.
$$

这里：

- $p_{\mathrm{init}}$ 是简单的离散初始分布，例如 uniform distribution 或全 mask 分布。
- $Q_t^\theta$ 是神经网络参数化的 rate matrix。
- 采样时从 $p_{\mathrm{init}}$ 初始化，然后模拟 CTMC 到 $t=1$。

> [!example] 语言模型中的例子
> 对于 masked diffusion language model，可以令初始分布是所有位置都是 `[MASK]`：
>
> $$
> X_0 = (\texttt{[MASK]},\dots,\texttt{[MASK]}).
> $$
>
> 然后 CTMC 逐渐把 mask token 替换成真实 token，最后得到完整文本。

## 3.2 神经网络输出什么？

一个 general CTMC model 需要输出：

$$
x \mapsto \{Q_t^\theta(y \mid x)\}_{y\in\mathcal{S}}.
$$

也就是：给定当前状态 $x$，输出从 $x$ 跳到所有可能 $y$ 的 rate。

但对于序列空间：

$$
|\mathcal{S}|=|\mathcal{V}|^d.
$$

这个空间太大，不可能直接输出所有 $y\in\mathcal{S}$ 的 rate。因此需要结构化假设：factorized CTMC。

---

# 4. Factorized CTMC：只允许一次改一个 token

## 4.1 Neighbor 的概念

对 token 序列：

$$
x=(x_1,\dots,x_d), \qquad y=(y_1,\dots,y_d).
$$

如果 $x$ 和 $y$ 只在一个位置不同，就称它们是 neighbors。

例如：

$$
x=(A,B,C,D), \qquad y=(A,E,C,D)
$$

是 neighbors，因为只改了第二个 token。

但：

$$
z=(A,E,F,D)
$$

和 $x$ 不是 neighbors，因为改了两个位置。

## 4.2 Factorized rate matrix

Factorized CTMC 只允许单 token 更新：

$$
Q_t(y \mid x)=0
$$

当 $x$ 和 $y$ 不是 neighbors 时。

这让模型不需要输出整个 $\mathcal{V}^d$ 上的 rate，只需要对每个位置 $j$ 输出把当前 token 改成每个 vocabulary token 的 rate。

记：

$$
q_j(v) = Q_t(v,j \mid x), \qquad j=1,\dots,d, \quad v\in\mathcal{V}.
$$

其中 $Q_t(v,j \mid x)$ 表示：当前序列是 $x$，把第 $j$ 个位置改成 token $v$ 的 rate。

> [!important] 为什么 factorized 很重要？
> 对语言序列，完整状态空间大小是 $|\mathcal{V}|^d$，不可处理。
>
> Factorized CTMC 把输出规模降到 $d\times |\mathcal{V}|$，这和普通语言模型输出每个位置的 vocabulary logits 类似。

## 4.3 Factorized CTMC 的 Euler / tau-leaping 采样

设当前序列为：

$$
X_t=(X_t^{(1)},\dots,X_t^{(d)}).
$$

步长为：

$$
h=\frac1n.
$$

对每个位置 $j$，令当前 token 为：

$$
x = X_t^{(j)}.
$$

构造 per-position transition distribution：

$$
\widetilde p_{j,t}(v \mid x)=
\begin{cases}
hq_j(v), & v\ne x,\\
1-h\sum_{v'\ne x}q_j(v'), & v=x.
\end{cases}
$$

然后对所有位置并行采样：

$$
X_{t+h}^{(j)}\sim \mathrm{Categorical}(\widetilde p_{j,t}(\cdot \mid X_t^{(j)})).
$$

> [!note] 和真实 CTMC 的关系
> 真实 CTMC 在一个极小时间段内几乎只会发生一个 jump。Factorized parallel update 允许多个位置在同一步中同时更新，因此是 tau-leaping 近似。步长足够小时，这个近似在一阶上是合理的。

---

# 5. Kolmogorov Forward Equation（KFE）

## 5.1 KFE 是什么？

在连续 flow matching 中，我们用 continuity equation 描述概率密度如何随 vector field 演化。离散 CTMC 中对应的方程是 Kolmogorov Forward Equation：

$$
\frac{d}{dt}p_t(x)=\sum_{y\in\mathcal{S}}Q_t(x \mid y)p_t(y).
$$

含义：状态 $x$ 的概率变化率等于所有其他状态流入 $x$ 的净概率流。

其中：

- $Q_t(x \mid y)$：从 $y$ 跳到 $x$ 的 rate。
- $p_t(y)$：当前处在 $y$ 的概率。
- 求和表示所有状态 $y$ 对 $x$ 的贡献。

## 5.2 KFE 的作用

KFE 给出了判断一个 CTMC 是否 follow 某个 probability path 的标准：

$$
X_t \sim p_t \quad \text{for all } 0\le t\le 1
$$

当且仅当 $p_t$ 和 $Q_t$ 满足 KFE。

> [!important] 类比关系
> 连续 flow matching：
>
> $$
> \partial_t p_t(x) = -\mathrm{div}(p_tu_t)(x).
> $$
>
> 离散 flow matching：
>
> $$
> \frac{d}{dt}p_t(x)=\sum_{y\in\mathcal{S}}Q_t(x \mid y)p_t(y).
> $$
>
> 所以 KFE 是离散版 continuity equation。

---

# 6. Discrete Flow Matching 的整体矩阵

连续 flow matching 的核心对象是：

1. Conditional probability path。
2. Marginal probability path。
3. Conditional vector field。
4. Marginal vector field。
5. Conditional / marginal flow matching loss。

离散 flow matching 中对应为：

1. Conditional probability path。
2. Marginal probability path。
3. Conditional rate matrix。
4. Marginal rate matrix。
5. Discrete flow matching loss。

> [!summary] 一句话版
> 把连续空间中的 vector field 换成离散空间中的 rate matrix，其他 flow matching 的思想几乎不变。

---

# 7. Discrete probability path

## 7.1 Conditional probability path

给定一个数据点 $z\in\mathcal{S}$，conditional probability path 是一族分布：

$$
p_t(x \mid z), \qquad 0\le t\le 1.
$$

它需要满足：

$$
p_0(\cdot \mid z)=p_{\mathrm{init}}, \qquad p_1(\cdot \mid z)=\delta_z.
$$

也就是说：

- $t=0$ 时是 noise distribution。
- $t=1$ 时集中到目标数据点 $z$。

## 7.2 Marginal probability path

和连续情形一样，marginal path 通过对数据点 $z$ 做 marginalization 得到：

$$
p_t(x)=\sum_{z\in\mathcal{S}}p_t(x \mid z)p_{\mathrm{data}}(z).
$$

因此：

$$
p_0=p_{\mathrm{init}}, \qquad p_1=p_{\mathrm{data}}.
$$

> [!note] 关键直觉
> Conditional path 是“从 noise 到某个固定数据点 $z$”。
>
> Marginal path 是“从 noise 到整个数据分布 $p_{\mathrm{data}}$”。

---

# 8. Factorized mixture path

## 8.1 定义

最重要的离散 probability path 例子是 factorized mixture path。

设 schedule：

$$
0\le \kappa_t\le 1, \qquad \kappa_0=0, \qquad \kappa_1=1.
$$

对序列 $x=(x_1,\dots,x_d)$ 和目标数据 $z=(z_1,\dots,z_d)$，定义：

$$
p_t(x \mid z)=\prod_{j=1}^d\left((1-\kappa_t)p_{\mathrm{init}}^{(j)}(x_j)+\kappa_t\delta_{z_j}(x_j)\right).
$$

解释：每个位置 $j$ 独立地在 noise token distribution 和真实 token $z_j$ 之间插值。

- 当 $t=0$，$\kappa_t=0$，所有 token 来自 noise distribution。
- 当 $t=1$，$\kappa_t=1$，所有 token 都等于数据 token。

## 8.2 采样方式

从 $p_t(\cdot \mid z)$ 采样可以写成：

$$
m_j\sim \mathrm{Bernoulli}(\kappa_t), \qquad \xi_j\sim p_{\mathrm{init}}^{(j)}.
$$

然后：

$$
x_j=
\begin{cases}
z_j, & m_j=1,\\
\xi_j, & m_j=0.
\end{cases}
$$

最后：

$$
x=(x_1,\dots,x_d).
$$

> [!warning] 不要误解 $x_j=m_jz_j+(1-m_j)\xi_j$
> 这个写法在 slides / notes 中用于表达选择关系，但 token 本身不是数字。更安全的理解是：如果 $m_j=1$，选真实 token $z_j$；如果 $m_j=0$，选 noise token $\xi_j$。

## 8.3 和 Gaussian probability path 的类比

连续 Gaussian path 是：

$$
x=\alpha_t z+\beta_t\epsilon.
$$

它逐渐降低 noise、增加 data signal。

离散 factorized mixture path 是：

$$
p_t(x_j \mid z_j)=(1-\kappa_t)p_{\mathrm{init}}^{(j)}(x_j)+\kappa_t\delta_{z_j}(x_j).
$$

它逐渐降低 noise token 的概率、增加真实 token 的概率。

不同点是：

- Gaussian path 中 $x$ 在连续空间中移动。
- Factorized mixture path 中 token 不移动，只是在 noise token 与 clean token 之间随机切换。

---

# 9. Conditional rate matrix

## 9.1 定义目标

给定 conditional path $p_t(x \mid z)$，我们希望找到 conditional rate matrix：

$$
Q_t^z(y \mid x),
$$

使得对应 CTMC 满足：

$$
X_0\sim p_{\mathrm{init}}, \qquad X_t \text{ follows CTMC of } Q_t^z, \qquad X_t\sim p_t(\cdot \mid z).
$$

也就是说，conditional rate matrix 是离散版的 conditional vector field。

## 9.2 Factorized mixture path 的 conditional rate

对于 factorized mixture path，conditional rate matrix 也是 factorized 的，只允许单 token 更新。

对位置 $j$，候选 token $v_i\in\mathcal{V}$，有：

$$
Q_t^z(v_i,j \mid x)=\frac{\dot\kappa_t}{1-\kappa_t}\left(\delta_{z_j}(v_i)-\delta_{x_j}(v_i)\right).
$$

等价地，可以写成分段形式：

$$
Q_t^z(v_i,j \mid x)=
\begin{cases}
0, & x_j=z_j,\\
\frac{\dot\kappa_t}{1-\kappa_t}, & v_i=z_j,\ x_j\ne z_j,\\
0, & v_i\ne z_j,\ v_i\ne x_j,\ x_j\ne z_j,\\
-\frac{\dot\kappa_t}{1-\kappa_t}, & v_i=x_j,\ x_j\ne z_j.
\end{cases}
$$

直觉：

- 如果当前位置已经是正确 token，即 $x_j=z_j$，就不需要跳。
- 如果当前位置不正确，就以 rate $\dot\kappa_t/(1-\kappa_t)$ 跳到正确 token $z_j$。
- diagonal 项为负数，保证 rate matrix 的列和为 $0$。

## 9.3 rate explosion

若选择简单 schedule：

$$
\kappa_t=t,
$$

则：

$$
\frac{\dot\kappa_t}{1-\kappa_t}=\frac1{1-t}.
$$

当 $t\to1$ 时 rate 会爆炸。

> [!warning] 数值注意
> slides 中专门指出 rates explode at $t=1$。实际实现中通常需要避免精确取到 $t=1$，或者使用截断、稳定化的 schedule / sampler。

---

# 10. Discrete marginalization trick

## 10.1 Marginal rate matrix

连续 flow matching 中，conditional vector field 可以通过 marginalization 得到 marginal vector field。离散情形中完全类似：

$$
Q_t(y \mid x)=\sum_{z\in\mathcal{S}}Q_t^z(y \mid x)\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}.
$$

定义 posterior：

$$
p_{1\mid t}(z \mid x)=\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}.
$$

则：

$$
Q_t(y \mid x)=\sum_{z\in\mathcal{S}}Q_t^z(y \mid x)p_{1\mid t}(z \mid x).
$$

> [!important] 这就是离散版 marginalization trick
> Conditional rate matrix 会把 noise 变成某个固定数据点 $z$。
>
> Marginal rate matrix 对所有可能 $z$ 做 posterior 加权，最终把 noise 变成整个数据分布 $p_{\mathrm{data}}$。

## 10.2 为什么它 follow marginal path？

如果 $Q_t^z$ follow conditional path：

$$
X_t\sim p_t(\cdot \mid z),
$$

那么由 KFE 可以证明，marginal rate matrix $Q_t$ follow marginal path：

$$
X_t\sim p_t.
$$

因此：

$$
X_1\sim p_{\mathrm{data}}.
$$

证明思路和连续版本类似：

1. 写出 marginal path。
2. 对时间求导。
3. 对每个 conditional path 使用 KFE。
4. 交换求和并整理。
5. 得到 marginal KFE。

---

# 11. Factorized mixture path 的 marginal rate

## 11.1 从 conditional rate 到 posterior classifier

对 factorized mixture path，marginal rate 也保持 factorized，并且有一个非常关键的形式：

$$
Q_t(v_i,j \mid x)=\frac{\dot\kappa_t}{1-\kappa_t}\left(p_{1\mid t}(z_j=v_i \mid x)-\delta_{x_j}(v_i)\right).
$$

这里唯一未知的是：

$$
p_{1\mid t}(z_j=v_i \mid x).
$$

这是在给定当前 noisy sequence $x$ 和时间 $t$ 后，第 $j$ 个位置最终 clean token 是 $v_i$ 的 posterior probability。

> [!important] 关键结论
> 学习 marginal rate matrix 等价于学习每个 token 位置的 posterior classifier。
>
> 也就是说，离散 flow matching 最终变成一个分类问题：预测 clean token。

## 11.2 和 denoising 的关系

训练时我们知道原始 clean sequence $z$，也知道如何从 $z$ 生成 noisy $x$。所以可以让网络根据 $x,t$ 预测每个位置的 clean token：

$$
p_{1\mid t}^{\theta}(z_j \mid x).
$$

这和 denoising diffusion 的思想完全一致：输入被腐蚀的数据，预测干净数据。

---

# 12. Discrete Flow Matching loss

## 12.1 Posterior probability network

令神经网络输出每个位置上的 vocabulary distribution：

$$
f_\theta(x,t)_j \in \mathbb{R}^{|\mathcal{V}|}.
$$

经过 softmax 得到：

$$
p_{1\mid t}^{\theta}(v \mid x)_j=\mathrm{Softmax}(f_\theta(x,t)_j)(v).
$$

## 12.2 Loss：每个 token 一个 cross-entropy

Discrete Flow Matching 的训练目标是：

$$
\mathcal{L}_{\mathrm{DFM}}(\theta)
=
\mathbb{E}_{z\sim p_{\mathrm{data}},\ t\sim\mathrm{Unif}[0,1],\ x\sim p_t(\cdot \mid z)}
\left[
\sum_{j=1}^d -\log p_{1\mid t}^{\theta}(z_j \mid x)
\right].
$$

这就是对每个 token 位置做 cross-entropy classification。

> [!note] 和连续 FM 的差别
> 连续 FM：回归一个 target vector field。
>
> 离散 FM：分类一个 clean token posterior。

## 12.3 训练算法

一次训练迭代可以写成：

1. 采样真实序列：

$$
z\sim p_{\mathrm{data}}.
$$

2. 采样时间：

$$
t\sim\mathrm{Unif}[0,1].
$$

3. 计算 schedule：

$$
\kappa=\kappa_t.
$$

4. 从 factorized mixture path 采样 noisy sequence：

$$
x\sim p_t(\cdot \mid z).
$$

5. 网络输出每个位置的 clean-token logits：

$$
\ell_j(\cdot)=f_\theta(x,t)_j.
$$

6. softmax 得到 posterior prediction：

$$
p_{1\mid t}^{\theta}(v \mid x)_j=\mathrm{Softmax}(\ell_j)(v).
$$

7. 最小化 token-wise negative log-likelihood：

$$
\mathcal{L}_{\mathrm{DFM}}(\theta)=\sum_{j=1}^d -\log p_{1\mid t}^{\theta}(z_j \mid x)_j.
$$

---

# 13. Mask Diffusion Language Models

## 13.1 引入 `[MASK]` token

Masked diffusion language model 在 vocabulary 中加入一个特殊 token：

$$
\texttt{[MASK]}.
$$

令初始分布为全 mask：

$$
p_{\mathrm{init}}^{(j)}(x_j)=\delta_{\texttt{[MASK]}}(x_j).
$$

于是 $t=0$ 时：

$$
X_0=(\texttt{[MASK]},\dots,\texttt{[MASK]}).
$$

## 13.2 Factorized mixture path 在 mask 模型中的形式

因为 noise token 固定为 `[MASK]`，所以每个位置只有两种情况：

$$
x_j=
\begin{cases}
z_j, & \text{with probability } \kappa_t,\\
\texttt{[MASK]}, & \text{with probability } 1-\kappa_t.
\end{cases}
$$

训练时，模型看到部分 mask、部分真实 token 的序列，然后预测所有位置的原始 token。

## 13.3 采样过程

采样时从全 mask 开始：

$$
X_0=(\texttt{[MASK]},\dots,\texttt{[MASK]}).
$$

随后模拟 CTMC / discrete sampler，逐渐把 mask 替换成 token。slides 中的例子展示了：

- $t=0$：几乎全是 mask。
- $t=0.3$：少量 token 被填入。
- $t=0.6$：句子结构逐渐出现。
- $t=0.8$：大部分内容已经可读。
- $t=1.0$：完整文本生成。

> [!example] 和自回归语言模型的差异
> 自回归模型通常从左到右生成：
>
> $$
> p(z)=\prod_{j=1}^d p(z_j \mid z_{<j}).
> $$
>
> Mask diffusion 可以以任意顺序填 token，甚至多个 token 并行生成。

---

# 14. Discrete diffusion vs autoregressive models

## 14.1 可能的优势

Discrete diffusion / masked diffusion LLM 的潜在优势：

- **并行生成多个 token**：可能比逐 token 自回归更快。
- **任意顺序生成**：不必固定 left-to-right。
- **适合文本编辑**：可以 mask 掉局部内容再重生成。
- **可以设计新的 probability paths**：也许能设计更符合语义的 noising / denoising 过程。

## 14.2 主要挑战

也有明显困难：

- **没有 KV caching**：自回归 Transformer 的推理加速优势不一定能直接用。
- **学习更难**：模型要学会在任意 mask pattern 下恢复 token。
- **left-to-right 顺序本身有语义合理性**：自然语言强依赖前文，AR factorization 很适合这个结构。
- **需要多步迭代采样**：如果步数很多，并行优势可能被抵消。

> [!question] 一个核心研究问题
> Discrete diffusion 能否在质量、速度、可控编辑能力之间找到比 autoregressive LLM 更好的 trade-off？这仍然是活跃研究方向。

---

# 15. 统一视角：Generator Matching

本讲最后指出：flow matching 的思想不仅适用于：

- Euclidean ODE / SDE。
- 离散 CTMC。

它其实可以推广到更一般的 Markov processes。这个统一框架被称为 **Generator Matching**。

在这个视角下：

- 连续空间中的 vector field 是一种 generator。
- 离散空间中的 rate matrix 是一种 generator。
- 更一般的 Markov process 也有自己的 generator。

因此，flow matching 的核心思想是：

> 构造一个从 noise 到 data 的 probability path，然后学习一个 Markov process 的 generator，使该过程 follow 这条 path。

这个视角可以扩展到：

- smooth manifolds 上的数据。
- 混合状态空间，例如图像 + 文本。
- jump processes。
- 几何数据或科学数据。

---

# 16. 连续 FM 与离散 DFM 对照表

| 连续 Flow Matching | 离散 Flow Matching |
|---|---|
| 状态空间 $\mathbb{R}^d$ | 状态空间 $\mathcal{S}$ 或 $\mathcal{V}^d$ |
| ODE / SDE | CTMC |
| vector field $u_t(x)$ | rate matrix $Q_t(y \mid x)$ |
| conditional vector field $u_t^{\mathrm{target}}(x \mid z)$ | conditional rate matrix $Q_t^z(y \mid x)$ |
| marginal vector field $u_t^{\mathrm{target}}(x)$ | marginal rate matrix $Q_t(y \mid x)$ |
| continuity equation | Kolmogorov Forward Equation |
| regression loss | cross-entropy classification loss |
| Gaussian probability path | factorized mixture path |
| denoise continuous noise | predict clean token posterior |

---

# 17. 常见易错点

## 17.1 “Discrete diffusion” 不是真的 SDE diffusion

在离散状态空间里没有 Brownian motion，也没有 SDE。这里的 diffusion 是机器学习术语，数学对象是 CTMC。

## 17.2 $Q_t(y \mid x)$ 的方向不要写反

$Q_t(y \mid x)$ 表示从 $x$ 跳到 $y$，不是从 $y$ 跳到 $x$。

KFE 中写的是：

$$
\frac{d}{dt}p_t(x)=\sum_{y\in\mathcal{S}}Q_t(x \mid y)p_t(y).
$$

这里 $Q_t(x \mid y)$ 是从 $y$ 流入 $x$ 的 rate。

## 17.3 条件记号用 `\mid`

在 Obsidian 表格和 LaTeX 中，建议写：

$$
p_t(x \mid z), \qquad Q_t(y \mid x), \qquad p_{1\mid t}(z \mid x).
$$

不要写成 `x|z`，避免和 Markdown 表格分隔符冲突。

## 17.4 Factorized mixture path 不是线性插值 token

公式中的：

$$
x_j=m_jz_j+(1-m_j)\xi_j
$$

只是表达“二选一”。token 本身不是数值向量时，不应该把它理解为线性加法。

## 17.5 rate explosion

当 $\kappa_t=t$ 时：

$$
\frac{\dot\kappa_t}{1-\kappa_t}=\frac1{1-t}.
$$

$t\to1$ 时会爆炸，采样和训练实现中需要处理。

---

# 18. 本讲速记

> [!summary] 最小记忆版
> 1. 离散数据不能用 ODE / SDE；用 CTMC。
> 2. CTMC 的核心是 rate matrix $Q_t(y \mid x)$。
> 3. KFE 是离散版 continuity equation。
> 4. Discrete flow matching 依然是：先设 probability path，再找 conditional rate，再 marginalize，再训练。
> 5. Factorized mixture path 对每个 token 独立地在 noise 和 clean token 之间混合。
> 6. Factorized mixture path 的 marginal rate 只需要 posterior $p_{1\mid t}(z_j=v \mid x)$。
> 7. 因此 DFM loss 就是 token-wise cross-entropy。
> 8. Mask diffusion LLM 从全 `[MASK]` 开始，多步并行填 token。

---

# 19. 复习问题

1. 为什么离散空间中不能直接使用 ODE / SDE？
2. $Q_t(y \mid x)$ 的数学含义是什么？为什么 diagonal entry 是负数？
3. KFE 和 continuity equation 的对应关系是什么？
4. Factorized CTMC 为什么可以把输出规模从 $|\mathcal{V}|^d$ 降到 $d|\mathcal{V}|$？
5. Factorized mixture path 中 $\kappa_t$ 起什么作用？
6. 为什么 conditional rate matrix 在 $t\to1$ 时可能爆炸？
7. Discrete marginalization trick 中 posterior $p_{1\mid t}(z \mid x)$ 的意义是什么？
8. 为什么 DFM loss 是 cross-entropy，而不是 MSE？
9. Mask diffusion LLM 和 autoregressive LLM 的生成顺序有什么不同？
10. Generator Matching 如何统一连续和离散生成模型？

---

# 20. 一页公式总结

CTMC rate matrix 条件：

$$
Q_t(y \mid x)\ge0 \quad y\ne x, \qquad Q_t(x \mid x)=-\sum_{y\ne x}Q_t(y \mid x).
$$

小时间步转移近似：

$$
p_{t+h\mid t}(y \mid x)=\mathbf{1}_{y=x}+hQ_t(y \mid x)+o(h).
$$

Kolmogorov Forward Equation：

$$
\frac{d}{dt}p_t(x)=\sum_{y\in\mathcal{S}}Q_t(x \mid y)p_t(y).
$$

Discrete conditional probability path：

$$
p_0(\cdot \mid z)=p_{\mathrm{init}}, \qquad p_1(\cdot \mid z)=\delta_z.
$$

Marginal probability path：

$$
p_t(x)=\sum_{z\in\mathcal{S}}p_t(x \mid z)p_{\mathrm{data}}(z).
$$

Factorized mixture path：

$$
p_t(x \mid z)=\prod_{j=1}^d\left((1-\kappa_t)p_{\mathrm{init}}^{(j)}(x_j)+\kappa_t\delta_{z_j}(x_j)\right).
$$

Conditional rate for factorized mixture path：

$$
Q_t^z(v_i,j \mid x)=\frac{\dot\kappa_t}{1-\kappa_t}\left(\delta_{z_j}(v_i)-\delta_{x_j}(v_i)\right).
$$

Discrete marginalization trick：

$$
Q_t(y \mid x)=\sum_{z\in\mathcal{S}}Q_t^z(y \mid x)\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}.
$$

Posterior definition：

$$
p_{1\mid t}(z \mid x)=\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}.
$$

Marginal rate for factorized mixture path：

$$
Q_t(v_i,j \mid x)=\frac{\dot\kappa_t}{1-\kappa_t}\left(p_{1\mid t}(z_j=v_i \mid x)-\delta_{x_j}(v_i)\right).
$$

Discrete Flow Matching loss：

$$
\mathcal{L}_{\mathrm{DFM}}(\theta)
=
\mathbb{E}_{z\sim p_{\mathrm{data}},\ t\sim\mathrm{Unif}[0,1],\ x\sim p_t(\cdot \mid z)}
\left[
\sum_{j=1}^d -\log p_{1\mid t}^{\theta}(z_j \mid x)
\right].
$$
