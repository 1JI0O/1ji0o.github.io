[[2026-01-25]]

[Welcome to Quartz 4](https://quartz.jzhao.xyz/)
继承自[[个人主页]]和[[个人主页 - about]]

# 初始化

好的，既然你要严格参照官方教程来搭建 **Quartz 4**，我们就按照官方的步骤一步步来，同时结合你当前 `1ji0o.github.io` 仓库只有 `gh-pages` 分支的特殊情况进行处理。

以下是适配你情况的 **Quartz 4 官方标准部署流程**：

### 第一步：准备环境
确保你的电脑上安装了：
*   **Node v22** 或更高版本
*   **npm v10.9.2** 或更高版本
（在终端输入 `node -v` 和 `npm -v` 查看）

---

### 第二步：本地初始化 Quartz
按照官方命令执行：

1.  **克隆代码库：**
    ```bash
    git clone https://github.com/jackyzha0/quartz.git
    cd quartz
    ```

2.  **安装依赖：**
    ```bash
    npm i
    ```

3.  **初始化内容：**
    ```bash
    npx quartz create
    ```
    *在这个步骤中，建议选择 **"Empty Quartz"**（如果你想从头开始写）或者 **"Default Quartz Content"**（带有一些示例文件）。*

---

### 第三步：关联并清理你的 GitHub 仓库
这是处理你“旧仓库只有 `gh-pages` 分支”的关键步骤。

1.  **重新设置远程仓库地址**（将克隆下来的 quartz 指向你自己的地址）：
    ```bash
    git remote set-url origin https://github.com/1JI0O/1ji0o.github.io.git
    ```

2.  **创建并切换到 `main` 分支**：
    ```bash
    git branch -M main
    ```

3.  **强制推送以覆盖旧的 `gh-pages` 结构**：
    由于你之前的仓库只有 `gh-pages`，我们需要用 Quartz 的源码彻底重写这个仓库。
    ```bash
    git add .
    git commit -m "Initial Quartz 4 setup"
    git push -u origin main --force
    ```
    *注意：`--force` 会抹掉之前 Hexo 的所有记录，因为我们要换成 Quartz 的源码模式。*

---

### 第四步：配置 GitHub Pages 部署模式（重要！）
Quartz 4 **不使用**传统的 `gh-pages` 分支部署，它使用更现代的 **GitHub Actions**。

1.  打开浏览器，进入你的 GitHub 仓库：`1JI0O/1ji0o.github.io`。
2.  点击 **Settings** -> **Pages**。
3.  在 **Build and deployment** > **Source** 处，点击下拉菜单。
4.  **将 "Deploy from a branch" 改为 "GitHub Actions"**。

---

### 第五步：触发自动构建
1.  回到你的 Actions 选项卡，你应该能看到一个名为 "Deploy Quartz" 的任务正在运行。
2.  如果没有运行，你随便修改一下 `content/index.md` 里的文字，然后 `git add .`, `git commit`, `git push` 一下，它就会自动触发。
3.  等 Actions 跑完（变绿），访问 `https://1ji0o.github.io/` 就能看到你的 Quartz 笔记了。

---

### 验证关于页 (About)
由于你之前选择了 **“双仓库方案”**：
1.  你现在在 `1ji0o.github.io` 部署的是 Quartz。
2.  你另外有一个名为 `about` 的独立仓库。

**不需要在 Quartz 里做任何复杂配置**，你直接访问 `https://1ji0o.github.io/about/`，GitHub 依然会精准地导向你那个 JB 模板的 About 页面。

### 总结
你现在做到了：
*   **仓库 A (1ji0o.github.io)**: 纯粹的 Quartz 源码 + GitHub Actions 部署。
*   **仓库 B (about)**: 纯粹的静态 JB 模板页面。

这比 Hexo 时代那一堆混合在一起的代码要优雅得多！如果你在 `npx quartz create` 或者推送过程中遇到报错，请告诉我具体的错误信息。

# github actions

你列出的这些文件（`ci.yaml`, `build-preview.yaml` 等）其实是 Quartz **项目本身开发时用的脚本**，而不是用来**部署你个人网站**的脚本。

这就是为什么你虽然设置了 GitHub Actions，但网站还没上线的原因。你需要一个专门的 `deploy.yml`。

### 核心操作：创建部署脚本

请在你的本地 Quartz 项目中执行以下操作：

1.  在 `.github/workflows/` 文件夹下，**新建一个文件**，命名为 **`deploy.yml`**。
2.  将以下代码完整地复制并粘贴进去：

```yaml
name: Deploy Quartz to GitHub Pages

on:
  push:
    branches:
      - main

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # 必须，用于读取笔记的修改时间
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install Dependencies
        run: npm ci
      - name: Build Quartz
        run: npx quartz build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 接下来要做的事情：

1.  **清理多余文件（可选但建议）**：
    把你刚才列出的那些 `build-preview.yaml`、`ci.yaml`、`deploy-preview.yaml`、`docker-build-push.yaml` **全部删掉**。它们会干扰你的 Actions 界面，而且对你部署个人博客完全没用。

2.  **提交并推送**：
    在终端执行：
    ```bash
    git add .
    git commit -m "Add production deployment workflow"
    git push origin main
    ```

### 发生了什么？

*   当你推送这个 `deploy.yml` 后，GitHub 会识别出这是一个标准的部署指令。
*   点击你仓库上方的 **Actions** 选项卡，你会看到一个名为 **"Deploy Quartz to GitHub Pages"** 的任务开始运行。
*   等它运行结束（变绿），你的 Quartz 笔记就正式通过 `https://1ji0o.github.io/` 发布了。

### 为什么之前不行？
官方仓库自带的那些 `.yaml` 文件是给 Quartz 的开发者（比如修改 Quartz 核心代码的人）用的，它们只负责“测试代码是否写错了”，而不负责“把你的笔记发布到 GitHub Pages”。你刚才手动添加的这个 `deploy.yml` 才是真正的“上线开关”。

**现在去推送吧，成功就在眼前！** 推送完后记得去 **Actions** 页面盯着那个转动的小圈。

# 使用技巧

恭喜你！Quartz 已经成功上线，说明你的“桥”已经修通了。现在我们来装修你的“房间”。

Quartz 的所有配置和内容都在你本地的那个文件夹里。修改的核心原则是：**修改本地文件 -> 提交到 GitHub -> 等待 Actions 自动更新。**

以下是具体操作：

### 1. 修改站点名称（把 "Quartz" 改成 "My Blog"）

你需要修改全局配置文件。

1.  打开本地目录下的 **`quartz.config.ts`**。
2.  找到 `configuration` 部分，修改 `pageTitle`：
    ```typescript
    configuration: {
      pageTitle: "1ji0o's Blog", // 这里改成你喜欢的名字
      enablePopovers: true,
      analytics: { provider: 'google', tagId: '...' },
      // ... 其他配置
    },
    ```
3.  **保存文件**。

---

### 2. 修改主页内容

你的主页（落地页）对应的是 **`content/index.md`**。

1.  打开 **`content/index.md`**。
2.  修改里面的文字。例如：
    ```markdown
    ---
    title: Welcome to My Digital Garden
    ---

    这里是 1JI0O 的博客。

    ## 目录
    - [[About|关于我]]  <-- 这是一个指向你笔记中 About.md 的双向链接
    - [[Project|项目项目]]
    ```
3.  **保存文件**。

---

### 3. 建立新文章

在 Quartz 中，每一篇 Markdown 文件就是一个页面。

1.  在 **`content/`** 文件夹下直接新建 `.md` 文件（或者建子文件夹来分类）。
    *   例如：`content/我的第一篇博文.md`
2.  文章开头建议带上 **Frontmatter**（元数据）：
    ```markdown
    ---
    title: 我的第一篇博文
    date: 2026-01-25
    tags:
      - 生活
      - 技术
    ---

    你好，世界！这是我从 Hexo 逃难到 Quartz 的第一天。
    ```

---

### 4. 实时本地预览（非常重要！）

你不需要每次改完都 push 到 GitHub 去看效果。Quartz 有非常强大的本地预览功能。

1.  在你的终端（cmd 或 powershell）进入 `quartz` 目录。
2.  运行：
    ```bash
    npx quartz build --serve
    ```
3.  打开浏览器访问 `http://localhost:8080`。
4.  **神奇的地方**：你现在修改本地的 Markdown 文件，浏览器会自动刷新，实时显示修改后的样子。

---

### 5. 同步到线上

当你本地改满意了，执行 Git 三部曲：

```bash
git add .
git commit -m "Update site title and add new post"
git push origin main
```

几分钟后，你的 `https://1ji0o.github.io` 就会更新。

---

### 进阶提示：关于那个 About 页面

*   **内部链接**：如果你想在 Quartz 笔记里提到你的 JB 模板关于页，由于它是外部仓库部署的，你需要写完整链接或相对路径：`[About Me](/about/)`。
*   **左侧侧边栏**：如果你想修改左侧的导航结构（那个文件夹树），可以去修改 **`quartz.layout.ts`**，不过对于新手，默认的布局已经非常好用了。

**下一步建议：**
先运行 `npx quartz build --serve` 玩一玩，你会发现 Quartz 的响应速度比 Hexo 快了不止一个量级！

# 杂七杂八

然后，之前在1ji0o.xxx那个仓库的environment里面有个gh-pages rules，去掉任何限制，任何分支都可以部署

[更改默认分支 - GitHub 文档](https://docs.github.com/zh/repositories/configuring-branches-and-merges-in-your-repository/managing-branches-in-your-repository/changing-the-default-branch)
- 现在在general settings里面

现在，只需要在本地修改，然后commit push就可以自动部署了！

我靠，爽死了，在ob里面把那个[quartz/content](D:\quartz\quartz\content)作为一个库引入，然后引入git插件，然后就丝滑无比，完美匹配现在的工作流，我要爽死了，这个东西太棒了

