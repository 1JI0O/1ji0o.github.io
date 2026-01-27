这个题型通常被称为 **“泛洪填充” (Flood Fill)**，也就是画图软件里的“油漆桶工具”。在算法考试中，它经常以 **“计算连通块大小”** 或 **“区域染色”** 的形式出现。

这也是我之前预测的 **“预测题目二：扫雷/区域染色”** 的核心逻辑。它非常适合 2 小时时长的考试，因为代码量小，但考察了递归（DFS）和二维数组操作。

---

### 题目场景描述

假设你有一个 $M \times N$ 的网格，每个格子里有一个数字代表颜色（比如 0=白, 1=红, 2=蓝）。

**任务**：
给定一个坐标 $(x, y)$ 和一个目标颜色 `newColor`。
请把 **$(x, y)$ 所在的连通区域**（即：从 $(x, y)$ 开始，上下左右颜色相同的所有格子）全部染成 `newColor`。

### 核心算法逻辑 (DFS)

这个问题的 DFS 不需要 `visited` 数组（只要新颜色和旧颜色不一样），逻辑非常简洁。

**步骤**：
1.  **记录旧颜色**：记下起点 $(x, y)$ 当前的颜色为 `oldColor`。
2.  **防呆检查**：如果 `oldColor == newColor`，说明不需要染，直接返回（否则会死循环）。
3.  **进入递归 `dfs(x, y)`**：
    *   **终止条件 1**：越界（跑出地图了）。
    *   **终止条件 2**：当前格子的颜色 **不是** `oldColor`（遇到边界了，或者是别的颜色块）。
    *   **执行操作**：把当前格子改成 `newColor`。
    *   **递归扩散**：对 上、下、左、右 四个邻居调用 `dfs`。

---

### 代码实现

请直接把这一套代码准备好，考场上可以直接用。

#### 1. 头文件 (`mainwindow.h`)

```cpp
private:
    // 递归填充函数
    void dfsFloodFill(int x, int y, int oldColor, int newColor);
    
    // 对外接口
    void startFloodFill(int startX, int startY, int targetColor);
```

#### 2. 源文件 (`mainwindow.cpp`)

```cpp
// 对外调用的入口函数
void MainWindow::startFloodFill(int startX, int startY, int targetColor) {
    // 0. 基础检查
    if (M == 0 || N == 0) return;
    if (startX < 0 || startX >= M || startY < 0 || startY >= N) return;

    // 1. 获取旧颜色
    int oldColor = map[startX][startY];

    // 2. 如果颜色一样，不用染，防止死循环
    if (oldColor == targetColor) return;

    // 3. 开始递归
    dfsFloodFill(startX, startY, oldColor, targetColor);

    // 4. 刷新界面
    update();
}

// 核心递归函数
void MainWindow::dfsFloodFill(int x, int y, int oldColor, int newColor) {
    // 1. 越界检查
    if (x < 0 || x >= M || y < 0 || y >= N) return;

    // 2. 颜色不匹配检查 (遇到墙了，或者已经染过了)
    if (map[x][y] != oldColor) return;

    // 3. 染色！(修改状态)
    map[x][y] = newColor;

    // 4. 向四个方向扩散
    // 写法 A: 直接写四行 (简单粗暴)
    dfsFloodFill(x + 1, y, oldColor, newColor);
    dfsFloodFill(x - 1, y, oldColor, newColor);
    dfsFloodFill(x, y + 1, oldColor, newColor);
    dfsFloodFill(x, y - 1, oldColor, newColor);

    /* 写法 B: 用方向数组 (更优雅)
    int dx[] = {1, -1, 0, 0};
    int dy[] = {0, 0, 1, -1};
    for(int i=0; i<4; ++i) {
        dfsFloodFill(x + dx[i], y + dy[i], oldColor, newColor);
    }
    */
}
```

---

### 进阶考法：如何用鼠标触发？

如果题目要求 **“点击某个格子，该区域变色”**，你需要重写 `mousePressEvent`。这是 GUI 考试中的高分点。

```cpp
void MainWindow::mousePressEvent(QMouseEvent *event) {
    if (!isLoaded) return;

    // 1. 获取鼠标点击的屏幕坐标
    int mouseX = event->x();
    int mouseY = event->y();

    // 2. 转换为网格坐标 (Row, Col)
    // 逆运算 paintEvent 里的公式： pixel = margin + index * size
    // index = (pixel - margin) / size
    
    int topMargin = 50; 
    int leftMargin = 20;
    
    // 计算当前的格子大小 (逻辑要和 paintEvent 一致)
    int drawWidth = this->width() - 2 * leftMargin;
    int drawHeight = this->height() - topMargin - 20;
    double cellW = (double)drawWidth / N;
    double cellH = (double)drawHeight / M;

    // 只有点在网格区域内才处理
    if (mouseX >= leftMargin && mouseY >= topMargin) {
        // 注意：Y轴对应行(Row/M)，X轴对应列(Col/N)
        int col = (mouseX - leftMargin) / cellW;
        int row = (mouseY - topMargin) / cellH;

        // 二次防越界检查
        if (row >= 0 && row < M && col >= 0 && col < N) {
            
            // 触发染色！
            // 比如：左键染色成 1 (红色)，右键染色成 2 (蓝色)
            if (event->button() == Qt::LeftButton) {
                startFloodFill(row, col, 1);
            } else if (event->button() == Qt::RightButton) {
                startFloodFill(row, col, 2);
            }
        }
    }
}
```

### 为什么说这道题适合 2 小时考试？

1.  **逻辑闭环**：不像消消乐（还要处理掉落、重复消除），Flood Fill 染完就结束了，一次性操作。
2.  **代码极短**：`dfsFloodFill` 只有 10 行代码。
3.  **视觉效果好**：点一下，一大片变色，演示给助教看的时候非常直观。

### 变种考题：计算最大连通块

如果题目不让你染色，而是让你 **“求出地图上最大的同色区域包含多少个格子”**。

逻辑几乎一样，只需要加一个计数器：

```cpp
// 全局变量或成员变量
int currentAreaSize = 0;

void MainWindow::dfsCount(int x, int y, int targetColor, vector<vector<bool>> &visited) {
    if (x < 0 || ... || visited[x][y] || map[x][y] != targetColor) return;

    visited[x][y] = true;
    currentAreaSize++; // 统计数量

    // 递归...
    // 这里的 // 递归... 指的就是 **向上下左右 4 个方向** 继续调用函数自己。
}

// 主循环
void MainWindow::findMaxArea() {
    int maxArea = 0;
    vector<vector<bool>> visited(M, vector<bool>(N, false));

    for(int i=0; i<M; ++i) {
        for(int j=0; j<N; ++j) {
            if (!visited[i][j]) {
                currentAreaSize = 0;
                dfsCount(i, j, map[i][j], visited);
                if (currentAreaSize > maxArea) {
                    maxArea = currentAreaSize;
                }
            }
        }
    }
    qDebug() << "Max connected area size:" << maxArea;
}
```

这段代码也建议你存下来，万一考的是**“消除最大的同色块”**，你就需要先算出哪个最大，再调用上面的 `floodFill` 把它消掉（染成 0）。