---
title: MIT 6.S184 Lecture 04 - Latent Spaces and Neural Network Architectures
创建日期: 2026-05-19
author: gpt5.5
---
# Lecture 04：Latent Spaces, Neural Network Architectures

> [!summary] 本讲主线
> 前几讲已经讲清楚了如何训练 flow / diffusion model：学习一个时间相关的 vector field 或 score，然后从噪声逐步生成数据。本讲回答两个更工程化但非常关键的问题：
> 1. **高分辨率图片 / 视频太高维，怎么让模型可训练、可采样？**答案是把数据压缩到 latent space，在 latent 上做 flow matching / diffusion。
> 2. **神经网络 $u_t^\theta(x \mid y)$ 到底怎么设计？**答案包括时间嵌入、文本嵌入、patchify、self-attention、cross-attention、AdaLN，以及现代 DiT / MM-DiT 架构。

## 0. 和前几讲的连接

前几讲的生成建模框架是：给定数据分布 $p_{\mathrm{data}}$，我们希望训练一个模型，使得从简单初始分布出发，通过 ODE / SDE 采样得到数据样本。

Flow model 的典型采样形式是：

$$
X_0 \sim p_{\mathrm{init}}, \qquad \frac{d}{dt}X_t = u_t^\theta(X_t), \qquad X_1 \sim p_{\mathrm{data}}.
$$

Guided / conditional generation 时，模型变成：

$$
u_t^\theta(x \mid y),
$$

其中 $x$ 是当前 noisy sample 或 latent sample，$t$ 是时间，$y$ 是条件，例如 class label 或 text prompt。

本讲重点不是重新推导 flow matching / score matching，而是解释：

- $x$ 如果是高分辨率图片或视频，维度太大，直接建模会非常贵。
- $t$ 是一个标量，如何让网络真正使用它。
- $y$ 是文本时，如何转成神经网络能处理的向量序列。
- $u_t^\theta(x \mid y)$ 用什么架构参数化。

---

# 1. 为什么需要 latent space？

## 1.1 高分辨率图片的维度灾难

一张 RGB 图片可以写成：

$$
x \in \mathbb{R}^{C \times H \times W}, \qquad C = 3.
$$

如果图片大小是 $600 \times 1000$，那么维度是：

$$
d = 3 \times 600 \times 1000 = 1{,}800{,}000.
$$

如果是 $1024 \times 1024$，则：

$$
d = 3 \times 1024 \times 1024 \approx 3 \times 10^6.
$$

视频更夸张，因为多了时间维度 $T$：

$$
x \in \mathbb{R}^{T \times C \times H \times W}.
$$

所以维度会随帧数 $T$ 线性增长。

## 1.2 为什么这对 diffusion / flow 特别麻烦？

这不是普通 supervised learning 中的“输入很大”问题，而是 diffusion / flow 中的“输入和输出都很大”问题。

在图片分类里，网络可能输入一张大图，但输出只是类别 logits，例如 $1000$ 维。而在 flow / diffusion 中，模型学习的是 vector field：

$$
u_t^\theta : \mathbb{R}^d \to \mathbb{R}^d.
$$

也就是说：

- 输入是高维图片 $x_t$。
- 输出也是同样形状的高维向量 $u_t^\theta(x_t)$。
- 采样时还要反复调用网络，例如 50 steps、100 steps，甚至更多。

因此问题包括：

- GPU memory 很容易爆。
- 学习一个高维输出函数很难。
- 相邻像素高度相关，直接在 pixel space 里建模有大量冗余。
- 视频还会乘上时间维度，成本进一步上升。

> [!important] 核心动机
> Latent space 的作用不是“让模型更神秘”，而是把图片 / 视频压缩成更小、更语义化、更容易建模的表示，让 flow matching / diffusion model 在这个低维表示上工作。

---

# 2. Autoencoder：构造 latent space 的基本工具

## 2.1 Encoder + Decoder

Autoencoder 由两部分组成：

- Encoder：把数据 $x$ 压缩成 latent $z$。
- Decoder：把 latent $z$ 还原成数据 $\hat{x}$。

形式上：

$$
\mu_\phi : \mathbb{R}^d \to \mathbb{R}^k, \qquad \mu_\theta : \mathbb{R}^k \to \mathbb{R}^d, \qquad k \ll d.
$$

编码和解码为：

$$
z = \mu_\phi(x), \qquad \hat{x} = \mu_\theta(z) = \mu_\theta(\mu_\phi(x)).
$$

标准 autoencoder 的训练目标通常是 reconstruction loss：

$$
\mathcal{L}_{\mathrm{Recon}}(\phi, \theta) = \mathbb{E}_{x \sim p_{\mathrm{data}}}\left[ \left\| \mu_\theta(\mu_\phi(x)) - x \right\|^2 \right].
$$

直观上，它要求解码后的 $\hat{x}$ 尽量接近原图 $x$。

## 2.2 标准 autoencoder 的问题

如果我们的目标只是压缩和重建，标准 autoencoder 已经够用了。但在 latent diffusion 中，我们还要在 latent space 里训练一个生成模型。

也就是说，我们真正需要的是：

1. 把数据映射到 latent space：

$$
z = \mu_\phi(x), \qquad x \sim p_{\mathrm{data}}.
$$

2. 得到 latent distribution：

$$
z \sim p_{\mathrm{latent}}.
$$

3. 在 $p_{\mathrm{latent}}$ 上训练 flow / diffusion model。

问题是，标准 reconstruction loss 只关心能不能重建，不关心 latent distribution 长什么样。它可能把数据压缩到一个很扭曲、很复杂、很难采样的分布上。

> [!warning] 标准 AE 的关键缺陷
> Reconstruction loss 不能保证 latent distribution 是“nice”的。它可能完成压缩，却让 latent 分布变得更难学习。

因此我们需要一种 autoencoder，它不仅能重建，还能让 latent distribution 更接近一个简单分布，比如标准高斯分布。

这就引出 VAE。

---

# 3. KL divergence：衡量 latent distribution 是否接近 prior

## 3.1 KL divergence 定义

对于两个概率密度 $q$ 和 $p$，Kullback-Leibler divergence 定义为：

$$
D_{\mathrm{KL}}(q(x) \| p(x)) = \int q(x) \log \frac{q(x)}{p(x)} dx = \mathbb{E}_{X \sim q}\left[ \log \frac{q(X)}{p(X)} \right].
$$

它满足：

$$
D_{\mathrm{KL}}(q(x) \| p(x)) \ge 0,
$$

并且：

$$
D_{\mathrm{KL}}(q(x) \| p(x)) = 0 \iff q = p.
$$

> [!note] 直觉
> KL divergence 可以看成“用 $p$ 近似 $q$ 的代价”。在 VAE 中，我们用它惩罚 encoder 输出的 latent distribution 偏离标准高斯 prior。

## 3.2 两个 diagonal Gaussian 的 KL divergence

令：

$$
q(x) = \mathcal{N}(x; \mu_q, \operatorname{diag}(\sigma_q^2)), \qquad p(x) = \mathcal{N}(x; \mu_p, \operatorname{diag}(\sigma_p^2)).
$$

则：

$$
D_{\mathrm{KL}}(q \| p) = \frac{1}{2}\left( K\left(\frac{\sigma_q^2}{\sigma_p^2}\right) + \frac{\|\mu_q - \mu_p\|^2}{\sigma_p^2} \right), \qquad K(\alpha) = \sum_i \alpha_i - \log \alpha_i - 1.
$$

其中 $K(\alpha)$ 在 $\alpha = 1$ 处达到最小值。也就是说：

- 均值相同会降低 KL。
- 方差相同会降低 KL。
- 当 $q=p$ 时，KL 为 $0$。

如果 prior 是标准高斯：

$$
p_{\mathrm{prior}}(z) = \mathcal{N}(0, I_k),
$$

那么对 encoder 的 Gaussian 输出：

$$
q_\phi(z \mid x) = \mathcal{N}(z; \mu_\phi(x), \operatorname{diag}(\sigma_\phi^2(x))),
$$

KL 项会鼓励：

$$
\mu_\phi(x) \approx 0, \qquad \sigma_\phi^2(x) \approx 1.
$$

这就是 VAE 让 latent distribution 变得“Gaussian-like”的机制。

---

# 4. Variational Autoencoder, VAE

## 4.1 从 deterministic AE 到 probabilistic AE

标准 autoencoder 是 deterministic 的：

$$
z = \mu_\phi(x), \qquad \hat{x} = \mu_\theta(z).
$$

VAE 把 encoder 和 decoder 都看成概率分布：

$$
q_\phi(z \mid x) = \mathcal{N}(z; \mu_\phi(x), \operatorname{diag}(\sigma_\phi^2(x))),
$$

$$
p_\theta(x \mid z) = \mathcal{N}(x; \mu_\theta(z), \sigma_\theta^2(z) I_d).
$$

编码和解码变成采样：

$$
z \sim q_\phi(\cdot \mid x), \qquad x \sim p_\theta(\cdot \mid z).
$$

当 encoder / decoder 方差都退化为 $0$ 时，VAE 就退化为普通 autoencoder。

## 4.2 VAE reconstruction loss

VAE 的 reconstruction loss 使用 negative log-likelihood：

$$
\mathcal{L}_{\mathrm{VAE\text{-}Recon}}(\phi, \theta) = -\mathbb{E}_{x \sim p_{\mathrm{data}}(x), z \sim q_\phi(\cdot \mid x)}\left[ \log p_\theta(x \mid z) \right].
$$

如果 decoder 是 Gaussian，则可以写成：

$$
\mathcal{L}_{\mathrm{VAE\text{-}Recon}}(\phi, \theta) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x), z \sim q_\phi(z \mid x)}\left[ \frac{1}{2\sigma_\theta^2(z)}\|x - \mu_\theta(z)\|^2 + \frac{d}{2}\log \sigma_\theta^2(z) \right] + \mathrm{const}.
$$

如果为了稳定，把 decoder 方差固定为常数 $\sigma_\theta^2$，则基本变成带随机编码的 MSE：

$$
\mathcal{L}_{\mathrm{VAE\text{-}Recon}}(\phi, \theta) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x), z \sim q_\phi(z \mid x)}\left[ \frac{1}{2\sigma_\theta^2}\|x - \mu_\theta(z)\|^2 \right] + \mathrm{const}.
$$

## 4.3 VAE prior loss

VAE 额外引入 latent prior：

$$
p_{\mathrm{prior}}(z) = \mathcal{N}(0, I_k).
$$

prior loss 是：

$$
\mathcal{L}_{\mathrm{VAE\text{-}Prior}}(\phi) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x)}\left[ D_{\mathrm{KL}}(q_\phi(\cdot \mid x) \| p_{\mathrm{prior}}) \right].
$$

对于 Gaussian encoder，可以写成：

$$
\mathcal{L}_{\mathrm{VAE\text{-}Prior}}(\phi) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x)}\left[ \frac{1}{2}K(\sigma_\phi^2(x)) + \frac{1}{2}\|\mu_\phi(x)\|^2 \right].
$$

直觉：

- $\|\mu_\phi(x)\|^2$ 惩罚 latent mean 偏离 $0$。
- $K(\sigma_\phi^2(x))$ 惩罚 latent variance 偏离 $1$。

## 4.4 β-VAE 总 loss

VAE 的总目标是 reconstruction 和 prior regularization 的加权和：

$$
\mathcal{L}_{\mathrm{VAE}}(\phi, \theta) = \mathcal{L}_{\mathrm{VAE\text{-}Recon}}(\phi, \theta) + \beta \mathcal{L}_{\mathrm{VAE\text{-}Prior}}(\phi).
$$

展开为：

$$
\mathcal{L}_{\mathrm{VAE}}(\phi, \theta) = -\mathbb{E}_{x \sim p_{\mathrm{data}}(x), z \sim q_\phi(z \mid x)}\left[ \log p_\theta(x \mid z) \right] + \beta \mathbb{E}_{x \sim p_{\mathrm{data}}(x)}\left[ D_{\mathrm{KL}}(q_\phi(\cdot \mid x) \| p_{\mathrm{prior}}) \right].
$$

如果写成更直观的 Gaussian 形式：

$$
\mathcal{L}_{\mathrm{VAE}}(\phi, \theta) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x), z \sim q_\phi(z \mid x)}\left[ \frac{1}{2\sigma_\theta^2(z)}\|x - \mu_\theta(z)\|^2 + \frac{d}{2}\log \sigma_\theta^2(z) + \frac{\beta}{2}K(\sigma_\phi^2(x)) + \frac{\beta}{2}\|\mu_\phi(x)\|^2 \right].
$$

四个项分别对应：

1. Reconstruction error：重建要好。
2. Decoder confidence：decoder 的不确定性控制。
3. Latent variance regularization：让 latent variance 接近 $1$。
4. Latent mean regularization：让 latent mean 接近 $0$。

> [!important] β 的作用
> $\beta$ 越大，latent 越接近标准高斯，但 reconstruction 可能变差；$\beta$ 太小，重建可能好，但 latent distribution 可能不够规整。现代图像 autoencoder 中 $\beta$ 往往很小，且常配合 KL warm-up。

## 4.5 Reparameterization trick

VAE 训练的难点是：

$$
z \sim q_\phi(z \mid x)
$$

这个采样分布依赖参数 $\phi$，不方便直接反向传播。

Reparameterization trick 把采样改写为：

$$
\epsilon \sim \mathcal{N}(0, I_k), \qquad z = \mu_\phi(x) + \sigma_\phi(x) \odot \epsilon, \qquad z \sim q_\phi(\cdot \mid x).
$$

这样随机性只来自 $\epsilon$，而 $\epsilon$ 的分布不依赖 $\phi$。于是梯度可以通过 $\mu_\phi(x)$ 和 $\sigma_\phi(x)$ 反传。

固定 decoder 方差后的训练目标可以写成：

$$
\mathcal{L}_{\mathrm{VAE}}(\phi, \theta) = \mathbb{E}_{x \sim p_{\mathrm{data}}(x), \epsilon \sim \mathcal{N}(0, I_k)}\left[ \frac{1}{2\sigma^2}\|x - \mu_\theta(\mu_\phi(x) + \sigma_\phi(x) \odot \epsilon)\|^2 + \frac{\beta}{2}K(\sigma_\phi^2(x)) + \frac{\beta}{2}\|\mu_\phi(x)\|^2 \right].
$$

## 4.6 β-VAE 训练算法

> [!example] β-VAE Training Procedure
> 输入：数据集 $x \sim p_{\mathrm{data}}$，encoder networks $(\mu_\phi(x), \log \sigma_\phi^2(x))$，decoder network $\mu_\theta(z)$，latent dimension $k$，常数 $\beta \ge 0$ 和 $\tilde{\sigma}^2 > 0$。
>
> 1. 对每个 mini-batch $\{x_i\}_{i=1}^B$：
> 2. 编码：
>
> $$
> \mu_i \leftarrow \mu_\phi(x_i), \qquad \log \sigma_i^2 \leftarrow \log \sigma_\phi^2(x_i).
> $$
>
> 3. 采样 noise：
>
> $$
> \epsilon_i \sim \mathcal{N}(0, I_k).
> $$
>
> 4. Reparameterize：
>
> $$
> z_i \leftarrow \mu_i + \sigma_i \odot \epsilon_i, \qquad \sigma_i = \exp\left(\frac{1}{2}\log \sigma_i^2\right).
> $$
>
> 5. Decode mean：
>
> $$
> \hat{x}_i \leftarrow \mu_\theta(z_i).
> $$
>
> 6. Reconstruction loss：
>
> $$
> \mathcal{L}_{\mathrm{recon}} \leftarrow \frac{1}{B}\sum_{i=1}^B \frac{1}{2\tilde{\sigma}^2}\|x_i - \hat{x}_i\|^2.
> $$
>
> 7. KL loss to prior $p_{\mathrm{prior}}(z) = \mathcal{N}(0, I_k)$：
>
> $$
> \mathcal{L}_{\mathrm{KL}} \leftarrow \frac{1}{B}\sum_{i=1}^B \frac{1}{2}\sum_{j=1}^k \left(\mu_{i,j}^2 + \sigma_{i,j}^2 - \log \sigma_{i,j}^2 - 1\right).
> $$
>
> 8. Total loss：
>
> $$
> \mathcal{L} \leftarrow \mathcal{L}_{\mathrm{recon}} + \beta \mathcal{L}_{\mathrm{KL}}.
> $$
>
> 9. 用 gradient update 更新 $(\phi, \theta)$。

## 4.7 实践备注

- **KL warm-up**：训练早期先让 $\beta=0$ 或很小，让模型学会重建；之后逐渐增大 $\beta$。
- **Posterior collapse**：如果 $\beta$ 太大，encoder 可能学成 $q_\phi(z \mid x) \approx \mathcal{N}(0, I_k)$，即忽略输入 $x$。
- **固定 decoder variance**：学习 $\sigma_\theta^2(z)$ 可能数值不稳定，很多实现固定它。
- **Pixel MSE 会偏糊**：图像上仅用 pixel-level MSE 容易得到过平滑结果，实际模型常加入 perceptual loss 或 adversarial loss。
- **生成时通常用 decoder mean**：从 latent model 采样得到 $z$ 后，用 $x = \mu_\theta(z)$ 解码，而不是再从 $p_\theta(x \mid z)$ 随机采样，以避免额外噪声 artifacts。

---

# 5. Latent Diffusion Models, LDMs

## 5.1 LDM 的基本 recipe

Latent diffusion / latent flow matching 的流程非常直接：

1. 准备原始训练数据：

$$
x_1, \ldots, x_N \sim p_{\mathrm{data}}.
$$

2. 用预训练 autoencoder 编码成 latent。对 VAE，通常取 encoder mean：

$$
z_i = \mu_\phi(x_i).
$$

3. 得到 latent dataset：

$$
z_1, \ldots, z_N \sim p_{\mathrm{latent}}.
$$

4. 在 latent space 中训练 flow / diffusion model：

$$
u_t^\theta : \mathbb{R}^k \to \mathbb{R}^k.
$$

5. 采样时先生成 latent：

$$
z_{\mathrm{sample}} \sim p_{\mathrm{latent}}.
$$

6. 用 decoder 映射回数据空间：

$$
x_{\mathrm{sample}} = \mu_\theta(z_{\mathrm{sample}}).
$$

> [!important] 关键理解
> LDM 没有改变前几讲的 flow matching / diffusion recipe。它只是把训练数据从 pixel space 换成了 latent space。

## 5.2 为什么几乎所有现代图像 / 视频生成都在 latent space 中做？

现代高分辨率图像和视频生成模型几乎都依赖 latent space，原因是：

- 直接建模 pixel space 太贵。
- Autoencoder 可以过滤掉部分高频、语义上不重要的细节。
- 生成模型可以集中容量学习更重要的 perceptual / semantic structure。
- 视频多了时间维度，latent compression 更关键。

两个典型压缩例子：

$$
\text{Stable Diffusion: } [3, 256, 256] \to [4, 32, 32].
$$

$$
\text{FLUX 2.0: } [3, 1024, 1024] \to [32, 64, 64].
$$

> [!warning] LDM 的代价
> 性能不仅取决于 diffusion / flow model，也强依赖 autoencoder 的质量。如果 autoencoder 压缩不好或解码效果差，后面的 latent generative model 再强也会受限。

---

# 6. Neural network architecture：如何参数化 $u_t^\theta(x \mid y)$

## 6.1 模型输入输出

Guided flow / diffusion model 的核心网络是：

$$
u_t^\theta(x \mid y).
$$

它通常有三个输入：

- 当前 sample 或 latent image：$x$。
- 时间：$t$。
- 条件：$y$，例如 class label 或 text prompt。

输出是与 $x$ 同形状的 vector field / noise / velocity prediction：

$$
u_t^\theta(x \mid y) \in \mathrm{shape}(x).
$$

对于低维 toy distribution，可以把 $x,t,y$ 拼起来送入 MLP。但对图像 / 视频，需要专门的架构：U-Net、DiT、MM-DiT 等。

---

# 7. Encoding time

## 7.1 为什么不能直接用标量 $t$？

$t$ 只有一维，而图片 token、latent token、prompt token 都是高维向量。如果直接把 $t$ 作为一个 scalar 输入，网络可能很难充分利用时间信息。

所以通常用 sinusoidal / Fourier feature 把 $t$ 映射到高维向量。

## 7.2 Sinusoidal time embedding

时间嵌入可以写成：

$$
\operatorname{TimeEmb}(t) = \sqrt{\frac{2}{d}}\left[\cos(2\pi w_1 t), \ldots, \cos(2\pi w_{d/2}t), \sin(2\pi w_1 t), \ldots, \sin(2\pi w_{d/2}t)\right]^T.
$$

频率为：

$$
w_i = w_{\min}\left(\frac{w_{\max}}{w_{\min}}\right)^{\frac{i-1}{d/2-1}}, \qquad i = 1, \ldots, d/2.
$$

这个 embedding 的一个性质是：

$$
\|\operatorname{TimeEmb}(t)\| = 1.
$$

> [!note] 重点
> 具体 sinusoidal 公式不是最重要的。重要的是把一维时间 $t$ 嵌入成一个高维、normed、对不同频率敏感的向量，使网络更容易学习时间相关行为。

---

# 8. Encoding language prompt

## 8.1 文本条件的难点

Prompt 是离散 token 序列，例如：

> A dog running on grass in a park at sunshine in an Italian city.

神经网络不能直接处理原始字符串，所以要先用文本编码器把它变成向量。

常见选择：

- CLIP text embedding。
- T5 / T5-XXL embedding。
- LLM embedding。
- 多种 embedding 组合使用。

## 8.2 Prompt embedding 形状

如果 prompt 被编码成一个长度为 $S$ 的向量序列，每个向量维度为 $k$，则：

$$
\operatorname{PromptEmbed}(y_{\mathrm{raw}}) \in \mathbb{R}^{S \times k}.
$$

CLIP 更偏 coarse-grained global text-image alignment；T5 这类模型可以提供更细粒度的 token-level / sequence-level 信息。

> [!important] 对图像生成的意义
> Cross-attention 需要一个“文本 token 序列”作为 key / value，让图像 token 能够 attend 到 prompt 中的不同词或短语。

---

# 9. Patchify：把图片变成 token 序列

Transformer 处理的是序列，而图片是张量。因此 DiT 类模型需要先把图片切成 patch，再把每个 patch 变成 token。

设图片为：

$$
x \in \mathbb{R}^{C \times H \times W}.
$$

patch size 为 $P$。Patchify 后：

$$
\operatorname{Patchify}(x) \in \mathbb{R}^{N \times C'}, \qquad C' = CP^2, \qquad N = \frac{H}{P}\cdot\frac{W}{P}.
$$

再通过线性层映射到 transformer hidden dimension $d$：

$$
\operatorname{PatchEmb}(x) = \operatorname{Patchify}(x)W \in \mathbb{R}^{N \times d}, \qquad W \in \mathbb{R}^{C' \times d}.
$$

其中：

- $N$ 是 sequence length，也就是 patch token 数。
- $d$ 是每个 token 的 hidden dimension。

---

# 10. Diffusion Transformer, DiT

## 10.1 DiT 的整体结构

DiT 是为 diffusion / flow model 设计的 transformer。它的基本输入包括：

$$
\tilde{t} = \operatorname{TimeEmb}(t) \in \mathbb{R}^d,
$$

$$
\tilde{y} = \operatorname{PromptEmbed}(y) \in \mathbb{R}^{S \times d},
$$

$$
\tilde{x}_0 = \operatorname{PatchEmb}(x) \in \mathbb{R}^{N \times d}.
$$

之后通过 $L$ 层 DiTBlock：

$$
\tilde{x}_{i+1} = \operatorname{DiTBlock}(\tilde{x}_i, \tilde{t}, \tilde{y}) \in \mathbb{R}^{N \times d}, \qquad i = 0, \ldots, L-1.
$$

最后 unpatchify 回原始形状，得到 vector field 输出：

$$
u = \operatorname{Depatchify}(\tilde{x}_L \tilde{W}) \in \mathbb{R}^{C \times H \times W}, \qquad \tilde{W} \in \mathbb{R}^{d \times C'}.
$$

这个 $u$ 就是网络输出的 velocity / vector field：

$$
u = u_t^\theta(x \mid y).
$$

## 10.2 Scaled dot-product attention

Attention 的输入是 queries、keys、values：

$$
Q \in \mathbb{R}^{N \times d_h}, \qquad K \in \mathbb{R}^{M \times d_h}, \qquad V \in \mathbb{R}^{M \times d_h}.
$$

Scaled dot-product attention 定义为：

$$
\operatorname{Attn}(Q,K,V) = \operatorname{softmax}\left(\frac{QK^T}{\sqrt{d_h}}\right)V \in \mathbb{R}^{N \times d_h}.
$$

其中 softmax 按 row 作用。

直觉：

- $QK^T$ 计算每个 query 对每个 key 的相关性。
- 除以 $\sqrt{d_h}$ 防止 dot product 过大。
- softmax 得到 attention weights。
- 最后对 values 加权求和。

## 10.3 Self-attention 和 cross-attention

DiTBlock 中至少有两个核心 attention：

### Self-attention on image patches

图像 patch token 自己和自己交互：

$$
Q = xW_Q, \qquad K = xW_K, \qquad V = xW_V.
$$

这里 queries、keys、values 都来自 image tokens。

作用：让不同图像 patch 之间交换信息，建模空间关系。

### Cross-attention to text prompt

图像 token attend 到文本 token：

$$
Q = xW_Q, \qquad K = yW_K, \qquad V = yW_V.
$$

queries 来自 image tokens，keys 和 values 来自 text embeddings。

作用：让图像 patch 根据 prompt 中的信息调整生成内容。

> [!important] Cross-attention 的一句话理解
> 图像 token 问：“我应该生成什么？”文本 token 回答：“prompt 里有哪些语义可以参考？”

## 10.4 Multi-head attention

设 head 数为 $h$，每个 head 的维度为：

$$
d_h = \frac{d}{h}.
$$

每个 head 做一次 attention：

$$
\operatorname{head}_r(x,z) = \operatorname{Attn}(xW_Q^{(r)}, zW_K^{(r)}, zW_V^{(r)}).
$$

其中 $z=x$ 表示 self-attention，$z=y$ 表示 cross-attention。

把所有 head 拼接后再做输出投影：

$$
\operatorname{MultiHeadAttention}(x,z) = \operatorname{Concat}(\operatorname{head}_1(x,z), \ldots, \operatorname{head}_h(x,z))W_O.
$$

## 10.5 Time conditioning via AdaLN / adaptive normalization

DiT 中时间信息通常不是简单拼接，而是用时间 embedding 调制 normalization。

先由时间 embedding 产生 scale 和 shift：

$$
(\gamma, \beta) = g(\tilde{t}), \qquad \gamma, \beta \in \mathbb{R}^d.
$$

然后对 token matrix $x \in \mathbb{R}^{N \times d}$ 做 adaptive normalization：

$$
\operatorname{AdaNorm}_{\tilde{t}}(x) = (1 + \gamma) \odot \operatorname{Norm}(x) + \beta.
$$

直觉：不同时间 $t$ 下，模型应该执行不同去噪 / 生成行为。AdaLN 让时间直接调制每一层的激活分布。

## 10.6 一个典型 DiTBlock 的组合

简化地说，DiTBlock 包括：

1. Image self-attention。
2. Text cross-attention。
3. MLP。
4. Time-conditioned AdaNorm 和 gating。

可以写成：

$$
x \leftarrow x + g_{\mathrm{self}}(\tilde{t}) \odot \operatorname{MultiHeadAttention}(\operatorname{AdaNorm}_{\tilde{t}}(x), \operatorname{AdaNorm}_{\tilde{t}}(x)),
$$

$$
x \leftarrow x + g_{\mathrm{cross}}(\tilde{t}) \odot \operatorname{MultiHeadAttention}(\operatorname{AdaNorm}_{\tilde{t}}(x), y),
$$

$$
x \leftarrow x + g_{\mathrm{MLP}}(\tilde{t}) \odot \operatorname{MLP}(\operatorname{AdaNorm}_{\tilde{t}}(x)).
$$

> [!note] 轻重缓急
> 不需要死记每个 gating 或 projection 的实现细节。更重要的是理解三件事：self-attention 处理图像内部关系，cross-attention 注入文本条件，AdaLN 注入时间条件。

---

# 11. U-Net：早期 diffusion model 的主力架构

虽然本讲 slides 更强调 DiT，但 lecture notes 也介绍了 U-Net。U-Net 是一种卷积神经网络架构，早期 diffusion model 大量使用它。

U-Net 的特点：

- 输入和输出都是 image-shaped tensor。
- Encoder 逐步降低空间分辨率、增加 channel 数。
- Decoder 逐步恢复空间分辨率。
- Encoder 和 decoder 之间有 skip connections。
- 整体形状像字母 U。

例如输入：

$$
x_t^{\mathrm{input}} \in \mathbb{R}^{3 \times 256 \times 256}.
$$

经过 encoder：

$$
x_t^{\mathrm{latent}} = E(x_t^{\mathrm{input}}) \in \mathbb{R}^{512 \times 32 \times 32}.
$$

经过 midcoder：

$$
x_t^{\mathrm{latent}} = M(x_t^{\mathrm{latent}}) \in \mathbb{R}^{512 \times 32 \times 32}.
$$

经过 decoder：

$$
x_t^{\mathrm{output}} = D(x_t^{\mathrm{latent}}) \in \mathbb{R}^{3 \times 256 \times 256}.
$$

U-Net 的优势是对图像局部结构有很强 inductive bias，适合 image-to-image 形状的输入输出。DiT 的优势是更适合规模化，并且可以通过 attention 灵活融合多模态条件。

---

# 12. Case Study：Stable Diffusion 3

Stable Diffusion 3 可以看成前面所有组件的组合：

- 使用 conditional flow matching。
- 使用 straight-line schedulers，也就是 CondOT path。
- 在 latent space 中训练 flow matching model。
- 使用预训练 VAE / autoencoder。
- 使用 classifier-free guidance。
- 使用 MM-DiT 架构。
- 使用多种 text embedding，例如 CLIP 和 T5-XXL。

## 12.1 SD3 的几个关键数字

- 最大模型约 8B 参数。
- Sampling 约 50 steps。
- Classifier-free guidance weight 大约 $2.0$ 到 $5.0$。
- Dataset：LAION。

## 12.2 为什么同时用 CLIP 和 T5？

CLIP embedding 提供较 coarse 的全局图文对齐信号；T5-XXL 这类 sequence-level embedding 提供更细粒度的文本 token 信息。

这使模型既能把握整体 prompt 语义，又能 attend 到 prompt 中具体词语。

## 12.3 MM-DiT

MM-DiT 是 Multi-Modal Diffusion Transformer。它相比普通 class-conditioned DiT 的主要变化是：

- 不只是处理 image patches。
- 还把 text embeddings 放入整个网络中。
- 通过 cross-attention 或更深的多模态交互，让图像和文本在多层中融合。

> [!important] SD3 的抽象 recipe
> SD3 = latent flow matching + classifier-free guidance + strong text encoders + MM-DiT + large-scale training。

---

# 13. Case Study：Meta MovieGen

MovieGen 是视频生成模型，因此数据形状变成：

$$
x \in \mathbb{R}^{T \times C \times H \times W}.
$$

多出来的 $T$ 是帧数，也就是时间维度。相比图片，视频生成更难，因为：

- 数据维度更高。
- 不仅要每帧好看，还要帧间一致。
- 采样和训练成本更高。

## 13.1 MovieGen 的组件

MovieGen 的整体思路和 SD3 很像：

- Flow matching model。
- Straight-line schedulers / CondOT path。
- Classifier-free guidance。
- Latent space 中训练。
- 使用预训练 video autoencoder / temporal autoencoder。
- DiT-like backbone，但 patchify 要扩展到空间和时间维度。
- 文本条件使用多种 embeddings，例如 UL2、ByT5、MetaCLIP。

## 13.2 为什么 latent space 对视频更关键？

视频比图片多了时间维度。若直接在 pixel video space 中建模，成本会非常高。因此 MovieGen 使用 temporal autoencoder，把原始视频压缩到 latent video：

$$
x' \in \mathbb{R}^{T' \times 3 \times H' \times W'} \quad \longrightarrow \quad x \in \mathbb{R}^{T \times C \times H \times W}.
$$

lecture notes 中给出的压缩比例是：

$$
\frac{T'}{T} = \frac{H'}{H} = \frac{W'}{W} = 8.
$$

也就是说，时间和空间都被压缩。

## 13.3 MovieGen 的规模

- 最大模型约 30B 参数。
- 使用约 6,144 张 H100 GPU。

> [!note] 视频 DiT 的变化
> 图片 DiT patchify 空间维度；视频 DiT 需要同时沿时间和空间 patchify，并用 attention 建模跨帧关系。

---

# 14. Bonus：diffusion literature 的几种视角

## 14.1 时间 convention 不同

不同文献中时间方向不一样，容易混淆。

### Flow time convention

$$
t = 0 \Rightarrow \text{noise}, \qquad t = 1 \Rightarrow \text{data}.
$$

这是本课程前几讲主要使用的 convention。

### Diffusion time convention

$$
t = 0 \Rightarrow \text{data}, \qquad t \to \infty \Rightarrow \text{noise}.
$$

许多 score-based diffusion / SDE 文献使用这个方向。

### Discrete time convention

DDPM / DDIM 等模型使用离散 timesteps，而不是连续时间 ODE / SDE。

一个常见对应关系是：

$$
\mathrm{DDIM} \approx \text{probability flow ODE}.
$$

## 14.2 三种 noising procedure 语言

对于 Gaussian probability path，本课程提到几种表述方式本质上等价。

### Probability path / flow matching 语言

$$
p_t(x \mid z) = \mathcal{N}(\alpha_t z, \beta_t^2 I_d).
$$

### Stochastic interpolant 语言

$$
I_t(\epsilon, z) = \alpha_t z + \beta_t \epsilon.
$$

注意这里 $z$ 是 data，$\epsilon$ 是 noise。实际文献可能交换符号，所以看文章时要先确认 notation。

### Forward diffusion process 语言

$$
dX_t = a_t(X_t)dt + \sigma_t dW_t.
$$

> [!warning] 容易混淆点
> Flow matching、rectified flows、stochastic interpolants、DDPM、score-based SDE 可能使用不同时间方向、不同符号和不同 noising 描述。看公式前先确认：哪个时刻是 data，哪个时刻是 noise。

## 14.3 Reverse SDE 与 SDE extension trick

从 forward SDE 构造 reverse SDE 是 diffusion literature 中的经典思路。课程中强调：time-reversed SDE 可以看成前一讲 SDE extension trick 的一个特定解，对应某个特定 noise level。

但经验上，它不一定总是实践中最好的采样 SDE。

## 14.4 Flow matching 的一般性

Flow matching 的一个优势是可以 bridge arbitrary distributions，不一定只能 noise 到 data。

例如：

- 无音频视频 $\to$ 有音频视频。
- 低分辨率图像 $\to$ 高分辨率图像。
- 未扰动细胞 $\to$ 扰动后细胞。

这说明 flow matching 不只是“从高斯噪声生成图片”的算法，也是一类学习分布到分布变换的工具。

---

# 15. 本讲重点总结

## 15.1 必须掌握

1. **Latent space 的必要性**：pixel space 太高维，flow / diffusion 的输出同维，采样还要多次调用模型。
2. **标准 AE 的问题**：只保证重建，不保证 latent distribution 好学。
3. **VAE 的核心机制**：reconstruction loss + KL prior loss。
4. **Reparameterization trick**：把 $z \sim q_\phi(z \mid x)$ 改写成 $z = \mu_\phi(x) + \sigma_\phi(x) \odot \epsilon$。
5. **LDM recipe**：先训练 autoencoder，再在 latent dataset 上训练 flow / diffusion model，采样后 decode。
6. **DiT 的三类条件处理**：time embedding、prompt embedding、image patch tokens。
7. **Self-attention / cross-attention / AdaLN** 分别对应 image interaction、text conditioning、time conditioning。

## 15.2 可以一笔带过但要知道

- U-Net 是早期 diffusion 常用架构，输入输出都是 image-shaped tensor。
- DiT / MM-DiT 是现代大模型常见架构，更适合 scale。
- Stable Diffusion 3 使用 latent flow matching、CFG、MM-DiT、多文本编码器。
- MovieGen 把这些技术扩展到视频，并且需要 temporal autoencoder。

## 15.3 最容易错的地方

- 不要把 autoencoder 的 latent space 默认当成好学分布；普通 AE 没有这个保证。
- 不要忘记 flow / diffusion 的输出维度和输入一样，所以高维输出才是核心负担。
- 不要把 CLIP embedding 和 T5 embedding 当成同一种东西；CLIP 更 global，T5 更 sequence-level。
- 不同文献的时间方向可能相反。
- $p_t(x \mid z)$ 这种条件写法在笔记中最好写成 $p_t(x \mid z)$，不要写成 `p_t(x|z)`，避免 Obsidian 表格或 Markdown 解析出问题。

---

# 16. 一页速记

```markdown
Lecture 04 = Latent Space + Architecture

Why latent?
- Images/videos are huge.
- Diffusion/flow outputs have same shape as input.
- Sampling calls model many times.

AE:
- Encoder compresses x -> z.
- Decoder reconstructs z -> x_hat.
- Reconstruction alone does not control latent distribution.

VAE:
- q_phi(z | x) is Gaussian encoder.
- p_theta(x | z) is Gaussian decoder.
- Loss = reconstruction + beta * KL-to-prior.
- Reparameterization: z = mu + sigma * epsilon.

LDM:
- Train autoencoder.
- Encode data into latents.
- Train flow/diffusion in latent space.
- Sample latent and decode.

DiT:
- Time -> sinusoidal embedding.
- Prompt -> CLIP/T5/LLM embeddings.
- Image -> patches -> tokens.
- Self-attention handles image tokens.
- Cross-attention injects text.
- AdaLN injects time.

Case studies:
- Stable Diffusion 3: latent flow matching + CFG + MM-DiT + CLIP/T5.
- MovieGen: video latent flow matching + temporal autoencoder + video DiT.
```
