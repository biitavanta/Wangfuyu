# Tangerine Sync Hub

这个目录是“中央同步器”。

它负责做三件事：

1. 每天只请求一次上游数据源
2. 生成给全班 APK 统一读取的 `docs/latest.json` 和 `docs/latest.txt`
3. 可选地把同步结果写入飞书多维表格

## 推荐运转方式

- GitHub Actions 每天定时跑一次 `npm run sync`
- 产物写到仓库根目录 `docs/`
- GitHub Pages 对外提供：
  - `https://<用户名>.github.io/<仓库名>/latest.json`
  - `https://<用户名>.github.io/<仓库名>/latest.txt`
- Auto.js 里的 `数据源地址` 指向 `latest.json`

## 支持的数据源模式

### `simple`

适合：

- 一个公开 TXT 地址
- 一个公开 JSON 地址
- 一个普通 GET/POST 接口

### `segmentedForm`

适合：

- 上游需要按固定 key 逐段请求
- 每段返回一部分内容
- 直到遇到结束标记才停止

## 本地运行

```powershell
cd C:\Users\Administrator\Documents\New project\tangerine_sync_hub
node .\scripts\sync.mjs
```

如果你要本地调试，可以复制 `config.example.json` 为 `local.config.json`，再把真实参数填进去。

## GitHub Actions 需要的 Secrets

- `SOURCE_MODE`
- `SOURCE_URL`
- `SOURCE_METHOD`
- `SOURCE_HEADERS_JSON`
- `SOURCE_BODY_JSON`
- `SOURCE_BODY_FORM_JSON`
- `SOURCE_SEGMENT_KEYS_JSON`
- `SOURCE_SEGMENT_STOP_TEXT`
- `SOURCE_SEGMENT_VALUE_PATH`
- `SOURCE_SEGMENT_DECODE_URI`
- `SOURCE_SEGMENT_REPLACE_QUESTION`
- `PUBLIC_BASE_URL`

可选飞书：

- `FEISHU_ENABLED`
- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_APP_TOKEN`
- `FEISHU_TABLE_ID`
- `FEISHU_DATE_FIELD`
- `FEISHU_CONTENT_FIELD`
- `FEISHU_COUNT_FIELD`
- `FEISHU_STATUS_FIELD`
- `FEISHU_UPDATED_AT_FIELD`
- `FEISHU_HASH_FIELD`

## 结果文件

- `docs/latest.json`
- `docs/latest.txt`
- `docs/history/YYYY-MM-DD.json`
- `docs/history/YYYY-MM-DD.txt`
