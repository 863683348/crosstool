export interface ToolMeta {
  slug: string;
  group: 'file' | 'image' | 'account' | 'finance' | 'listing' | 'media' | 'data' | 'compliance' | 'seo' | 'productivity';
  titleKey: string;
  descKey: string;
  // 该工具是否为 PRD 规划但未在 MVP 实现（显示「即将上线」）
  soon?: boolean;
}

// 注册表共 120 个工具：v1.0（24，已落库）+ v2.0（16）+ v3.0（12）+ v4.0（12）+ v5.0（16）+ v6.0（20）+ v7.0（20）提案；v2.0+ 全部 soon 待实现页面
export const TOOLS: ToolMeta[] = [
  // A 组 · 文件 / PDF
  { slug: 'pdf-merge', group: 'file', titleKey: 'pdfMergeTitle', descKey: 'pdfMergeDesc' },
  { slug: 'pdf-compress', group: 'file', titleKey: 'pdfCompressTitle', descKey: 'pdfCompressDesc' },
  { slug: 'pdf-split', group: 'file', titleKey: 'pdfSplitTitle', descKey: 'pdfSplitDesc' },
  { slug: 'pdf-to-images', group: 'file', titleKey: 'pdfToImagesTitle', descKey: 'pdfToImagesDesc' },
  // B 组 · 图片
  { slug: 'image-compress', group: 'image', titleKey: 'imgCompressTitle', descKey: 'imgCompressDesc' },
  { slug: 'image-remove-bg', group: 'image', titleKey: 'imgRemoveBgTitle', descKey: 'imgRemoveBgDesc' },
  { slug: 'image-convert', group: 'image', titleKey: 'imgConvertTitle', descKey: 'imgConvertDesc' },
  { slug: 'image-resize', group: 'image', titleKey: 'imgResizeTitle', descKey: 'imgResizeDesc' },
  { slug: 'image-blind-watermark', group: 'image', titleKey: 'imgBlindTitle', descKey: 'imgBlindDesc' },
  { slug: 'image-watermark', group: 'image', titleKey: 'imgWatermarkTitle', descKey: 'imgWatermarkDesc' },
  // C 组 · 账号 / 数据安全
  { slug: 'base64', group: 'account', titleKey: 'base64Title', descKey: 'base64Desc' },
  { slug: 'jwt-decoder', group: 'account', titleKey: 'jwtTitle', descKey: 'jwtDesc' },
  { slug: 'password-generator', group: 'account', titleKey: 'pwTitle', descKey: 'pwDesc' },
  { slug: 'json-formatter', group: 'account', titleKey: 'jsonFmtTitle', descKey: 'jsonFmtDesc' },
  { slug: 'json-validator', group: 'account', titleKey: 'jsonValTitle', descKey: 'jsonValDesc' },
  { slug: 'json-convert', group: 'account', titleKey: 'jsonConvTitle', descKey: 'jsonConvDesc' },
  // D 组 · 跨境财务
  { slug: 'vat-calculator', group: 'finance', titleKey: 'vatTitle', descKey: 'vatDesc' },
  { slug: 'profit-calculator', group: 'finance', titleKey: 'profitTitle', descKey: 'profitDesc' },
  { slug: 'currency-converter', group: 'finance', titleKey: 'curTitle', descKey: 'curDesc' },
  { slug: 'fba-fee-estimator', group: 'finance', titleKey: 'fbaTitle', descKey: 'fbaDesc' },
  // E 组 · Listing / 文本
  { slug: 'title-localizer', group: 'listing', titleKey: 'titleLocTitle', descKey: 'titleLocDesc' },
  { slug: 'keyword-analyzer', group: 'listing', titleKey: 'kwTitle', descKey: 'kwDesc' },
  { slug: 'char-counter', group: 'listing', titleKey: 'ccTitle', descKey: 'ccDesc' },
  { slug: 'text-normalizer', group: 'listing', titleKey: 'tnTitle', descKey: 'tnDesc' },

  // —— v2.0 提案（PRD §十三，待确认）· 16 个垂直卖家本地隐私工具 ——
  // 上线时按导航归类：F 组并入 account，G→image，H→finance，I→listing（见 §十三 注）
  // soon: true = 已纳入规划/注册表，页面待实现（卡片不跳转、不进 sitemap，避免死链）

  // F 组 · 编码 / 标识（→ account）
  { slug: 'qr-code', group: 'account', titleKey: 'qrTitle', descKey: 'qrDesc' },
  { slug: 'url-codec', group: 'account', titleKey: 'urlCodecTitle', descKey: 'urlCodecDesc' },
  { slug: 'html-entity', group: 'account', titleKey: 'htmlEntityTitle', descKey: 'htmlEntityDesc' },
  { slug: 'timestamp-convert', group: 'account', titleKey: 'tsTitle', descKey: 'tsDesc' },
  { slug: 'hash-generator', group: 'account', titleKey: 'hashTitle', descKey: 'hashDesc' },
  { slug: 'barcode-generator', group: 'account', titleKey: 'barcodeTitle', descKey: 'barcodeDesc' },

  // G 组 · 图片进阶（→ image）
  { slug: 'exif-cleaner', group: 'image', titleKey: 'exifTitle', descKey: 'exifDesc' },
  { slug: 'image-batch-rename', group: 'image', titleKey: 'imgRenameTitle', descKey: 'imgRenameDesc' },
  { slug: 'image-size-report', group: 'image', titleKey: 'imgSizeTitle', descKey: 'imgSizeDesc' },
  { slug: 'image-rounded-border', group: 'image', titleKey: 'imgBorderTitle', descKey: 'imgBorderDesc' },

  // H 组 · 跨境财务进阶（→ finance）
  { slug: 'duty-estimator', group: 'finance', titleKey: 'dutyTitle', descKey: 'dutyDesc' },
  { slug: 'return-cost-calculator', group: 'finance', titleKey: 'returnCostTitle', descKey: 'returnCostDesc' },
  { slug: 'multi-store-profit', group: 'finance', titleKey: 'multiProfitTitle', descKey: 'multiProfitDesc' },

  // I 组 · Listing 进阶（→ listing）
  { slug: 'title-ab-test', group: 'listing', titleKey: 'titleAbTitle', descKey: 'titleAbDesc' },
  { slug: 'bullet-generator', group: 'listing', titleKey: 'bulletGenTitle', descKey: 'bulletGenDesc' },
  { slug: 'sensitive-word-check', group: 'listing', titleKey: 'sensitiveWordTitle', descKey: 'sensitiveWordDesc' },

  // —— v3.0 提案（视频与多媒体，media）· 12 个本地隐私工具 ——
  { slug: 'video-compress', group: 'media', titleKey: 'videoCompressTitle', descKey: 'videoCompressDesc' },
  { slug: 'video-convert', group: 'media', titleKey: 'videoConvertTitle', descKey: 'videoConvertDesc' },
  { slug: 'video-to-gif', group: 'media', titleKey: 'videoToGifTitle', descKey: 'videoToGifDesc' },
  { slug: 'video-trim', group: 'media', titleKey: 'videoTrimTitle', descKey: 'videoTrimDesc' },
  { slug: 'video-merge', group: 'media', titleKey: 'videoMergeTitle', descKey: 'videoMergeDesc' },
  { slug: 'video-extract-audio', group: 'media', titleKey: 'videoExtractAudioTitle', descKey: 'videoExtractAudioDesc' },
  { slug: 'audio-convert', group: 'media', titleKey: 'audioConvertTitle', descKey: 'audioConvertDesc' },
  { slug: 'audio-trim', group: 'media', titleKey: 'audioTrimTitle', descKey: 'audioTrimDesc' },
  { slug: 'images-to-video', group: 'media', titleKey: 'imagesToVideoTitle', descKey: 'imagesToVideoDesc' },
  { slug: 'video-frame-extract', group: 'media', titleKey: 'videoFrameExtractTitle', descKey: 'videoFrameExtractDesc' },
  { slug: 'video-resize', group: 'media', titleKey: 'videoResizeTitle', descKey: 'videoResizeDesc' },
  { slug: 'images-to-pdf', group: 'media', titleKey: 'imagesToPdfTitle', descKey: 'imagesToPdfDesc' },

  // —— v4.0 提案（选品与数据，data）· 12 个本地隐私工具 ——
  { slug: 'csv-cleaner', group: 'data', titleKey: 'csvCleanerTitle', descKey: 'csvCleanerDesc' },
  { slug: 'keyword-frequency', group: 'data', titleKey: 'keywordFrequencyTitle', descKey: 'keywordFrequencyDesc' },
  { slug: 'price-compare', group: 'data', titleKey: 'priceCompareTitle', descKey: 'priceCompareDesc' },
  { slug: 'fx-bulk', group: 'data', titleKey: 'fxBulkTitle', descKey: 'fxBulkDesc' },
  { slug: 'stock-alert', group: 'data', titleKey: 'stockAlertTitle', descKey: 'stockAlertDesc' },
  { slug: 'profit-report', group: 'data', titleKey: 'profitReportTitle', descKey: 'profitReportDesc' },
  { slug: 'review-analyzer', group: 'data', titleKey: 'reviewAnalyzerTitle', descKey: 'reviewAnalyzerDesc' },
  { slug: 'volumetric-weight', group: 'data', titleKey: 'volumetricWeightTitle', descKey: 'volumetricWeightDesc' },
  { slug: 'shipping-estimator', group: 'data', titleKey: 'shippingEstimatorTitle', descKey: 'shippingEstimatorDesc' },
  { slug: 'dedupe', group: 'data', titleKey: 'dedupeTitle', descKey: 'dedupeDesc' },
  { slug: 'asin-batch', group: 'data', titleKey: 'asinBatchTitle', descKey: 'asinBatchDesc' },
  { slug: 'pivot-lite', group: 'data', titleKey: 'pivotLiteTitle', descKey: 'pivotLiteDesc' },

  // —— v5.0 提案（合规与效率，compliance）· 16 个本地隐私工具 ——
  { slug: 'brand-check', group: 'compliance', titleKey: 'brandCheckTitle', descKey: 'brandCheckDesc' },
  { slug: 'restricted-words', group: 'compliance', titleKey: 'restrictedWordsTitle', descKey: 'restrictedWordsDesc' },
  { slug: 'glossary-translate', group: 'compliance', titleKey: 'glossaryTranslateTitle', descKey: 'glossaryTranslateDesc' },
  { slug: 'receipt-ocr', group: 'compliance', titleKey: 'receiptOcrTitle', descKey: 'receiptOcrDesc' },
  { slug: 'watermark-batch', group: 'compliance', titleKey: 'watermarkBatchTitle', descKey: 'watermarkBatchDesc' },
  { slug: 'thumbnail-gen', group: 'compliance', titleKey: 'thumbnailGenTitle', descKey: 'thumbnailGenDesc' },
  { slug: 'image-collage', group: 'compliance', titleKey: 'imageCollageTitle', descKey: 'imageCollageDesc' },
  { slug: 'pdf-encrypt', group: 'compliance', titleKey: 'pdfEncryptTitle', descKey: 'pdfEncryptDesc' },
  { slug: 'pdf-page-number', group: 'compliance', titleKey: 'pdfPageNumberTitle', descKey: 'pdfPageNumberDesc' },
  { slug: 'diff-text', group: 'compliance', titleKey: 'diffTextTitle', descKey: 'diffTextDesc' },
  { slug: 'regex-tester', group: 'compliance', titleKey: 'regexTesterTitle', descKey: 'regexTesterDesc' },
  { slug: 'uuid-generator', group: 'compliance', titleKey: 'uuidGeneratorTitle', descKey: 'uuidGeneratorDesc' },
  { slug: 'qr-batch', group: 'compliance', titleKey: 'qrBatchTitle', descKey: 'qrBatchDesc' },
  { slug: 'color-convert', group: 'compliance', titleKey: 'colorConvertTitle', descKey: 'colorConvertDesc' },
  { slug: 'markdown-table', group: 'compliance', titleKey: 'markdownTableTitle', descKey: 'markdownTableDesc' },
  { slug: 'listing-template', group: 'compliance', titleKey: 'listingTemplateTitle', descKey: 'listingTemplateDesc' },

  // —— v6.0 提案（SEO 与流量，seo）· 20 个本地隐私工具 ——
  { slug: 'keyword-cluster', group: 'seo', titleKey: 'keywordClusterTitle', descKey: 'keywordClusterDesc' },
  { slug: 'long-tail-gen', group: 'seo', titleKey: 'longTailGenTitle', descKey: 'longTailGenDesc' },
  { slug: 'meta-gen', group: 'seo', titleKey: 'metaGenTitle', descKey: 'metaGenDesc' },
  { slug: 'slug-gen', group: 'seo', titleKey: 'slugGenTitle', descKey: 'slugGenDesc' },
  { slug: 'title-tag-tester', group: 'seo', titleKey: 'titleTagTesterTitle', descKey: 'titleTagTesterDesc' },
  { slug: 'desc-gen', group: 'seo', titleKey: 'descGenTitle', descKey: 'descGenDesc' },
  { slug: 'alt-text-gen', group: 'seo', titleKey: 'altTextGenTitle', descKey: 'altTextGenDesc' },
  { slug: 'keyword-density', group: 'seo', titleKey: 'keywordDensityTitle', descKey: 'keywordDensityDesc' },
  { slug: 'lsi-words', group: 'seo', titleKey: 'lsiWordsTitle', descKey: 'lsiWordsDesc' },
  { slug: 'question-miner', group: 'seo', titleKey: 'questionMinerTitle', descKey: 'questionMinerDesc' },
  { slug: 'niche-finder', group: 'seo', titleKey: 'nicheFinderTitle', descKey: 'nicheFinderDesc' },
  { slug: 'competitor-gap', group: 'seo', titleKey: 'competitorGapTitle', descKey: 'competitorGapDesc' },
  { slug: 'content-outline', group: 'seo', titleKey: 'contentOutlineTitle', descKey: 'contentOutlineDesc' },
  { slug: 'breadcrumb-gen', group: 'seo', titleKey: 'breadcrumbGenTitle', descKey: 'breadcrumbGenDesc' },
  { slug: 'hreflang-check', group: 'seo', titleKey: 'hreflangCheckTitle', descKey: 'hreflangCheckDesc' },
  { slug: 'sitemap-validate', group: 'seo', titleKey: 'sitemapValidateTitle', descKey: 'sitemapValidateDesc' },
  { slug: 'robots-gen', group: 'seo', titleKey: 'robotsGenTitle', descKey: 'robotsGenDesc' },
  { slug: 'serp-preview', group: 'seo', titleKey: 'serpPreviewTitle', descKey: 'serpPreviewDesc' },
  { slug: 'trend-finder', group: 'seo', titleKey: 'trendFinderTitle', descKey: 'trendFinderDesc' },
  { slug: 'rank-tracker-local', group: 'seo', titleKey: 'rankTrackerTitle', descKey: 'rankTrackerDesc' },

  // —— v7.0 提案（效率与批量，productivity）· 20 个本地隐私工具 ——
  { slug: 'batch-rename', group: 'productivity', titleKey: 'batchRenameTitle', descKey: 'batchRenameDesc' },
  { slug: 'bulk-image-resize', group: 'productivity', titleKey: 'bulkImageResizeTitle', descKey: 'bulkImageResizeDesc' },
  { slug: 'bulk-convert', group: 'productivity', titleKey: 'bulkConvertTitle', descKey: 'bulkConvertDesc' },
  { slug: 'csv-merge', group: 'productivity', titleKey: 'csvMergeTitle', descKey: 'csvMergeDesc' },
  { slug: 'json-to-csv', group: 'productivity', titleKey: 'jsonToCsvTitle', descKey: 'jsonToCsvDesc' },
  { slug: 'csv-to-json', group: 'productivity', titleKey: 'csvToJsonTitle', descKey: 'csvToJsonDesc' },
  { slug: 'xml-format', group: 'productivity', titleKey: 'xmlFormatTitle', descKey: 'xmlFormatDesc' },
  { slug: 'yaml-convert', group: 'productivity', titleKey: 'yamlConvertTitle', descKey: 'yamlConvertDesc' },
  { slug: 'env-manager', group: 'productivity', titleKey: 'envManagerTitle', descKey: 'envManagerDesc' },
  { slug: 'lorem-gen', group: 'productivity', titleKey: 'loremGenTitle', descKey: 'loremGenDesc' },
  { slug: 'cron-tester', group: 'productivity', titleKey: 'cronTesterTitle', descKey: 'cronTesterDesc' },
  { slug: 'md-preview', group: 'productivity', titleKey: 'mdPreviewTitle', descKey: 'mdPreviewDesc' },
  { slug: 'diff-viewer', group: 'productivity', titleKey: 'diffViewerTitle', descKey: 'diffViewerDesc' },
  { slug: 'base64-file', group: 'productivity', titleKey: 'base64FileTitle', descKey: 'base64FileDesc' },
  { slug: 'color-palette', group: 'productivity', titleKey: 'colorPaletteTitle', descKey: 'colorPaletteDesc' },
  { slug: 'favicon-gen', group: 'productivity', titleKey: 'faviconGenTitle', descKey: 'faviconGenDesc' },
  { slug: 'placeholder-gen', group: 'productivity', titleKey: 'placeholderGenTitle', descKey: 'placeholderGenDesc' },
  { slug: 'shortcut-ref', group: 'productivity', titleKey: 'shortcutRefTitle', descKey: 'shortcutRefDesc' },
  { slug: 'template-manager', group: 'productivity', titleKey: 'templateManagerTitle', descKey: 'templateManagerDesc' },
  { slug: 'clipboard-history', group: 'productivity', titleKey: 'clipboardHistoryTitle', descKey: 'clipboardHistoryDesc' },
];

export const GROUP_LABEL_KEY: Record<ToolMeta['group'], string> = {
  file: 'homeGroupFile',
  image: 'homeGroupImage',
  account: 'homeGroupAccount',
  finance: 'homeGroupFinance',
  listing: 'homeGroupListing',
  media: 'homeGroupMedia',
  data: 'homeGroupData',
  compliance: 'homeGroupCompliance',
  seo: 'homeGroupSeo',
  productivity: 'homeGroupProductivity',
};

// 首页「热门工具」置顶列表（均为已实现、卖家最高频的工具）
export const HOT_SLUGS: string[] = [
  'pdf-merge',
  'pdf-compress',
  'pdf-split',
  'image-compress',
  'image-remove-bg',
  'image-convert',
  'image-resize',
  'base64',
  'vat-calculator',
  'profit-calculator',
  'currency-converter',
  'char-counter',
  'title-localizer',
  'jwt-decoder',
];
