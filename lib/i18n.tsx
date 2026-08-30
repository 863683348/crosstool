'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Dict = Record<string, string>;
type Lang = 'zh' | 'en';

const ZH: Dict = {
  brand: 'CrossTool',
  tagline: '跨境卖家本地隐私工具箱',
  privacyBadge: '🔒 全程本地处理 · 文件不上传',
  navHome: '首页',
  navTools: '全部工具',
  seoH1: 'CrossTool · 跨境卖家本地隐私工具箱 — PDF/图片/账号/财务/Listing 工具，100% 浏览器内处理，零上传',

  // 首页
  homeSub: '为 Amazon · TikTok Shop · Shopify 卖家打造。所有工具在你的浏览器本地运行，文件永不离开设备。',
  homeAllTools: '全部工具',
  homeGroupFile: '文件 / PDF',
  homeGroupImage: '图片',
  homeGroupAccount: '账号安全',
  homeGroupFinance: '跨境财务',
  homeGroupListing: 'Listing 文本',

  // 通用
  dropBig: '拖拽文件到此处 / 或点击选择',
  dropSub: '也支持 Ctrl+V 直接粘贴',
  dropFmtPdf: '支持 PDF（可批量）',
  dropFmtImg: '支持 JPG · PNG · WebP（单文件 ≤ 50MB，可批量）',
  processing: '处理中…',
  done: '已完成',
  fail: '失败',
  pending: '待处理',
  download: '下载',
  downloadZip: '打包下载 ZIP',
  clear: '清空',
  remove: '移除',
  preview: '预览',
  copied: '已复制',
  copyFail: '当前浏览器不支持复制，请改用下载',
  confirmClear: '确定清空？',
  original: '原大小',
  result: '结果',
  ratio: '压缩率',
  saved: '已节省',
  empty: '还没有文件，快添加试试 👆',
  backHome: '返回首页',

  // PDF 合并
  pdfMergeTitle: 'PDF 合并（本地）',
  pdfMergeDesc: '把多个 PDF 按顺序合并成一个，100% 在浏览器内完成，不上传服务器。适合合并发票、报关单、合同。',
  pdfMergeRun: '合并 PDF',
  pdfMergePages: '页',
  pdfMergeDrag: '拖入多个 PDF，可上下拖动调整顺序',
  pdfMergeReorder: '拖动调整顺序',

  // PDF 压缩
  pdfCompressTitle: 'PDF 压缩（本地）',
  pdfCompressDesc: '重新编码 PDF 以减小体积，所有处理在本地完成，文件不上传。适合压缩给买家发的目录、说明书。',
  pdfCompressRun: '压缩 PDF',
  pdfCompressNote: '压缩为无损重编码，体积通常可减少 10%–40%。',

  // PDF 拆分
  pdfSplitTitle: 'PDF 拆分（本地）',
  pdfSplitDesc: '按页码范围把一个 PDF 拆成多个文件，全部本地处理。例如输入 1-3,5,8-10。',
  pdfSplitRangeLabel: '拆分范围（如 1-3,5,8-10）',
  pdfSplitRangePh: '1-3,5,8-10',
  pdfSplitRun: '拆分 PDF',
  pdfSplitPageCount: '共 {n} 页',

  // 图片压缩
  imgCompressTitle: '图片压缩（本地）',
  imgCompressDesc: 'JPG/PNG/WebP/AVIF 本地压缩与格式转换，零上传、无水印、批量处理、ZIP 导出。适合产品图、配图优化。',
  quality: '压缩质量',
  format: '输出格式',
  fmtKeep: '保持原格式',
  fmtJpg: 'JPG',
  fmtPng: 'PNG',
  fmtWebp: 'WebP',
  target: '目标大小（可选）',
  targetTo: '压到',
  kb: 'KB',
  avifFallback: '当前浏览器暂不支持导出 AVIF，已自动改用 WebP',
  targetUnreachable: '无法达到目标大小，已使用最低质量',

  // Base64
  base64Title: 'Base64 编解码（本地）',
  base64Desc: '文本与 Base64 互转，常用于调试 API、嵌入小图标。全部本地，不上传。',
  base64Encode: '编码 → Base64',
  base64Decode: '← 解码 Base64',
  base64Input: '输入文本或 Base64',
  base64Output: '输出',
  base64Copy: '复制结果',

  // VAT
  vatTitle: '欧盟 VAT 计算器（本地）',
  vatTitleEn: 'EU VAT Calculator',
  vatDesc: '快速计算含/不含税价格与 VAT 金额，覆盖欧盟主要税率。',
  vatNet: '不含税价 (Net)',
  vatRate: 'VAT 税率 %',
  vatGross: '含税价 (Gross)',
  vatAmount: 'VAT 金额',
  vatCountry: '国家/地区',

  // 页脚
  footerPrivacy: '所有处理均在你的浏览器本地完成 · 文件不会上传任何服务器 · 断网也可用',
  footerRights: 'CrossTool · 跨境卖家本地隐私工具箱',

  // v1.0 工具（18 个）
  pdfToImagesTitle: 'PDF 转图片（本地）',
  pdfToImagesDesc: '逐页把 PDF 导出为 JPG/PNG，全部在浏览器本地完成，不上传服务器。适合把合同、说明书转成图片。',
  pdfToImgRun: '导出图片',
  imgFmt: '图片格式',
  imgFmtJpg: 'JPG',
  imgFmtPng: 'PNG',
  imgScale: '清晰度',
  imgScale1: '标准 (1x)',
  imgScale2: '高清 (2x)',
  imgPages: '页数',

  imgRemoveBgTitle: '图片去背景（本地）',
  imgRemoveBgDesc: '一键把产品图去背景成透明 PNG，模型在浏览器本地运行，零上传。',
  imgRemoveBgRun: '去背景',
  imgRemoveBgLoading: '正在加载模型（首次稍慢，后续走缓存）…',
  imgRemoveBgNote: '去背景模型约 40MB，首次加载需联网下载并缓存到本地；处理过程不上传任何图片。',

  imgConvertTitle: '图片格式转换（本地）',
  imgConvertDesc: 'JPG / PNG / WebP 互相转换，批量处理、零上传。适合统一产品图格式。',

  imgResizeTitle: '图片缩放（本地）',
  imgResizeDesc: '按最长边或比例缩放产品图，批量处理、零上传。',
  imgResizeMode: '缩放模式',
  imgResizeMax: '最长边 (px)',
  imgResizeScale: '按比例 (%)',

  imgBlindTitle: '隐形水印（本地）',
  imgBlindDesc: '把版权指纹嵌入图片像素（肉眼不可见），事后可提取验证归属；零上传。',
  imgBlindEmbed: '嵌入水印',
  imgBlindExtract: '提取水印',
  imgBlindPayload: '水印内容',
  imgBlindPayloadPh: '如 © 店铺名 2026',
  imgBlindResult: '提取到的水印',
  imgBlindEmpty: '请填写水印内容',

  imgWatermarkTitle: '批量水印（本地）',
  imgWatermarkDesc: '给产品图批量叠加可见版权文字，零上传。',
  imgWatermarkText: '水印文字',
  imgWatermarkTextPh: '© 你的品牌',
  imgWatermarkOpacity: '不透明度',
  imgWatermarkSize: '字号',

  jwtTitle: 'JWT 解码（本地）',
  jwtDesc: '解析店铺 API Token 的 Header / Payload，高亮过期时间，零上传。',
  jwtInput: '粘贴 JWT（三段式 xxx.yyy.zzz）',
  jwtDecodeBtn: '解码',
  jwtHeader: 'Header',
  jwtPayload: 'Payload',
  jwtErrorFormat: 'JWT 格式错误：应为三段 base64url，用点分隔',
  jwtErrorHeader: 'Header 解码失败',
  jwtErrorPayload: 'Payload 解码失败',
  jwtExpired: '已过期',
  jwtValidLeft: '剩余 {d} 天 {h} 小时',

  pwTitle: '密码生成器（本地）',
  pwDesc: '用浏览器加密随机数生成强密码，零上传。',
  pwLength: '长度',
  pwGen: '生成密码',

  jsonFmtTitle: 'JSON 格式化（本地）',
  jsonFmtDesc: '美化或压缩 JSON，零上传。',
  jsonPretty: '美化',
  jsonMinify: '压缩',
  jsonErr: 'JSON 错误：',

  jsonValTitle: 'JSON 校验（本地）',
  jsonValDesc: '检查 JSON 语法错误并定位行号，零上传。',
  jsonValBtn: '校验',
  jsonValOk: '✅ JSON 合法',
  jsonValFail: '❌ JSON 错误',
  jsonValLine: '行',

  jsonConvTitle: 'JSON 互转（本地）',
  jsonConvDesc: 'JSON 转 CSV / YAML / XML，零上传。',
  jsonConvBtn: '转换',

  profitTitle: '利润计算器（本地）',
  profitDesc: '采购 + 运费 + VAT + 平台佣金算净利润与利润率，零上传。',
  profitPrice: '售价',
  profitCost: '采购成本',
  profitShip: '单件运费',
  profitVat: 'VAT 率 %',
  profitCommission: '平台佣金 %',
  profitOther: '其他费用',
  profitNet: '预估净利润',
  profitMargin: '利润率',

  curTitle: '货币换算（本地）',
  curDesc: '多币种换算，汇率表可手动覆盖，零上传。',
  curAmount: '金额',
  curFrom: '从',
  curTo: '到',
  curResult: '结果',
  curOverride: '手动覆盖汇率（相对 USD）',

  fbaTitle: 'FBA 费用估算（本地）',
  fbaDesc: '按站点与尺寸档估算 FBA 履约费，零上传。',
  fbaMarket: '站点',
  fbaTier: '尺寸档',
  fbaSmall: '小标准件',
  fbaLarge: '大标准件',
  fbaSmallOver: '小超大件',
  fbaLargeOver: '大超大件',
  fbaWeight: '重量',
  fbaEstFee: '预估履约费',
  fbaNote: '示例费率，仅供估算，以官方费率为准',

  titleLocTitle: '多语言标题优化器（本地）',
  titleLocDesc: '内置词库给出同义/更本地化表达与密度提示，零上传。',
  titleLocInput: '粘贴 Listing 标题（英文）',
  titleLocLen: '长度',
  titleLocSuggest: '可替换词',
  titleLocDensity: '关键词密度',
  titleLocPreview: '预览',

  kwTitle: '关键词密度分析（本地）',
  kwDesc: '粘贴 Listing 分析词频与密度，零上传。',
  kwInput: '粘贴 Listing 文案',
  kwTop: '显示前',
  kwTotal: '总词数',

  ccTitle: '字符计数器（本地）',
  ccDesc: '实时统计字符数并对照 Amazon / eBay 长度上限，零上传。',
  ccInput: '粘贴文本',
  ccChars: '字符',
  ccWords: '词数',
  amazonTitle: 'Amazon 标题',
  amazonBullet: 'Amazon 要点',
  amazonDesc: 'Amazon 描述',
  ebayTitle: 'eBay 标题',

  tnTitle: '文本规范化（本地）',
  tnDesc: '批量去空格 / 去空行 / 去重 / 大小写 / 去非 ASCII，零上传。',
  tnInput: '粘贴文本（每行一条）',
  tnTrim: '首尾去空格',
  tnBlank: '删除空行',
  tnDedupe: '去除重复行',
  tnSpace: '合并多余空格',
  tnUpper: '转大写',
  tnLower: '转小写',
  tnAscii: '去除非 ASCII',
};

const EN: Dict = {
  brand: 'CrossTool',
  tagline: 'Local & private toolbox for cross-border sellers',
  privacyBadge: '🔒 Processed locally · never uploaded',
  navHome: 'Home',
  navTools: 'All tools',
  seoH1: 'CrossTool · Local & private toolbox for cross-border sellers — PDF / image / account / finance / listing tools, 100% in-browser, zero upload',

  homeSub:
    'Built for Amazon · TikTok Shop · Shopify sellers. Every tool runs in your browser — files never leave your device.',
  homeAllTools: 'All tools',
  homeGroupFile: 'File / PDF',
  homeGroupImage: 'Image',
  homeGroupAccount: 'Account security',
  homeGroupFinance: 'Cross-border finance',
  homeGroupListing: 'Listing text',

  dropBig: 'Drag files here / or click to choose',
  dropSub: 'You can also paste with Ctrl+V',
  dropFmtPdf: 'PDF supported (batch OK)',
  dropFmtImg: 'JPG · PNG · WebP (≤ 50MB each, batch OK)',
  processing: 'Processing…',
  done: 'Done',
  fail: 'Failed',
  pending: 'Pending',
  download: 'Download',
  downloadZip: 'Download ZIP',
  clear: 'Clear',
  remove: 'Remove',
  preview: 'Preview',
  copied: 'Copied',
  copyFail: 'Copy not supported — use Download',
  confirmClear: 'Clear all?',
  original: 'Original',
  result: 'Result',
  ratio: 'Ratio',
  saved: 'Saved',
  empty: 'No files yet — add one to start 👆',
  backHome: 'Back to home',

  pdfMergeTitle: 'PDF Merge (local)',
  pdfMergeDesc:
    'Merge multiple PDFs in order, 100% in-browser, no upload. Great for invoices, customs docs, contracts.',
  pdfMergeRun: 'Merge PDF',
  pdfMergePages: 'pp',
  pdfMergeDrag: 'Drop several PDFs; drag to reorder',
  pdfMergeReorder: 'Drag to reorder',

  pdfCompressTitle: 'PDF Compress (local)',
  pdfCompressDesc:
    'Re-encode PDFs to shrink size, fully local, no upload. Good for catalogs and manuals you send to buyers.',
  pdfCompressRun: 'Compress PDF',
  pdfCompressNote: 'Lossless re-encode; size usually drops 10%–40%.',

  pdfSplitTitle: 'PDF Split (local)',
  pdfSplitDesc:
    'Split one PDF into several by page ranges, all local. E.g. 1-3,5,8-10.',
  pdfSplitRangeLabel: 'Split ranges (e.g. 1-3,5,8-10)',
  pdfSplitRangePh: '1-3,5,8-10',
  pdfSplitRun: 'Split PDF',
  pdfSplitPageCount: '{n} pages',

  imgCompressTitle: 'Image Compress (local)',
  imgCompressDesc:
    'JPG/PNG/WebP/AVIF compression & conversion, zero upload, no watermark, batch + ZIP. For product & web images.',
  quality: 'Quality',
  format: 'Output format',
  fmtKeep: 'Keep original',
  fmtJpg: 'JPG',
  fmtPng: 'PNG',
  fmtWebp: 'WebP',
  target: 'Target size (optional)',
  targetTo: 'Down to',
  kb: 'KB',
  avifFallback: 'AVIF export not supported here — switched to WebP',
  targetUnreachable: 'Target unreachable — used lowest quality',

  base64Title: 'Base64 Encode/Decode (local)',
  base64Desc: 'Convert text ↔ Base64 for API debugging or inline icons. Fully local.',
  base64Encode: 'Encode → Base64',
  base64Decode: '← Decode Base64',
  base64Input: 'Input text or Base64',
  base64Output: 'Output',
  base64Copy: 'Copy result',

  vatTitle: 'EU VAT Calculator',
  vatTitleEn: 'EU VAT Calculator',
  vatDesc: 'Quickly compute net/gross prices and VAT amount across major EU rates.',
  vatNet: 'Net price',
  vatRate: 'VAT rate %',
  vatGross: 'Gross price',
  vatAmount: 'VAT amount',
  vatCountry: 'Country / region',

  footerPrivacy: 'All processing happens in your browser · files are never uploaded · works offline',
  footerRights: 'CrossTool · local & private toolbox for cross-border sellers',

  // v1.0 tools (18)
  pdfToImagesTitle: 'PDF to Images (local)',
  pdfToImagesDesc: 'Export each PDF page as JPG/PNG, fully in-browser, no upload. Great for contracts & manuals.',
  pdfToImgRun: 'Export images',
  imgFmt: 'Image format',
  imgFmtJpg: 'JPG',
  imgFmtPng: 'PNG',
  imgScale: 'Quality',
  imgScale1: 'Standard (1x)',
  imgScale2: 'HD (2x)',
  imgPages: 'Pages',

  imgRemoveBgTitle: 'Remove Background (local)',
  imgRemoveBgDesc: 'One-click transparent PNG from product photos; model runs in-browser, zero upload.',
  imgRemoveBgRun: 'Remove BG',
  imgRemoveBgLoading: 'Loading model (slower first time, then cached)…',
  imgRemoveBgNote: 'BG model ~40MB — downloaded & cached locally on first use; images never leave your device.',

  imgConvertTitle: 'Image Convert (local)',
  imgConvertDesc: 'Convert JPG / PNG / WebP in batch, zero upload.',
  imgResizeTitle: 'Image Resize (local)',
  imgResizeDesc: 'Resize product images by max edge or ratio, batch, zero upload.',
  imgResizeMode: 'Mode',
  imgResizeMax: 'Max edge (px)',
  imgResizeScale: 'By ratio (%)',

  imgBlindTitle: 'Invisible Watermark (local)',
  imgBlindDesc: 'Embed a copyright fingerprint into pixels (invisible) and verify later; zero upload.',
  imgBlindEmbed: 'Embed',
  imgBlindExtract: 'Extract',
  imgBlindPayload: 'Watermark text',
  imgBlindPayloadPh: 'e.g. © ShopName 2026',
  imgBlindResult: 'Extracted watermark',
  imgBlindEmpty: 'Enter watermark text',

  imgWatermarkTitle: 'Batch Watermark (local)',
  imgWatermarkDesc: 'Stamp visible copyright text on product images in batch, zero upload.',
  imgWatermarkText: 'Watermark text',
  imgWatermarkTextPh: '© YourBrand',
  imgWatermarkOpacity: 'Opacity',
  imgWatermarkSize: 'Font size',

  jwtTitle: 'JWT Decoder (local)',
  jwtDesc: 'Decode shop API token Header / Payload, highlight expiry, zero upload.',
  jwtInput: 'Paste JWT (xxx.yyy.zzz)',
  jwtDecodeBtn: 'Decode',
  jwtHeader: 'Header',
  jwtPayload: 'Payload',
  jwtErrorFormat: 'Invalid JWT: expect 3 base64url segments separated by dots',
  jwtErrorHeader: 'Header decode failed',
  jwtErrorPayload: 'Payload decode failed',
  jwtExpired: 'expired',
  jwtValidLeft: '{d}d {h}h left',

  pwTitle: 'Password Generator (local)',
  pwDesc: 'Strong passwords from crypto-random values, zero upload.',
  pwLength: 'Length',
  pwGen: 'Generate',

  jsonFmtTitle: 'JSON Formatter (local)',
  jsonFmtDesc: 'Pretty-print or minify JSON, zero upload.',
  jsonPretty: 'Pretty',
  jsonMinify: 'Minify',
  jsonErr: 'JSON error: ',

  jsonValTitle: 'JSON Validator (local)',
  jsonValDesc: 'Check JSON syntax and locate the error line, zero upload.',
  jsonValBtn: 'Validate',
  jsonValOk: '✅ Valid JSON',
  jsonValFail: '❌ Invalid JSON',
  jsonValLine: 'line',

  jsonConvTitle: 'JSON Convert (local)',
  jsonConvDesc: 'JSON → CSV / YAML / XML, zero upload.',
  jsonConvBtn: 'Convert',

  profitTitle: 'Profit Calculator (local)',
  profitDesc: 'Net profit & margin from cost + shipping + VAT + commission, zero upload.',
  profitPrice: 'Sale price',
  profitCost: 'Unit cost',
  profitShip: 'Shipping',
  profitVat: 'VAT %',
  profitCommission: 'Commission %',
  profitOther: 'Other fees',
  profitNet: 'Est. net profit',
  profitMargin: 'Margin',

  curTitle: 'Currency Converter (local)',
  curDesc: 'Multi-currency conversion with editable rates, zero upload.',
  curAmount: 'Amount',
  curFrom: 'From',
  curTo: 'To',
  curResult: 'Result',
  curOverride: 'Override rates (vs USD)',

  fbaTitle: 'FBA Fee Estimator (local)',
  fbaDesc: 'Estimate FBA fulfillment fee by marketplace & size tier, zero upload.',
  fbaMarket: 'Marketplace',
  fbaTier: 'Size tier',
  fbaSmall: 'Small standard',
  fbaLarge: 'Large standard',
  fbaSmallOver: 'Small oversize',
  fbaLargeOver: 'Large oversize',
  fbaWeight: 'Weight',
  fbaEstFee: 'Est. fee',
  fbaNote: 'Sample rates for estimation only — see official tables',

  titleLocTitle: 'Title Localizer (local)',
  titleLocDesc: 'Built-in synonym bank + density hints for listings, zero upload.',
  titleLocInput: 'Paste listing title (EN)',
  titleLocLen: 'Length',
  titleLocSuggest: 'Suggestions',
  titleLocDensity: 'Keyword density',
  titleLocPreview: 'Preview',

  kwTitle: 'Keyword Density (local)',
  kwDesc: 'Analyze word frequency & density from your listing, zero upload.',
  kwInput: 'Paste listing copy',
  kwTop: 'Top',
  kwTotal: 'Total words',

  ccTitle: 'Character Counter (local)',
  ccDesc: 'Live char count vs Amazon / eBay limits, zero upload.',
  ccInput: 'Paste text',
  ccChars: 'chars',
  ccWords: 'words',
  amazonTitle: 'Amazon title',
  amazonBullet: 'Amazon bullet',
  amazonDesc: 'Amazon desc',
  ebayTitle: 'eBay title',

  tnTitle: 'Text Normalizer (local)',
  tnDesc: 'Trim / drop blanks / dedupe / case / strip non-ASCII in batch, zero upload.',
  tnInput: 'Paste text (one per line)',
  tnTrim: 'Trim lines',
  tnBlank: 'Drop blank lines',
  tnDedupe: 'Dedupe lines',
  tnSpace: 'Collapse spaces',
  tnUpper: 'Uppercase',
  tnLower: 'Lowercase',
  tnAscii: 'Strip non-ASCII',
};

const DICTS: Record<Lang, Dict> = { zh: ZH, en: EN };

interface LocaleCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const Ctx = createContext<LocaleCtx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('ct_lang');
    if (saved === 'en' || saved === 'zh') setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    localStorage.setItem('ct_lang', lang);
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let s = DICTS[lang][key] ?? DICTS.en[key] ?? key;
      if (params) for (const k in params) s = s.split(`{${k}}`).join(String(params[k]));
      return s;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useT() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useT must be used within LocaleProvider');
  return c;
}
