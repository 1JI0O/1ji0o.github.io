[[2026-01-28]]
研究 VLA（Vision-Language-Action）模型，目前的论文路径非常清晰：从 Google DeepMind 的开创性工作开始，到目前的开源大模型方案。

建议你按照以下顺序阅读，这能帮你理清 VLA 是如何从 LLM/VLM 演变而来的：

---

### 1. 入门首选：开山之作 (Google DeepMind 系列)

这两篇论文定义了 VLA 的基本架构，是绕不开的经典。

*   **RT-2: Vision-Language-Action Models (2023)**
    *   **地位：** VLA 的“成名作”。
    *   **核心：** 首次提出了将机器人动作（Action）直接映射为文本 Token。它证明了在海量视觉语言数据上预训练的模型，只需要少量的机器人数据微调，就能拥有极强的泛化能力（即解决你之前问的 OOD 问题）。
    *   **必读理由：** 理解如何把“看、说、做”统一到一个大模型里。

*   **RT-1: Robotics Transformer (2022)**
    *   **核心：** RT-2 的前身，虽然还没用到超大规模的 VLM，但它构建了机器人动作序列化（Tokenization）的基础架构。
    *   **必读理由：** 理解机器人动作是如何被转换成模型能听懂的“数字序列”的。

---

### 2. 必看数据集：VLA 的能量来源

*   **Open X-Embodiment: Robotic Learning at Scale (2023)**
    *   **地位：** 机器人界的 ImageNet。
    *   **核心：** 汇集了全球 20 多个机构、22 种机器人型号、100 万条轨迹的数据集。
    *   **必读理由：** VLA 之所以能有泛化性，全靠这个巨大的数据集。这篇论文解释了“跨机型、跨任务”训练是如何实现的。

---

### 3. 开源界的最强音：目前最好用的模型

如果你想动手跑代码或者深入研究细节，这两篇比 Google 的闭源模型更重要。

*   **OpenVLA: An Open-Source Vision-Language-Action Model (2024)**
    *   **地位：** 目前开源社区最火、性能最强的 VLA。
    *   **核心：** 基于 Llama 和 Prismatic-VLM 架构，在 Open X-Embodiment 数据集上训练。它提供了非常容易使用的推理代码。
    *   **必读理由：** 它是目前学术界研究 VLA 的“标准底座”。

*   **Octo: An Open-Source Generalist Robot Policy (2023)**
    *   **核心：** 采用 Transformer 架构，支持灵活的输入（可以只输入指令，也可以只输入目标图）。
    *   **必读理由：** 学习如何设计一个灵活的、可扩展的通用机器人策略。

---

### 4. 进阶研究：VLA + 扩散模型 (Diffusion)

这部分回答了你第一个问题：如何结合 VLA 的大脑和 Diffusion 的精准动作。

*   **π0 (pi-zero): Original Multimodal Autoregressive Transformer (2024)**
    *   **背景：** 来自 Physical Intelligence (π) 公司的重磅论文。
    *   **核心：** 它将**流匹配（Flow Matching，扩散模型的一种变体）**集成到大模型里。VLA 负责高层逻辑，扩散机制负责输出高频、丝滑的动作。
    *   **必读理由：** 代表了 2024-2025 年最前沿的方向——大模型与连续动作生成的最优结合。

---

### 5. 推荐阅读路线图 (Roadmap)

如果你时间有限，建议按照这个顺序：
1.  **先读《RT-2》**：建立整体概念，知道 VLA 是干嘛的。
	1. [[RT-2]]
2.  **再读《OpenVLA》**：了解现在大家是怎么具体训练这种模型的。
	1. [[OpenVLA]]
3.  **看《Open X-Embodiment》**：了解数据长什么样。
	1. [[Open X-Embodiment]]
4.  **最后看《π0》**：了解大模型和扩散模型是怎么合体的。
	1. [[π0]]

**小建议：**
读这些论文时，重点看它们的 **"Action Tokenization"（动作如何编码）** 和 **"Unseen Generalization"（面对没见过的情况表现如何）** 章节，这能让你对 VLA 处理 OOD 的能力有最直观的科学认识。