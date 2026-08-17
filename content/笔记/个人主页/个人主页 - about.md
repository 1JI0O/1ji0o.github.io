[[2026-01-25]]，继承自[[个人主页]]
基本上是 gemini 3 flash 干的

# 初始化

这是一个非常经典的需求：**在 Hexo 博客中集成一个完全独立样式的子页面（如 CV 或 About）**。

虽然你提到的“多分支”是一种方法，但对于 Hexo 用户来说，**最优雅、最简单的做法是利用 Hexo 的 `skip_render` 功能**。这样你可以把所有代码放在一个仓库里，统一管理。

以下是实现步骤：

### 第一步：准备 Jon Barron 模板代码

1.  去 [jonbarron/jonbarron.github.io](https://github.com/jonbarron/jonbarron.github.io) 下载源码。
2.  你主要需要这些文件：
    *   `index.html`
    *   `stylesheet.css`
    *   `images/` 文件夹（存放头像等）

### 第二步：将代码放入 Hexo 项目

1.  进入你的 Hexo 本地根目录。
2.  进入 `source` 文件夹。
3.  在该目录下新建一个文件夹，命名为 `about` （或者 `cv`，取决于你想要的链接）。
4.  将第一步准备好的 Jon Barron 的文件全部拷贝进去。
    现在的结构应该是：
    ```text
    hexo-blog/
    ├── source/
    │   ├── _posts/
    │   └── about/           <-- 新建文件夹
    │       ├── index.html   (Jon Barron 的 HTML)
    │       ├── stylesheet.css
    │       └── images/
    ├── _config.yml
    ...
    ```

### 第三步：配置 Hexo 忽略渲染（核心步骤）

这是解决“双模板兼容”的关键。如果不配置，Hexo 会尝试用博客的主题去解析 Jon Barron 的 `index.html`，导致样式错乱。

1.  打开 Hexo 根目录下的 **`_config.yml`** (站点配置文件)。
2.  找到 `skip_render` 这一项（如果没有就手动添加）。
3.  将其修改为：
    ```yaml
    skip_render: 
      - "about/**"
    ```
    *注：这行代码的意思是：跳过 `source/about/` 目录下所有文件的渲染，直接把它们原封不动地复制到最终生成的 `public` 文件夹中。*

### 第四步：调整 Jon Barron 模板的代码路径

因为你现在把页面放在了 `/about/` 子目录下，需要确保 HTML 里的资源引用是正确的。

1.  打开 `source/about/index.html`。
2.  检查 CSS 和 图片的引用路径。如果 Jon Barron 原本的代码是 `<link rel="stylesheet" href="stylesheet.css">`，而文件就在同级目录下，通常**不需要修改**。
3.  但如果你在 Hexo 预览时发现图片不显示，请确保路径没有被 Hexo 的其他插件干扰。

### 第五步：本地预览与部署

1.  运行本地预览：
    ```bash
    hexo clean
    hexo s
    ```
2.  访问 `http://localhost:4000/about/`。
    此时你应该能看到完整的 Jon Barron 风格页面，且完全不受 Hexo 主题影响。
3.  如果一切正常，执行部署：
    ```bash
    hexo d -g
    ```

---

### 为什么不建议用“多分支”而建议用这个方法？

1.  **管理方便**：你只需要维护一个 GitHub 仓库。每次 `hexo d` 时，博客和关于页会同时更新。
2.  **符合逻辑**：`1ji0o.github.io/about` 本质上就是你站点的一个静态子目录。
3.  **SEO 友好**：所有的内容都在同一个域名下，有助于提升搜索排名。

### 进阶小贴士：

*   **关于路径**：如果你希望通过 `https://1ji0o.github.io/cv` 访问，就把文件夹改名为 `cv`，同时 `skip_render` 也改为 `- "cv/**"`。
*   **关于样式冲突**：由于使用了 `skip_render`，Jon Barron 的 CSS 不会加载到博客文章里，博客的 CSS 也不会加载到 About 页里。它们是**彻底隔离**的。
*   **如何在博客导航栏添加链接**：
    在你的 Hexo **主题配置文件**（例如 `themes/your-theme/_config.yml`）中，找到 `menu` 配置，添加一行：
    ```yaml
    menu:
      Home: /
      Archives: /archives
      About: /about/    # 指向你的新页面
    ```

按照这个步骤操作，你就可以在保持 Hexo 博客的同时，拥有一个非常专业的 Jon Barron 风格简历页了！

# 样式修改

既然你的 CSS 中定义的是类选择器 `.name`（注意前面那个点），那么你的 HTML 标签必须对应使用 `class="name"` 才能生效。

为了达到你要求的“加粗、很大”的效果，请按照以下两步微调：

### 1. 修改 CSS 部分 (stylesheet.css)
在你的 `stylesheet.css` 中，建议把 `font-weight`（加粗）加上，因为你现在的代码里没有定义粗细：

```css
.name {
  padding-top: 20px;
  margin: 0;
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  font-size: 32px;
  font-weight: 700; /* 加上这一行实现加粗 */
  line-height: 1.2;
}
```

### 2. 修改 HTML 部分 (index.html)
确保你的 HTML 中名字那一行是这样写的（使用 `class="name"`）：

```html
<p style="text-align:center">
  <span class="name">Haoxiang Qin 秦浩翔</span>
</p>
```

---

### 为什么这样改？

1.  **匹配选择器**：你在 CSS 里写的是 `.name`，这在 CSS 语法里表示“寻找所有 `class` 属性为 `name` 的元素”。所以 HTML 里要写 `class="name"`。
2.  **实现加粗**：单纯设置 `font-size` 只会让字变大，设置 `font-weight: 700` 或 `bold` 才会让它像学长页面那样有厚重感。
3.  **使用 `<span>` 而不是 `<name>`**：虽然 JB 原版喜欢用自定义标签 `<name>`，但既然你已经写好了 `.name` 这个 CSS 类，用 `<span>` 或 `<p>` 配合 `class` 是最标准、兼容性最好的做法。

### 最终效果代码演示：
你的个人介绍部分看起来应该是这样的：

```html
<td style="padding:2.5%;width:63%;vertical-align:middle">
    <!-- 名字 -->
    <p style="text-align:center">
        <span class="name">Haoxiang Qin 秦浩翔</span>
    </p>
    
    <!-- 介绍 -->
    <p>Hello World! I am an undergraduate student at <a href="https://www.sjtu.edu.cn/">Shanghai Jiao Tong University</a>.</p>
    
    <!-- 链接 -->
    <p style="text-align:center">
        <a href="mailto:qhx_sjtu@sjtu.edu.cn">Email</a> &nbsp;/&nbsp;
        <a href="https://github.com/1JI0O">GitHub</a> &nbsp;/&nbsp;
        <a href="https://x.com/1ji0o">X</a>
    </p>
</td>
```

这样改完后，刷新页面，你的名字就会像你期望的那样，既有 JB 模板的质感，又是加大加粗的了。

15点58分 
后面在style.css还增加了

```
/* 区块大标题：News, Research 等 */
.heading {
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  font-size: 22px;   /* 标题大小 */
  font-weight: 700;  /* 加上这行就会加粗 */
}

/* 项目标题：Null / Null 那行 */
.papertitle {
  font-family: 'Lato', Verdana, Helvetica, sans-serif;
  font-size: 16px;
  font-weight: 700;  /* 确保项目名字也加粗 */
}
```

用法类似，如同上面的span

---

# 17点10分 妈的，hexo就是狗屎，换了个实现方法

这种做法在 GitHub Pages 的术语里叫 **“User Site + Project Site” 组合部署**。这是最专业、最解耦的方案。

以下是手把手操作步骤：

### 第一步：创建并设置 About 仓库 (Project Site)

1.  **在 GitHub 上新建仓库**：
    *   仓库名：`about`（注意：仓库名就是你以后访问的路径，如果你想起名叫 `cv`，仓库就叫 `cv`）。
    *   设置为 **Public**。
2.  **上传 JB 模板文件**：
    *   把你的 `index.html`、`stylesheet.css` 和 `images/` 文件夹直接上传到这个 `about` 仓库的 `main` 分支根目录下。
    *   **确保 `index.html` 就在根目录**，不要套娃。
3.  **开启 GitHub Pages**：
    *   进入该仓库的 **Settings** -> **Pages**。
    *   **Build and deployment** 下的 Source 选 "Deploy from a branch"。
    *   Branch 选 `main`，文件夹选 `/(root)`，点击 **Save**。
4.  **验证**：
    *   等待 1 分钟，访问 `https://1ji0o.github.io/about/`。
    *   此时，你应该能看到完美的 Jon Barron 风格页面。

---

### 第二步：创建并设置 Quartz 仓库 (User Site)

1.  **新建/重命名主仓库**：
    *   仓库名必须是：`1JI0O.github.io`。
2.  **部署 Quartz**：
    *   按照 Quartz 的官方流程，把 Quartz 代码推送到这个仓库。
    *   Quartz 会通过 GitHub Actions 自动部署。
3.  **验证**：
    *   访问 `https://1ji0o.github.io`，你应该能看到 Quartz 的笔记界面。

---

### 第三步：把它们连起来（优雅的跳转）

现在你有两个独立的“岛屿”，我们需要在 Quartz 里修一座桥。

1.  **在 Quartz 导航栏添加链接**：
    *   打开 Quartz 根目录下的 `quartz.config.ts` 或相关的主题配置文件。
    *   在菜单（Menu/Links）部分添加一个项：
        ```typescript
        // 示例：在 Quartz 的导航配置里
        links: [
          { title: "Home", url: "/" },
          { title: "About", url: "/about/" }, // 重点：直接写相对路径 /about/
        ]
        ```
2.  **在 About 页回跳博客**：
    *   修改 `about` 仓库里的 `index.html`，在导航位置加一个回跳链接：
        ```html
        <a href="https://1ji0o.github.io/">Blog</a>
        ```

---

### 为什么这招无敌“优雅”？

1.  **域名自动继承**：GitHub Pages 的原生逻辑是：如果访问 `username.github.io/xxx`，它会优先去找名为 `xxx` 的仓库。所以你不需要做任何复杂的解析设置，GitHub 自动帮你路由好了。
2.  **互不干扰**：
    *   你在 `about` 仓库里怎么折腾 HTML/CSS，都不会导致 Quartz 编译失败。
    *   你在 `1JI0O.github.io` 里升级 Quartz 版本、改 TypeScript 逻辑，你的 About 页面也永远稳如泰山。
3.  **仓库容量**：Quartz 的 `content` 分支可能会变得非常大，把图片和静态简历放在独立仓库，可以让主仓库更“轻量”。
4.  **SEO**：搜索引擎会认为这是一个大型网站下的两个子频道，权重是累加的。

### 避坑小贴士：
*   **不要在 Quartz 仓库里建 `about` 文件夹**：虽然 Project Site 通常优先级更高，但为了保险，请确保你的 Quartz `content` 目录下没有 `about.md`。
*   **路径斜杠**：访问时建议带上末尾斜杠 `https://1ji0o.github.io/about/`，这能让浏览器更快定位到 `index.html`。

去干吧，这绝对是 GitHub Pages 玩家的终极形态。

[Welcome to Quartz](https://1ji0o.github.io/)

很好！

参见[[个人主页 - quartz]]
