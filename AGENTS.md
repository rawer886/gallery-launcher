# AGENTS.md

This file provides guidance to Codex when working with code in this repository.

> **注意**: 请先阅读项目根目录下的 `README.md` 文件了解项目基本信息。本文件不要重复 README 中的内容。

## 开发方式

这是一个**无构建**的 Obsidian 插件，直接编辑源文件即可：
- 编辑 `main.js` + `styles.css`，无需 npm/build 步骤
- 部署到 Obsidian：`cp main.js styles.css "/Users/jiayg/Library/Mobile Documents/com~apple~CloudDocs/Obsidian/.obsidian/plugins/gallery-launcher/"`
- 验证：在 Obsidian 中禁用再启用插件，或 `Ctrl+P → Reload app without saving`
- `data.json` 是用户设置文件，不要提交或覆盖

## 架构

单文件插件（`main.js`，~1600 行），核心结构：

| 区域 | 行范围 | 说明 |
|------|--------|------|
| 常量 & DEFAULT_SETTINGS | 1-50 | VIEW_TYPE、渲染批次、前缀键名、颜色定义、缩放级别 |
| i18n (TRANSLATIONS) | 54-217 | 英文/中文双语，通过 `moment.locale()` 自动检测 |
| 工具函数 | 219-278 | `t()` 翻译、`formatDate()`、`stripMarkdown()`、`debounce()` |
| Modal 类 | 283-604 | ConfirmModal、InputModal、EditTimeModal、ColorPickerModal |
| **GalleryView** | 606-1472 | 主视图，所有 UI 逻辑在 `onOpen()` 闭包内 |
| GallerySettingTab | 1477-1538 | 设置面板 |
| GalleryLauncherPlugin | 1543-1614 | 插件入口，注册视图/命令/ribbon |

### GalleryView.onOpen() 内部关键函数

- `collectSubFolders()` — 收集子目录并排序（文件夹无 stat，用递归最新文件时间代替）
- `renderFolderTabs()` — 一级目录标签栏，支持拖拽排序和置顶
- `renderSubFolderTabs()` — 二级子目录标签栏
- `renderCards()` — 卡片渲染主函数，含批次加载和分组
- `renderSingleCard()` — 单张卡片渲染（标题、标签、摘要、页脚）
- `renderBatch()` — 分批渲染：收藏区 → 月份分组 / 平铺

### 前缀键（Frontmatter）

- `gallery-favorite: true` — 收藏标记
- `gallery-color: red|orange|yellow|green|blue|purple|gray` — 卡片颜色

## 关键设计约束

- **TFolder 无 stat**：Obsidian 的文件夹对象没有 `stat` 属性，按时间排序文件夹需递归取最新文件的 mtime/ctime
- **平台差异**：macOS 用 `touch -t` 设置 ctime，其它平台用 `fs.utimesSync` 只能改 mtime
- **缩放切换需重渲染**：zoom 变更时必须调用 `renderCards()` 而不仅是切换 CSS class，因为摘要/标签的 DOM 元素在 small 模式下不生成
- **卡片布局**：标签区固定两行高度（42px），摘要区固定四行高度（80px），避免用 flex:1 导致空白
- **批次渲染**：`RENDER_BATCH_SIZE = 100`，超出部分显示"加载更多"按钮

## styles.css 结构

- 文件夹/子文件夹标签栏（12-106）
- 信息栏：排序、缩放、计数（109-149）
- 缩放级别覆写：large 全内容、medium 无摘要、small 无摘要无标签（154-210）
- 卡片网格与卡片样式（213-391）
- Modal 弹窗样式（433-680）
- 收藏区样式（690-706）
