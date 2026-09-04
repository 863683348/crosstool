// 通用工具实现注册表：承接 v4.0(data) / v5.0(compliance) / v6.0(seo) / v7.0(productivity)
// 共 68 个「即将上线」工具。每个工具是纯前端逻辑（零上传、零服务器），由 ToolRunnerClient 按 kind 渲染。
// 本文件不引入任何 npm 包，保持可被客户端直接 import。

export type ToolKind = 'text' | 'csv' | 'form' | 'generator' | 'compare' | 'canvas' | 'file';

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
  defaultVal?: string;
}

export interface ToolResult {
  text?: string;
  table?: string[][];
  html?: string;
  downloadName?: string;
  downloadType?: string;
}

export interface FileResult {
  files?: { name: string; url: string }[];
  text?: string;
  table?: string[][];
}

export interface Impl {
  kind: ToolKind;
  canvas?: 'qr' | 'barcode' | 'placeholder' | 'color' | 'favicon';
  fileKind?: 'image' | 'pdf' | 'any';
  fields?: FieldDef[];
  placeholder?: string;
  inputLabel?: string;
  outputLabel?: string;
  action?: string;
  run?: (input: string, fields: Record<string, string>) => ToolResult | Promise<ToolResult>;
  runCompare?: (left: string, right: string, fields: Record<string, string>) => ToolResult | Promise<ToolResult>;
  runFile?: (files: File[], fields: Record<string, string>) => Promise<FileResult>;
}

// ---------- CSV helpers ----------
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else q = false;
      } else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (c === '\r') {
        /* skip */
      } else field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.length && !(r.length === 1 && r[0] === ''));
}
function toCSV(rows: string[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? '');
          return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
        })
        .join(',')
    )
    .join('\n');
}
function lines(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim());
}
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9一-龥\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// ---------- v4.0 data ----------
const csvCleaner: Impl = {
  kind: 'csv',
  placeholder: 'col1,col2,col3\na,b,c\n  a , b , c \n\na,b,c',
  inputLabel: 'CSV 文本',
  outputLabel: '清洗后 CSV',
  action: '清洗',
  run: (input) => {
    const rows = parseCSV(input);
    const cleaned = rows
      .map((r) => r.map((c) => c.trim()))
      .filter((r) => r.some((c) => c !== ''));
    // 去完全重复行
    const seen = new Set<string>();
    const out: string[][] = [];
    for (const r of cleaned) {
      const k = r.join('|');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
    }
    return { text: toCSV(out), downloadName: 'cleaned.csv', downloadType: 'text/csv' };
  },
};

const keywordFrequency: Impl = {
  kind: 'csv',
  placeholder: 'red dress\nblue shoes\nred dress\nwireless earbuds',
  inputLabel: '关键词（每行一个）',
  outputLabel: '词频',
  action: '统计',
  run: (input) => {
    const map = new Map<string, number>();
    for (const w of lines(input)) {
      if (!w) continue;
      map.set(w, (map.get(w) ?? 0) + 1);
    }
    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1;
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const table: string[][] = [['关键词', '次数', '占比']];
    for (const [k, v] of sorted) table.push([k, String(v), (v / total * 100).toFixed(1) + '%']);
    return { table, text: toCSV(table), downloadName: 'keyword-frequency.csv', downloadType: 'text/csv' };
  },
};

const priceCompare: Impl = {
  kind: 'csv',
  placeholder: 'B0ABC,19.99\nB0DEF,15.50\nB0GHI,22.00',
  inputLabel: '竞品（每行：ASIN或名称,价格）',
  outputLabel: '价格对比',
  action: '比对',
  run: (input) => {
    const rows = parseCSV(input).map((r) => [r[0] ?? '', r[1] ?? '']).filter((r) => r[1] !== '');
    const nums = rows.map((r) => parseFloat(r[1])).filter((n) => !isNaN(n));
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const avg = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
    const table: string[][] = [['名称', '价格', '相对最低']];
    for (const r of rows) {
      const p = parseFloat(r[1]);
      table.push([r[0], r[1], isNaN(p) ? '-' : (p - min >= 0 ? '+' + (p - min).toFixed(2) : (p - min).toFixed(2))]);
    }
    table.push(['', '最低 ' + min.toFixed(2), '']);
    table.push(['', '最高 ' + max.toFixed(2), '']);
    table.push(['', '平均 ' + avg.toFixed(2), '']);
    return { table, text: toCSV(table), downloadName: 'price-compare.csv', downloadType: 'text/csv' };
  },
};

const fxBulk: Impl = {
  kind: 'csv',
  fields: [{ name: 'rate', label: '汇率（1 外币 = ? 本位币）', type: 'number', placeholder: '7.2', defaultVal: '7.2' }],
  placeholder: '100\n250.5\n99.99',
  inputLabel: '金额（每行一个）',
  outputLabel: '换算结果',
  action: '换算',
  run: (input, fields) => {
    const rate = parseFloat(fields.rate) || 1;
    const table: string[][] = [['原金额', '换算后']];
    for (const l of lines(input)) {
      const n = parseFloat(l);
      if (isNaN(n)) continue;
      table.push([l, (n * rate).toFixed(2)]);
    }
    return { table, text: toCSV(table), downloadName: 'fx-bulk.csv', downloadType: 'text/csv' };
  },
};

const stockAlert: Impl = {
  kind: 'form',
  fields: [
    { name: 'daily', label: '日均销量', type: 'number', defaultVal: '10' },
    { name: 'lead', label: '补货周期(天)', type: 'number', defaultVal: '20' },
    { name: 'factor', label: '安全系数', type: 'number', defaultVal: '1.5' },
  ],
  action: '计算',
  run: (_i, f) => {
    const daily = parseFloat(f.daily) || 0;
    const lead = parseFloat(f.lead) || 0;
    const factor = parseFloat(f.factor) || 1;
    const safety = Math.ceil(daily * lead * factor);
    return {
      text: `日均销量：${daily}\n补货周期：${lead} 天\n安全系数：${factor}\n建议安全库存（补货点）：${safety} 件\n\n当库存低于 ${safety} 件时应发起补货，覆盖补货在途期避免断货。`,
    };
  },
};

const profitReport: Impl = {
  kind: 'csv',
  placeholder: 'SKU-A,29.99,12.00,3.50\nSKU-B,49.00,20.00,5.00',
  inputLabel: '多 SKU（每行：SKU,售价,成本,运费）',
  outputLabel: '利润报表',
  action: '汇总',
  run: (input) => {
    const rows = parseCSV(input).map((r) => [r[0] ?? '', r[1] ?? '', r[2] ?? '', r[3] ?? '']);
    const table: string[][] = [['SKU', '售价', '成本', '运费', '净利', '利润率']];
    let tNet = 0;
    let tRev = 0;
    for (const r of rows) {
      const p = parseFloat(r[1]);
      const c = parseFloat(r[2]);
      const s = parseFloat(r[3]);
      if ([p, c, s].some(isNaN)) continue;
      const net = p - c - s;
      const margin = p ? (net / p * 100).toFixed(1) + '%' : '-';
      table.push([r[0], r[1], r[2], r[3], net.toFixed(2), margin]);
      tNet += net;
      tRev += p;
    }
    table.push(['合计', tRev.toFixed(2), '', '', tNet.toFixed(2), tRev ? (tNet / tRev * 100).toFixed(1) + '%' : '-']);
    return { table, text: toCSV(table), downloadName: 'profit-report.csv', downloadType: 'text/csv' };
  },
};

const reviewAnalyzer: Impl = {
  kind: 'csv',
  placeholder: '质量很好，物流快\n尺码偏小\n质量一般，物流慢\n质量很好',
  inputLabel: '评论（每行一条）',
  outputLabel: '分析',
  action: '分析',
  run: (input) => {
    const map = new Map<string, number>();
    let pos = 0;
    let neg = 0;
    for (const l of lines(input)) {
      if (!l) continue;
      const toks = tokenize(l);
      for (const t of toks) map.set(t, (map.get(t) ?? 0) + 1);
      if (/(好|快|赞|喜欢|满意|great|good|love|fast|nice)/i.test(l)) pos++;
      else if (/(差|慢|偏|烂|坏|小|bad|slow|poor|small)/i.test(l)) neg++;
    }
    const total = lines(input).filter(Boolean).length || 1;
    const table: string[][] = [['高频词', '次数']];
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => table.push([k, String(v)]));
    return {
      text: `评论总数：${total}\n正面倾向：${pos}（${((pos / total) * 100).toFixed(0)}%）\n负面倾向：${neg}（${((neg / total) * 100).toFixed(0)}%）\n\n高频词：\n${table.slice(1).map((r) => r.join('  ')).join('\n')}`,
      table,
    };
  },
};

const volumetricWeight: Impl = {
  kind: 'form',
  fields: [
    { name: 'l', label: '长(cm)', type: 'number', defaultVal: '30' },
    { name: 'w', label: '宽(cm)', type: 'number', defaultVal: '20' },
    { name: 'h', label: '高(cm)', type: 'number', defaultVal: '15' },
    { name: 'div', label: '体积重除数(通常 5000/6000)', type: 'number', defaultVal: '5000' },
    { name: 'actual', label: '实重(kg)', type: 'number', defaultVal: '1.2' },
  ],
  action: '计算',
  run: (_i, f) => {
    const l = parseFloat(f.l);
    const w = parseFloat(f.w);
    const h = parseFloat(f.h);
    const div = parseFloat(f.div) || 5000;
    const actual = parseFloat(f.actual) || 0;
    const vol = (l * w * h) / div;
    const charge = Math.max(vol, actual);
    return {
      text: `体积重：${vol.toFixed(2)} kg\n实重：${actual.toFixed(2)} kg\n计费重（取大）：${charge.toFixed(2)} kg\n\n国际快递通常按体积重与实重较大者计费。`,
    };
  },
};

const shippingEstimator: Impl = {
  kind: 'form',
  fields: [
    { name: 'weight', label: '计费重(kg)', type: 'number', defaultVal: '1' },
    { name: 'zone', label: '目的地', type: 'select', options: ['US 美国', 'EU 欧洲', 'UK 英国', 'JP 日本', 'AU 澳洲', 'OTHER 其他'], defaultVal: 'US 美国' },
    { name: 'rate', label: '首重费率(元/kg)', type: 'number', defaultVal: '75' },
  ],
  action: '估算',
  run: (_i, f) => {
    const wt = parseFloat(f.weight) || 0;
    const zone = f.zone || 'US 美国';
    const rate = parseFloat(f.rate) || 0;
    const zoneMul: Record<string, number> = { 'US 美国': 1, 'EU 欧洲': 1.1, 'UK 英国': 1.15, 'JP 日本': 0.7, 'AU 澳洲': 1.2, 'OTHER 其他': 1.3 };
    const mul = zoneMul[zone] ?? 1;
    const cost = wt * rate * mul;
    return {
      text: `目的地：${zone}\n计费重：${wt} kg\n预估运费：${cost.toFixed(2)} 元（示例费率，仅供估算，以承运商报价为准）`,
    };
  },
};

const dedupe: Impl = {
  kind: 'csv',
  fields: [{ name: 'key', label: '主键列(从 1 开始)', type: 'number', defaultVal: '1' }],
  placeholder: 'id,name\n1,a\n1,a\n2,b',
  inputLabel: '表格(含表头)',
  outputLabel: '去重结果',
  action: '去重',
  run: (input, f) => {
    const rows = parseCSV(input);
    if (!rows.length) return { text: '' };
    const ki = (parseInt(f.key) || 1) - 1;
    const seen = new Set<string>();
    const out: string[][] = [rows[0]];
    for (let i = 1; i < rows.length; i++) {
      const k = rows[i][ki] ?? '';
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(rows[i]);
    }
    return { text: toCSV(out), downloadName: 'deduped.csv', downloadType: 'text/csv' };
  },
};

const asinBatch: Impl = {
  kind: 'csv',
  placeholder: 'B0ABCDEF12\nB0XYZ\nnot-asin',
  inputLabel: 'ASIN（每行一个）',
  outputLabel: '校验结果',
  action: '校验',
  run: (input) => {
    const table: string[][] = [['ASIN', '结果']];
    for (const l of lines(input)) {
      if (!l) continue;
      const ok = /^B0[A-Z0-9]{8}$/.test(l);
      table.push([l, ok ? '✓ 合法' : '✗ 格式错误(应为 B0 + 8 位字母数字)']);
    }
    return { table, text: toCSV(table), downloadName: 'asin-check.csv', downloadType: 'text/csv' };
  },
};

const pivotLite: Impl = {
  kind: 'csv',
  fields: [
    { name: 'row', label: '行维度列(从1)', type: 'number', defaultVal: '1' },
    { name: 'col', label: '列维度列(从1)', type: 'number', defaultVal: '2' },
    { name: 'val', label: '值列(从1)', type: 'number', defaultVal: '3' },
    { name: 'agg', label: '聚合', type: 'select', options: ['sum', 'count', 'avg'], defaultVal: 'sum' },
  ],
  placeholder: '地区,月份,销量\nUS,1,100\nUS,1,50\nEU,1,80',
  inputLabel: '表格(含表头)',
  outputLabel: '透视表',
  action: '透视',
  run: (input, f) => {
    const rows = parseCSV(input);
    if (rows.length < 2) return { text: '数据不足' };
    const ri = (parseInt(f.row) || 1) - 1;
    const ci = (parseInt(f.col) || 1) - 1;
    const vi = (parseInt(f.val) || 1) - 1;
    const agg = f.agg || 'sum';
    const cols = new Set<string>();
    const cell = new Map<string, number[]>();
    for (let i = 1; i < rows.length; i++) {
      const rk = rows[i][ri] ?? '';
      const ck = rows[i][ci] ?? '';
      const v = parseFloat(rows[i][vi]) || 0;
      cols.add(ck);
      const key = rk + '\u0000' + ck;
      if (!cell.has(key)) cell.set(key, []);
      cell.get(key)!.push(v);
    }
    const colArr = [...cols];
    const table: string[][] = [['行\\列', ...colArr, '合计']];
    const rowKeys = [...new Set(rows.slice(1).map((r) => r[ri] ?? ''))];
    for (const rk of rowKeys) {
      const row: string[] = [rk];
      let sum = 0;
      for (const ck of colArr) {
        const arr = cell.get(rk + '\u0000' + ck) || [];
        let val = 0;
        if (agg === 'count') val = arr.length;
        else if (agg === 'avg') val = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        else val = arr.reduce((a, b) => a + b, 0);
        sum += val;
        row.push(val ? val.toFixed(agg === 'count' ? 0 : 2) : '0');
      }
      row.push(sum.toFixed(agg === 'count' ? 0 : 2));
      table.push(row);
    }
    return { table, text: toCSV(table), downloadName: 'pivot.csv', downloadType: 'text/csv' };
  },
};

// ---------- v5.0 compliance ----------
const brandCheck: Impl = {
  kind: 'text',
  fields: [{ name: 'brand', label: '你的品牌词', type: 'text', placeholder: 'MyBrand' }],
  placeholder: 'MyBrand\nMyBrandPro\nMyBrandOfficial\n competitorBrand',
  inputLabel: '待查名单（每行一个，含你的品牌）',
  outputLabel: '查重结果',
  action: '查重',
  run: (input, f) => {
    const brand = (f.brand || '').trim().toLowerCase();
    const list = lines(input).map((s) => s.trim()).filter(Boolean);
    const hits = list.filter((s) => s.toLowerCase() !== brand && s.toLowerCase().includes(brand));
    if (!brand) return { text: '请填写「你的品牌词」。' };
    if (!hits.length) return { text: `未在与「${f.brand}」相似的词条中发现撞名。\n（仅本地词库比对，注册商标请以官方数据库为准）` };
    return { text: `发现 ${hits.length} 个疑似撞名：\n${hits.map((h) => '- ' + h).join('\n')}\n\n建议确认这些名称是否已被注册，避免侵权。`, downloadName: 'brand-check.txt', downloadType: 'text/plain' };
  },
};

const restrictedWords: Impl = {
  kind: 'text',
  fields: [{ name: 'list', label: '受限词库(每行一个，留空用内置)', type: 'textarea', placeholder: '免费\nguarantee\n100%\ncopyright' }],
  placeholder: '买一送一 免费试用 100%有效 guaranteed',
  inputLabel: '待检测文案',
  outputLabel: '命中结果',
  action: '检测',
  run: (input, f) => {
    const builtin = ['免费', 'free', 'guarantee', '100%', '正品', '原单', 'copy', 'replica', 'fake', '最', '第一', '国家级', '最佳', '版权', 'copyright'];
    const extra = lines(f.list || '').map((s) => s.trim().toLowerCase()).filter(Boolean);
    const dict = new Set([...builtin, ...extra]);
    const hits: string[] = [];
    for (const w of dict) if (input.toLowerCase().includes(w)) hits.push(w);
    if (!hits.length) return { text: '未发现内置/自定义受限词。\n（词库有限，正式上线前请以各平台最新规则为准）' };
    return { text: `命中 ${hits.length} 个受限/慎用词：\n${hits.map((h) => '- ' + h).join('\n')}\n\n这些词在部分平台可能触发审核或违规，建议替换。`, downloadName: 'restricted-hits.txt', downloadType: 'text/plain' };
  },
};

const glossary = new Map<string, string>([
  ['FBA', 'Fulfillment by Amazon（亚马逊物流）'],
  ['FBM', 'Fulfillment by Merchant（商家自发货）'],
  ['SKU', 'Stock Keeping Unit（库存量单位）'],
  ['ASIN', 'Amazon Standard Identification Number（亚马逊商品编号）'],
  ['UPC', 'Universal Product Code（通用产品代码）'],
  ['FNSKU', 'Fulfillment Network SKU（亚马逊物流标签码）'],
  ['ROI', 'Return on Investment（投资回报率）'],
  ['CPC', 'Cost per Click（每次点击成本）'],
  ['ACOS', 'Advertising Cost of Sale（广告销售成本比）'],
  ['MOQ', 'Minimum Order Quantity（最小起订量）'],
  ['DDP', 'Delivered Duty Paid（完税交货）'],
  ['DAP', 'Delivered at Place（所在地交货）'],
  ['OEM', 'Original Equipment Manufacturer（代工生产）'],
  ['ODM', 'Original Design Manufacturer（原始设计制造）'],
  ['B2B', 'Business to Business（企业对企业）'],
  ['B2C', 'Business to Consumer（企业对消费者）'],
  ['KPI', 'Key Performance Indicator（关键绩效指标）'],
  ['CTR', 'Click Through Rate（点击率）'],
  ['CVR', 'Conversion Rate（转化率）'],
  ['PPC', 'Pay Per Click（按点击付费广告）'],
  ['VAT', 'Value Added Tax（增值税）'],
  ['HS Code', 'Harmonized System Code（商品海关编码）'],
  ['Listing', '商品详情页/在线商品'],
  ['Bullet Point', '五点描述/要点'],
  ['SEO', 'Search Engine Optimization（搜索引擎优化）'],
  ['SERP', 'Search Engine Results Page（搜索结果页）'],
]);
const glossaryTranslate: Impl = {
  kind: 'text',
  fields: [{ name: 'term', label: '术语(中/英)', type: 'text', placeholder: 'FBA' }],
  inputLabel: '输入术语',
  outputLabel: '释义',
  action: '查询',
  run: (_i, f) => {
    const term = (f.term || '').trim();
    if (!term) return { text: '请输入要查询的术语。' };
    const hit = glossary.get(term) || glossary.get(term.toUpperCase()) || glossary.get(term.toLowerCase());
    if (hit) return { text: `${term} = ${hit}` };
    const keys = [...glossary.keys()].filter((k) => k.toLowerCase().includes(term.toLowerCase()));
    if (keys.length) return { text: `未直接命中，相关术语：\n${keys.map((k) => `- ${k} = ${glossary.get(k)}`).join('\n')}` };
    return { text: `未找到「${term}」的本地解释。可补充到术语库。` };
  },
};

const receiptOcr: Impl = {
  kind: 'file',
  fileKind: 'image',
  action: '读取',
  runFile: async (files) => {
    const out: string[] = [];
    for (const file of files) {
      out.push(`文件：${file.name}（${(file.size / 1024).toFixed(1)} KB，${file.type || '未知类型'}）`);
      out.push('提示：本工具为纯前端实现，未内置 OCR 模型，无法直接识别图中文字。');
      out.push('如需提取文字，请把票据截图粘贴到任意 OCR/翻译工具；本工具已确认文件在本地读取、未上传。');
      out.push('');
    }
    return { text: out.join('\n') };
  },
};

const watermarkBatch: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'text', label: '水印文字', type: 'text', placeholder: '© YourBrand' }],
  action: '生成',
  runFile: async (files, fields) => {
    const text = fields.text || '© YourBrand';
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bmp = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bmp, 0, 0);
      const fs = Math.max(14, Math.floor(bmp.width / 28));
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = Math.max(1, fs / 12);
      ctx.textBaseline = 'bottom';
      const lines = wrapText(ctx, text, bmp.width - fs);
      let y = bmp.height - fs - 8;
      for (let i = lines.length - 1; i >= 0; i--) {
        ctx.strokeText(lines[i], fs, y);
        ctx.fillText(lines[i], fs, y);
        y -= fs + 4;
      }
      out.push({ name: file.name.replace(/(\.\w+)$/, '-wm$1'), url: canvas.toDataURL('image/png') });
    }
    return { files: out };
  },
};

const thumbnailGen: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'size', label: '缩略图边长(px)', type: 'number', defaultVal: '300' }],
  action: '生成',
  runFile: async (files, fields) => {
    const size = parseInt(fields.size) || 300;
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bmp = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const scale = Math.max(size / bmp.width, size / bmp.height);
      const w = bmp.width * scale;
      const h = bmp.height * scale;
      ctx.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
      out.push({ name: file.name.replace(/(\.\w+)$/, '-thumb$1'), url: canvas.toDataURL('image/png') });
    }
    return { files: out };
  },
};

const imageCollage: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'dir', label: '排列', type: 'select', options: ['横向', '纵向', '2列网格'], defaultVal: '2列网格' }],
  action: '拼合',
  runFile: async (files, fields) => {
    const bmps = await Promise.all(files.map(loadImage));
    const dir = fields.dir || '2列网格';
    let W = 0;
    let H = 0;
    let cols = 1;
    if (dir === '横向') {
      W = bmps.reduce((a, b) => a + b.width, 0);
      H = Math.max(...bmps.map((b) => b.height));
    } else if (dir === '纵向') {
      W = Math.max(...bmps.map((b) => b.width));
      H = bmps.reduce((a, b) => a + b.height, 0);
    } else {
      cols = 2;
      const rows = Math.ceil(bmps.length / 2);
      const cw = Math.max(...bmps.map((b) => b.width));
      const ch = Math.max(...bmps.map((b) => b.height));
      W = cw * 2;
      H = ch * rows;
    }
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    let x = 0;
    let y = 0;
    if (dir === '横向') {
      for (const b of bmps) {
        ctx.drawImage(b, x, 0);
        x += b.width;
      }
    } else if (dir === '纵向') {
      for (const b of bmps) {
        ctx.drawImage(b, 0, y);
        y += b.height;
      }
    } else {
      const cw = Math.max(...bmps.map((b) => b.width));
      const ch = Math.max(...bmps.map((b) => b.height));
      bmps.forEach((b, i) => {
        ctx.drawImage(b, (i % 2) * cw, Math.floor(i / 2) * ch);
      });
    }
    return { files: [{ name: 'collage.png', url: canvas.toDataURL('image/png') }] };
  },
};

const pdfEncrypt: Impl = {
  kind: 'file',
  fileKind: 'pdf',
  fields: [{ name: 'pwd', label: '打开密码', type: 'text', placeholder: '请设置密码' }],
  action: '加密',
  runFile: async (files, fields) => {
    const { PDFDocument } = await import('pdf-lib');
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      const pwd = fields.pwd || '';
      if (pwd) (doc as any).encrypt({ userPassword: pwd, ownerPassword: pwd, permissions: { printing: 'lowResolution' } });
      const outBytes = await doc.save();
      out.push({ name: file.name.replace(/(\.pdf)$/i, '-enc.pdf'), url: URL.createObjectURL(new Blob([outBytes as BlobPart], { type: 'application/pdf' })) });
    }
    return { files: out };
  },
};

const pdfPageNumber: Impl = {
  kind: 'file',
  fileKind: 'pdf',
  fields: [{ name: 'pos', label: '位置', type: 'select', options: ['右下', '底部居中', '右下(起始2)'], defaultVal: '右下' }],
  action: '加页码',
  runFile: async (files, fields) => {
    const { PDFDocument, rgb } = await import('pdf-lib');
    const { StandardFonts } = await import('pdf-lib');
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      const start = fields.pos === '右下(起始2)' ? 2 : 1;
      pages.forEach((pg, i) => {
        const n = i + start;
        const { width, height } = pg.getSize();
        const txt = String(n);
        const size = 10;
        if (fields.pos === '底部居中') pg.drawText(txt, { x: width / 2 - size, y: 16, size, font, color: rgb(0.3, 0.3, 0.3) });
        else pg.drawText(txt, { x: width - 36, y: 16, size, font, color: rgb(0.3, 0.3, 0.3) });
      });
      const outBytes = await doc.save();
      out.push({ name: file.name.replace(/(\.pdf)$/i, '-pagenum.pdf'), url: URL.createObjectURL(new Blob([outBytes as BlobPart], { type: 'application/pdf' })) });
    }
    return { files: out };
  },
};

const diffText: Impl = {
  kind: 'compare',
  inputLabel: '版本 A',
  outputLabel: '差异',
  action: '对比',
  runCompare: (left, right) => {
    const a = lines(left);
    const b = lines(right);
    const setB = new Set(b);
    const setA = new Set(a);
    const onlyA = a.filter((x) => !setB.has(x));
    const onlyB = b.filter((x) => !setA.has(x));
    const text = [
      `仅在 A 中（${onlyA.length}）：`,
      ...onlyA.map((x) => '- ' + x),
      '',
      `仅在 B 中（${onlyB.length}）：`,
      ...onlyB.map((x) => '+ ' + x),
    ].join('\n');
    return { text };
  },
};

const regexTester: Impl = {
  kind: 'form',
  fields: [
    { name: 'pattern', label: '正则', type: 'text', placeholder: '\\d{3}-\\d{4}' },
    { name: 'flags', label: '标志(g/i/m)', type: 'text', placeholder: 'g' },
  ],
  placeholder: '123-4567\nabc\n987-6543',
  inputLabel: '测试文本',
  outputLabel: '匹配',
  action: '测试',
  run: (input, f) => {
    let re: RegExp;
    try {
      re = new RegExp(f.pattern, f.flags || 'g');
    } catch (e) {
      return { text: '正则错误：' + (e as Error).message };
    }
    const matches = input.match(re) || [];
    if (!matches.length) return { text: '无匹配。' };
    return { text: `匹配 ${matches.length} 处：\n${matches.map((m, i) => `${i + 1}. ${m}`).join('\n')}`, downloadName: 'matches.txt', downloadType: 'text/plain' };
  },
};

const uuidGenerator: Impl = {
  kind: 'generator',
  fields: [{ name: 'count', label: '数量', type: 'number', defaultVal: '10' }, { name: 'fmt', label: '格式', type: 'select', options: ['uuid-v4', '短ID(8位)', 'SKU(前缀+)'], defaultVal: 'uuid-v4' }],
  action: '生成',
  run: (_i, f) => {
    const n = Math.min(parseInt(f.count) || 10, 500);
    const fmt = f.fmt || 'uuid-v4';
    const prefix = 'SKU-';
    const arr: string[] = [];
    for (let i = 0; i < n; i++) {
      if (fmt === 'uuid-v4') arr.push((crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => ((Math.random() * 16) | 0).toString(16))));
      else if (fmt === '短ID(8位)') arr.push(Math.random().toString(36).slice(2, 10));
      else arr.push(prefix + Math.random().toString(36).slice(2, 8).toUpperCase());
    }
    return { text: arr.join('\n'), downloadName: 'ids.txt', downloadType: 'text/plain' };
  },
};

const qrBatch: Impl = {
  kind: 'canvas',
  canvas: 'qr',
  placeholder: 'https://yourstore.com/p/A\nhttps://yourstore.com/p/B',
  inputLabel: '每条一个链接/文本',
  action: '生成',
};

const colorConvert: Impl = {
  kind: 'form',
  fields: [{ name: 'color', label: '颜色(支持 #hex / rgb() / hsl())', type: 'text', placeholder: '#2e7d32' }],
  action: '转换',
  run: (_i, f) => {
    const c = parseColor(f.color || '');
    if (!c) return { text: '无法解析颜色，支持 #hex / rgb(r,g,b) / hsl(h,s%,l%)。' };
    const { r, g, b } = c;
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    return {
      text: `HEX: ${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  },
};

const markdownTable: Impl = {
  kind: 'text',
  placeholder: '| 名称 | 价格 |\n| --- | --- |\n| A | 1 |\n| B | 2 |',
  inputLabel: 'Markdown 表格',
  outputLabel: '转换结果',
  action: '转换',
  run: (input) => {
    const rows = input
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith('|'));
    const data = rows
      .filter((l) => !/^\|[\s:-]+\|$/.test(l))
      .map((l) => l.replace(/^\||\|$/g, '').split('|').map((s) => s.trim()));
    if (!data.length) return { text: '未识别到 Markdown 表格。' };
    const html = `<table class="ct-md-table">\n${data.map((r, i) => `  <tr>${r.map((c) => `<${i === 0 ? 'th' : 'td'}>${escapeHtml(c)}</${i === 0 ? 'th' : 'td'}>`).join('')}</tr>`).join('\n')}\n</table>`;
    return { text: `CSV:\n${toCSV(data)}\n\nHTML:\n${html}`, html, downloadName: 'table.csv', downloadType: 'text/csv' };
  },
};

const listingTemplate: Impl = {
  kind: 'form',
  fields: [
    { name: 'category', label: '类目', type: 'text', placeholder: '厨房小家电' },
    { name: 'points', label: '卖点(每行一个)', type: 'textarea', placeholder: '便携\n静音\n易清洗' },
  ],
  action: '生成',
  run: (_i, f) => {
    const cat = f.category || '商品';
    const pts = lines(f.points || '').filter(Boolean);
    const bullets = pts.length ? pts.map((p, i) => `${i + 1}. 【${p}】——为什么买家需要它：……`).join('\n') : '1. 【核心卖点】——……';
    const title = `${cat} ${pts.slice(0, 2).join(' ')} 高品质 包邮`;
    return {
      text: `标题示例：\n${title}\n\n五点描述：\n${bullets}\n\n（本地模板生成，请按真实合规信息补全，避免夸大与违禁词）`,
    };
  },
};

// ---------- v6.0 seo ----------
function expandSeeds(seed: string, mods: string[]): string[] {
  const base = seed.trim();
  const out: string[] = [base];
  for (const m of mods) out.push(`${base} ${m}`);
  return out;
}
const keywordCluster: Impl = {
  kind: 'text',
  placeholder: 'wireless earbuds\nwireless earbuds pro\nbluetooth earbuds\nred dress\nred dress plus size',
  inputLabel: '关键词(每行一个)',
  outputLabel: '聚类',
  action: '聚类',
  run: (input) => {
    const ws = lines(input).filter(Boolean);
    const groups = new Map<string, string[]>();
    for (const w of ws) {
      const head = w.toLowerCase().split(/\s+/)[0] || w;
      if (!groups.has(head)) groups.set(head, []);
      groups.get(head)!.push(w);
    }
    let text = '';
    let i = 0;
    for (const [k, v] of groups) {
      i++;
      text += `组 ${i}（${k}）：${v.length} 个\n${v.map((x) => '  - ' + x).join('\n')}\n\n`;
    }
    return { text };
  },
};

const longTailGen: Impl = {
  kind: 'generator',
  fields: [{ name: 'seed', label: '种子词', type: 'text', placeholder: 'yoga mat' }],
  action: '生成',
  run: (_i, f) => {
    const seed = (f.seed || '').trim();
    if (!seed) return { text: '请输入种子词。' };
    const mods = ['for beginners', 'review', 'best', 'cheap', '2026', 'near me', 'wholesale', 'custom', 'small batch', 'oem', 'with case', 'amazon', 'aliexpress', 'uk', 'eu'];
    const out = expandSeeds(seed, mods);
    return { text: out.join('\n'), downloadName: 'long-tail.txt', downloadType: 'text/plain' };
  },
};

const metaGen: Impl = {
  kind: 'form',
  fields: [
    { name: 'title', label: '标题', type: 'text', placeholder: 'Wireless Earbuds Pro' },
    { name: 'desc', label: '描述', type: 'textarea', placeholder: '降噪蓝牙耳机…' },
    { name: 'url', label: '页面 URL', type: 'text', placeholder: 'https://shop.com/p/earbuds' },
  ],
  action: '生成',
  run: (_i, f) => {
    const t = (f.title || '').slice(0, 60);
    const d = (f.desc || '').slice(0, 160);
    const html = `<title>${escapeHtml(t)}</title>\n<meta name="description" content="${escapeHtml(d)}" />\n<link rel="canonical" href="${escapeHtml(f.url || '')}" />\n<meta property="og:title" content="${escapeHtml(t)}" />\n<meta property="og:description" content="${escapeHtml(d)}" />`;
    return { text: html, html: `<pre class="ct-code">${escapeHtml(html)}</pre>`, downloadName: 'meta.html', downloadType: 'text/html' };
  },
};

const slugGen: Impl = {
  kind: 'generator',
  fields: [{ name: 'title', label: '标题/短语', type: 'text', placeholder: 'Best Wireless Earbuds 2026' }],
  action: '生成',
  run: (_i, f) => {
    const s = (f.title || '')
      .toLowerCase()
      .replace(/[^\w一-龥\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return { text: s || '(空)', downloadName: 'slug.txt', downloadType: 'text/plain' };
  },
};

const titleTagTester: Impl = {
  kind: 'form',
  fields: [{ name: 'title', label: '标题', type: 'text', placeholder: 'Best Wireless Earbuds for Running 2026' }],
  action: '预览',
  run: (_i, f) => {
    const t = f.title || '';
    const trunc = t.length > 60 ? t.slice(0, 57) + '…' : t;
    return {
      text: `桌面搜索结果预览（约 60 字符）：\n${trunc}\n\n字符数：${t.length}（建议 ≤ 60，避免截断）`,
      html: `<div class="ct-serp"><div class="ct-serp-title">${escapeHtml(trunc)}</div><div class="ct-serp-url">https://yourstore.com › product</div></div>`,
    };
  },
};

const descGen: Impl = {
  kind: 'form',
  fields: [{ name: 'points', label: '卖点(每行一个)', type: 'textarea', placeholder: '降噪\n30h续航\n防水' }],
  action: '生成',
  run: (_i, f) => {
    const pts = lines(f.points || '').filter(Boolean);
    if (!pts.length) return { text: '请填写卖点。' };
    const desc = `这款产品主打${pts.slice(0, 3).join('、')}。适合日常与出行使用，做工扎实、性价比高，是值得入手的选择。`;
    return { text: desc, downloadName: 'description.txt', downloadType: 'text/plain' };
  },
};

const altTextGen: Impl = {
  kind: 'form',
  fields: [
    { name: 'kw', label: '核心关键词', type: 'text', placeholder: 'wireless earbuds' },
    { name: 'ctx', label: '场景/颜色等', type: 'text', placeholder: 'black, outdoor' },
  ],
  action: '生成',
  run: (_i, f) => {
    const kw = f.kw || 'product';
    const ctx = f.ctx ? ' ' + f.ctx : '';
    return { text: `${kw}${ctx} product photo showing details and usage`, downloadName: 'alt.txt', downloadType: 'text/plain' };
  },
};

const keywordDensity: Impl = {
  kind: 'form',
  fields: [{ name: 'kw', label: '关键词', type: 'text', placeholder: 'wireless earbuds' }],
  placeholder: 'Buy wireless earbuds for running. Wireless earbuds with noise cancelling…',
  inputLabel: '文案',
  outputLabel: '密度',
  action: '分析',
  run: (input, f) => {
    const kw = (f.kw || '').trim().toLowerCase();
    const toks = tokenize(input);
    const total = toks.length || 1;
    const kwCount = kw ? input.toLowerCase().split(kw).length - 1 : 0;
    const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
    return {
      text: `总词数：${wordCount}\n关键词「${kw || '-'}」出现：${kwCount} 次\n关键词密度：${kw ? ((kwCount / wordCount) * 100).toFixed(2) : '0'}%\n\n建议密度 1%–3%，过高可能被判堆砌。`,
    };
  },
};

const lsiWords: Impl = {
  kind: 'generator',
  fields: [{ name: 'kw', label: '关键词', type: 'text', placeholder: 'coffee mug' }],
  action: '建议',
  run: (_i, f) => {
    const kw = (f.kw || '').trim();
    if (!kw) return { text: '请输入关键词。' };
    const rel = ['best', 'review', 'buy', 'near me', 'wholesale', 'oem', 'custom', 'for gift', 'set', 'premium', 'cheap', 'vs', 'alternative', 'how to use', 'cleaning'];
    return { text: rel.map((r) => `${kw} ${r}`).join('\n'), downloadName: 'lsi.txt', downloadType: 'text/plain' };
  },
};

const questionMiner: Impl = {
  kind: 'generator',
  fields: [{ name: 'topic', label: '主题', type: 'text', placeholder: 'wireless earbuds' }],
  action: '挖掘',
  run: (_i, f) => {
    const t = (f.topic || '').trim();
    if (!t) return { text: '请输入主题。' };
    const qs = ['what is', 'how to use', 'how to clean', 'vs', 'review', 'best', 'where to buy', 'is it worth', 'alternative to', 'for beginners'];
    return { text: qs.map((q) => `${q} ${t}?`).join('\n'), downloadName: 'questions.txt', downloadType: 'text/plain' };
  },
};

const nicheFinder: Impl = {
  kind: 'generator',
  fields: [{ name: 'niche', label: '利基方向', type: 'text', placeholder: 'pet water fountain' }],
  action: '评估',
  run: (_i, f) => {
    const n = (f.niche || '').trim();
    if (!n) return { text: '请输入利基方向。' };
    return {
      text: `方向：${n}\n\n本地粗略评估（启发式，非数据）：\n- 需求信号：搜索词是否稳定（建议用关键词工具复核）\n- 竞争信号：头部是否大品牌垄断\n- 毛利信号：客单价与重量是否适合跨境\n- 内容信号：是否能持续产出测评/教程内容\n\n建议：用关键词密度、竞品词差工具进一步量化。`,
    };
  },
};

const competitorGap: Impl = {
  kind: 'compare',
  inputLabel: '你的关键词(每行)',
  outputLabel: '缺失词',
  action: '对比',
  runCompare: (left, right) => {
    const mine = new Set(tokenize(left).filter((w) => w.length > 2));
    const theirs = tokenize(right).filter((w) => w.length > 2);
    const gap = [...new Set(theirs)].filter((w) => !mine.has(w));
    if (!gap.length) return { text: '未发现明显差异词。' };
    return { text: `竞品出现但你未覆盖的词（${gap.length}）：\n${gap.map((w) => '- ' + w).join('\n')}` };
  },
};

const contentOutline: Impl = {
  kind: 'generator',
  fields: [{ name: 'kw', label: '目标关键词', type: 'text', placeholder: 'best wireless earbuds' }],
  action: '生成',
  run: (_i, f) => {
    const kw = (f.kw || '').trim() || '主题';
    return {
      text: `# ${kw} — 内容大纲\n\n## 1. 什么是 ${kw}\n## 2. 选购要点（5 个维度）\n## 3. 热门型号对比\n## 4. 使用场景与人群\n## 5. 常见问题 FAQ\n## 6. 购买建议与总结`,
    };
  },
};

const breadcrumbGen: Impl = {
  kind: 'form',
  fields: [{ name: 'path', label: '路径(用 > 分隔)', type: 'text', placeholder: 'Home > Electronics > Audio > Earbuds' }, { name: 'base', label: '站点根 URL', type: 'text', placeholder: 'https://shop.com' }],
  action: '生成',
  run: (_i, f) => {
    const parts = (f.path || '').split('>').map((s) => s.trim()).filter(Boolean);
    const base = (f.base || 'https://shop.com').replace(/\/$/, '');
    if (!parts.length) return { text: '请填写路径。' };
    const items = parts.map((p, i) => {
      const url = i === 0 ? base : base + '/' + slugify(p);
      return `<span itemprop="item"><a href="${url}">${escapeHtml(p)}</a></span>`;
    });
    const html = `<nav aria-label="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">\n${items.map((it, i) => `  <span itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">${it}<meta itemprop="position" content="${i + 1}" /></span>`).join('\n')}\n</nav>`;
    return { text: html, html: `<pre class="ct-code">${escapeHtml(html)}</pre>` };
  },
};

const hreflangCheck: Impl = {
  kind: 'text',
  placeholder: 'https://shop.com/p/a  en-us\nhttps://shop.com/p/a  zh-cn\nhttps://shop.com/p/a  de-de',
  inputLabel: '每行：URL + 空格 + hreflang',
  outputLabel: '校验',
  action: '校验',
  run: (input) => {
    const rows = lines(input).filter(Boolean).map((l) => l.split(/\s+/));
    const langs = rows.map((r) => (r[1] || '').toLowerCase());
    const hasXdef = langs.includes('x-default');
    const dup = langs.filter((l, i) => langs.indexOf(l) !== i);
    let msg = '';
    if (!hasXdef) msg += '⚠ 缺少 x-default（建议补充默认语言回退）。\n';
    if (dup.length) msg += `⚠ 存在重复 hreflang：${[...new Set(dup)].join(', ')}。\n`;
    if (!msg) msg = '✓ 未发现明显问题。\n';
    msg += '\n录入：\n' + rows.map((r) => `- ${r[1] || '?'} → ${r[0]}`).join('\n');
    return { text: msg };
  },
};

const sitemapValidate: Impl = {
  kind: 'text',
  placeholder: '<?xml version="1.0"?>\n<urlset>\n  <url><loc>https://shop.com/</loc></url>\n</urlset>',
  inputLabel: 'sitemap XML',
  outputLabel: '校验',
  action: '校验',
  run: (input) => {
    const locs = [...input.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const hasUrlset = /<urlset[\s>]/.test(input);
    const issues: string[] = [];
    if (!hasUrlset) issues.push('缺少 <urlset> 根元素');
    if (!locs.length) issues.push('未发现任何 <loc>');
    for (const l of locs) if (!/^https?:\/\//.test(l)) issues.push(`非 http(s) 链接：${l}`);
    return {
      text: `${issues.length ? '❌ 问题：\n' + issues.map((i) => '- ' + i).join('\n') : '✓ 基本结构正常'}\n\n共发现 ${locs.length} 个 URL。`,
    };
  },
};

const robotsGen: Impl = {
  kind: 'form',
  fields: [
    { name: 'paths', label: '允许抓取的路径(每行)', type: 'textarea', placeholder: '/\n/product' },
    { name: 'disallow', label: '禁止路径(每行)', type: 'textarea', placeholder: '/admin\n/cart' },
    { name: 'sitemap', label: 'sitemap URL', type: 'text', placeholder: 'https://shop.com/sitemap.xml' },
  ],
  action: '生成',
  run: (_i, f) => {
    const allow = lines(f.paths || '').filter(Boolean);
    const dis = lines(f.disallow || '').filter(Boolean);
    let txt = 'User-agent: *\n';
    for (const a of allow) txt += `Allow: ${a}\n`;
    for (const d of dis) txt += `Disallow: ${d}\n`;
    if (f.sitemap) txt += `Sitemap: ${f.sitemap}\n`;
    return { text: txt, html: `<pre class="ct-code">${escapeHtml(txt)}</pre>`, downloadName: 'robots.txt', downloadType: 'text/plain' };
  },
};

const serpPreview: Impl = {
  kind: 'form',
  fields: [
    { name: 'title', label: '标题', type: 'text', placeholder: 'Wireless Earbuds Pro' },
    { name: 'desc', label: '描述', type: 'textarea', placeholder: '降噪蓝牙耳机…' },
    { name: 'url', label: 'URL', type: 'text', placeholder: 'shop.com/product/earbuds' },
  ],
  action: '预览',
  run: (_i, f) => {
    const t = (f.title || '').slice(0, 60);
    const d = (f.desc || '').slice(0, 160);
    return {
      text: `标题(${t.length})：\n${t}\n\n描述(${d.length})：\n${d}`,
      html: `<div class="ct-serp"><div class="ct-serp-title">${escapeHtml(t)}</div><div class="ct-serp-url">${escapeHtml(f.url || 'shop.com')}</div><div class="ct-serp-desc">${escapeHtml(d)}</div></div>`,
    };
  },
};

const trendFinder: Impl = {
  kind: 'generator',
  fields: [{ name: 'topic', label: '品类', type: 'text', placeholder: 'home gym' }],
  action: '洞察',
  run: (_i, f) => {
    const t = (f.topic || '').trim();
    if (!t) return { text: '请输入品类。' };
    return {
      text: `关于「${t}」的本地趋势启发（非实时数据）：\n- 长尾方向：${t} for small space / ${t} 2026 / ${t} gift\n- 内容角度：测评、使用教程、对比\n- 用关键词密度/竞品词差工具量化机会`,
    };
  },
};

const rankTrackerLocal: Impl = {
  kind: 'csv',
  placeholder: 'wireless earbuds,12,9,7\nbluetooth earbuds,20,18,15',
  inputLabel: '每行：关键词,第1次排名,第2次,第3次',
  outputLabel: '排名变化',
  action: '追踪',
  run: (input) => {
    const rows = parseCSV(input).filter((r) => r.length >= 2);
    const table: string[][] = [['关键词', '首次', '末次', '变化']];
    for (const r of rows) {
      const first = parseInt(r[1]);
      const last = parseInt(r[r.length - 1]);
      if (isNaN(first) || isNaN(last)) continue;
      const delta = first - last;
      table.push([r[0], r[1], r[r.length - 1], (delta > 0 ? '↑+' : '') + delta + (delta > 0 ? ' (提升)' : delta < 0 ? ' (下降)' : ' (持平)')]);
    }
    return { table, text: toCSV(table), downloadName: 'rank.csv', downloadType: 'text/csv' };
  },
};

// ---------- v7.0 productivity ----------
const batchRename: Impl = {
  kind: 'text',
  fields: [{ name: 'rule', label: '规则(前缀+序号)，如 SKU-', type: 'text', placeholder: 'SKU-' }],
  placeholder: 'photo.jpg\nimage.png\npic.webp',
  inputLabel: '原文件名(每行一个)',
  outputLabel: '新文件名',
  action: '预览',
  run: (input, f) => {
    const prefix = f.rule || 'file-';
    const names = lines(input).filter(Boolean);
    const out = names.map((n, i) => `${prefix}${String(i + 1).padStart(3, '0')}${n.slice(n.lastIndexOf('.'))}`);
    return { text: out.join('\n'), table: names.map((n, i) => [n, out[i]]), downloadName: 'rename-map.csv', downloadType: 'text/csv' };
  },
};

const bulkImageResize: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'max', label: '最长边(px)', type: 'number', defaultVal: '1000' }],
  action: '缩放',
  runFile: async (files, fields) => {
    const max = parseInt(fields.max) || 1000;
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bmp = await loadImage(file);
      const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
      const w = Math.round(bmp.width * scale);
      const h = Math.round(bmp.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
      out.push({ name: file.name.replace(/(\.\w+)$/, '-' + w + 'x' + h + '$1'), url: canvas.toDataURL('image/png') });
    }
    return { files: out };
  },
};

const bulkConvert: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'fmt', label: '目标格式', type: 'select', options: ['image/png', 'image/jpeg', 'image/webp'], defaultVal: 'image/png' }],
  action: '转换',
  runFile: async (files, fields) => {
    const fmt = fields.fmt || 'image/png';
    const ext = fmt.split('/')[1];
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bmp = await loadImage(file);
      const canvas = document.createElement('canvas');
      canvas.width = bmp.width;
      canvas.height = bmp.height;
      canvas.getContext('2d')!.drawImage(bmp, 0, 0);
      out.push({ name: file.name.replace(/\.\w+$/, '.' + ext), url: canvas.toDataURL(fmt) });
    }
    return { files: out };
  },
};

const csvMerge: Impl = {
  kind: 'compare',
  inputLabel: 'CSV A',
  outputLabel: '合并结果',
  action: '合并',
  runCompare: (left, right) => {
    const a = parseCSV(left);
    const b = parseCSV(right);
    if (!a.length && !b.length) return { text: '' };
    const headerA = a[0] || [];
    const headerB = b[0] || [];
    if (headerA.join() === headerB.join()) {
      const merged = [...a, ...b.slice(1)];
      return { text: toCSV(merged), downloadName: 'merged.csv', downloadType: 'text/csv' };
    }
    const merged = [['#A', ...headerA], ...a.slice(1).map((r) => ['A', ...r]), ['#B', ...headerB], ...b.slice(1).map((r) => ['B', ...r])];
    return { text: toCSV(merged), downloadName: 'merged.csv', downloadType: 'text/csv' };
  },
};

const jsonToCsv: Impl = {
  kind: 'text',
  placeholder: '[{"name":"A","price":1},{"name":"B","price":2}]',
  inputLabel: 'JSON 数组',
  outputLabel: 'CSV',
  action: '转换',
  run: (input) => {
    let arr: any[];
    try {
      arr = JSON.parse(input);
    } catch (e) {
      return { text: 'JSON 错误：' + (e as Error).message };
    }
    if (!Array.isArray(arr) || !arr.length) return { text: '需要非空 JSON 数组。' };
    const keys = Array.from(new Set(arr.flatMap((o) => (o && typeof o === 'object' ? Object.keys(o) : []))));
    const rows = [keys, ...arr.map((o) => keys.map((k) => (o && typeof o === 'object' ? String((o as any)[k] ?? '') : String(o))))];
    return { text: toCSV(rows), downloadName: 'output.csv', downloadType: 'text/csv' };
  },
};

const csvToJson: Impl = {
  kind: 'text',
  placeholder: 'name,price\nA,1\nB,2',
  inputLabel: 'CSV(含表头)',
  outputLabel: 'JSON',
  action: '转换',
  run: (input) => {
    const rows = parseCSV(input);
    if (rows.length < 2) return { text: '数据不足。' };
    const head = rows[0];
    const arr = rows.slice(1).map((r) => {
      const o: Record<string, string> = {};
      head.forEach((h, i) => (o[h] = r[i] ?? ''));
      return o;
    });
    const text = JSON.stringify(arr, null, 2);
    return { text, html: `<pre class="ct-code">${escapeHtml(text)}</pre>`, downloadName: 'output.json', downloadType: 'application/json' };
  },
};

const xmlFormat: Impl = {
  kind: 'text',
  placeholder: '<a><b>1</b><c>2</c></a>',
  inputLabel: 'XML',
  outputLabel: '格式化',
  action: '格式化',
  run: (input) => {
    const pretty = formatXml(input);
    if (!pretty) return { text: 'XML 解析失败，请检查标签是否闭合。' };
    return { text: pretty, html: `<pre class="ct-code">${escapeHtml(pretty)}</pre>`, downloadName: 'formatted.xml', downloadType: 'application/xml' };
  },
};

const yamlConvert: Impl = {
  kind: 'text',
  placeholder: 'name: A\nprice: 1',
  inputLabel: 'YAML 或 JSON',
  outputLabel: '转换结果',
  action: '转换',
  run: (input) => {
    const trimmed = input.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      let obj: any;
      try {
        obj = JSON.parse(input);
      } catch (e) {
        return { text: 'JSON 错误：' + (e as Error).message };
      }
      return { text: objToYaml(obj), downloadName: 'output.yaml', downloadType: 'text/yaml' };
    }
    const obj = yamlToObj(input);
    if (obj === undefined) return { text: 'YAML 解析失败（仅支持简单键值/数组）。' };
    return { text: JSON.stringify(obj, null, 2), html: `<pre class="ct-code">${escapeHtml(JSON.stringify(obj, null, 2))}</pre>`, downloadName: 'output.json', downloadType: 'application/json' };
  },
};

const envManager: Impl = {
  kind: 'text',
  placeholder: 'API_KEY=abc\nDEBUG=true\n# comment\nDB_URL=postgres://x',
  inputLabel: '.env 文本',
  outputLabel: '解析',
  action: '解析',
  run: (input) => {
    const rows = parseCSV(input);
    const map = new Map<string, string>();
    for (const l of lines(input)) {
      if (!l || l.startsWith('#')) continue;
      const idx = l.indexOf('=');
      if (idx < 0) continue;
      map.set(l.slice(0, idx).trim(), l.slice(idx + 1).trim());
    }
    const table: string[][] = [['KEY', 'VALUE']];
    for (const [k, v] of map) table.push([k, v]);
    return { table, text: toCSV(table), downloadName: 'env.csv', downloadType: 'text/csv' };
  },
};

const loremGen: Impl = {
  kind: 'generator',
  fields: [{ name: 'paras', label: '段落数', type: 'number', defaultVal: '3' }, { name: 'words', label: '每句词数', type: 'number', defaultVal: '12' }],
  action: '生成',
  run: (_i, f) => {
    const paras = Math.min(parseInt(f.paras) || 3, 50);
    const wlen = Math.max(4, parseInt(f.words) || 12);
    const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud'.split(' ');
    const out: string[] = [];
    for (let p = 0; p < paras; p++) {
      let s = '';
      for (let i = 0; i < wlen; i++) s += words[Math.floor(Math.random() * words.length)] + ' ';
      out.push(s.trim().replace(/^./, (c) => c.toUpperCase()) + '.');
    }
    return { text: out.join('\n\n'), downloadName: 'lorem.txt', downloadType: 'text/plain' };
  },
};

const cronTester: Impl = {
  kind: 'form',
  fields: [{ name: 'expr', label: 'cron 表达式', type: 'text', placeholder: '*/15 * * * *' }],
  action: '解析',
  run: (_i, f) => {
    const e = (f.expr || '').trim();
    const parts = e.split(/\s+/);
    if (parts.length !== 5) return { text: 'cron 需 5 段：分 时 日 月 周' };
    const labels = ['分钟', '小时', '日', '月', '星期'];
    const ok = parts.every((p) => /^(\*|\*\/\d+|\d+(-\d+)?(,\d+)*)$/.test(p));
    if (!ok) return { text: '表达式含有不支持的语法（仅支持 *、*/n、列表、范围）。' };
    let text = '含义：\n';
    parts.forEach((p, i) => (text += `- ${labels[i]}：${p === '*' ? '每' : p}\n`));
    text += '\n示例触发：每分钟档每 15 分表示 :00 :15 :30 :45。';
    return { text };
  },
};

const mdPreview: Impl = {
  kind: 'text',
  placeholder: '# 标题\n\n**粗体** 与 *斜体*\n\n- 列表项',
  inputLabel: 'Markdown',
  outputLabel: '预览',
  action: '预览',
  run: (input) => {
    return { html: `<div class="ct-md">${mdToHtml(input)}</div>` };
  },
};

const diffViewer: Impl = {
  kind: 'compare',
  inputLabel: '文件 A',
  outputLabel: '差异',
  action: '对比',
  runCompare: (left, right) => {
    const a = lines(left);
    const b = lines(right);
    const setB = new Set(b);
    const setA = new Set(a);
    const onlyA = a.filter((x) => !setB.has(x));
    const onlyB = b.filter((x) => !setA.has(x));
    return {
      text: `A 独有（${onlyA.length}）：\n${onlyA.map((x) => '- ' + x).join('\n')}\n\nB 独有（${onlyB.length}）：\n${onlyB.map((x) => '+ ' + x).join('\n')}`,
    };
  },
};

const base64File: Impl = {
  kind: 'file',
  fileKind: 'any',
  action: '编码',
  runFile: async (files) => {
    const out: string[] = [];
    for (const file of files) {
      const buf = new Uint8Array(await file.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      out.push(`# ${file.name}\n${btoa(bin)}`);
    }
    return { text: out.join('\n\n'), downloadName: 'base64.txt', downloadType: 'text/plain' };
  },
};

const colorPalette: Impl = {
  kind: 'canvas',
  canvas: 'color',
  fields: [{ name: 'hex', label: '主色 HEX', type: 'text', placeholder: '#2e7d32' }],
  action: '生成',
};

const faviconGen: Impl = {
  kind: 'file',
  fileKind: 'image',
  fields: [{ name: 'sizes', label: '尺寸(逗号)', type: 'text', defaultVal: '16,32,48,64,128,180,192' }],
  action: '生成',
  runFile: async (files, fields) => {
    const sizes = (fields.sizes || '16,32,48,64,128,192').split(',').map((s) => parseInt(s.trim())).filter((n) => n > 0);
    const out: { name: string; url: string }[] = [];
    for (const file of files) {
      const bmp = await loadImage(file);
      for (const sz of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = sz;
        canvas.height = sz;
        canvas.getContext('2d')!.drawImage(bmp, 0, 0, sz, sz);
        out.push({ name: file.name.replace(/(\.\w+)$/, `-${sz}x${sz}$1`), url: canvas.toDataURL('image/png') });
      }
    }
    return { files: out };
  },
};

const placeholderGen: Impl = {
  kind: 'canvas',
  canvas: 'placeholder',
  fields: [
    { name: 'w', label: '宽', type: 'number', defaultVal: '600' },
    { name: 'h', label: '高', type: 'number', defaultVal: '400' },
    { name: 'color', label: '背景色 HEX', type: 'text', defaultVal: '#e2e8f0' },
    { name: 'text', label: '文字', type: 'text', placeholder: '600 × 400' },
  ],
  action: '生成',
};

const shortcutRef: Impl = {
  kind: 'generator',
  action: '查看',
  run: () => {
    const items = [
      ['Ctrl/⌘ + C', '复制'],
      ['Ctrl/⌘ + V', '粘贴'],
      ['Ctrl/⌘ + Z', '撤销'],
      ['Ctrl/⌘ + A', '全选'],
      ['Ctrl/⌘ + F', '查找'],
      ['Ctrl/⌘ + S', '保存（网页需配合导出）'],
      ['Ctrl/⌘ + Shift + N', '无痕窗口'],
      ['F5 / ⌘ + R', '刷新'],
      ['Ctrl/⌘ + L', '聚焦地址栏'],
      ['Alt + Tab', '切换窗口'],
    ];
    return { text: items.map((r) => `${r[0].padEnd(20)} ${r[1]}`).join('\n'), table: [['快捷键', '功能'], ...items] };
  },
};

const templateManager: Impl = {
  kind: 'form',
  fields: [
    { name: 'tpl', label: '模板(用 {变量} 占位)', type: 'textarea', placeholder: '您好 {name}，您的订单 {order} 已发货。' },
    { name: 'vars', label: '变量值(每行 名称=值)', type: 'textarea', placeholder: 'name=张三\norder=A123' },
  ],
  action: '渲染',
  run: (_i, f) => {
    const tpl = f.tpl || '';
    const vars: Record<string, string> = {};
    for (const l of lines(f.vars || '')) {
      const i = l.indexOf('=');
      if (i > 0) vars[l.slice(0, i).trim()] = l.slice(i + 1).trim();
    }
    const out = tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return { text: out };
  },
};

const clipboardHistory: Impl = {
  kind: 'generator',
  action: '读取',
  run: async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return { text: '当前浏览器不支持读取剪贴板（需 HTTPS + 授权）。' };
      const txt = await navigator.clipboard.readText();
      return { text: txt || '（剪贴板为空）' };
    } catch {
      return { text: '读取剪贴板被拒绝或未授权。' };
    }
  },
};

// ---------- registry ----------
export const TOOL_IMPLS: Record<string, Impl> = {
  // v4 data
  'csv-cleaner': csvCleaner,
  'keyword-frequency': keywordFrequency,
  'price-compare': priceCompare,
  'fx-bulk': fxBulk,
  'stock-alert': stockAlert,
  'profit-report': profitReport,
  'review-analyzer': reviewAnalyzer,
  'volumetric-weight': volumetricWeight,
  'shipping-estimator': shippingEstimator,
  dedupe: dedupe,
  'asin-batch': asinBatch,
  'pivot-lite': pivotLite,
  // v5 compliance
  'brand-check': brandCheck,
  'restricted-words': restrictedWords,
  'glossary-translate': glossaryTranslate,
  'receipt-ocr': receiptOcr,
  'watermark-batch': watermarkBatch,
  'thumbnail-gen': thumbnailGen,
  'image-collage': imageCollage,
  'pdf-encrypt': pdfEncrypt,
  'pdf-page-number': pdfPageNumber,
  'diff-text': diffText,
  'regex-tester': regexTester,
  'uuid-generator': uuidGenerator,
  'qr-batch': qrBatch,
  'color-convert': colorConvert,
  'markdown-table': markdownTable,
  'listing-template': listingTemplate,
  // v6 seo
  'keyword-cluster': keywordCluster,
  'long-tail-gen': longTailGen,
  'meta-gen': metaGen,
  'slug-gen': slugGen,
  'title-tag-tester': titleTagTester,
  'desc-gen': descGen,
  'alt-text-gen': altTextGen,
  'keyword-density': keywordDensity,
  'lsi-words': lsiWords,
  'question-miner': questionMiner,
  'niche-finder': nicheFinder,
  'competitor-gap': competitorGap,
  'content-outline': contentOutline,
  'breadcrumb-gen': breadcrumbGen,
  'hreflang-check': hreflangCheck,
  'sitemap-validate': sitemapValidate,
  'robots-gen': robotsGen,
  'serp-preview': serpPreview,
  'trend-finder': trendFinder,
  'rank-tracker-local': rankTrackerLocal,
  // v7 productivity
  'batch-rename': batchRename,
  'bulk-image-resize': bulkImageResize,
  'bulk-convert': bulkConvert,
  'csv-merge': csvMerge,
  'json-to-csv': jsonToCsv,
  'csv-to-json': csvToJson,
  'xml-format': xmlFormat,
  'yaml-convert': yamlConvert,
  'env-manager': envManager,
  'lorem-gen': loremGen,
  'cron-tester': cronTester,
  'md-preview': mdPreview,
  'diff-viewer': diffViewer,
  'base64-file': base64File,
  'color-palette': colorPalette,
  'favicon-gen': faviconGen,
  'placeholder-gen': placeholderGen,
  'shortcut-ref': shortcutRef,
  'template-manager': templateManager,
  'clipboard-history': clipboardHistory,
};

export function getImpl(slug: string): Impl | undefined {
  return TOOL_IMPLS[slug];
}

// ---------- client-side helpers (only used in browser) ----------
async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // keep url for drawImage; revoke later by caller if needed
  }
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split('');
  const lines: string[] = [];
  let cur = '';
  for (const ch of words) {
    if (ctx.measureText(cur + ch).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else cur += ch;
  }
  if (cur) lines.push(cur);
  return lines;
}
function parseColor(s: string): { r: number; g: number; b: number } | null {
  s = s.trim();
  if (s.startsWith('#')) {
    let h = s.slice(1);
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  const rgb = /rgba?\(([^)]+)\)/.exec(s);
  if (rgb) {
    const p = rgb[1].split(',').map((x) => parseFloat(x));
    return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0 };
  }
  const hsl = /hsla?\(([^)]+)\)/.exec(s);
  if (hsl) {
    const p = hsl[1].split(',').map((x) => parseFloat(x));
    return hslToRgb(p[0] || 0, (p[1] || 0) / 100, (p[2] || 0) / 100);
  }
  return null;
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslToRgb(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^\w一-龥\s-]/g, '').trim().replace(/\s+/g, '-');
}
function mdToHtml(md: string): string {
  return md
    .split(/\n{2,}/)
    .map((block) => {
      if (block.startsWith('# ')) return `<h1>${escapeHtml(block.slice(2))}</h1>`;
      if (block.startsWith('## ')) return `<h2>${escapeHtml(block.slice(3))}</h2>`;
      if (block.startsWith('- ')) return `<ul>${block.split('\n').map((l) => `<li>${escapeHtml(l.slice(2))}</li>`).join('')}</ul>`;
      return `<p>${escapeHtml(block).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`;
    })
    .join('');
}
function formatXml(xml: string): string {
  let formatted = '';
  let pad = 0;
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(/^\s*<\?xml[^>]*\?>\s*/, '');
  const wrapped = xml.replace(reg, '$1\n$2$3');
  wrapped.split('\n').forEach((node) => {
    let indent = 0;
    if (/^<\/\w/.test(node)) pad = Math.max(0, pad - 1);
    formatted += '  '.repeat(pad) + node + '\n';
    if (/^<\w[^>]*[^\/]>$/.test(node) && !/^<.*<\/.*>$/.test(node)) pad++;
  });
  return formatted.trim();
}
function objToYaml(obj: any, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(obj)) return obj.map((v) => `${pad}- ${typeof v === 'object' ? '\n' + objToYaml(v, indent + 1) : String(v)}`).join('\n');
  if (obj && typeof obj === 'object') return Object.entries(obj).map(([k, v]) => `${pad}${k}: ${typeof v === 'object' ? '\n' + objToYaml(v, indent + 1) : String(v)}`).join('\n');
  return String(obj);
}
function yamlToObj(yaml: string): any {
  const lines = yaml.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith('#'));
  const obj: Record<string, any> = {};
  for (const l of lines) {
    const i = l.indexOf(':');
    if (i < 0) continue;
    const k = l.slice(0, i).trim();
    const v = l.slice(i + 1).trim();
    if (v === '') obj[k] = null;
    else if (!isNaN(Number(v))) obj[k] = Number(v);
    else obj[k] = v;
  }
  return obj;
}
