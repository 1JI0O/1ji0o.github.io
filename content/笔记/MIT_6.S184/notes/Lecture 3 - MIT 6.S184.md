---
course: MIT 6.S184
title: Score Matching and Guidance
创建日期: 2026-05-19
author: gpt5.5
---
# Lecture 03: Score Matching and Guidance

> [!summary] 本讲主线
> Lec 1-2 主要用 **flow matching** 学习 marginal vector field，然后通过 ODE 从 noise 走到 data。本讲换一个等价视角：学习 **score function**，再用它做 SDE stochastic sampling；然后讨论如何把生成过程条件化到 prompt/class 上，特别是现代模型里非常核心的 **classifier-free guidance, CFG**。

## 0. 课前回顾：从 Flow Matching 到本讲问题

Flow matching 里已经有三层对象：conditional probability path、conditional vector field，以及 marginal 后得到的真正用于生成的 vector field。

### 0.1 Conditional probability path

给定一个 data point $z$，conditional probability path $p_t(x \mid z)$ 从简单噪声分布插值到这个 data point。

$$
p_0(\cdot \mid z)=p_{\mathrm{init}},\qquad p_1(\cdot \mid z)=\delta_z
$$

最重要的例子是 Gaussian conditional probability path：

$$
p_t(\cdot \mid z)=\mathcal N(\alpha_t z,\beta_t^2 I_d)
$$

其中 schedulers 满足：

$$
\alpha_0=0,\quad \alpha_1=1,\quad \beta_0=1,\quad \beta_1=0
$$

采样形式是：

$$
z\sim p_{\mathrm{data}},\qquad \epsilon\sim \mathcal N(0,I_d),\qquad x_t=\alpha_t z+\beta_t\epsilon
$$

直觉：$t=0$ 时只有 noise，$t=1$ 时回到 data。

### 0.2 Conditional vector field

Conditional vector field $u_t^{\mathrm{target}}(x \mid z)$ 是一个 ODE velocity field，使得 ODE 的边缘分布正好沿着 conditional path 走：

$$
X_0\sim p_{\mathrm{init}},\qquad \frac{d}{dt}X_t=u_t^{\mathrm{target}}(X_t \mid z)\quad\Longrightarrow\quad X_t\sim p_t(\cdot \mid z)
$$

对于 Gaussian path，它有显式表达式：

$$
u_t^{\mathrm{target}}(x \mid z)=\left(\dot\alpha_t-\frac{\dot\beta_t}{\beta_t}\alpha_t\right)z+\frac{\dot\beta_t}{\beta_t}x
$$

也可以把 $x_t=\alpha_t z+\beta_t\epsilon$ 代进去，得到训练时最常用的 target velocity：

$$
u_t^{\mathrm{target}}(x_t \mid z)=\dot\alpha_t z+\dot\beta_t\epsilon
$$

### 0.3 Marginalization trick

Conditional vector field 会把所有点推到同一个 $z$，本身不能直接生成新样本。真正的生成 field 是对所有 $z$ 做 posterior-weighted average：

$$
u_t^{\mathrm{target}}(x)=\int u_t^{\mathrm{target}}(x \mid z)\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}\,dz
$$

它满足：

$$
X_0\sim p_{\mathrm{init}},\qquad \frac{d}{dt}X_t=u_t^{\mathrm{target}}(X_t)\quad\Longrightarrow\quad X_t\sim p_t
$$

特别地，$X_1\sim p_{\mathrm{data}}$。

### 0.4 Flow matching training 回顾

Flow matching 的关键是：虽然 $u_t^{\mathrm{target}}(x)$ 难以直接算，但训练网络去拟合 conditional target $u_t^{\mathrm{target}}(x \mid z)$，最优解会等价于学到 marginal field。

一般形式：

$$
\mathcal L_{\mathrm{CFM}}(\theta)=\mathbb E_{t,z,x}\left[\left\|u_t^\theta(x)-u_t^{\mathrm{target}}(x \mid z)\right\|^2\right]
$$

Gaussian path 下：

$$
\mathcal L_{\mathrm{CFM}}(\theta)=\mathbb E_{t,z,\epsilon}\left[\left\|u_t^\theta(\alpha_t z+\beta_t\epsilon)-(\dot\alpha_t z+\dot\beta_t\epsilon)\right\|^2\right]
$$

> [!tip] 本讲的转折点
> Flow matching 学的是 velocity/vector field。Diffusion model 的经典表述更喜欢学 **score function**。本讲要说明：在 Gaussian probability path 下，学 velocity 和学 score 本质上可以互相转换。

## 1. Score function：log-likelihood 的梯度

对任意 density $q(x)$，score function 定义为：

$$
s_q(x)=\nabla_x\log q(x)
$$

几何直觉：$\nabla_x\log q(x)$ 指向 log-likelihood 上升最快的方向。也就是说，如果当前位置 $x$ 在低概率区域，score 会指出“往哪里走更像数据”。

> [!note] 为什么不是直接学 likelihood？
> 在高维生成模型中，$q(x)$ 本身的归一化常数、密度值通常很难处理；而 score 只需要知道 log-density 的局部梯度。Diffusion/score-based models 正是利用这个梯度信息来逐步把 noise 拉回 data manifold。

## 2. Conditional score 与 marginal score

回到 probability path：

- conditional score：$\nabla_x\log p_t(x \mid z)$
- marginal score：$\nabla_x\log p_t(x)$

它们之间有和 vector field 完全平行的 marginalization 关系：

$$
\nabla_x\log p_t(x)=\int \nabla_x\log p_t(x \mid z)\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}\,dz
$$

这里的权重就是 posterior-like quantity：给定 noisy sample $x$，不同 clean data $z$ 的相对可能性。

### 2.1 Gaussian path 的 conditional score

对 Gaussian conditional path：

$$
p_t(x \mid z)=\mathcal N(x;\alpha_t z,\beta_t^2 I_d)
$$

其 log-density 中与 $x$ 有关的部分是：

$$
\log p_t(x \mid z)=\mathrm{const}-\frac{1}{2\beta_t^2}\|x-\alpha_t z\|^2
$$

因此：

$$
\nabla_x\log p_t(x \mid z)=-\frac{x-\alpha_t z}{\beta_t^2}=\frac{\alpha_t}{\beta_t^2}z-\frac{1}{\beta_t^2}x
$$

如果写成 noisy sample $x_t=\alpha_t z+\beta_t\epsilon$，那么：

$$
\nabla_x\log p_t(x_t \mid z)=-\frac{\epsilon}{\beta_t}
$$

这条公式非常重要，因为它直接导出 denoising score matching 的训练目标。

## 3. Velocity field 与 score function 的转换

Gaussian path 里，conditional vector field 和 conditional score 都是关于 $x,z$ 的线性函数。因此它们可以互相重参数化。

定义：

$$
a_t=\beta_t^2\frac{\dot\alpha_t}{\alpha_t}-\dot\beta_t\beta_t,
\qquad b_t=\frac{\dot\alpha_t}{\alpha_t}
$$

则有：

$$
u_t^{\mathrm{target}}(x \mid z)=a_t\nabla_x\log p_t(x \mid z)+b_t x
$$

marginal 版本也成立：

$$
u_t^{\mathrm{target}}(x)=a_t\nabla_x\log p_t(x)+b_t x
$$

这意味着：

- 如果学到了 marginal vector field $u_t^{\mathrm{target}}(x)$，就能恢复 marginal score $\nabla_x\log p_t(x)$。
- 如果学到了 marginal score $\nabla_x\log p_t(x)$，也能恢复 marginal vector field。
- 早期 diffusion models 往往直接学习 score/noise，再把它转换成 vector field 做采样。

> [!warning] 端点附近的数值问题
> 上面公式里有 $\alpha_t$、$\beta_t$ 的分母。实际实现中，$t=0$ 或 $t=1$ 附近常需要避开端点、clip scheduler，或换成更稳定的 parameterization。不要把这些理论公式机械地在端点代入。

### 3.1 Denoiser parameterization

除了 velocity 和 score，还可以学习 denoiser，即从 noisy sample $x$ 估计 clean data $z$ 的 posterior mean：

$$
D_t(x)=\mathbb E[z\mid x]=\int z\frac{p_t(x \mid z)p_{\mathrm{data}}(z)}{p_t(x)}\,dz
$$

对于 Gaussian path，denoiser、score、velocity 都可以互相恢复。直觉上，denoising diffusion models 的名字来自这里：模型在 noisy input 上学习恢复干净信号或恢复噪声。

## 4. Score Matching：如何学习 marginal score

目标是学：

$$
s_t^\theta(x)\approx \nabla_x\log p_t(x)
$$

直接做 score matching 的 loss 是：

$$
\mathcal L_{\mathrm{SM}}(\theta)=\mathbb E_{t,z,x}\left[\left\|s_t^\theta(x)-\nabla_x\log p_t(x)\right\|^2\right]
$$

问题：$p_t(x)$ 是 marginal path 的密度，通常涉及对所有 data $z$ 积分，无法直接算；所以 $\nabla_x\log p_t(x)$ 也不可得。

### 4.1 Denoising score matching

可行的替代目标是拟合 conditional score：

$$
\mathcal L_{\mathrm{CSM}}(\theta)=\mathbb E_{t,z,x}\left[\left\|s_t^\theta(x)-\nabla_x\log p_t(x \mid z)\right\|^2\right]
$$

关键定理：

$$
\mathcal L_{\mathrm{SM}}(\theta)=\mathcal L_{\mathrm{CSM}}(\theta)+C
$$

其中 $C$ 与 $\theta$ 无关，所以两者梯度相同：

$$
\nabla_\theta\mathcal L_{\mathrm{SM}}(\theta)=\nabla_\theta\mathcal L_{\mathrm{CSM}}(\theta)
$$

这和 flow matching 的 trick 完全平行：训练时用 tractable 的 conditional target，最优时学到的是 marginal object。

### 4.2 Gaussian path 下的 DSM loss

由前面的 Gaussian score：

$$
\nabla_x\log p_t(x_t \mid z)=-\frac{\epsilon}{\beta_t}
$$

所以 DSM loss 可以写成：

$$
\mathcal L_{\mathrm{DSM}}(\theta)=\mathbb E_{t,z,\epsilon}\left[\left\|s_t^\theta(\alpha_t z+\beta_t\epsilon)+\frac{\epsilon}{\beta_t}\right\|^2\right]
$$

这说明 score network 本质上要预测 corrupted data 中的噪声方向。

> [!danger] 低噪声处不稳定
> 当 $\beta_t\approx 0$ 时，target $-\epsilon/\beta_t$ 的尺度会很大，训练容易数值不稳定。这也是 slides 特别强调的 typo/实现易错点之一。

### 4.3 Noise predictor parameterization

实际 DDPM 风格实现常改学 noise predictor $\epsilon_t^\theta(x)$，令：

$$
-\beta_t s_t^\theta(x)=\epsilon_t^\theta(x)
$$

于是训练目标变成更稳定的噪声预测：

$$
\mathcal L_{\mathrm{DDPM}}(\theta)=\mathbb E_{t,z,\epsilon}\left[\left\|\epsilon_t^\theta(\alpha_t z+\beta_t\epsilon)-\epsilon\right\|^2\right]
$$

这就是“denoising”的核心含义：训练时人为把 clean data $z$ 加噪得到 $x_t$，网络学习识别或去除这部分噪声。

### 4.4 Score matching 训练流程

```text
Input: dataset samples z ~ p_data, score network s_theta or noise predictor epsilon_theta
repeat for each mini-batch:
    1. sample clean data z
    2. sample time t ~ Uniform[0,1]
    3. sample noise epsilon ~ N(0, I_d)
    4. set x_t = alpha_t z + beta_t epsilon
    5. score-target version:
       minimize ||s_theta(t, x_t) + epsilon / beta_t||^2
    6. noise-prediction version:
       minimize ||epsilon_theta(t, x_t) - epsilon||^2
end
```

## 5. 从 ODE 到 SDE：stochastic sampling

Flow matching 默认用 ODE：

$$
dX_t=u_t^{\mathrm{target}}(X_t)\,dt
$$

Diffusion models 允许采样轨迹带随机性：

$$
dX_t=u_t(X_t)\,dt+\sigma_t\,dW_t
$$

这里 $W_t$ 是 Brownian motion，$\sigma_t$ 是 diffusion coefficient。

### 5.1 Fokker-Planck equation

如果 SDE 为：

$$
dX_t=u_t(X_t)\,dt+\sigma_t\,dW_t
$$

那么它的 marginal density $p_t(x)$ 满足：

$$
\partial_t p_t(x)=-\operatorname{div}(p_tu_t)(x)+\frac{\sigma_t^2}{2}\Delta p_t(x)
$$

两项含义：

- $-\operatorname{div}(p_tu_t)$：由 vector field 搬运 probability mass，对应 ODE 的 continuity equation。
- $\frac{\sigma_t^2}{2}\Delta p_t$：由 Brownian noise 导致的扩散，对应 heat equation 的 dispersion。

### 5.2 SDE extension trick

如果已经有一个 ODE vector field $u_t^{\mathrm{target}}$ 能让 $X_t\sim p_t$，那么对任意 $\sigma_t\ge 0$，下面这个 SDE 也保持相同的 marginals：

$$
dX_t=\left[u_t^{\mathrm{target}}(X_t)+\frac{\sigma_t^2}{2}\nabla_x\log p_t(X_t)\right]dt+\sigma_t\,dW_t
$$

因此：

$$
X_0\sim p_{\mathrm{init}}\quad\Longrightarrow\quad X_t\sim p_t\quad(0\le t\le 1),\qquad X_1\sim p_{\mathrm{data}}
$$

直觉：$\sigma_t dW_t$ 会把点随机打散；额外的 score correction $\frac{\sigma_t^2}{2}\nabla_x\log p_t(X_t)$ 会把分布拉回目标 marginal path。两者配平后，边缘分布仍然是 $p_t$。

### 5.3 Gaussian path：只用 score 写采样 SDE

利用 velocity-score 转换：

$$
u_t^{\mathrm{target}}(x)=a_t\nabla_x\log p_t(x)+b_t x
$$

SDE extension 可写为：

$$
dX_t=\left[\left(a_t+\frac{\sigma_t^2}{2}\right)\nabla_x\log p_t(X_t)+b_tX_t\right]dt+\sigma_t\,dW_t
$$

实际用 score network 近似：

$$
dX_t=\left[\left(a_t+\frac{\sigma_t^2}{2}\right)s_t^\theta(X_t)+b_tX_t\right]dt+\sigma_t\,dW_t
$$

Euler-Maruyama 离散化为：

$$
X_{t+h}=X_t+h\left[\left(a_t+\frac{\sigma_t^2}{2}\right)s_t^\theta(X_t)+b_tX_t\right]+\sigma_t\sqrt h\,\xi_t,
\qquad \xi_t\sim\mathcal N(0,I_d)
$$

### 5.4 为什么要 stochastic dynamics？

理论上，如果 score/vector field 完美、数值积分也完美，所有 $\sigma_t$ 都会得到同样的 marginal path，最后都采样自 $p_{\mathrm{data}}$。

实践中不同 $\sigma_t$ 会有差异，因为：

- **training error**：神经网络没有完美学到 score 或 vector field。
- **simulation error**：ODE/SDE 都要离散化，步数有限时会有误差；$\sigma_t$ 太大时可能需要更小步长。
- **downstream needs**：某些任务需要随机演化，例如 inference-time optimization、search、fine-tuning 等。

> [!important] slides 的实际结论
> SDE sampling 是一个可选工具，不是必须项。很多场景里 ODE sampling 反而效果最好或更高效。

### 5.5 Aside：Langevin dynamics

当 probability path 不随时间变，即 $p_t=p$，并且 $u_t^{\mathrm{target}}=0$ 时，SDE extension 退化为：

$$
dX_t=\frac{\sigma_t^2}{2}\nabla_x\log p(X_t)\,dt+\sigma_t\,dW_t
$$

这就是 Langevin dynamics。它的 stationary distribution 是 $p$，也是 molecular dynamics 和许多 MCMC 方法的重要基础。

## 6. Guidance：从“生成任意图片”到“按 prompt 生成”

前面讨论的 mostly 是 unguided generation：

$$
X_1\sim p_{\mathrm{data}}
$$

但实际更常见的是 guided generation，例如输入 prompt “a cat baking a cake”，希望：

$$
X_1\sim p_{\mathrm{data}}(\cdot \mid y)
$$

> [!note] 术语区分
> 课程里为了避免混淆，通常把 $p_t(x \mid z)$ 这种“给定 clean data $z$ 的 path”叫 **conditional**，而把给定 prompt/class $y$ 的生成叫 **guided**。

## 7. Vanilla guidance

最直接的方法：把 prompt/class $y$ 作为网络输入。

Guided diffusion/flow model：

$$
u^\theta:\mathbb R^d\times\mathcal Y\times[0,1]\to\mathbb R^d,
\qquad (x,y,t)\mapsto u_t^\theta(x \mid y)
$$

采样时：

$$
X_0\sim p_{\mathrm{init}},\qquad dX_t=u_t^\theta(X_t \mid y)dt+\sigma_t dW_t,
\qquad X_1\approx p_{\mathrm{data}}(\cdot \mid y)
$$

Flow matching 训练目标变成：

$$
\mathcal L_{\mathrm{guided\text{-}CFM}}(\theta)=\mathbb E_{(z,y),t,x}\left[\left\|u_t^\theta(x \mid y)-u_t^{\mathrm{target}}(x \mid z)\right\|^2\right]
$$

其中 $(z,y)\sim p_{\mathrm{data}}(z,y)$。也就是说，dataloader 需要返回 paired data，例如 image-text pair 或 image-class pair。

### 7.1 Vanilla guidance 的问题

理论上 vanilla guidance 应该学到 $p_{\mathrm{data}}(\cdot \mid y)$。但实践中生成样本常常“不够听话”，即 prompt adherence 不够好。

可能原因：

- model underfit，没有真正学到 guided marginal vector field；
- 数据集里的 image-text pair 本身有噪声；
- 复杂 prompt 的约束很难完全由 vanilla conditioning 捕捉。

于是需要人为强化 prompt 对采样轨迹的影响，这就引出 guidance。

## 8. Classifier guidance

为了理解 CFG，先看 classifier guidance。

Gaussian path 下有：

$$
u_t^{\mathrm{target}}(x \mid y)=a_t\nabla_x\log p_t(x \mid y)+b_t x
$$

由 Bayes rule：

$$
p_t(x \mid y)=\frac{p_t(x)p_t(y \mid x)}{p_t(y)}
$$

对 $x$ 求梯度：

$$
\nabla_x\log p_t(x \mid y)=\nabla_x\log p_t(x)+\nabla_x\log p_t(y \mid x)
$$

所以：

$$
u_t^{\mathrm{target}}(x \mid y)=u_t^{\mathrm{target}}(x)+a_t\nabla_x\log p_t(y \mid x)
$$

其中 $\nabla_x\log p_t(y \mid x)$ 可以理解为一个 classifier 给出的“让 noisy image $x$ 更像 label/prompt $y$”的方向。

Classifier guidance 把这一项放大：

$$
\widetilde u_t(x \mid y)=u_t^{\mathrm{target}}(x)+w a_t\nabla_x\log p_t(y \mid x)
$$

其中 $w>1$ 是 guidance scale。

缺点：

- 需要额外训练一个 classifier $p_t(y \mid x)$。
- 对 text prompt 这种高维条件，classifier 很难建模。
- 需要对 $x$ 求 classifier gradient，成本和稳定性都不理想。

## 9. Classifier-free guidance, CFG

CFG 的目标：达到 classifier guidance 类似的“放大 prompt-dependent direction”的效果，但不训练额外 classifier。

由前面的分解可以推导：

$$
\widetilde u_t(x \mid y)=(1-w)u_t^{\mathrm{target}}(x)+wu_t^{\mathrm{target}}(x \mid y)
$$

把 unguided field 写成空条件：

$$
u_t^{\mathrm{target}}(x)=u_t^{\mathrm{target}}(x \mid \emptyset)
$$

于是 CFG 采样时使用：

$$
\widetilde u_t(x \mid y)=(1-w)u_t^{\mathrm{target}}(x \mid \emptyset)+wu_t^{\mathrm{target}}(x \mid y)
$$

实际用同一个网络：

$$
\widetilde u_t^\theta(x \mid y)=(1-w)u_t^\theta(x \mid \emptyset)+wu_t^\theta(x \mid y)
$$

解释：

- $w=0$：只用 unconditional field。
- $w=1$：普通 vanilla guided field。
- $w>1$：放大 conditional 与 unconditional 之间的差异，即强化 prompt-dependent part。

> [!warning] CFG 是 heuristic
> 当 $w>1$ 时，采样不再严格对应真实的 $p_{\mathrm{data}}(\cdot \mid y)$。它是在经验上更好地提升 prompt adherence，但可能牺牲 diversity，过大时也会导致 artifacts。

## 10. CFG training：drop label 学到空条件

关键技巧：训练时随机把 label/prompt 丢掉，替换成空 token $\emptyset$。这样同一个网络同时学会：

- $u_t^\theta(x \mid y)$：有条件生成；
- $u_t^\theta(x \mid \emptyset)$：无条件生成。

设 label drop probability 为 $\eta$。CFG-CFM objective：

$$
\mathcal L_{\mathrm{CFG\text{-}CFM}}(\theta)=\mathbb E\left[\left\|u_t^\theta(x \mid y)-u_t^{\mathrm{target}}(x \mid z)\right\|^2\right]
$$

其中采样过程包含：

$$
(z,y)\sim p_{\mathrm{data}}(z,y),\qquad t\sim\mathrm{Unif}[0,1],\qquad x\sim p_t(\cdot \mid z),\qquad y\leftarrow\emptyset\ \text{with probability }\eta
$$

Gaussian path 下算法是：

```text
Input: paired dataset (z, y), network u_theta, label-drop probability eta
repeat for each mini-batch:
    1. sample paired example (z, y)
    2. sample time t ~ Uniform[0,1]
    3. sample noise epsilon ~ N(0, I_d)
    4. set x_t = alpha_t z + beta_t epsilon
    5. with probability eta, replace y by empty token
    6. minimize ||u_theta(t, x_t, y) - (dot_alpha_t z + dot_beta_t epsilon)||^2
end
```

CFG inference：

```text
Input: prompt y, guidance scale w, initial X_0 ~ p_init
for t from 0 to 1:
    u_cond   = u_theta(t, X_t, y)
    u_uncond = u_theta(t, X_t, empty_token)
    u_cfg    = (1 - w) * u_uncond + w * u_cond
    update X_t using ODE/SDE solver with u_cfg
return X_1
```

> [!important] 实践地位
> Slides 强调：几乎所有你看到的高质量 AI image/video generation 都 heavily rely on CFG。Stable Diffusion 3 这类系统也会使用大于 1 的 guidance scale，slides 中给出的例子约为 $w\approx 4$。

## 11. Diffusion literature map：不同表述其实在讲同一件事

Lec 3 最后给了一个 diffusion literature guide，主要是帮你把不同论文的术语对齐。

### 11.1 Time convention

Flow matching / rectified flows / stochastic interpolants 常用：

$$
t=0\Rightarrow \text{noise},\qquad t=1\Rightarrow \text{data}
$$

Score-based diffusion with SDEs 常用相反方向：

$$
t=0\Rightarrow \text{data},\qquad t\to\infty\Rightarrow \text{noise}
$$

DDPM/DDIM 常用 discrete time：

- 不直接写连续 ODE/SDE，而写 Markov chain。
- DDIM 可以理解成某种 probability flow ODE 的离散版本。

### 11.2 Noising procedure 的三种语言

同一 Gaussian construction 经常有三种等价说法：

第一种，probability path：

$$
p_t(\cdot \mid z)=\mathcal N(\alpha_tz,\beta_t^2I_d)
$$

第二种，interpolant function：

$$
x_t=\alpha_tz+\beta_t\epsilon
$$

第三种，forward noising process：从 data 出发逐步加噪，最后变成 Gaussian noise。

> [!tip] 读论文时的翻译规则
> 如果一篇论文说 “forward diffusion/noising process”，另一篇说 “probability path/interpolant”，先检查它们是否都是 Gaussian path。很多情况下只是 time convention 和 notation 不同，本质等价。

### 11.3 Flow Matching 的位置

Slides 对 Flow Matching 的定位：

- 算法表达非常简单；
- 可以只用 flows，也可以扩展到 diffusion/SDE sampling；
- 不局限于 Gaussian noise 到 image data，也可以从任意 initial distribution 桥接到任意 target distribution。

例子包括：

- video without audio $\to$ video with audio；
- low-resolution image $\to$ high-resolution image；
- unperturbed cells $\to$ perturbed cells。

## 12. 一页公式速查

### 12.1 Gaussian path

$$
p_t(\cdot \mid z)=\mathcal N(\alpha_t z,\beta_t^2I_d),\qquad x_t=\alpha_tz+\beta_t\epsilon
$$

### 12.2 Conditional vector field

$$
u_t^{\mathrm{target}}(x \mid z)=\left(\dot\alpha_t-\frac{\dot\beta_t}{\beta_t}\alpha_t\right)z+\frac{\dot\beta_t}{\beta_t}x
$$

$$
u_t^{\mathrm{target}}(x_t \mid z)=\dot\alpha_tz+\dot\beta_t\epsilon
$$

### 12.3 Conditional score

$$
\nabla_x\log p_t(x \mid z)=-\frac{x-\alpha_tz}{\beta_t^2}
$$

$$
\nabla_x\log p_t(x_t \mid z)=-\frac{\epsilon}{\beta_t}
$$

### 12.4 Velocity-score conversion

$$
u_t^{\mathrm{target}}(x)=a_t\nabla_x\log p_t(x)+b_tx,
\qquad a_t=\beta_t^2\frac{\dot\alpha_t}{\alpha_t}-\dot\beta_t\beta_t,
\qquad b_t=\frac{\dot\alpha_t}{\alpha_t}
$$

### 12.5 Denoising score matching

$$
\mathcal L_{\mathrm{DSM}}(\theta)=\mathbb E_{t,z,\epsilon}\left[\left\|s_t^\theta(\alpha_tz+\beta_t\epsilon)+\frac{\epsilon}{\beta_t}\right\|^2\right]
$$

### 12.6 Noise prediction

$$
\mathcal L_{\mathrm{DDPM}}(\theta)=\mathbb E_{t,z,\epsilon}\left[\left\|\epsilon_t^\theta(\alpha_tz+\beta_t\epsilon)-\epsilon\right\|^2\right]
$$

### 12.7 SDE extension

$$
dX_t=\left[u_t^{\mathrm{target}}(X_t)+\frac{\sigma_t^2}{2}\nabla_x\log p_t(X_t)\right]dt+\sigma_t\,dW_t
$$

### 12.8 CFG

$$
\widetilde u_t^\theta(x \mid y)=(1-w)u_t^\theta(x \mid \emptyset)+wu_t^\theta(x \mid y)
$$

## 13. 易错点清单

- 写条件概率时尽量用 $x \mid z$、$x \mid y$，不要写成容易在表格里出问题的 `x|z`。
- $z$ 是 clean data；$x_t$ 是加噪后的中间状态；$\epsilon$ 是加进去的 Gaussian noise。
- $\beta_t$ 是 probability path 的 noise scheduler；$\sigma_t$ 是 SDE sampling 的 diffusion coefficient。两者不是同一个东西。
- $u_t^\theta$ 是 velocity/vector field network；$s_t^\theta$ 是 score network；$\epsilon_t^\theta$ 是 noise predictor。
- Denoising score matching 里拟合 conditional score，但理论最优解是 marginal score。
- $\beta_t\approx 0$ 时，$\epsilon/\beta_t$ 会造成数值不稳定。
- CFG 的 $w=1$ 对应 vanilla guided sampling；$w>1$ 才是强化 prompt。过大的 $w$ 可能让样本更听 prompt，但 diversity 下降、artifact 增多。
- CFG 不是精确建模 $p_{\mathrm{data}}(\cdot \mid y)$，而是一个经验上非常有效的 heuristic。

## 14. 本讲最重要的 takeaway

> [!success] Takeaway
> Gaussian probability path 下，velocity、score、noise prediction、denoiser 是同一个信息的不同 parameterization。Flow matching 学 velocity，score matching 学 score/noise；二者可以互相转换。SDE extension 说明加入随机噪声后，只要加上 score correction，仍能保持同一 probability path。Guidance 部分则说明，现代 text-to-image/video 模型几乎都会用 CFG，通过同时计算 conditional 与 unconditional vector field，并放大它们的差异来增强 prompt adherence。
