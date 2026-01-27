[[Adaptive Compliance Policy]]的论文，[[2026-01-18]]

既然主要目的是用这个文章的代码训练我们的数据，那么后面的附录可以好好看看，同时前面的方法什么的理解就可以了，没有必要特别详细地读。主要精力，至少60%，应该放在代码数据适配上。

质量（Mass）：就像笔的重量。
阻尼（Damping）：就像纸面的摩擦力，或者是你手腕的“粘性”（让动作不乱晃）。
刚度（Stiffness）：就像你手指握笔的“松紧度”。


**“Transformer 融合 + Diffusion 生成”**的架构**

The virtual target pose is computed such that the robot will exert the reference force if it reaches the reference pose while tracking the virtual target with the given stiffness. It essentially changes a force target into a position target. The benefit is to have a uniform target representation across different robots: **an impedance controlled robot without FT sensor can also execute the virtual target.**
- 推理时可以不用力传感器，反正是基于reference pose和virtual target的位置差算出来的要施加的弹性力
- 作者把“力”变成了一种**由物理定律自动生成的副作用**。AI 只需要控制“胡萝卜的位置”和“弹簧的硬度”，哪怕机器人感觉不到力，它也能在碰撞瞬间做出最完美的柔顺反应。
	- 胡萝卜，比如说往猪前面挂一个胡萝卜，它会追着走，也就是target
- 妈的，还挺巧妙的

At inference time, the full stiffness matrix is reconstructed following Eq. 6 by replacing the force direction with the direction from the reference pose to the virtual target.
- 作者不再看传感器现在感到了什么方向的力，而是直接用 **“从参考位置指向胡萝卜”的方向** 来定义变软的方向。
- 这是一种从**“被动反应”到“主动预测”的跨越。机器人不再是“哪里被撞了才在哪里变软”，而是“我知道我要往这个方向压，所以我提前在这个方向上做好了变软的准备”。这让动作的鲁棒性（稳定性）**提升了几个量级。


**原文**：Finally both the stiffness matrix and the virtual target are sent to the low level compliance controller for execution.

这里完成了 **"高层大脑"向"底层脊髓"** 的指令下达。

- **高层大脑 (Diffusion Policy AI)**：每秒钟工作几十次（慢但聪明）。它观察图像，输出 19 维向量，算出了这根"肌肉"的松紧方案（Stiffness Matrix）和胡萝卜位置（Virtual Target）。
- **底层脊髓 (Low-level Compliance Controller)**：每秒钟工作 1000 次以上（快但头脑简单）。它不需要懂视觉，它只负责执行物理定律。
- **执行过程**：
    - 底层控制器接收到 $K$（刚度矩阵）和 $x_{virtual}$（胡萝卜）。
    - 它不断测量电机的当前位置，然后模拟出一根虚拟弹簧：$F_{motor}=K \cdot (x_{actual}-x_{virtual})$。
    - 电机根据这个计算结果产生扭矩。


23点08分 看完了 不是，这个东西怎么没有附录啊，它根本就没详细讲解它那些参数啊代码什么的是怎么用的啊！

