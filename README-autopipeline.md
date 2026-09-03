# crosstool 自动发布管线（3 层）

> 参考 getcreditworth / haoweirecipes 模式（seo-100day-autopipeline skill）。
> 每天北京时间 ~02:00 自动：生成 1 篇博客 → Git Data API 推送 → Vercel 自动部署 → IndexNow 提交。

## 架构

```
GitHub Actions cron (0 18 * * * UTC = 北京 02:00)
  └─ Layer 1  scripts/fetch-content-daily.mjs
       读 scripts/content-calendar.json（100 天排期）
       → 找下一个未发布 day → LLM(qwen-plus) 生成
       → 校验 → 追加 content/blog.daily.json（不碰 blog.ts）
  └─ Layer 2  scripts/sync-github.mjs
       Git Data API: blob → tree → commit → PATCH ref（幂等、可重试）
  └─ (push 触发) Vercel 自动部署
  └─ Layer 3  scripts/indexnow-submit.mjs  → Bing/Yandex 秒级收录（非阻塞）
```

数据两层：`content/blog.ts` = 种子帖（人工）；`content/blog.daily.json` = 日更池（流水线只写这个）。
渲染与 sitemap 自动合并两层（`content/blog.ts` 末尾 merge）。

## 需要配置的 GitHub Secrets

https://github.com/863683348/crosstool/settings/secrets/actions

| Secret | 说明 | 必填 |
|---|---|---|
| `DASHSCOPE_API_KEY` | 阿里云百炼（qwen-plus） | ✅ |
| `INDEXNOW_KEY` | https://www.bing.com/indexnow 生成的 32 位 hex | 可选 |

IndexNow 前置：把 key 文件放 `public/<KEY>.txt`（内容=key 本身）并部署，否则提交不生效。

## 首次验证

1. GitHub → Actions → "Daily Content (crosstool 100-day pipeline)" → Run workflow
   - `dry_run=true`：只校验日历与工具链路（不调 LLM 不写盘）
   - `dry_run=false`（day 留空）：正式生成 day 1 → 推送 → 部署
2. 几分钟后检查 https://crosstool.online/blog 是否出现新文章
3. 次日北京 02:00 观察自动 cron 触发

## 失败处理

| 失败点 | 现象 | 恢复 |
|---|---|---|
| LLM 限流/余额 | retry 3 次后退出 1 | 次日 cron 自动重试同一天 |
| 日历引用非活工具 | 生成前 fail（防死链） | 修 calendar.json 后重跑 |
| sync 4xx | retry 5 次 | Actions 重跑，幂等 |
| Vercel 构建失败 | 保留上一版本 | 站点不受影响 |
| IndexNow 失败 | 静默跳过 | 非阻塞 |
