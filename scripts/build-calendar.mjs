#!/usr/bin/env node
/**
 * crosstool 100 天内容日历扩量构建器（每天 5 篇 × 5 个不同分类）
 * 规则：1 天 1 个分类 1 篇，每天 5 个不同分类轮转，共 100 天 = 500 篇。
 * 10 分类：每分类 50 篇（既有 10 篇种子 + 本脚本 40 篇新选题）。
 *
 * 用法：
 *   node scripts/build-calendar.mjs            # 重建 content-calendar.json（500 条）
 *   node scripts/build-calendar.mjs --dry-run  # 只校验不写盘
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CALENDAR = path.join(ROOT, 'scripts', 'content-calendar.json');
const TOOLS_TS = path.join(ROOT, 'lib', 'tools.ts');
const I18N_TS = path.join(ROOT, 'lib', 'i18n.tsx');

const dryRun = process.argv.includes('--dry-run');
const fail = (msg) => { console.error('❌ ' + msg); process.exit(1); };

// ---------- 活工具 slug + 中文名 ----------
function loadLiveTools() {
  const slugs = new Map();
  for (const line of readFileSync(TOOLS_TS, 'utf-8').split('\n')) {
    const s = line.match(/slug: '([a-z0-9-]+)'/);
    const k = line.match(/titleKey: '([A-Za-z]+)'/);
    if (s && k && !/soon: true/.test(line)) slugs.set(s[1], k[1]);
  }
  const keyTitle = new Map();
  for (const line of readFileSync(I18N_TS, 'utf-8').split('\n')) {
    const m = line.match(/^\s{2,}([A-Za-z]+Title):\s*'([^']+)'/);
    if (m && !keyTitle.has(m[1])) keyTitle.set(m[1], m[2]);
  }
  const out = new Map();
  for (const [slug, key] of slugs) if (keyTitle.has(key)) out.set(slug, keyTitle.get(key));
  return out;
}

const LIVE = loadLiveTools();
if (LIVE.size < 40) fail('活工具解析异常: ' + LIVE.size);

// ---------- 新选题数据：10 分类 × 40 篇 ----------
// 每条：[slug, 标题, [关键词], [工具slug], type]
// 标题可含 {T} 占位符（工具中文名），生成时替换并防重复
const NEW = {
  '视频营销': [
    ['video-main-compress-choose', '主图视频太大传不上？本地压缩工具怎么选', ['主图视频', '视频压缩', '上传失败'], ['video-compress'], 'tutorial'],
    ['video-gif-loop-detail', '详情页视频循环播放：转 GIF 的正确姿势', ['视频转GIF', '循环动图', '详情页'], ['video-to-gif'], 'tutorial'],
    ['video-merge-unify-params', '多段素材合并不丢画质：合并前先统一参数', ['视频合并', '画质', '参数统一'], ['video-merge', 'video-convert'], 'tutorial'],
    ['video-frame-cover', '商品视频提取首帧做封面：不再另拍图', ['视频首帧', '封面图', '抽帧'], ['video-frame-extract'], 'tutorial'],
    ['video-resize-vertical-ad', '竖屏广告素材改造：横转竖不裁主体', ['竖屏视频', '视频分辨率', '广告素材'], ['video-resize'], 'tutorial'],
    ['images-to-video-preheat', '用图片做视频预告：上线前的低成本预热', ['图片转视频', '预告片', '预热'], ['images-to-video'], 'tutorial'],
    ['video-trim-blurry', '视频裁剪后画质发糊？三处参数排查', ['视频裁剪', '画质', '清晰度'], ['video-trim', 'video-compress'], 'tutorial'],
    ['live-replay-highlight', '直播回放太长：裁剪出高光片段再复用', ['直播回放', '高光片段', '视频裁剪'], ['video-trim'], 'tutorial'],
    ['multi-platform-video-spec', '不同平台视频规格对照：一次准备全渠道', ['视频规格', '平台适配', '分辨率'], ['video-convert', 'video-resize'], 'listicle'],
    ['gif-size-cap', '视频转 GIF 后体积大？两步压到能发', ['动图压缩', 'GIF体积', '视频转GIF'], ['video-to-gif', 'video-compress'], 'tutorial'],
    ['unboxing-frame-detail', '开箱视频里的产品特写：抽帧做详情图', ['开箱视频', '抽帧', '详情图'], ['video-frame-extract', 'image-compress'], 'tutorial'],
    ['video-merge-order', '视频合并顺序老错？拖拽排序的讲究', ['视频合并', '排序', '顺序'], ['video-merge'], 'tutorial'],
    ['mov-edit-first', '素材是 MOV 无法编辑？先转 MP4 再动手', ['MOV转MP4', '视频格式', '可编辑'], ['video-convert'], 'tutorial'],
    ['compress-no-loss', '视频压缩不损画质的秘密：码率与分辨率', ['视频压缩', '码率', '分辨率'], ['video-compress', 'video-resize'], 'tutorial'],
    ['frame-compare-image', '详情页视频截关键帧做前后对比图', ['抽帧', '对比图', '详情页'], ['video-frame-extract', 'image-compress'], 'tutorial'],
    ['merge-av-sync', '合并多个视频后音画不同步？一次排查', ['视频合并', '音画同步', '音轨'], ['video-merge', 'video-convert'], 'tutorial'],
    ['review-gif-animation', '商品视频转 GIF 放评价区：动态口碑', ['评价区动图', '视频转GIF', '口碑'], ['video-to-gif'], 'tutorial'],
    ['vertical-tiktok-material', '竖版视频做 TikTok 素材：裁剪与重排', ['TikTok素材', '竖屏视频', '视频裁剪'], ['video-trim', 'video-resize'], 'tutorial'],
    ['slideshow-ad-material', '图片轮播转视频做广告素材：零拍摄成本', ['图片转视频', '广告素材', '轮播'], ['images-to-video'], 'tutorial'],
    ['export-format-h264', '视频导出格式怎么选：MP4/H.264 详解', ['视频格式', 'MP4', 'H.264'], ['video-convert'], 'tutorial'],
    ['frame-batch-compress', '抽帧提取图片后批量压缩再上架', ['抽帧', '批量压缩', '上架'], ['video-frame-extract', 'image-compress'], 'tutorial'],
    ['trim-selling-point', '视频裁剪保留重点：只留卖点片段', ['视频裁剪', '卖点', '重点片段'], ['video-trim'], 'tutorial'],
    ['merge-multi-product', '多产品合并一个展示视频：统一主图视频', ['视频合并', '多产品', '展示视频'], ['video-merge'], 'tutorial'],
    ['resize-speed-up', '视频分辨率过高卡顿？降分辨率提速', ['视频分辨率', '卡顿', '加载速度'], ['video-resize', 'video-compress'], 'tutorial'],
    ['phone-format-unify', '手机拍的视频格式不对？统一转码再分发', ['视频格式', '转码', '手机拍摄'], ['video-convert'], 'tutorial'],
    ['gif-cs-reply', '视频转 GIF 用于客服快捷回复：一眼看懂', ['客服动图', '视频转GIF', '快捷回复'], ['video-to-gif'], 'tutorial'],
    ['merge-transition', '视频合并加转场：多镜头自然衔接', ['视频合并', '转场', '镜头衔接'], ['video-merge'], 'tutorial'],
    ['frame-use-moment', '截取视频里的产品使用瞬间：做场景图', ['抽帧', '使用场景', '产品图'], ['video-frame-extract'], 'tutorial'],
    ['vertical-whatsapp', '竖屏视频用于 WhatsApp/朋友圈：格式适配', ['竖屏视频', 'WhatsApp', '格式适配'], ['video-resize', 'video-convert'], 'tutorial'],
    ['images-story-video', '图片生成视频做产品故事：品牌叙事新方式', ['图片转视频', '品牌故事', '产品视频'], ['images-to-video'], 'tutorial'],
    ['compress-still-over', '视频压缩后上传还是超限？继续压的底线', ['视频压缩', '体积限制', '上传'], ['video-compress'], 'tutorial'],
    ['trim-remove-logo', '视频裁剪去除片头片尾：干净利落', ['视频裁剪', '片头片尾', '水印'], ['video-trim'], 'tutorial'],
    ['merge-collection-workflow', '素材太多合并成合集：整理工作流', ['视频合并', '合集', '素材整理'], ['video-merge', 'video-trim'], 'listicle'],
    ['gif-resize-small', '视频转 GIF 压缩循环动图尺寸', ['动图尺寸', '视频转GIF', '压缩'], ['video-to-gif', 'video-resize'], 'tutorial'],
    ['frame-aplus-image', '抽帧提取高清产品图做 A+ 页面', ['A+页面', '抽帧', '高清产品图'], ['video-frame-extract', 'image-compress'], 'tutorial'],
    ['format-compat-check', '视频格式转换避免兼容性翻车：老设备也能播', ['视频格式', '兼容性', '播放'], ['video-convert', 'video-trim'], 'tutorial'],
    ['compress-check-report', '压缩视频前先看体积报告：心中有数', ['视频体积', '压缩', '体积报告'], ['video-compress'], 'tutorial'],
    ['resize-keep-aspect', '视频分辨率调整保持宽高比：不变形', ['视频分辨率', '宽高比', '不变形'], ['video-resize'], 'tutorial'],
    ['images-to-video-bgm', '多张图片转视频配背景音乐：产品氛围片', ['图片转视频', '背景音乐', '氛围片'], ['images-to-video'], 'tutorial'],
    ['merge-unify-fps', '视频合并前统一帧率与码率：避免忽快忽慢', ['视频合并', '帧率', '码率'], ['video-merge', 'video-convert'], 'tutorial'],
  ],
  '图片优化': [
    ['remove-bg-shadow', '白底图去背景后边缘发灰？本地抠图精修', ['去背景', '白底图', '抠图'], ['image-remove-bg'], 'tutorial'],
    ['compress-single-fast', '单张图上传太慢？先压缩再传', ['图片压缩', '上传速度', '单张'], ['image-compress'], 'tutorial'],
    ['convert-png-webp', 'PNG 转 WebP：详情页图片瘦身新方案', ['PNG转WebP', '图片格式', '瘦身'], ['image-convert'], 'tutorial'],
    ['resize-thumbnail', '缩略图统一尺寸：列表页不再参差', ['图片缩放', '缩略图', '统一尺寸'], ['image-resize'], 'tutorial'],
    ['blind-watermark-tracking', '隐形水印追踪：代理盗图也溯源', ['隐形水印', '盗图溯源', '追踪'], ['image-blind-watermark'], 'tutorial'],
    ['watermark-brand-margin', '批量水印怎么放不挡主体：边角策略', ['批量水印', '水印位置', '品牌'], ['image-watermark'], 'tutorial'],
    ['exif-before-upload', '上传前清 EXIF：你的图里有拍摄信息', ['EXIF清除', '图片隐私', '上传前'], ['exif-cleaner'], 'tutorial'],
    ['rename-sort-sku', '产品图按 SKU+序号批量改名：仓库对得上', ['批量改名', 'SKU', '序号'], ['image-batch-rename'], 'tutorial'],
    ['size-report-heavy', '图片体积体检：哪张图拖慢详情页', ['图片体积', '体检', '页面速度'], ['image-size-report'], 'tutorial'],
    ['rounded-border-social', '社交素材加圆角：不挡内容更精致', ['圆角图片', '社交素材', '边框'], ['image-rounded-border'], 'tutorial'],
    ['remove-bg-logo', 'Logo 去背景：透明底图的正确做法', ['去背景', 'Logo', '透明底'], ['image-remove-bg', 'image-convert'], 'tutorial'],
    ['compress-webp-quality', 'WebP 压缩画质崩了？质量参数怎么调', ['WebP', '压缩画质', '质量参数'], ['image-compress', 'image-convert'], 'tutorial'],
    ['convert-heic-web', 'HEIC 图片网页不显示？批量转 JPG/WebP', ['HEIC转换', '网页兼容', '批量'], ['image-convert'], 'tutorial'],
    ['resize-banner', 'Banner 图统一尺寸：多平台不重做', ['图片缩放', 'Banner', '多平台'], ['image-resize', 'image-convert'], 'tutorial'],
    ['blind-watermark-claims', '原创图隐形标记：被抄袭时举证', ['隐形水印', '原创保护', '举证'], ['image-blind-watermark'], 'tutorial'],
    ['watermark-batch-folders', '批量水印按文件夹处理：一次全站加水印', ['批量水印', '文件夹', '批处理'], ['image-watermark'], 'tutorial'],
    ['exif-mac-location', 'Mac 拍的图带位置？EXIF 里藏着 GPS', ['EXIF', 'GPS', 'Mac'], ['exif-cleaner'], 'tutorial'],
    ['rename-archive-rules', '图片归档命名规范：三个月后还找得到', ['批量改名', '归档', '命名规范'], ['image-batch-rename'], 'tutorial'],
    ['size-report-mobile', '移动端图片体积标准：流量就是钱', ['图片体积', '移动端', '流量'], ['image-size-report', 'image-compress'], 'tutorial'],
    ['rounded-border-icon', '图标加圆角：产品 UI 素材统一风格', ['圆角图片', '图标', 'UI素材'], ['image-rounded-border'], 'tutorial'],
    ['remove-bg-person', '模特图去背景：换背景做营销图', ['去背景', '模特图', '营销图'], ['image-remove-bg'], 'tutorial'],
    ['compress-batch-50', '50 张图批量压缩：全流程 3 分钟', ['批量压缩', '图片压缩', '效率'], ['image-compress', 'image-size-report'], 'tutorial'],
    ['convert-gif-mp4', 'GIF 转 MP4：动图体积大改用视频', ['GIF转MP4', '动图', '体积'], ['image-convert'], 'tutorial'],
    ['resize-main-image', '主图尺寸不达标？一键缩放到平台要求', ['主图尺寸', '图片缩放', '平台要求'], ['image-resize'], 'tutorial'],
    ['blind-watermark-contract', '合同/报价单隐形水印：防外泄', ['隐形水印', '合同', '防外泄'], ['image-blind-watermark'], 'tutorial'],
    ['watermark-repeat-ratio', '批量水印平铺密度：美观与防伪平衡', ['批量水印', '平铺', '防伪'], ['image-watermark'], 'tutorial'],
    ['exif-proof-of-work', '保留 EXIF 自证原创：别急着清', ['EXIF', '原创自证', '保留'], ['exif-cleaner'], 'tutorial'],
    ['rename-before-backup', '改名备份前先做：防误操作', ['批量改名', '备份', '防误'], ['image-batch-rename'], 'tutorial'],
    ['size-report-compress-ratio', '体积报表指导压缩：先看再压更聪明', ['图片体积', '压缩比', '报表'], ['image-size-report', 'image-compress'], 'tutorial'],
    ['rounded-border-thumb', '缩略图统一圆角：视觉更整齐', ['圆角图片', '缩略图', '统一'], ['image-rounded-border', 'image-resize'], 'tutorial'],
    ['remove-bg-swatch', '色卡/色板去背景：颜色不失真', ['去背景', '色卡', '颜色'], ['image-remove-bg'], 'tutorial'],
    ['compress-lossless-check', '无损压缩真无损吗？肉眼对比法', ['无损压缩', '图片压缩', '对比'], ['image-compress'], 'review'],
    ['convert-svg-png', 'SVG 转 PNG：矢量素材网页兼容', ['SVG转PNG', '图片格式', '矢量'], ['image-convert'], 'tutorial'],
    ['resize-crop-fill', '缩放裁剪填充：图片不变形的三件套', ['图片缩放', '裁剪', '填充'], ['image-resize'], 'tutorial'],
    ['blind-watermark-price', '价格敏感图加隐形水印：防截图外传', ['隐形水印', '价格图', '防截图'], ['image-blind-watermark'], 'tutorial'],
    ['watermark-legal-text', '图片角落加水印文字：版权声明', ['批量水印', '版权声明', '文字水印'], ['image-watermark'], 'tutorial'],
    ['exif-consignment', '代发货物料先清 EXIF：保护仓库信息', ['EXIF', '代发货', '信息保护'], ['exif-cleaner'], 'tutorial'],
    ['rename-by-date-session', '按日期/批次命名图片：拍摄管理', ['批量改名', '日期', '批次'], ['image-batch-rename'], 'tutorial'],
    ['size-report-bulk-opt', '大图批量体检：一次找全超重文件', ['图片体积', '批量体检', '超重'], ['image-size-report'], 'listicle'],
    ['rounded-border-before-after', '圆角边框做前后对比：设计感提升', ['圆角图片', '对比', '设计感'], ['image-rounded-border'], 'tutorial'],
  ],
  '文档处理': [
    ['merge-supplier-quote', '多家供应商报价单合并：比价一册看', ['PDF合并', '报价单', '比价'], ['pdf-merge'], 'tutorial'],
    ['compress-scanned-slim', '扫描件压缩：清晰度与体积的平衡', ['PDF压缩', '扫描件', '清晰度'], ['pdf-compress'], 'tutorial'],
    ['split-one-order-page', '一个 PDF 拆出我的订单页：只留需要的', ['PDF拆分', '订单页', '提取'], ['pdf-split'], 'tutorial'],
    ['pdf-image-draft-check', 'PDF 转图片给设计确认：不用装阅读器', ['PDF转图片', '设计确认', '审稿'], ['pdf-to-images'], 'tutorial'],
    ['images-pdf-quickbook', '快递面单拍照转 PDF：对账留底', ['图片转PDF', '快递面单', '对账'], ['images-to-pdf'], 'tutorial'],
    ['merge-license-pdf', '营业执照+资质证明合并：入驻材料一份交', ['PDF合并', '资质', '入驻材料'], ['pdf-merge'], 'tutorial'],
    ['compress-50mb-cap', 'PDF 超过 50MB？分档压到可发', ['PDF压缩', '体积', '发送'], ['pdf-compress'], 'tutorial'],
    ['split-chinese-invoice', '中文发票 PDF 拆出报销页', ['PDF拆分', '发票', '报销'], ['pdf-split'], 'tutorial'],
    ['pdf-image-watermark-quote', '报价单 PDF 转图加水印再发客户', ['PDF转图片', '水印', '报价单'], ['pdf-to-images', 'image-watermark'], 'tutorial'],
    ['images-pdf-catalog', '产品图批量转 PDF：做电子目录册', ['图片转PDF', '产品目录', '电子册'], ['images-to-pdf'], 'tutorial'],
    ['merge-faq-doc', 'FAQ 文档合并成一份客服手册', ['PDF合并', 'FAQ', '客服手册'], ['pdf-merge'], 'tutorial'],
    ['compress-email-invoice', '发票 PDF 太大发不了邮件？先压', ['PDF压缩', '发票', '邮件'], ['pdf-compress'], 'tutorial'],
    ['split-shipping-label', '批量面单 PDF 拆出单张：打印不浪费', ['PDF拆分', '面单', '打印'], ['pdf-split'], 'tutorial'],
    ['pdf-image-social', 'PDF 转图片发社交：宣传册也能晒', ['PDF转图片', '社交', '宣传册'], ['pdf-to-images'], 'tutorial'],
    ['images-pdf-contract', '签好的合同扫描转 PDF 归档', ['图片转PDF', '合同', '归档'], ['images-to-pdf', 'pdf-merge'], 'tutorial'],
    ['merge-trademark-doc', '商标注册材料合并：一次提交齐全', ['PDF合并', '商标', '材料'], ['pdf-merge'], 'tutorial'],
    ['compress-customs-pdf', '报关文件压缩：清关上传不卡', ['PDF压缩', '报关', '清关'], ['pdf-compress'], 'tutorial'],
    ['split-text-chapter', 'PDF 按页拆章节：长文档分册', ['PDF拆分', '章节', '分册'], ['pdf-split'], 'tutorial'],
    ['pdf-image-review-mark', 'PDF 转图标注审：提意见更方便', ['PDF转图片', '审阅', '标注'], ['pdf-to-images'], 'tutorial'],
    ['images-pdf-expense-merge', '报销截图批量转 PDF 再合并成册', ['图片转PDF', '报销', '合并'], ['images-to-pdf', 'pdf-merge'], 'tutorial'],
    ['merge-insurance-policy', '保险保单多份合并：理赔时好找', ['PDF合并', '保单', '理赔'], ['pdf-merge'], 'tutorial'],
    ['compress-image-pdf', '图片型 PDF 怎么压缩：降分辨率', ['PDF压缩', '图片型PDF', '分辨率'], ['pdf-compress', 'pdf-to-images'], 'tutorial'],
    ['split-doc-front-page', '只留首页做预览：PDF 拆分技巧', ['PDF拆分', '首页', '预览'], ['pdf-split'], 'tutorial'],
    ['pdf-image-thumb', 'PDF 转缩略图：文档封面一目了然', ['PDF转图片', '缩略图', '封面'], ['pdf-to-images', 'image-resize'], 'tutorial'],
    ['images-pdf-whitebg', '白底产品图转 PDF：给客户看实物', ['图片转PDF', '白底图', '产品图'], ['images-to-pdf'], 'tutorial'],
    ['merge-inspection-report', '质检报告合并：溯源材料一份全', ['PDF合并', '质检报告', '溯源'], ['pdf-merge'], 'tutorial'],
    ['compress-archive-pdf', '历史文件压缩归档：省空间好迁移', ['PDF压缩', '归档', '空间'], ['pdf-compress'], 'tutorial'],
    ['split-packing-list', '装箱单 PDF 拆出当页：随货附上', ['PDF拆分', '装箱单', '随货'], ['pdf-split'], 'tutorial'],
    ['pdf-image-emblem', 'PDF 转图保留格式：排版不乱', ['PDF转图片', '排版', '格式'], ['pdf-to-images'], 'tutorial'],
    ['images-pdf-design-draft', '设计稿图转 PDF：发给印刷厂', ['图片转PDF', '设计稿', '印刷'], ['images-to-pdf'], 'tutorial'],
    ['merge-tax-record', '完税证明合并：报税材料归档', ['PDF合并', '完税', '报税'], ['pdf-merge'], 'tutorial'],
    ['compress-compressed', 'PDF 已经压过还能再压？', ['PDF压缩', '二次压缩', '极限'], ['pdf-compress'], 'review'],
    ['split-remove-blank', 'PDF 拆出并去掉空白页：打印省纸', ['PDF拆分', '空白页', '省纸'], ['pdf-split'], 'tutorial'],
    ['pdf-image-watermark-batch', '多页 PDF 转图批量加水印', ['PDF转图片', '批量水印', '多页'], ['pdf-to-images', 'image-watermark'], 'tutorial'],
    ['images-pdf-list-pack', '打包清单图转 PDF：发货核对', ['图片转PDF', '打包清单', '发货'], ['images-to-pdf'], 'tutorial'],
    ['merge-partnership-doc', '合作协议多份合并：谈判材料齐', ['PDF合并', '合作协议', '材料'], ['pdf-merge'], 'tutorial'],
    ['compress-quality-check', '压缩后 PDF 能看清吗？验收三看', ['PDF压缩', '质量', '验收'], ['pdf-compress'], 'review'],
    ['split-page-range', 'PDF 按页码范围拆分：1-10 页单独出', ['PDF拆分', '页码范围', '提取'], ['pdf-split'], 'tutorial'],
    ['pdf-image-long-screenshot', '长截图转 PDF：聊天记录存档', ['PDF转图片', '长截图', '存档'], ['pdf-to-images', 'images-to-pdf'], 'tutorial'],
    ['images-pdf-3d-render', '产品渲染图转 PDF：给客户看效果', ['图片转PDF', '渲染图', '客户'], ['images-to-pdf'], 'tutorial'],
  ],
  '跨境财务': [
    ['vat-reclaim-check', '欧盟 VAT 能退税吗？先看能否抵扣', ['VAT退税', '抵扣', '欧盟'], ['vat-calculator'], 'tutorial'],
    ['fba-size-tier', 'FBA 分仓与尺寸分段：费用差在哪', ['FBA费用', '尺寸分段', '分仓'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-value-declare', '申报货值怎么定：关税计算器里的门道', ['关税', '申报货值', '报关'], ['duty-estimator'], 'tutorial'],
    ['return-restock-loss', '退货重上架的成本：一单算清', ['退货成本', '重上架', '损耗'], ['return-cost-calculator'], 'tutorial'],
    ['multi-store-tax-fee', '多店铺费用分摊：利润报表更真实', ['多店铺', '费用分摊', '利润'], ['multi-store-profit'], 'tutorial'],
    ['currency-forward', '锁汇思路：结算前先算清汇率差', ['汇率', '结汇', '锁汇'], ['currency-converter'], 'tutorial'],
    ['profit-breakdown', '利润拆解：售价-成本-费用一条线', ['利润计算', '拆解', '定价'], ['profit-calculator'], 'tutorial'],
    ['vat-eu-country', '欧盟各国 VAT 税率不同：一表对照', ['VAT税率', '欧盟各国', '对照'], ['vat-calculator'], 'listicle'],
    ['fba-inbound-fee', 'FBA 入库费怎么算：发货前先估', ['FBA入库', '费用', '发货'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-hs-check', 'HS 编码查对：关税计算器的第一步', ['HS编码', '关税', '归类'], ['duty-estimator'], 'tutorial'],
    ['return-cause-profit', '退货原因与利润：哪个品类退货最伤', ['退货成本', '退货原因', '品类'], ['return-cost-calculator', 'profit-calculator'], 'tutorial'],
    ['multi-store-cny', '多店铺按人民币看总账：汇率统一', ['多店铺', '人民币', '总账'], ['multi-store-profit', 'currency-converter'], 'tutorial'],
    ['currency-invoice-currency', '发票币种选择：结算汇率不吃亏', ['汇率', '发票币种', '结算'], ['currency-converter'], 'tutorial'],
    ['profit-ad-budget', '广告预算占利润多少合适：比例法', ['利润', '广告预算', '比例'], ['profit-calculator'], 'tutorial'],
    ['vat-zero-rate', '零税率商品有哪些：别多交税', ['VAT', '零税率', '商品'], ['vat-calculator'], 'tutorial'],
    ['fba-monthly-fee', 'FBA 月度仓储费：按体积算钱', ['FBA仓储费', '月度', '体积'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-bonded', '保税仓模式：关税怎么省', ['关税', '保税仓', '省税'], ['duty-estimator'], 'tutorial'],
    ['return-refund-handling', '退货退款处理费：不止运费', ['退货成本', '退款', '处理费'], ['return-cost-calculator'], 'tutorial'],
    ['multi-store-ranking', '多店铺横向对比：哪家最赚钱', ['多店铺', '横向对比', '盈利'], ['multi-store-profit'], 'tutorial'],
    ['currency-mid-rate', '用中间价结算：避开买卖价差', ['汇率', '中间价', '结算'], ['currency-converter'], 'tutorial'],
    ['profit-warehouse-cost', '把仓储费算进成本：利润更真实', ['利润计算', '仓储费', '成本'], ['profit-calculator', 'fba-fee-estimator'], 'tutorial'],
    ['vat-invoice-number', 'VAT 发票号规则：欧盟开票要点', ['VAT发票', '发票号', '欧盟'], ['vat-calculator'], 'tutorial'],
    ['fba-longterm-fee', '长期仓储费预警：压货超 180 天', ['FBA长期仓储', '预警', '压货'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-sampling-rate', '查验概率与关税：被抽到怎么办', ['关税', '查验', '抽检'], ['duty-estimator'], 'tutorial'],
    ['return-eco-cost', '退货的隐性成本：物流+人工+再售', ['退货成本', '隐性成本', '再售'], ['return-cost-calculator'], 'tutorial'],
    ['multi-store-shared-inventory', '多店铺共享库存：利润怎么分', ['多店铺', '共享库存', '利润'], ['multi-store-profit'], 'tutorial'],
    ['currency-monthly-settle', '月结汇率统一：财务核算不打架', ['汇率', '月结', '核算'], ['currency-converter'], 'tutorial'],
    ['profit-bulk-margin', '批量算毛利：一键看全 SKU 利润', ['利润计算', '批量', '毛利'], ['profit-calculator'], 'tutorial'],
    ['vat-intra-eu', '欧盟内跨境销售：VAT 怎么交', ['VAT', '欧盟内', '跨境销售'], ['vat-calculator'], 'tutorial'],
    ['fba-removal-fee', '弃置/移除费：清库存也要算钱', ['FBA移除', '清库存', '费用'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-free-threshold', '各国免税额：小额包裹怎么报', ['关税', '免税额', '小包裹'], ['duty-estimator'], 'tutorial'],
    ['return-reverse-logistics', '逆向物流成本：退货到底花多少', ['退货成本', '逆向物流', '运费'], ['return-cost-calculator'], 'tutorial'],
    ['multi-store-export', '多店铺利润导出：报表带走看', ['多店铺', '导出', '报表'], ['multi-store-profit'], 'tutorial'],
    ['currency-forward-contract', '远期结汇：锁定汇率防波动', ['汇率', '远期结汇', '锁汇'], ['currency-converter'], 'tutorial'],
    ['profit-gross-net', '毛利与净利：别只看表面数字', ['利润计算', '毛利', '净利'], ['profit-calculator'], 'tutorial'],
    ['vat-registration-threshold', '各国 VAT 注册门槛：超了才要交', ['VAT注册', '门槛', '各国'], ['vat-calculator'], 'tutorial'],
    ['fba-split-case', '分箱发货省 FBA 费？算给你看', ['FBA费用', '分箱', '发货'], ['fba-fee-estimator'], 'tutorial'],
    ['duty-trade-agreement', '自贸协定税率：进口成本更低', ['关税', '自贸协定', '税率'], ['duty-estimator'], 'tutorial'],
    ['return-asin-level', '单 ASIN 退货率：低于多少才健康', ['退货率', 'ASIN', '健康线'], ['return-cost-calculator'], 'tutorial'],
    ['currency-pricing-zone', '按区域定价：汇率差怎么留利润', ['汇率', '区域定价', '利润'], ['currency-converter', 'profit-calculator'], 'tutorial'],
  ],
  'Listing 优化': [
    ['title-localize-japan', '日本站标题本地化：片假名与汉字规范', ['标题本地化', '日本站', '片假名'], ['title-localizer'], 'tutorial'],
    ['keyword-density-stuff', '关键词密度多少合适：别再堆砌', ['关键词密度', '堆砌', 'SEO'], ['keyword-analyzer', 'char-counter'], 'tutorial'],
    ['char-limit-fix', '标题超字数被截断？先数再写', ['字符数', '标题长度', '截断'], ['char-counter'], 'tutorial'],
    ['normalize-garbled', '文案复制变乱码？一键规范', ['文本规范化', '乱码', '复制'], ['text-normalizer'], 'tutorial'],
    ['bullet-feature-benefit', '五点描述先参数还是先利益：结构对比', ['五点描述', '利益', '结构'], ['bullet-generator'], 'review'],
    ['sensitive-claim-banned', '这些词一写就下架：违禁词红区', ['敏感词', '违禁词', '下架'], ['sensitive-word-check'], 'listicle'],
    ['abtest-sample-size', '标题 A/B 测试样本量：多少才可信', ['标题A/B', '样本量', '可信'], ['title-ab-test'], 'tutorial'],
    ['title-localize-france', '法国站标题本地化：大小写与重音', ['标题本地化', '法国站', '重音'], ['title-localizer'], 'tutorial'],
    ['density-by-platform', '关键词密度各平台标准不同', ['关键词密度', '平台标准', 'SEO'], ['keyword-analyzer'], 'tutorial'],
    ['char-emoji-count', '表情符号占字数吗：计数规则', ['字符数', '表情', '计数'], ['char-counter'], 'tutorial'],
    ['normalize-quote', '中文引号英文引号统一：排版规范', ['文本规范化', '引号', '排版'], ['text-normalizer'], 'tutorial'],
    ['bullet-mobile-read', '五点描述移动端阅读：短句优先', ['五点描述', '移动端', '短句'], ['bullet-generator', 'char-counter'], 'tutorial'],
    ['sensitive-region-words', '不同站点敏感词不同：分站自查', ['敏感词', '分站点', '自查'], ['sensitive-word-check'], 'tutorial'],
    ['abtest-click-rate', '标题 A/B 看点击率还是转化率', ['标题A/B', '点击率', '转化率'], ['title-ab-test'], 'tutorial'],
    ['title-localize-arabic', '中东站标题本地化：右对齐与措辞', ['标题本地化', '中东站', '阿拉伯语'], ['title-localizer'], 'tutorial'],
    ['density-tool-explained', '关键词密度分析原理：别迷信数字', ['关键词密度', '原理', '工具'], ['keyword-analyzer'], 'review'],
    ['char-search-ads', '搜索广告标题字数：预算内最大化', ['字符数', '搜索广告', '标题'], ['char-counter'], 'tutorial'],
    ['normalize-linebreak', '复制文案段落错乱？统一换行', ['文本规范化', '换行', '段落'], ['text-normalizer'], 'tutorial'],
    ['bullet-3-lines', '五点描述三行原则：信息密度', ['五点描述', '三行', '信息密度'], ['bullet-generator'], 'tutorial'],
    ['sensitive-food-health', '食品保健类目：绝对化用语红线', ['敏感词', '食品保健', '绝对化'], ['sensitive-word-check'], 'tutorial'],
    ['abtest-tool-guide', '标题 A/B 测试工具实操：留痕对比', ['标题A/B', '实操', '留痕'], ['title-ab-test'], 'tutorial'],
    ['title-localize-brazil', '巴西站标题本地化：葡萄牙语习惯', ['标题本地化', '巴西站', '葡萄牙语'], ['title-localizer'], 'tutorial'],
    ['density-synonym', '同义词稀释关键词：密度新玩法', ['关键词密度', '同义词', '稀释'], ['keyword-analyzer'], 'tutorial'],
    ['char-html-count', '带 HTML 的文案字数怎么数', ['字符数', 'HTML', '计数'], ['char-counter'], 'tutorial'],
    ['normalize-bilingual', '中英混排规范化：空格与标点', ['文本规范化', '中英混排', '标点'], ['text-normalizer'], 'tutorial'],
    ['bullet-review-mining', '从评论挖卖点写五点：数据驱动', ['五点描述', '评论挖掘', '卖点'], ['bullet-generator', 'keyword-analyzer'], 'tutorial'],
    ['sensitive-environment', '环保类目敏感词：绿色声明要谨慎', ['敏感词', '环保', '绿色声明'], ['sensitive-word-check'], 'tutorial'],
    ['abtest-two-variant', '标题 A/B 两版就够：别多版本内耗', ['标题A/B', '双版本', '测试'], ['title-ab-test'], 'tutorial'],
    ['title-localize-korea', '韩国站标题本地化：关键词靠前', ['标题本地化', '韩国站', '关键词'], ['title-localizer'], 'tutorial'],
    ['density-head-5', '标题前 5 个词最关键：密度分布', ['关键词密度', '标题前置', '分布'], ['keyword-analyzer'], 'tutorial'],
    ['char-ask-seller', '问大家/QA 字数：简洁回答', ['字符数', 'QA', '简洁'], ['char-counter'], 'tutorial'],
    ['normalize-currency', '价格文案规范化：货币符号统一', ['文本规范化', '货币', '统一'], ['text-normalizer'], 'tutorial'],
    ['bullet-why-buy', '五点描述回答为什么买：转化逻辑', ['五点描述', '为什么买', '转化'], ['bullet-generator'], 'tutorial'],
    ['sensitive-country-list', '敏感词清单：多国对照自查表', ['敏感词', '多国', '清单'], ['sensitive-word-check'], 'listicle'],
    ['abtest-avoid-noise', '标题测试排除干扰：流量稳定期再测', ['标题A/B', '干扰', '流量'], ['title-ab-test'], 'tutorial'],
    ['title-localize-se', '东南亚站标题本地化：本地用语', ['标题本地化', '东南亚', '本地用语'], ['title-localizer'], 'tutorial'],
    ['density-compare-competitor', '关键词密度对比竞品：找到差异', ['关键词密度', '竞品', '对比'], ['keyword-analyzer', 'title-ab-test'], 'review'],
    ['char-sku-char', 'SKU 命名长度：字符上限与规范', ['字符数', 'SKU', '规范'], ['char-counter'], 'tutorial'],
    ['normalize-typo', '文案错别字批量检查：规范工具', ['文本规范化', '错别字', '检查'], ['text-normalizer'], 'tutorial'],
    ['bullet-image-callout', '五点描述配图点：图文呼应', ['五点描述', '配图', '呼应'], ['bullet-generator'], 'tutorial'],
  ],
  '账号安全': [
    ['jwt-payload-read', 'JWT 里藏了什么：payload 解析', ['JWT', 'payload', '解析'], ['jwt-decoder', 'json-formatter'], 'tutorial'],
    ['password-store-rules', '店铺密码分级：主号子号不同口令', ['密码生成', '分级', '口令'], ['password-generator'], 'tutorial'],
    ['json-feed-validate', 'feed 文件先 JSON 校验：少返工', ['JSON校验', 'feed', '验证'], ['json-validator', 'json-formatter'], 'tutorial'],
    ['json-convert-csv', 'JSON 转 CSV：报表打开不费劲', ['JSON转换', 'CSV', '报表'], ['json-convert'], 'tutorial'],
    ['url-encode-utm', 'UTM 链接参数：URL 编码避坑', ['URL编码', 'UTM', '跟踪'], ['url-codec'], 'tutorial'],
    ['qr-wifi-share', '办公室 WiFi 二维码：访客免输密码', ['二维码', 'WiFi', '共享'], ['qr-code'], 'tutorial'],
    ['hash-checksum', '哈希校验下载文件：改没改一目了然', ['哈希', '校验', '文件'], ['hash-generator'], 'tutorial'],
    ['timestamp-export', '平台导出时间戳：转本地时间看', ['时间戳', '导出', '本地时间'], ['timestamp-convert'], 'tutorial'],
    ['barcode-msku', '自有 MSKU 条码：仓库扫码管理', ['条码', 'MSKU', '仓库'], ['barcode-generator'], 'tutorial'],
    ['html-entity-title', '标题里的小数点/商标符：HTML 实体', ['HTML实体', '特殊字符', '标题'], ['html-entity'], 'tutorial'],
    ['jwt-token-refresh', 'JWT 过期刷新机制：401 自救', ['JWT', '刷新', '401'], ['jwt-decoder'], 'tutorial'],
    ['password-avoid-birthday', '别用生日做密码：暴力破解第一目标', ['密码生成', '弱密码', '安全'], ['password-generator'], 'tutorial'],
    ['json-pretty-log', '接口日志 JSON 美化：排查更快', ['JSON格式化', '日志', '排查'], ['json-formatter'], 'tutorial'],
    ['json-validate-bracket', 'JSON 括号配对：常见语法错误', ['JSON校验', '括号', '语法'], ['json-validator'], 'tutorial'],
    ['json-convert-yaml', '配置 YAML 转 JSON：跨工具搬运', ['JSON转换', 'YAML', '配置'], ['json-convert'], 'tutorial'],
    ['url-encode-decode', 'URL 编解码互转：参数安全', ['URL编码', '解码', '参数'], ['url-codec'], 'tutorial'],
    ['qr-track-package', '包裹二维码：买家扫码查物流', ['二维码', '物流', '扫码'], ['qr-code'], 'tutorial'],
    ['hash-sha256', 'SHA-256 哈希：安全与速度', ['哈希', 'SHA256', '安全'], ['hash-generator'], 'tutorial'],
    ['timestamp-10-13', '10 位 13 位时间戳：别搞混', ['时间戳', '10位', '13位'], ['timestamp-convert'], 'tutorial'],
    ['barcode-ean', 'EAN 条码生成：出口商品码', ['条码', 'EAN', '出口'], ['barcode-generator'], 'tutorial'],
    ['html-entity-desc', '描述里 & 符号：转义才不会丢', ['HTML实体', '描述', '转义'], ['html-entity', 'text-normalizer'], 'tutorial'],
    ['jwt-signature', 'JWT 签名验证：防篡改原理', ['JWT', '签名', '防篡改'], ['jwt-decoder'], 'tutorial'],
    ['password-password-manager', '密码管理器：店铺多账号救星', ['密码生成', '密码管理器', '多账号'], ['password-generator'], 'tutorial'],
    ['json-error-message', 'JSON 报错信息解读：常见错误码', ['JSON校验', '错误信息', '解读'], ['json-validator'], 'tutorial'],
    ['json-convert-array', 'JSON 数组与对象：转换不丢结构', ['JSON转换', '数组', '对象'], ['json-convert'], 'tutorial'],
    ['url-encode-cn', '中文参数 URL 编码：分享不断链', ['URL编码', '中文', '分享'], ['url-codec'], 'tutorial'],
    ['qr-wechat-contact', '供应商微信二维码：名片化', ['二维码', '微信', '名片'], ['qr-code'], 'tutorial'],
    ['hash-file-hash', '文件哈希一致性：对账防篡改', ['哈希', '文件', '对账'], ['hash-generator'], 'tutorial'],
    ['timestamp-format', '时间戳格式化：显示更友好', ['时间戳', '格式化', '显示'], ['timestamp-convert'], 'tutorial'],
    ['barcode-print-labels', '条码打印标签：热敏纸也能用', ['条码', '打印', '标签'], ['barcode-generator'], 'tutorial'],
    ['html-entity-nbsp', '不断行空格等实体：排版细节', ['HTML实体', '空格', '排版'], ['html-entity'], 'tutorial'],
    ['jwt-header-algo', 'JWT header 算法：安全性影响', ['JWT', 'header', '算法'], ['jwt-decoder'], 'tutorial'],
    ['password-rotation', '定期换密码：多久换一次合理', ['密码生成', '轮换', '周期'], ['password-generator'], 'tutorial'],
    ['json-nested', '嵌套 JSON 分层看：结构清晰', ['JSON格式化', '嵌套', '分层'], ['json-formatter'], 'tutorial'],
    ['json-validate-bom', '带 BOM 的 JSON 报错：编码坑', ['JSON校验', 'BOM', '编码'], ['json-validator'], 'tutorial'],
    ['json-convert-xml', 'XML 与 JSON 互转：对接老系统', ['JSON转换', 'XML', '对接'], ['json-convert'], 'tutorial'],
    ['url-encode-space', '空格在 URL 里：编码成 %20', ['URL编码', '空格', '%20'], ['url-codec'], 'tutorial'],
    ['qr-return-page', '退货页面二维码：售后入口', ['二维码', '退货', '售后'], ['qr-code'], 'tutorial'],
    ['hash-mac', 'MAC 地址/密码哈希：别存明文', ['哈希', '密码', '明文'], ['hash-generator'], 'tutorial'],
    ['timestamp-timezone', '时间戳与时区：全球订单不错乱', ['时间戳', '时区', '订单'], ['timestamp-convert'], 'tutorial'],
  ],
  '音视频': [
    ['audio-mp3-size', '播客 MP3 体积太大？转换时降码率', ['音频转换', 'MP3', '体积'], ['audio-convert'], 'tutorial'],
    ['audio-trim-breath', '录音有呼吸声？裁剪掉空隙', ['音频裁剪', '呼吸声', '口播'], ['audio-trim'], 'tutorial'],
    ['extract-vocal', '分离人声：视频里的配音单独拿', ['音频提取', '人声', '配音'], ['video-extract-audio'], 'tutorial'],
    ['wav-m4a-choice', 'WAV 还是 M4A：录音格式怎么选', ['音频格式', 'WAV', 'M4A'], ['audio-convert'], 'review'],
    ['audio-trim-100ms', '音效精确到 0.1 秒：裁剪精度', ['音频裁剪', '精度', '音效'], ['audio-trim'], 'tutorial'],
    ['extract-bgm', '视频里的 BGM 单独提取：做素材', ['音频提取', 'BGM', '素材'], ['video-extract-audio', 'audio-convert'], 'tutorial'],
    ['m4a-lossless', 'M4A 转无损？格式与音质关系', ['音频格式', 'M4A', '无损'], ['audio-convert'], 'review'],
    ['audio-trim-fade', '音频裁剪加淡入淡出：衔接自然', ['音频裁剪', '淡入淡出', '衔接'], ['audio-trim'], 'tutorial'],
    ['extract-interview', '采访视频转音频：整理纪要更快', ['音频提取', '采访', '纪要'], ['video-extract-audio', 'audio-trim'], 'tutorial'],
    ['batch-audio-normalize', '批量音频统一格式：素材库规范', ['音频转换', '批量', '素材库'], ['audio-convert'], 'tutorial'],
    ['audio-mp3-broadcast', '口播剪辑成 MP3：多平台分发', ['音频转换', '口播', '分发'], ['audio-convert'], 'tutorial'],
    ['audio-trim-remove-tick', '音频去杂音：裁剪掉点击声', ['音频裁剪', '杂音', '点击声'], ['audio-trim'], 'tutorial'],
    ['extract-sound-fx', '视频音效提取：复用做产品提示音', ['音频提取', '音效', '复用'], ['video-extract-audio'], 'tutorial'],
    ['aac-compat', 'AAC 兼容性：苹果生态音频', ['音频格式', 'AAC', '兼容'], ['audio-convert'], 'tutorial'],
    ['audio-trim-loop-point', 'BGM 循环点选择：无缝循环', ['音频裁剪', '循环点', 'BGM'], ['audio-trim'], 'tutorial'],
    ['extract-multiple', '一段视频提取多段音频：切分', ['音频提取', '多段', '切分'], ['video-extract-audio', 'audio-trim'], 'tutorial'],
    ['audio-quality-tier', '音频码率档位：体积与音质平衡', ['音频格式', '码率', '音质'], ['audio-convert'], 'tutorial'],
    ['audio-trim-silence-start', '开头静音去掉：一开口就进正题', ['音频裁剪', '静音', '开头'], ['audio-trim'], 'tutorial'],
    ['extract-voiceover', '提取旁白音频：重配音用', ['音频提取', '旁白', '重配'], ['video-extract-audio'], 'tutorial'],
    ['batch-folder-audio', '文件夹音频批量转换：一步到位', ['音频转换', '文件夹', '批量'], ['audio-convert'], 'tutorial'],
    ['audio-call-record', '客服录音转通用格式：归档', ['音频转换', '客服录音', '归档'], ['audio-convert'], 'tutorial'],
    ['audio-trim-remove-end', '结尾多余空白裁剪：干净收尾', ['音频裁剪', '结尾', '空白'], ['audio-trim'], 'tutorial'],
    ['extract-product-sound', '产品视频提取演示音：做教程', ['音频提取', '演示音', '教程'], ['video-extract-audio'], 'tutorial'],
    ['opus-web', 'Opus 格式：网页音频新标准', ['音频格式', 'Opus', '网页'], ['audio-convert'], 'review'],
    ['audio-trim-segment', '音频按句切段：字幕对齐', ['音频裁剪', '切段', '字幕'], ['audio-trim'], 'tutorial'],
    ['extract-track', '视频多音轨提取：选哪条', ['音频提取', '音轨', '选择'], ['video-extract-audio'], 'tutorial'],
    ['audio-bitrate-size', '音频比特率与文件大小对照', ['音频格式', '比特率', '大小'], ['audio-convert'], 'tutorial'],
    ['audio-trim-preview', '裁剪前先试听：别瞎切', ['音频裁剪', '试听', '预览'], ['audio-trim'], 'tutorial'],
    ['extract-whatsapp', '视频转音频发语音：不占视频流量', ['音频提取', '语音', '分享'], ['video-extract-audio', 'audio-convert'], 'tutorial'],
    ['batch-rename-audio', '音频批量转格式并命名：素材管理', ['音频转换', '批量', '命名'], ['audio-convert'], 'tutorial'],
    ['audio-mono-stereo', '单声道转立体声？适用场景', ['音频格式', '单声道', '立体声'], ['audio-convert'], 'review'],
    ['audio-trim-intro-3s', '口播前 3 秒黄金期：裁剪开场', ['音频裁剪', '开场', '3秒'], ['audio-trim'], 'tutorial'],
    ['extract-meeting', '会议录像转音频：重点回听', ['音频提取', '会议', '回听'], ['video-extract-audio'], 'tutorial'],
    ['audio-format-sort', '音频格式大全：该用哪个', ['音频格式', '大全', '选择'], ['audio-convert'], 'listicle'],
    ['audio-trim-merge-check', '裁剪后再接其他音轨：检查衔接', ['音频裁剪', '拼接', '衔接'], ['audio-trim'], 'tutorial'],
    ['extract-music-title', '提取配乐判断版权：别乱用', ['音频提取', '配乐', '版权'], ['video-extract-audio'], 'tutorial'],
    ['audio-small-cap', '音频太大传不上？转格式缩小', ['音频转换', '体积', '传输'], ['audio-convert'], 'tutorial'],
    ['audio-trim-region', '裁剪指定区域：只留中间段', ['音频裁剪', '区域', '中间段'], ['audio-trim'], 'tutorial'],
    ['extract-podcast', '播客视频转音频：随身听', ['音频提取', '播客', '随身'], ['video-extract-audio'], 'tutorial'],
    ['batch-quality-sort', '批量音频统一音质：团队协作', ['音频转换', '音质', '统一'], ['audio-convert'], 'tutorial'],
  ],
  '运营效率': [
    ['rename-workflow', '批量改名工作流：从素材到上架一条龙', ['批量改名', '工作流', '素材'], ['image-batch-rename'], 'tutorial'],
    ['normalize-batch-copy', '批量文案规范化：多店铺统一', ['文本规范化', '批量', '多店铺'], ['text-normalizer'], 'tutorial'],
    ['char-budget-plan', '字符预算规划：标题+描述不超限', ['字符数', '预算', '规划'], ['char-counter'], 'tutorial'],
    ['barcode-inventory', '条码库存管理：扫码盘点', ['条码', '库存', '盘点'], ['barcode-generator'], 'tutorial'],
    ['resize-batch-assets', '多店铺素材批量缩放：一套图通用', ['图片缩放', '批量', '多店铺'], ['image-resize'], 'tutorial'],
    ['size-report-audit', '素材体积月度体检：定期瘦身', ['图片体积', '体检', '月度'], ['image-size-report'], 'tutorial'],
    ['qr-multi-link', '一个码多个链接？二维码玩法', ['二维码', '多链接', '玩法'], ['qr-code'], 'tutorial'],
    ['timestamp-schedule', '跨时区排期：时间戳换算不误事', ['时间戳', '排期', '时区'], ['timestamp-convert'], 'tutorial'],
    ['hash-file-dedup', '文件去重：哈希判断重复素材', ['哈希', '去重', '素材'], ['hash-generator'], 'tutorial'],
    ['localize-brand-sheet', '品牌词翻译对照表：团队共享', ['标题本地化', '品牌词', '对照表'], ['title-localizer', 'text-normalizer'], 'tutorial'],
    ['rename-numbering', '批量加序号命名：顺序永不乱', ['批量改名', '序号', '命名'], ['image-batch-rename'], 'tutorial'],
    ['normalize-spreadsheet', '从表格复制文案规范化：去格式', ['文本规范化', '表格', '去格式'], ['text-normalizer'], 'tutorial'],
    ['char-sms-limit', '短信字数限制：营销短信合规', ['字符数', '短信', '限制'], ['char-counter'], 'tutorial'],
    ['barcode-shelf', '货架条码标签：拣货效率', ['条码', '货架', '拣货'], ['barcode-generator'], 'tutorial'],
    ['resize-social-set', '社交图一套五尺寸：批量出', ['图片缩放', '社交', '多尺寸'], ['image-resize'], 'tutorial'],
    ['size-report-priority', '先压哪些图：体积报表排优先级', ['图片体积', '优先级', '压缩'], ['image-size-report'], 'tutorial'],
    ['qr-product-manual', '说明书放二维码：扫码看视频教程', ['二维码', '说明书', '教程'], ['qr-code'], 'tutorial'],
    ['timestamp-reminder', '定时提醒用时间戳：跨平台', ['时间戳', '提醒', '跨平台'], ['timestamp-convert'], 'tutorial'],
    ['hash-version-check', '版本文件哈希：确认发的是新版', ['哈希', '版本', '确认'], ['hash-generator'], 'tutorial'],
    ['localize-faq', 'FAQ 多语言本地化：客服提效', ['标题本地化', 'FAQ', '客服'], ['title-localizer'], 'tutorial'],
    ['rename-prefix-campaign', '活动素材批量加前缀：归档清晰', ['批量改名', '前缀', '活动'], ['image-batch-rename'], 'tutorial'],
    ['normalize-email-copy', '邮件文案规范化：客户体验', ['文本规范化', '邮件', '文案'], ['text-normalizer'], 'tutorial'],
    ['char-hashtag', '社媒话题标签字数：算法匹配', ['字符数', '话题', '标签'], ['char-counter'], 'tutorial'],
    ['barcode-packaging', '包装条码规范：物流识别', ['条码', '包装', '物流'], ['barcode-generator'], 'tutorial'],
    ['resize-watermark-set', '批量缩放再加水印：一套流程', ['图片缩放', '水印', '流程'], ['image-resize', 'image-watermark'], 'tutorial'],
    ['size-report-sku', '按 SKU 看图片体积：定位问题', ['图片体积', 'SKU', '定位'], ['image-size-report'], 'tutorial'],
    ['qr-review-guide', '评价引导二维码：售后卡设计', ['二维码', '评价', '引导'], ['qr-code'], 'tutorial'],
    ['timestamp-report-cutoff', '报表截止时间戳：结算对齐', ['时间戳', '报表', '截止'], ['timestamp-convert'], 'tutorial'],
    ['hash-backup-check', '备份完整性哈希：恢复无忧', ['哈希', '备份', '完整性'], ['hash-generator'], 'tutorial'],
    ['localize-ad-copy', '广告语本地化：避免翻译事故', ['标题本地化', '广告语', '本地化'], ['title-localizer'], 'tutorial'],
    ['rename-clean-special', '文件名特殊字符清理：跨平台兼容', ['批量改名', '特殊字符', '兼容'], ['image-batch-rename'], 'tutorial'],
    ['normalize-price-list', '价格表规范化：千分位统一', ['文本规范化', '价格表', '千分位'], ['text-normalizer'], 'tutorial'],
    ['char-product-name', '产品名长度规范：各平台上限', ['字符数', '产品名', '规范'], ['char-counter'], 'tutorial'],
    ['barcode-ean13', 'EAN-13 校验位：条码正确性', ['条码', 'EAN13', '校验'], ['barcode-generator'], 'tutorial'],
    ['resize-batch-webp', '图片批量转 WebP：全站提速', ['图片缩放', 'WebP', '提速'], ['image-resize', 'image-convert'], 'tutorial'],
    ['size-report-opt-checklist', '图片优化清单：体积体检表', ['图片体积', '优化', '清单'], ['image-size-report'], 'listicle'],
    ['qr-login-quick', '扫码登录办公系统：提效', ['二维码', '登录', '办公'], ['qr-code'], 'tutorial'],
    ['timestamp-import-export', '导入导出时间戳：系统对接', ['时间戳', '导入导出', '对接'], ['timestamp-convert'], 'tutorial'],
    ['hash-sync-check', '同步文件哈希：多端一致', ['哈希', '同步', '一致'], ['hash-generator'], 'tutorial'],
    ['localize-title-ladder', '标题本地化分级：核心市场优先', ['标题本地化', '分级', '市场'], ['title-localizer'], 'tutorial'],
  ],
  '隐私合规': [
    ['zero-upload-why', '为什么零上传更重要：数据主权', ['零上传', '数据主权', '隐私'], ['exif-cleaner'], 'tutorial'],
    ['exif-staff-device', '员工手机照片带 EXIF：信息泄露', ['EXIF', '员工', '泄露'], ['exif-cleaner'], 'tutorial'],
    ['blind-watermark-partner', '给合作方素材加隐形水印：防转卖', ['隐形水印', '合作方', '防转卖'], ['image-blind-watermark'], 'tutorial'],
    ['compress-local-only', '本地压缩不联网：素材不出门', ['图片压缩', '本地处理', '不联网'], ['image-compress'], 'tutorial'],
    ['password-breach', '密码泄露怎么办：立即改+加2FA', ['密码生成', '泄露', '2FA'], ['password-generator'], 'tutorial'],
    ['hash-privacy-file', '传文件前算哈希：防篡改留证', ['哈希', '文件', '防篡改'], ['hash-generator'], 'tutorial'],
    ['json-minimize-data', 'JSON 数据最小化：只传必要字段', ['JSON格式化', '数据最小化', '合规'], ['json-formatter'], 'tutorial'],
    ['jwt-token-expire', 'Token 过期即失效：别留长期凭据', ['JWT', '过期', '凭据'], ['jwt-decoder'], 'tutorial'],
    ['exif-gps-off', '拍照关掉 GPS：源头防泄露', ['EXIF', 'GPS', '关闭'], ['exif-cleaner'], 'tutorial'],
    ['blind-watermark-leak', '素材泄露后靠水印溯源：流程', ['隐形水印', '泄露', '溯源'], ['image-blind-watermark'], 'tutorial'],
    ['watermark-public', '公开宣传图加水印：防滥用', ['批量水印', '宣传图', '防滥用'], ['image-watermark'], 'tutorial'],
    ['pdf-slim-privacy', 'PDF 压缩本地做：敏感文件不出网', ['PDF压缩', '本地', '敏感文件'], ['pdf-compress'], 'tutorial'],
    ['password-shared-account', '共用账号怎么管：子账号+权限', ['密码生成', '共用账号', '权限'], ['password-generator'], 'tutorial'],
    ['hash-consignment', '代发货对账哈希：防掉包', ['哈希', '代发货', '对账'], ['hash-generator'], 'tutorial'],
    ['json-api-key', 'API 响应里的密钥：别留日志', ['JSON格式化', 'API密钥', '日志'], ['json-formatter'], 'tutorial'],
    ['jwt-public-info', 'JWT 别放敏感信息：明文可见', ['JWT', '敏感信息', '明文'], ['jwt-decoder'], 'tutorial'],
    ['exif-batch-clean', '批量清 EXIF：上架前全清一遍', ['EXIF', '批量', '清除'], ['exif-cleaner'], 'tutorial'],
    ['blind-watermark-vendor', '供应商素材盲水印：质量溯源', ['隐形水印', '供应商', '溯源'], ['image-blind-watermark'], 'tutorial'],
    ['compress-without-upload', '压缩工具选本地：不传云端', ['图片压缩', '本地', '不上传'], ['image-compress'], 'tutorial'],
    ['password-master-key', '主密钥管理：一个入口管所有', ['密码生成', '主密钥', '管理'], ['password-generator'], 'tutorial'],
    ['hash-download-verify', '下载的素材先哈希验证：安全', ['哈希', '下载', '验证'], ['hash-generator'], 'tutorial'],
    ['json-log-masking', '日志脱敏：手机号邮箱打码', ['JSON格式化', '脱敏', '日志'], ['json-formatter'], 'tutorial'],
    ['timestamp-audit-log', '审计日志时间戳：合规留痕', ['时间戳', '审计', '留痕'], ['timestamp-convert'], 'tutorial'],
    ['exif-contract-photo', '合同拍照带 EXIF：位置泄露', ['EXIF', '合同', '位置'], ['exif-cleaner'], 'tutorial'],
    ['blind-watermark-dpi', '盲水印抗截图：清晰度损失', ['隐形水印', '抗截图', '清晰度'], ['image-blind-watermark'], 'review'],
    ['watermark-batch-legal', '批量水印做版权声明：全覆盖', ['批量水印', '版权', '全覆盖'], ['image-watermark'], 'tutorial'],
    ['pdf-encrypt-local', 'PDF 本地处理：加密文件不出网', ['PDF压缩', '加密', '本地'], ['pdf-compress'], 'tutorial'],
    ['password-rotate-schedule', '密码轮换表：季度一换', ['密码生成', '轮换', '排期'], ['password-generator'], 'tutorial'],
    ['hash-integrity-supplier', '供应商文件哈希对账：完整性', ['哈希', '供应商', '完整性'], ['hash-generator'], 'tutorial'],
    ['json-data-subject', '用户数据最小化：只留订单必需', ['JSON格式化', '数据最小化', '订单'], ['json-formatter'], 'tutorial'],
    ['jwt-revoke', 'Token 吊销：离职员工立刻失效', ['JWT', '吊销', '离职'], ['jwt-decoder'], 'tutorial'],
    ['exif-resale', '转售电子产品前清 EXIF：隐私', ['EXIF', '转售', '隐私'], ['exif-cleaner'], 'tutorial'],
    ['blind-watermark-proof', '隐形水印做创作证明：时间线', ['隐形水印', '创作证明', '时间线'], ['image-blind-watermark'], 'tutorial'],
    ['compress-cache-clean', '本地工具用完清缓存：不留残件', ['图片压缩', '缓存', '清理'], ['image-compress'], 'tutorial'],
    ['password-phishing', '钓鱼邮件识别：别在链接里输密码', ['密码生成', '钓鱼', '识别'], ['password-generator'], 'tutorial'],
    ['hash-cryptographic', '哈希与加密的区别：别混用', ['哈希', '加密', '区别'], ['hash-generator'], 'review'],
    ['json-consent-data', '用户同意与数据：合规收集', ['JSON格式化', '用户同意', '合规'], ['json-formatter'], 'tutorial'],
    ['timestamp-retention', '日志保留期限：按合规要求', ['时间戳', '日志保留', '合规'], ['timestamp-convert'], 'tutorial'],
    ['exif-smartphone', '手机照片默认带 EXIF：记得关', ['EXIF', '手机', '默认'], ['exif-cleaner'], 'tutorial'],
    ['privacy-check-tool', '隐私自查用本地工具：不留痕', ['零上传', '自查', '工具'], ['exif-cleaner', 'image-compress'], 'listicle'],
  ],
  '选品数据': [
    ['keyword-volume-niche', '关键词搜索量看细分：小词大机会', ['关键词分析', '搜索量', '细分'], ['keyword-analyzer'], 'tutorial'],
    ['profit-sku-filter', '利润过滤选品：不赚钱直接排除', ['利润计算', '选品', '过滤'], ['profit-calculator'], 'tutorial'],
    ['multi-store-which', '同款多平台：数据告诉你主推哪个', ['多店铺', '选品', '主推'], ['multi-store-profit'], 'tutorial'],
    ['image-health-conversion', '图片质量与转化：数据关联', ['图片体积', '转化率', '关联'], ['image-size-report'], 'tutorial'],
    ['timestamp-trend', '搜索趋势时间点：什么时候布局', ['时间戳', '趋势', '布局'], ['timestamp-convert', 'keyword-analyzer'], 'tutorial'],
    ['currency-cost-quote', '采购报价换算：人民币到美元成本', ['汇率', '采购', '成本'], ['currency-converter'], 'tutorial'],
    ['char-title-seo', '标题字符与收录：SEO 友好度', ['字符数', '标题', 'SEO'], ['char-counter'], 'tutorial'],
    ['fba-margin-entry', 'FBA 费用进利润：选品算全账', ['FBA费用', '利润', '选品'], ['fba-fee-estimator', 'profit-calculator'], 'tutorial'],
    ['keyword-season', '季节性关键词：提前 2 个月布局', ['关键词分析', '季节性', '布局'], ['keyword-analyzer'], 'tutorial'],
    ['profit-batch-review', '一批选品批量算利润：横向比较', ['利润计算', '批量', '比较'], ['profit-calculator'], 'tutorial'],
    ['multi-store-percent', '店铺占比分析：集中还是分散', ['多店铺', '占比', '分析'], ['multi-store-profit'], 'tutorial'],
    ['image-size-compress-for-seo', '图片压缩保 SEO：不拖慢页面', ['图片体积', '压缩', 'SEO'], ['image-size-report', 'image-compress'], 'tutorial'],
    ['timestamp-order-peak', '订单峰值时间：补货备货依据', ['时间戳', '订单峰值', '补货'], ['timestamp-convert'], 'tutorial'],
    ['currency-budget', '采购预算汇率锁定：成本可控', ['汇率', '预算', '成本'], ['currency-converter'], 'tutorial'],
    ['char-listing-check', 'Listing 字数体检：合规又完整', ['字符数', 'Listing', '体检'], ['char-counter'], 'tutorial'],
    ['fba-storage-plan', '按 FBA 仓储费规划：先进先出', ['FBA费用', '仓储', '规划'], ['fba-fee-estimator'], 'tutorial'],
    ['keyword-long-tail-batch', '长尾词批量挖掘：小流量大转化', ['关键词分析', '长尾词', '批量'], ['keyword-analyzer'], 'tutorial'],
    ['profit-fixed-cost', '固定成本摊薄：销量越大越赚', ['利润计算', '固定成本', '摊薄'], ['profit-calculator'], 'tutorial'],
    ['multi-store-synergy', '多店铺协同选品：互相导流', ['多店铺', '协同', '选品'], ['multi-store-profit'], 'tutorial'],
    ['image-blur-check', '图片清晰度体检：模糊图伤转化', ['图片体积', '清晰度', '转化'], ['image-size-report'], 'tutorial'],
    ['timestamp-campaign', '大促时间戳日历：全球同时开卖', ['时间戳', '大促', '日历'], ['timestamp-convert'], 'tutorial'],
    ['currency-profit-mix', '多币种利润混合：统一核算', ['汇率', '利润', '核算'], ['currency-converter', 'multi-store-profit'], 'tutorial'],
    ['char-title-competitive', '标题字数竞品对比：取长补短', ['字符数', '竞品', '对比'], ['char-counter', 'keyword-analyzer'], 'tutorial'],
    ['fba-size-price', 'FBA 尺寸段定价：体积影响利润', ['FBA费用', '尺寸段', '定价'], ['fba-fee-estimator', 'profit-calculator'], 'tutorial'],
    ['keyword-ladder', '关键词梯队：核心+长尾+场景', ['关键词分析', '梯队', '布局'], ['keyword-analyzer'], 'tutorial'],
    ['profit-break-even-qty', '保本销量：要卖多少才回本', ['利润计算', '保本销量', '回本'], ['profit-calculator'], 'tutorial'],
    ['multi-store-inventory-split', '多店铺库存分配：数据说话', ['多店铺', '库存', '分配'], ['multi-store-profit'], 'tutorial'],
    ['image-webp-seo', 'WebP 图片 SEO：加载快排名好', ['图片体积', 'WebP', 'SEO'], ['image-size-report', 'image-convert'], 'tutorial'],
    ['timestamp-keyword-hour', '关键词热度小时级：投放时机', ['时间戳', '关键词', '时段'], ['timestamp-convert', 'keyword-analyzer'], 'tutorial'],
    ['currency-pricing-anchor', '锚定定价：汇率换算定价策略', ['汇率', '定价', '锚定'], ['currency-converter', 'profit-calculator'], 'tutorial'],
    ['char-count-review', '评论字数分析：买家关注点', ['字符数', '评论', '分析'], ['char-counter', 'keyword-analyzer'], 'tutorial'],
    ['fba-return-rate-plan', '退货率进选品模型：风险对冲', ['FBA费用', '退货率', '风险'], ['fba-fee-estimator', 'return-cost-calculator'], 'tutorial'],
    ['keyword-gap', '关键词空白地带：竞品没做你来做', ['关键词分析', '空白', '机会'], ['keyword-analyzer'], 'tutorial'],
    ['profit-sensitivity', '利润敏感性分析：价格波动影响', ['利润计算', '敏感性', '价格'], ['profit-calculator'], 'tutorial'],
    ['multi-store-roi', '多店铺 ROI 对比：投流给谁', ['多店铺', 'ROI', '投流'], ['multi-store-profit'], 'tutorial'],
    ['image-size-mobile-seo', '移动端图片大小：SEO 加分项', ['图片体积', '移动端', 'SEO'], ['image-size-report', 'image-compress'], 'tutorial'],
    ['timestamp-crawl-time', '爬虫抓取时间：发布时机', ['时间戳', '抓取', '时机'], ['timestamp-convert'], 'tutorial'],
    ['currency-cost-plus', '成本加成定价：汇率差吃掉利润', ['汇率', '成本加成', '定价'], ['currency-converter', 'profit-calculator'], 'tutorial'],
    ['char-sku-optimize', 'SKU 字符优化：搜索友好', ['字符数', 'SKU', '优化'], ['char-counter'], 'tutorial'],
    ['fba-competitor-check', '竞品 FBA 策略：看费用推断打法', ['FBA费用', '竞品', '策略'], ['fba-fee-estimator'], 'tutorial'],
  ],
};

const CATS = Object.keys(NEW); // 10 分类
if (CATS.length !== 10) fail('分类数应为 10: ' + CATS.join(','));

// ---------- 组装 500 条 ----------
const oldCal = existsSync(CALENDAR) ? JSON.parse(readFileSync(CALENDAR, 'utf-8')) : [];
const oldByCat = {};
for (const e of oldCal) { (oldByCat[e.category] = oldByCat[e.category] || []).push(e); }

const entries = [];
for (const cat of CATS) {
  const seeds = (oldByCat[cat] || []).slice(0, 10);
  const news = NEW[cat];
  const per = seeds.concat(news);
  if (per.length !== 50) fail(`${cat} 应有 50 条，实际 ${per.length}`);
  entries.push(...per.map((e, i) => {
    if (Array.isArray(e)) {
      const [slug, title, keywords, tools, type] = e;
      return { day: 0, slot: 0, slug, title, category: cat, keywords, tools, type };
    }
    return { ...e, day: 0, slot: 0 };
  }));
}

// ---------- 分配 day/slot：每天 5 个不同分类，1 天 1 分类 1 篇 ----------
// 10 分类 → 每天 5 个，两天一轮覆盖全部 10 分类。
// 方案：day d (1-100)，slot 0-4；分类顺序固定轮转，
// 分类 i 的第 k 篇（k=0..49）落在 day = i%2 + 2k ... 用显式映射：
const perCat = {}; for (const cat of CATS) perCat[cat] = 0;
// 每分类 50 篇 → 每 2 天 1 篇 → 100 天。分类按奇偶天各占 5 个。
const CAT_ODD = CATS.filter((_, i) => i % 2 === 0);   // 5 个 → 奇数天
const CAT_EVEN = CATS.filter((_, i) => i % 2 === 1);  // 5 个 → 偶数天
const catProgress = {}; for (const cat of CATS) catProgress[cat] = 0;

for (const e of entries) {
  const isOdd = CAT_ODD.includes(e.category);
  const k = catProgress[e.category]++;
  const day = isOdd ? k * 2 + 1 : k * 2 + 2; // 1..99 / 2..100
  const slot = isOdd ? CAT_ODD.indexOf(e.category) : CAT_EVEN.indexOf(e.category);
  e.day = day;
  e.slot = slot;
}
// 按 day 排序，同一 day 内按 slot 排序
entries.sort((a, b) => (a.day - b.day) || (a.slot - b.slot));

// ---------- 校验 ----------
const slugs = new Set();
const perDay = {};
let badTools = [];
for (const e of entries) {
  if (slugs.has(e.slug)) fail('slug 重复: ' + e.slug);
  slugs.add(e.slug);
  (perDay[e.day] = perDay[e.day] || []).push(e);
  for (const t of e.tools) if (!LIVE.has(t)) badTools.push(e.slug + ':' + t);
}
if (entries.length !== 500) fail('总条数应为 500，实际 ' + entries.length);
for (let d = 1; d <= 100; d++) {
  const set = perDay[d] || [];
  if (set.length !== 5) fail(`day ${d} 应有 5 条，实际 ${set.length}`);
  const cats = new Set(set.map((e) => e.category));
  if (cats.size !== 5) fail(`day ${d} 分类重复: ${[...cats]}`);
  const slots = new Set(set.map((e) => e.slot));
  if (slots.size !== 5) fail(`day ${d} slot 重复`);
}
const perCatCount = {};
for (const e of entries) perCatCount[e.category] = (perCatCount[e.category] || 0) + 1;
const uneven = CATS.filter((c) => perCatCount[c] !== 50);
if (uneven.length) fail('分类数量不均: ' + uneven.map((c) => c + '=' + perCatCount[c]).join(','));
if (badTools.length) fail('非活工具引用: ' + badTools.slice(0, 5).join(','));

console.log(`✅ 日历 ${entries.length} 条 | 10 分类 × 50 | 100 天 × 5 篇 | 每天 5 分类不重复 | 工具引用全活`);
console.log('   分类分布: ' + CATS.map((c) => c + '=' + perCatCount[c]).join(' '));

if (dryRun) { console.log('✅ [dry-run] 校验通过，未写盘'); process.exit(0); }
writeFileSync(CALENDAR, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
console.log(`✅ 已写入 scripts/content-calendar.json`);
