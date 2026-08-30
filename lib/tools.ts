export interface ToolMeta {
  slug: string;
  group: 'file' | 'image' | 'account' | 'finance' | 'listing';
  titleKey: string;
  descKey: string;
  // 该工具是否为 PRD 规划但未在 MVP 实现（显示「即将上线」）
  soon?: boolean;
}

// v1.0 共 24 个工具（全部纯前端、零上传）
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
];

export const GROUP_LABEL_KEY: Record<ToolMeta['group'], string> = {
  file: 'homeGroupFile',
  image: 'homeGroupImage',
  account: 'homeGroupAccount',
  finance: 'homeGroupFinance',
  listing: 'homeGroupListing',
};
