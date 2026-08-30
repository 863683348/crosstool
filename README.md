# CrossTool · 跨境卖家本地隐私工具箱

面向 Amazon / TikTok Shop / Shopify 卖家的**纯前端本地隐私工具站**。
所有工具 100% 在浏览器内运行，**文件不上传任何服务器**，断网也可用。

## 技术栈

- Next.js 15（App Router）· React 19 · TypeScript · Tailwind CSS
- 全站静态预渲染（SSG），**零后端、零数据库、零 API 路由**
- 中英双语（客户端切换，localStorage 持久化）
- 亮/暗主题（首帧内联 bootstrap 防闪烁）

## 复用的既有组件（不重写）

| 模块 | 来源仓库 | 说明 |
|------|---------|------|
| PDF 合并 / 压缩 / 拆分 | `863683348/pdf-merge-next`（PDFMergeNext） | 复用其 `pdf-lib` Worker 引擎（`engine.worker.ts`），扩展 compress / split 两种操作 |
| 图片压缩 / 格式转换 | `863683348/image-compressor`（image-compressor-saas.shop） | 复用其纯前端 `OffscreenCanvas` 压缩逻辑 + 零依赖 ZIP 打包器，移植为 React 组件 |

> 未复用 `image-bg-remover`（走 Remove.bg API，属服务端上传，违背隐私定位）与
> `image-compressor-saas`（Next.js + Neon 全栈版，服务端处理）。

## MVP 6 个工具

| 路由 | 工具 | 引擎 |
|------|------|------|
| `/tools/pdf-merge` | PDF 合并（可拖动排序） | pdf-lib Worker |
| `/tools/pdf-compress` | PDF 压缩（重编码） | pdf-lib Worker |
| `/tools/pdf-split` | PDF 拆分（按页码范围） | pdf-lib Worker |
| `/tools/image-compress` | 图片压缩 / 格式转换 / 批量 ZIP | OffscreenCanvas Worker |
| `/tools/base64` | Base64 编解码 | 纯客户端 |
| `/tools/vat-calculator` | 欧盟 VAT 计算器 | 纯客户端 |

规划中（v1.0）：本地去背景、JWT 解码、密码生成、利润计算器、字符计数器等（见 PRD v2.3 共 24 个工具）。

## 开发

```bash
npm install
npm run dev      # 本地开发
npm run build    # 生产构建（静态导出）
npm run typecheck
```

## 部署

Vercel 直接 import 仓库即可（纯静态，无需环境变量 / 数据库）。
线上域名：`https://crosstool.online`（已写入 `app/layout.tsx`、`app/sitemap.ts`、`app/robots.ts`）。

## 文档

PRD：`F:/AI-2026/跨境本地工具站_PRD.md`（v2.3）
