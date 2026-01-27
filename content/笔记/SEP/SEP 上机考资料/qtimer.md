这是一个非常关键的补充材料！既然老师在 slides 里着重讲解了 **Snake Game (贪吃蛇)**，并且考试时间缩短为 2 小时，这强烈暗示了题目类型会从“复杂的逻辑计算”（如消消乐的掉落匹配、迷宫的最短路）转向 **“实时交互与状态更新”**。

**2023年考题**（静态路径规划）是基于**静态数据**的。
**2024年考题**（消消乐）是基于**离散步数**的。
**Slide 中的 Snake** 是基于 **Timer（定时器）** 和 **实时按键** 的。

结合 slide 内容，我为你重新定制了 3 个极高概率的预测题。它们都基于网格（Grid），但引入了 `QTimer`（时间流逝）的概念，这是 2 小时考试中考察“动态效果”的最佳方式。

---

### 预测题一：贪吃蛇变种 —— "Tron" (光轮摩托 / 贪吃蛇对战)
**可能性：★★★★★ (Slide 直接相关)**
这是贪吃蛇的简化版，去掉了“吃食物变长”的逻辑，改为“走过的地方留下墙壁”。

*   **题目描述**：
    *   $M \times N$ 网格。
    *   玩家控制一个光点，每 $T$ 毫秒自动向前移动一步。
    *   **规则**：
        1.  玩家走过的路径会变成“墙”。
        2.  玩家不能撞墙、不能撞边界、不能回头。
        3.  （进阶可能）输入文件包含预设的障碍物。
    *   **输入**：地图大小，障碍物坐标，初始方向。

*   **GUI 需求**：
    *   **绘制**：
        *   `0`: 空地（白色/黑色背景）。
        *   `1`: 障碍物（灰色）。
        *   `2`: 玩家当前的头（亮黄色）。
        *   `3`: 玩家留下的轨迹（蓝色）。
    *   **交互**：
        *   按 `Space` 开始/暂停游戏。
        *   按 `WASD` 或方向键改变移动方向。

*   **核心算法逻辑**：
    *   **定时器**：这是新考点。需要使用 `QTimer`，连接到 `updateGame()` 槽函数。
    *   **移动更新**：
        ```cpp
        void updateGame() {
            // 1. 计算下一步坐标
            int nextX = headX + dx;
            int nextY = headY + dy;
            
            // 2. 碰撞检测
            if (isWall(nextX, nextY) || isTrail(nextX, nextY) || isOutOfBounds(nextX, nextY)) {
                gameOver();
                return;
            }
            
            // 3. 更新状态
            map[headX][headY] = 3; // 把当前头变成轨迹
            headX = nextX;
            headY = nextY;
            map[headX][headY] = 2; // 新位置变成头
            
            update(); // 刷新界面
        }
        ```
    *   **2小时优势**：逻辑比贪吃蛇还简单（不用维护身体数组 `QList<QPoint>`，直接改地图 `map` 即可）。

---

### 预测题二：垂直躲避 / 下落方块 (Falling Dodge)
**可能性：★★★★☆**
这是“消消乐掉落逻辑” + “贪吃蛇实时移动”的结合体。

*   **题目描述**：
    *   玩家控制一个方块在**最底下一行**左右移动。
    *   上方随机（或根据文件输入）不断掉落障碍物。
    *   **规则**：玩家要躲避掉落物，坚持越久得分越高。
    *   **输入**：地图大小，每一秒掉落的物体位置序列。

*   **GUI 需求**：
    *   **绘制**：玩家（蓝色方块），掉落物（红色圆形或方块）。
    *   **交互**：按 `Left/Right` 控制玩家左右移动。

*   **核心算法逻辑**：
    *   **数据结构**：
        *   `playerCol`: 玩家当前在第几列。
        *   `vector<QPoint> obstacles`: 存储所有当前屏幕上的障碍物坐标。
    *   **定时器逻辑 (`QTimer`)**：
        *   每隔一段时间（如 500ms），遍历 `obstacles`，让所有障碍物 `y += 1`。
        *   **碰撞检测**：如果有障碍物的 `y` 到了最底行，且 `x == playerCol`，游戏结束。
        *   **生成新障碍**：读取输入序列，在顶行生成新的障碍物。
    *   **清理**：如果障碍物 `y >= M`（掉出屏幕），从 vector 中移除。

---

### 预测题三：打地鼠 / 点击消除 (Grid Whack-a-Mole)
**可能性：★★★☆☆**
考察鼠标交互 (`mousePressEvent`) 和 定时器 (`QTimer`) 的结合。

*   **题目描述**：
    *   $M \times N$ 网格。
    *   地鼠会随机出现在某个格子上，持续一段时间后消失。
    *   **规则**：在地鼠出现期间点击该格子，得分+1。
    *   **输入**：地鼠出现的坐标序列和时间点。

*   **GUI 需求**：
    *   **绘制**：
        *   普通格子（草地色）。
        *   有地鼠的格子（画个圆或褐色）。
    *   **交互**：
        *   **鼠标点击**：重写 `mousePressEvent`，判断点击位置是否有地鼠。

*   **核心算法逻辑**：
    *   **状态管理**：`map[i][j]` 记录该格子剩余的“存活时间”。
    *   **定时器逻辑**：
        *   每 100ms 触发一次。
        *   遍历全图，如果 `map[i][j] > 0`，则 `map[i][j]--` (倒计时)。
        *   如果倒计时归零，地鼠消失。
        *   检查输入队列，看当前时间点是否有新地鼠生成。
    *   **鼠标逻辑**：
        *   算出点击的 `(r, c)`。
        *   如果 `map[r][c] > 0`，则 `score++`，并设 `map[r][c] = 0` (立刻打死)。

---

### 针对 Slide 补充的“必背”代码模板

既然 slide 提到了 `QTimer` 和 `Snake`，你必须在考前把 **定时器** 的代码准备好。之前的复习主要集中在静态按键上，这里补上动态部分。

**在 `MainWindow.h` 中：**
```cpp
#include <QTimer>

private slots:
    void gameLoop(); // 游戏主循环函数

private:
    QTimer *timer;
    int gameSpeed = 500; // 毫秒
```

**在 `MainWindow.cpp` 中：**
```cpp
MainWindow::MainWindow(QWidget *parent) : QMainWindow(parent)
{
    // ... 初始化界面 ...

    // 1. 初始化定时器
    timer = new QTimer(this);
    
    // 2. 连接信号槽：每当定时器超时，就执行 gameLoop
    connect(timer, &QTimer::timeout, this, &MainWindow::gameLoop);

    // 3. 启动定时器 (开始游戏时调用)
    // timer->start(gameSpeed); 
}

void MainWindow::gameLoop() {
    // 这里写游戏逻辑：
    // 1. 移动蛇 / 下落方块 / 生成地鼠
    // 2. 检测碰撞
    // 3. 刷新界面
    
    // moveSnake();
    // checkCollision();
    update(); // 触发 paintEvent
}

// 记得在析构或重置游戏时停止定时器
// timer->stop();
```

### 总结建议

1.  **Slide 里的 `Snake` 是重点**：
    *   请仔细看 slide 第 19-24 页。它使用了 `QGraphicsView` 框架（`QGraphicsItem`, `QGraphicsScene`）。
    *   **但是！** 23年和24年的真题都是用 `QWidget` + `paintEvent` 也就是我们之前练习的方法。
    *   **我的建议**：考试时**不要**临时去学 `QGraphicsView`（那个框架比较重，配置麻烦）。**坚持用我们练习的 `vector<vector<int>>` + `paintEvent` + `QTimer`**。这能实现一模一样的效果，而且代码量少得多，完全符合题目要求。

2.  **准备好 `QTimer` 的代码**：
    *   如果题目要求“自动移动”、“倒计时”、“自动掉落”，一定是用 `QTimer`。

3.  **不要慌**：
    *   2小时很短，题目逻辑一定被大大简化了（如我预测的 Tron 或 下落躲避）。
    *   只要你会**读文件**、**画格子**、**写个定时器让格子动起来**，你就稳拿 80% 以上的分数。

---

>QTimer会循环进行吗

**是的，它会一直循环进行。**

在 Qt 中，`QTimer` 的默认行为就是 **周期性触发**。

### 1. 机制解释
当你调用 `timer->start(500);` 后：
1.  Qt 会开始计时。
2.  **每隔** 500 毫秒，它就会发出一次 `timeout()` 信号。
3.  对应的槽函数 `gameLoop()` 就会被执行一次。
4.  执行完后，计时器自动重置，等待下一个 500 毫秒，再次触发。

**这个过程会无限循环下去**，直到你手动停止它，或者程序关闭。

---

### 2. 考试中如何控制它？（必背代码）

针对贪吃蛇或掉落类游戏，你通常需要实现 **暂停 (Pause)**、**继续 (Resume)** 和 **游戏结束 (Game Over)**。

以下是控制 Timer 循环的标准写法：

#### A. 暂停游戏 (Pause)
```cpp
void MainWindow::on_pauseButton_clicked() {
    timer->stop(); // 停止计时器，gameLoop 不再执行，画面静止
}
```

#### B. 继续游戏 (Resume)
```cpp
void MainWindow::on_resumeButton_clicked() {
    // 重新启动，继续保持之前的间隔时间
    // 如果之前 start(500) 设过值，这里直接调 start() 即可
    timer->start(); 
}
```

#### C. 游戏结束 (Game Over)
在你的 `gameLoop` 逻辑里：
```cpp
void MainWindow::gameLoop() {
    // 1. 移动逻辑...
    
    // 2. 碰撞检测
    if (checkCollision()) {
        timer->stop(); // 必须立刻停止循环！否则游戏结束了蛇还在动
        QMessageBox::information(this, "Game Over", "You died!");
        return;
    }
    
    update();
}
```

#### D. (进阶) 游戏加速
如果你吃了食物想让蛇跑得更快：
```cpp
void MainWindow::levelUp() {
    gameSpeed -= 50; // 间隔变短 = 速度变快
    if (gameSpeed < 50) gameSpeed = 50; // 设个下限
    
    // 必须重新 start 才能应用新的时间间隔
    timer->start(gameSpeed); 
}
```

### 3. 特殊情况：如果你只想触发一次

虽然考试大概率是用循环（做动画/游戏循环），但如果题目要求 **“延时 1 秒后执行某操作，且只执行一次”**（比如显示 Logo 然后消失），你需要开启 **单次触发模式**：

```cpp
timer->setSingleShot(true); // 设置为单次触发
timer->start(1000); 
// 结果：1秒后 timeout 信号只发一次，然后 timer 自动停止。
```

**总结：**
对于 Slide 里提到的 Snake Game 或任何需要“自动移动”的题目，**默认的 `start()` 就是你想要的无限循环**，完全不用担心。