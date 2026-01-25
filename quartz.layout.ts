import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    // --- 修改这里 ---
    Component.Explorer({
      title: "目录", // 给一个标题，确保它像个侧边栏而不是折叠菜单
      folderClickBehavior: "collapse", // 点击文件夹名时：折叠/展开
      folderDefaultState: "collapsed", // 【重要】初始状态：收起所有文件夹
      useSavedState: true, // 记住用户的折叠/展开习惯
      // 修正后的过滤函数
      filterFn: (node) => node.displayName !== "tags", 
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    // --- 修改这里 (保持一致) ---
    Component.Explorer({
      title: "目录", // 给一个标题，确保它像个侧边栏而不是折叠菜单
      folderClickBehavior: "collapse", // 点击文件夹名时：折叠/展开
      folderDefaultState: "collapsed", // 【重要】初始状态：收起所有文件夹
      useSavedState: true, // 记住用户的折叠/展开习惯
      // 修正后的过滤函数
      filterFn: (node) => node.displayName !== "tags", 
    }),
  ],
  right: [],
}