// 数据驱动博客层（crosstool 百日 SEO 内容计划）。
// 结构：本文件保留「种子帖」（手工维护）+ 合并 content/blog.daily.json（每日流水线追加）。
// 每日发布：scripts/fetch-content-daily.mjs 只向 blog.daily.json 追加，不碰本文件，杜绝格式破坏。
export type BlogType = 'tutorial' | 'review' | 'compare' | 'listicle';

// 分类：英文 slug → 中文显示（分类页 URL 用英文 slug，避开中文 params 编码问题）
export const CATEGORY_SLUGS: Record<string, string> = {
  video: '视频营销',
  document: '文档处理',
  image: '图片优化',
  finance: '跨境财务',
  listing: 'Listing 优化',
  security: '账号安全',
  media: '音视频',
  operations: '运营效率',
  privacy: '隐私合规',
  sourcing: '选品数据',
};

export interface RelatedTool {
  slug: string;
  title: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: BlogType; // tutorial=工具使用 / review=实测评测 / compare=方案对比 / listicle=清单合集
  category: string;
  excerpt: string;
  body: string[]; // 段落数组
  keywords?: string[]; // SEO 关键词（how to / why 型选题，中文长尾优先）
  relatedTools: RelatedTool[];
}

const seedPosts: BlogPost[] = [
  {
    slug: 'amazon-product-video-compress-guide',
    title: '亚马逊商品视频压缩实战：体积减半也不损画质',
    date: '2026-09-03',
    type: 'tutorial',
    category: '视频营销',
    excerpt:
      '商品短视频上传常受体积限制。用本地工具在浏览器内压缩，文件不上传，既过平台限制又保住选品隐私。',
    keywords: ['亚马逊视频压缩', '主图视频体积', '商品视频压缩工具', '本地视频压缩', '视频压缩不损画质'],
    body: [
      'Amazon、TikTok Shop 对上传视频的体积都有隐性门槛，原片动辄几十上百 MB，加载慢、容易上传失败。把视频压缩到平台友好的区间，是上架前必做的一步。',
      '关键是「本地处理」：商品视频里常有未公开的选品、样片与测评素材，上传第三方压缩网站有泄露风险。在浏览器内用 ffmpeg 直接压，文件不会离开你的设备。',
      '实操建议：商品主视频 720p + 中档画质通常够用；做社媒动图时再单独转 GIF。压完用格式转换统一成 mp4（H.264），兼容性最好。',
    ],
    relatedTools: [
      { slug: 'video-compress', title: '视频压缩（本地）' },
      { slug: 'video-convert', title: '视频格式转换（本地）' },
      { slug: 'video-to-gif', title: '视频转 GIF（本地）' },
    ],
  },
  {
    slug: 'merge-pdf-customs-invoice',
    title: '报关单与发票 PDF 合并：跨境卖家一站式整理',
    date: '2026-09-03',
    type: 'tutorial',
    category: '文档处理',
    excerpt: '把报关单、发票、合同多份 PDF 按顺序合并成一册，本地完成，文件不上传。',
    keywords: ['PDF合并', '报关单发票整理', '跨境单据管理', '本地PDF工具', 'PDF批量合并'],
    body: [
      '发货前后要处理大量单据：报关单、商业发票、装箱单、合同。分散的 PDF 既难发买家，也难归档。按顺序合并成一本更省心。',
      '合并在浏览器本地完成，单据不上传任何服务器，适合含客户信息的敏感文件。合并后若体积偏大，可再压一次。',
      '需要把某页抽出来单独发？先用拆分按页码范围拆，再合并或转图片都行。',
    ],
    relatedTools: [
      { slug: 'pdf-merge', title: 'PDF 合并（本地）' },
      { slug: 'pdf-compress', title: 'PDF 压缩（本地）' },
      { slug: 'pdf-to-images', title: 'PDF 转图片（本地）' },
    ],
  },
  {
    slug: 'remove-bg-product-photo',
    title: '产品图去背景：本地工具 10 秒出透明 PNG',
    date: '2026-09-03',
    type: 'tutorial',
    category: '图片优化',
    excerpt: '一键把产品图去背景成透明 PNG，模型在浏览器本地跑，零上传，适合主图与白底图。',
    keywords: ['产品图去背景', '透明PNG', '白底图制作', '本地去背景工具', '图片抠图'],
    body: [
      '平台主图大多要求白底或透明底。去背景是最常用的图片预处理。用本地模型处理，原图不上传，隐私更稳。',
      '去背景后通常还要压缩或转格式统一大小；如果要做水印或批量改名，也可以在本地一气呵成。',
      '注意：去背景对毛发、玻璃等边缘复杂的图效果有限，必要时手动修一修再上架。',
    ],
    relatedTools: [
      { slug: 'image-remove-bg', title: '图片去背景（本地）' },
      { slug: 'image-compress', title: '图片压缩（本地）' },
      { slug: 'image-convert', title: '图片格式转换（本地）' },
    ],
  },
  {
    slug: 'vat-calculator-cross-border',
    title: '欧盟 VAT 计算器怎么用：含/不含税一键算',
    date: '2026-09-03',
    type: 'tutorial',
    category: '跨境财务',
    excerpt: '快速算含/不含税价与 VAT 金额，覆盖欧盟主要税率，本地完成不上传。',
    keywords: ['欧盟VAT计算', '含税不含税价格', 'VAT税率表', '关税估算', '跨境税务计算'],
    body: [
      '做欧盟站最常被 VAT 搞晕：标价到底含不含税、利润怎么算。用 VAT 计算器填税率一键出结果，避免手算出错。',
      'VAT 和关税是两回事：VAT 是消费稅，关税按 HS 编码 + 目的地国估算。两者都建议本地算，资料不上传。',
      '配合退货成本计算器，能把「卖了但退回」的真实净利也算清，定价更稳。',
    ],
    relatedTools: [
      { slug: 'vat-calculator', title: '欧盟 VAT 计算器（本地）' },
      { slug: 'duty-estimator', title: '关税估算（本地）' },
      { slug: 'return-cost-calculator', title: '退货成本计算器（本地）' },
    ],
  },
  {
    slug: 'amazon-listing-title-optimizer',
    title: 'Listing 标题优化：本地词库提词 + 密度自检',
    date: '2026-09-03',
    type: 'tutorial',
    category: 'Listing 优化',
    excerpt: '用内置词库给标题同义/本地化表达，并对照长度上限做密度自检，零上传。',
    keywords: ['Listing标题优化', '关键词密度', '标题长度限制', '本地标题优化器', '亚马逊标题怎么写'],
    body: [
      '标题是搜索权重最高的字段。把卖点词塞满但别堆砌，是门手艺。本地标题优化器给同义/更本地化表达，并提示关键词密度。',
      '写标题前先看长度上限（Amazon 通常 200 字符内），用字符计数器对照，避免被截断。',
      '上架前再用敏感词检查扫一遍，避开平台违禁词；五点描述也可以用生成器批量产出。',
    ],
    relatedTools: [
      { slug: 'title-localizer', title: '多语言标题优化器（本地）' },
      { slug: 'char-counter', title: '字符计数器（本地）' },
      { slug: 'sensitive-word-check', title: '敏感词检查（本地）' },
      { slug: 'bullet-generator', title: '五点描述生成器（本地）' },
    ],
  },
  {
    slug: 'extract-audio-from-live',
    title: '直播回放提取音频：做播客与字幕底稿',
    date: '2026-09-03',
    type: 'tutorial',
    category: '音视频',
    excerpt: '从直播/口播视频抽取音轨为 MP3，做播客素材或字幕底稿，本地处理不上传。',
    keywords: ['视频提取音频', '直播回放转播客', 'MP3提取', '音轨提取工具', '视频转音频'],
    body: [
      '直播回放、口播视频里常有高价值内容。提取音轨做成播客，或转写做字幕底稿，都能二次利用流量。',
      '提取只需取音轨、丢画面，速度快。拿到 MP3 后若要在剪辑软件用，可再转格式统一。',
      '纯本地处理，原视频不上传，素材隐私有保障。',
    ],
    relatedTools: [
      { slug: 'video-extract-audio', title: '视频提取音频（本地）' },
      { slug: 'audio-convert', title: '音频格式转换（本地）' },
    ],
  },
  {
    slug: 'images-to-pdf-catalog',
    title: '产品图批量转 PDF：发给买家的目录册',
    date: '2026-09-03',
    type: 'tutorial',
    category: '文档处理',
    excerpt: '把多张产品图、说明书页合成一本 PDF，便于发给买家、归档或报关随附，零上传。',
    keywords: ['图片转PDF', '产品目录PDF', '图片批量合并PDF', '本地PDF生成', '说明书PDF'],
    body: [
      '给买家发产品册、给仓头发说明书，PDF 比一堆散图专业也更省流量。按选择顺序合成，A4 自动居中。',
      '图多的时候先批量压缩或统一格式，再合成，出来的 PDF 体积更可控。',
      '本地生成，原图不上传。',
    ],
    relatedTools: [{ slug: 'images-to-pdf', title: '图片批量转 PDF（本地）' }],
  },
  {
    slug: 'jwt-decoder-shop-api',
    title: '店铺 API Token 解析：JWT 解码看过期时间',
    date: '2026-09-03',
    type: 'tutorial',
    category: '账号安全',
    excerpt: '解析店铺 API Token 的 Header/Payload，高亮过期时间，本地完成不上传。',
    keywords: ['JWT解码', '店铺API Token', 'Token过期时间', '本地JWT工具', 'API鉴权排查'],
    body: [
      '对接平台开放 API 时，Token 多是 JWT。解码看一下 Payload 里的过期时间，能提前排查「调用突然 401」的问题。',
      'JWT 解码纯本地，Token 不上传，安全。配合 Base64 编解码，调试回调/跟踪链接也方便。',
      'Token 属于敏感凭据，别在公共电脑上长时间留存解码结果。',
    ],
    relatedTools: [
      { slug: 'jwt-decoder', title: 'JWT 解码（本地）' },
      { slug: 'base64', title: 'Base64 编解码（本地）' },
    ],
  },
  {
    slug: 'why-keep-data-local-cross-border',
    title: '为什么跨境卖家的数据不该上传第三方工具：本地处理是底线',
    date: '2026-09-05',
    type: 'tutorial',
    category: '隐私合规',
    excerpt:
      '选品图、报价单、客户资料一旦传上第三方工具，就等于把商业底牌交给陌生人。这篇讲清跨境卖家为什么必须坚持本地处理、零上传。',
    keywords: ['为什么数据不上传', '本地处理工具', '跨境电商隐私合规', '零上传工具', '选品数据安全'],
    body: [
      '跨境卖家的日常离不开各种在线工具：压缩图片、转 PDF、查汇率、算关税。图省事用网页版，点一下上传、点一下下载，看似方便，代价却往往被忽略——你的数据离开设备的那一秒，就不再由你掌控了。',
      '先说最疼的：选品与报价。未上架的产品图、供应商报价、成本拆解，是你在一个类目里活下去的底牌。把它们传到一个不知名的第三方站点，等于把底牌摊给陌生人。缓存、日志、截图、再加工，哪一条都不是你能控制的。竞品先你一步上架你还在打样的款，这种事在圈子里并不罕见。',
      '再说客户与合规。订单里的收件人姓名、地址、电话属于个人数据，平台返回的接口数据、买家差评原文也可能带着可识别信息。一旦流入境外服务器，就进入 GDPR、CCPA 这类法规的射程。真出问题，不是你一句「不知道」就能摘干净的。',
      '更要留意那些「免费工具」的商业模式：免费背后要么是广告，要么就是数据本身。你的产品图、文案、表格，可能被拿去训练模型、喂给竞对分析，或躺在某个被拖库的服务器里。就算站点本身没有恶意，一次数据泄露也能把你的资料全带走。',
      '这不是让你放弃效率，而是换一种实现方式：把计算放在浏览器里。图片压缩、去背景、PDF 加密、EXIF 清理、汇率换算，这些都能在本地跑完，文件不出设备。效果与在线工具一致，唯一区别是数据从头到尾都在你手里。',
      '给你的底线建议就三条：能用本地工具绝不上传；必须走平台的地方用官方入口；每次上传前问一句「如果这条数据泄露，我承受得起吗」。跨境生意本质是信息差生意，把数据留在本地，是成本最低的一道护城河。',
    ],
    relatedTools: [
      { slug: 'exif-cleaner', title: 'EXIF 查看 / 清除（本地）' },
      { slug: 'pdf-encrypt', title: 'PDF 加密（本地）' },
      { slug: 'sensitive-word-check', title: '敏感词检查（本地）' },
    ],
  },
];

import dailyPosts from './blog.daily.json';

// 种子帖 + 日更池合并；每日流水线只写 blog.daily.json
export const blogPosts: BlogPost[] = [...seedPosts, ...(dailyPosts as BlogPost[])];

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}
