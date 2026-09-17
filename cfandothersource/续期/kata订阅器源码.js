// =============================================
// 用户配置与安全全局变量
// =============================================
const IP_BAN_STORE = new Map(); // 存储格式: ip -> { count: 失败次数, banUntil: 封禁截止时间戳 }
const MAX_FAILED_ATTEMPTS = 5;  // 最大尝试次数
const BAN_DURATION = 10 * 60 * 1000; // 封禁时长 (10分钟)

/**
 * 管理后台登录密码（访问 /admin 需要输入）
 */
const ADMIN_PWD = '990299'; // 请在翼龙面板启动参数中设置 ADMIN_PWD 环境变量 或直接在此处填写密码
const DEFAULT_REGIONS = []; // Kata节点：留空使用管理后台配置
const DEFAULT_LIMIT = 0; // Kata节点：每区不限数量

/**
 * /sub 接口默认 ProxyIP（留空 = 不使用中转）
 */
const DEFAULT_PIP = 'ProxyIP.CMLiussss.net';

const DEFAULT_UUID = '';
const DEFAULT_UUID_WEEKLY_ENABLED = false;

/**
 * 默认节点备注（广告）
 */
const DEFAULT_NODE_REMARK = 'Github@hc990275';
const DEFAULT_NODE_REMARK_ENABLED = true;

/**
 * 机场模拟（原广告节点）：默认开启两条模拟信息
 */
const DEFAULT_AD_ENABLED = true;
const DEFAULT_AD_NAME = JSON.stringify(['套餐到期：长期有效', '剩余流量：999.99 PB', '已用流量：1 MB']);

/**
 * TLS 指纹（Fingerprint）：推荐 chrome
 */
const DEFAULT_FP = 'chrome';

/**
 * ALPN 标识（逗号分隔），例如 h3,h2,http/1.1 或 h2,http/1.1
 */
const DEFAULT_ALPN = '';

/**
 * 订阅详情默认值 (流量与到期)
 */
const DEFAULT_SUB_EXPIRE = '2099-01-01';
const DEFAULT_SUB_TOTAL = '1024 GB';
const DEFAULT_SUB_USED = '0 GB';

/**
 * 地区名称映射 (全球主要 Cloudflare 节点所在国家/地区)
 */
const REGION_MAP = {
  // 亚太地区 (Asia Pacific)
  'JP': '日本', 'KR': '韩国', 'SG': '新加坡', 'HK': '香港', 'TW': '台湾',
  'MY': '马来西亚', 'TH': '泰国', 'VN': '越南', 'PH': '菲律宾', 'ID': '印尼',
  'IN': '印度', 'AU': '澳大利亚', 'NZ': '新西兰', 'KH': '柬埔寨', 'MO': '澳门',
  'BD': '孟加拉', 'PK': '巴基斯坦', 'NP': '尼泊尔', 'MN': '蒙古', 'LK': '斯里兰卡',
  'LA': '老挝', 'BN': '文莱', 'MM': '缅甸', 'BT': '不丹', 'MV': '马尔代夫',

  // 北美洲 (North America)
  'US': '美国', 'CA': '加拿大', 'MX': '墨西哥', 'PR': '波多黎各', 'GU': '关岛',

  // 欧洲 (Europe)
  'GB': '英国', 'UK': '英国', 'DE': '德国', 'FR': '法国', 'NL': '荷兰', 'IT': '意大利',
  'ES': '西班牙', 'PT': '葡萄牙', 'RU': '俄罗斯', 'UA': '乌克兰', 'PL': '波兰',
  'SE': '瑞典', 'FI': '芬兰', 'NO': '挪威', 'DK': '丹麦', 'IS': '冰岛',
  'IE': '爱尔兰', 'BE': '比利时', 'LU': '卢森堡', 'CH': '瑞士', 'AT': '奥地利',
  'CZ': '捷克', 'HU': '匈牙利', 'RO': '罗马尼亚', 'BG': '保加利亚', 'GR': '希腊',
  'TR': '土耳其', 'HR': '克罗地亚', 'RS': '塞尔维亚', 'SI': '斯洛文尼亚', 'SK': '斯洛伐克',
  'EE': '爱沙尼亚', 'LV': '拉脱维亚', 'LT': '立陶宛', 'MD': '摩尔多瓦', 'AL': '阿尔巴尼亚',
  'BA': '波黑', 'ME': '黑山', 'MK': '北马其顿', 'CY': '塞浦路斯', 'MT': '马耳他',
  'BY': '白俄罗斯', 'GE': '格鲁吉亚', 'AM': '亚美尼亚', 'AZ': '阿塞拜疆',

  // 南美洲 (South America)
  'BR': '巴西', 'AR': '阿根廷', 'CL': '智利', 'CO': '哥伦比亚', 'PE': '秘鲁',
  'EC': '厄瓜多尔', 'UY': '乌拉圭', 'PY': '巴拉圭', 'VE': '委内瑞拉', 'BO': '玻利维亚',
  'GY': '圭亚那', 'SR': '苏里南',

  // 中美洲与加勒比 (Central America & Caribbean)
  'PA': '巴拿马', 'CR': '哥斯达黎加', 'GT': '危地马拉', 'HN': '洪都拉斯', 'SV': '萨尔瓦多',
  'NI': '尼加拉瓜', 'JM': '牙买加', 'DO': '多米尼加', 'BS': '巴哈马', 'TT': '特立尼达多巴哥',
  'BB': '巴巴多斯', 'CW': '库拉索',

  // 中东与非洲 (Middle East & Africa)
  'ZA': '南非', 'EG': '埃及', 'MA': '摩洛哥', 'DZ': '阿尔及利亚', 'TN': '突尼斯',
  'NG': '尼日利亚', 'KE': '肯尼亚', 'GH': '加纳', 'TZ': '坦桑尼亚', 'UG': '乌干达',
  'MU': '毛里求斯', 'RE': '留尼汪', 'AO': '安哥拉', 'MZ': '莫桑比克', 'SN': '塞内加尔',
  'AE': '阿联酋', 'SA': '沙特', 'IL': '以色列', 'QA': '卡塔尔', 'BH': '巴林',
  'KW': '科威特', 'OM': '阿曼', 'JO': '约旦', 'LB': '黎巴嫩', 'IQ': '伊拉克',
  'KZ': '哈萨克斯坦', 'UZ': '乌兹别克斯坦', 'KG': '吉尔吉斯斯坦'
};

/**
 * 辅助函数：获取国旗 Emoji
 */
function getFlagEmoji(code) {
  if (code === 'TW') return '🇹🇼';
  if (code === 'UK') return '🇬🇧';
  if (!code || code.length !== 2) return '🇺🇳';
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

/**
 * 辅助函数：数字转上标
 */
function toSuperScript(num) {
  const supers = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return num.toString().split('').map(c => supers[c] || c).join('');
}

/**
 * 订阅调用计数器（异步持久化到纯文本文件）
 */
let _subCallCount = 0;


const _worker_main_export = {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*'
          }
        });
      }
      const url = new URL(request.url);

      // 获取 limit 参数
      const limit = parseInt(url.searchParams.get('limit')) || 0;

      // 路径路由
      const rawPath = decodeURIComponent(url.pathname);
      const pathMatches = rawPath.replace(/\/+$/, '')
        .match(/^\/(CFnew|edgetunnel)\/(.+)$/);

      if (pathMatches) {
        const type = pathMatches[1];
        const regions = pathMatches[2];
        const format = type === 'CFnew' ? 'cf_line_short' : 'line';
        return handleRawRequest(regions, format, limit, request.url);
      }

      // 管理后台 (密码保护) - 兼容 /admin 和 /admin/
      const adminPath = url.pathname.replace(/\/+$/, '');
      if (adminPath === '/admin') {
        const clientIp = request.clientIp || 'unknown';
        const now = Date.now();
        const banInfo = IP_BAN_STORE.get(clientIp);

        // 检查是否处于封禁期
        if (banInfo && banInfo.banUntil > now) {
          const remainingMinutes = Math.ceil((banInfo.banUntil - now) / 60000);
          return new Response(getAdminHtml(true, `您的 IP 已被临时封禁，请在 ${remainingMinutes} 分钟后再试。`), {
            headers: { 'content-type': 'text/html; charset=UTF-8' }
          });
        }

        const cookie = request.headers.get('Cookie') || '';
        const auth = cookie.match(/admin_auth=([^;]+)/)?.[1];

        if (auth === ADMIN_PWD) {
          // 登录成功，清除失败记录
          IP_BAN_STORE.delete(clientIp);
          return new Response(getAdminHtml(false), { headers: { 'content-type': 'text/html; charset=UTF-8' } });
        } else {
          // 只有当有 auth 尝试但错误时才计数（排除首次进入）
          let errorMsg = '密码错误，请重试';
          if (auth) {
            const current = IP_BAN_STORE.get(clientIp) || { count: 0, banUntil: 0 };
            current.count++;
            if (current.count >= MAX_FAILED_ATTEMPTS) {
              current.banUntil = now + BAN_DURATION;
              errorMsg = `错误次数过多，IP 已封禁 10 分钟。`;
            } else {
              errorMsg = `密码错误！还剩 ${MAX_FAILED_ATTEMPTS - current.count} 次尝试机会。`;
            }
            IP_BAN_STORE.set(clientIp, current);
          }
          return new Response(getAdminHtml(true, auth ? errorMsg : ''), { headers: { 'content-type': 'text/html; charset=UTF-8' } });
        }
      }

      // 接口 (管理后台相关)
      if (adminPath === '/api/config') return handleConfigApi(request, env);
      if (url.searchParams.has('api')) return handleApiRequest(url, env);
      if (url.searchParams.has('get_regions')) return handleGetRegions();

      // 订阅接口 —— 返回 Base64 编码的多行 VLESS 链接
      if (url.pathname === '/sub') {
        // NOTE: 每次调用 /sub 计数+1
        _subCallCount++;
        if (env.isNode && typeof env.incrementCounter === 'function') {
          env.incrementCounter(); // 异步持久化，不阻塞响应
        }
        return handleSubRequest(url, env, request);
      }

      const config = getAppConfig(env);
      return new Response(getHtml(config, url, _subCallCount), { headers: { 'content-type': 'text/html; charset=UTF-8' } });
    } catch (globalError) {
      return new Response('Global Fetch Error: ' + globalError.message + '\n\nStack:\n' + globalError.stack, {
        status: 500,
        headers: { 'content-type': 'text/plain; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};

async function handleGetRegions() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/hc990275/yx/main/cfyxip.txt");
    const text = await res.text();
    const matches = text.match(/#[A-Z]+/g) || [];
    const counts = {};
    matches.forEach(tag => {
      const region = tag.replace('#', '');
      counts[region] = (counts[region] || 0) + 1;
    });
    const regions = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return new Response(JSON.stringify(regions), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response('[]', { headers: { 'content-type': 'application/json' } });
  }
}

async function handleApiRequest(url, env) {
  const config = getAppConfig(env);
  const regionStr = url.searchParams.get('region') || (config.regions && config.regions.length > 0 ? config.regions.join(',') : '');
  const limit = parseInt(url.searchParams.get('limit')) || config.limit || 0;
  const format = url.searchParams.get('format') || 'line';
  return handleRawRequest(regionStr, format, limit, url.toString());
}

async function handleRawRequest(regionStr, format, limit = 0, requestUrl = null) {
  const decoded = decodeURIComponent(regionStr);

  const targetRegions = decoded.split(/[,-]/)
    .map(r => r.trim().toUpperCase())
    .filter(r => r);

  let needBase64 = false;
  if (requestUrl) {
    const urlObj = new URL(requestUrl);
    needBase64 = urlObj.searchParams.has('base64') && urlObj.searchParams.get('base64') !== '0';
  }

  try {
    const response = await fetch("https://raw.githubusercontent.com/hc990275/yx/main/cfyxip.txt");
    let text = await response.text();
    text = text.replace(/^\uFEFF/, '');
    const lines = text.split('\n');

    const regionPools = {};

    targetRegions.forEach(r => regionPools[r] = []);

    for (const line of lines) {
      if (!line.includes('#')) continue;
      const parts = line.split('#');
      const ipPort = parts[0].trim();

      // 使用更宽松的正则提取第一个字母组合作为区域代码（如 #HK 日本 -> HK）
      const codeMatch = parts[1].match(/[A-Z]+/i);
      const code = codeMatch ? codeMatch[0].toUpperCase() : '';

      if (regionPools[code]) {
        regionPools[code].push({ line, code, ipPort });
      }
    }

    let selectedItems = [];

    for (const region of targetRegions) {
      const pool = regionPools[region];

      if (!pool || pool.length === 0) continue;
      if (limit > 0 && pool.length > limit) {
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        selectedItems.push(...shuffled.slice(0, limit));
      } else {
        selectedItems.push(...pool);
      }
    }

    const processed = [];
    const isCFStyle = format.startsWith('cf') || format === 'comma';
    const isShortName = format.includes('short');
    const isLineSeparated = format.includes('line');
    const regionCounters = {};

    for (const item of selectedItems) {
      const { line, code, ipPort } = item;

      const flag = getFlagEmoji(code);
      const name = REGION_MAP[code] || code;

      regionCounters[code] = (regionCounters[code] || 0) + 1;

      if (isCFStyle) {
        const countStr = toSuperScript(regionCounters[code]);
        const port = ipPort.split(':')[1] || '';

        let nodeName = `${flag} ${name}${countStr}`;
        if (!isShortName) nodeName += `-${port}`;

        processed.push(`${ipPort}#${nodeName}`);
      } else {
        const seq = String(regionCounters[code]).padStart(2, '0');
        processed.push(`${ipPort}#${flag} ${name} ${seq}`);
      }
    }

    const separator = (format.includes('comma') && !isLineSeparated) ? ',' : '\n';
    let resultStr = processed.join(separator);

    if (needBase64) {
      resultStr = btoa(unescape(encodeURIComponent(resultStr)));
    }

    return new Response(resultStr, {
      headers: {
        'content-type': 'text/plain; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      }
    });

  } catch (e) {
    return new Response("Error fetching data: " + e.message, { status: 500 });
  }
}

function getHtml(config, url, callCount = 0) {
  const { regions, limit, pip, uuid, uuidInfo, uuidWeeklyEnabled, adEnabled, nodeRemark } = config;
  const regionNames = regions && regions.length > 0 ? regions.map(r => REGION_MAP[r] || r).join('、') : '全部地区';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>订阅控制台</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC',sans-serif;background:#0d0520;color:#f0e6ff;min-height:100vh;overflow-x:hidden}
.bg{position:fixed;inset:0;z-index:-2;background:linear-gradient(135deg,#0d0520 0%,#1a0a3e 40%,#0d1a3a 70%,#1a0520 100%)}
.star{position:fixed;border-radius:50%;animation:twinkle var(--d,3s) ease-in-out infinite;opacity:0}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(1)}50%{opacity:var(--o,.7);transform:scale(1.4)}}
.petal{position:fixed;top:-30px;font-size:var(--s,18px);animation:fall var(--d,8s) linear infinite;opacity:.6;z-index:-1}
@keyframes fall{0%{transform:translateY(-30px) rotate(0deg) translateX(0);opacity:.7}100%{transform:translateY(110vh) rotate(720deg) translateX(var(--x,60px));opacity:0}}
.glass{background:rgba(255,255,255,.05);backdrop-filter:blur(20px);border:1px solid rgba(255,180,220,.15);border-radius:24px}
.glass-pink{background:rgba(255,105,180,.06);backdrop-filter:blur(20px);border:1px solid rgba(255,150,200,.2);border-radius:24px}
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,180,220,.1);border-radius:18px;padding:18px;transition:all .3s}
.card:hover{background:rgba(255,180,220,.08);border-color:rgba(255,150,200,.3);transform:translateY(-4px)}
.title-grad{background:linear-gradient(135deg,#ff9de2,#c084fc,#67e8f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.badge{font-size:10px;font-weight:700;letter-spacing:.1em;padding:3px 10px;border-radius:20px;background:rgba(255,150,200,.1);border:1px solid rgba(255,150,200,.2);color:#e879aa}
.mono{font-family:'Fira Code',monospace}
.dot-live{width:8px;height:8px;border-radius:50%;background:#a78bfa;box-shadow:0 0 10px #a78bfa;animation:pulse-dot 2s infinite}
@keyframes pulse-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.8);opacity:.4}}
.sep{height:1px;background:linear-gradient(90deg,transparent,rgba(255,150,200,.2),transparent);margin:6px 0}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,150,200,.3);border-radius:3px}
/* === 响应式布局 === */
.main-wrap{max-width:960px;margin:0 auto;padding:40px 20px}
.main-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:48px;flex-wrap:wrap;gap:16px}
.main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}
.main-card{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.card-right{display:grid;grid-template-columns:1fr;gap:12px}
.token-row{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
.token-dates{display:flex;gap:20px;flex-wrap:wrap}
.glass-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,180,220,.1);border-radius:18px;padding:18px;transition:all .3s}
.glass-btn:hover{background:rgba(255,180,220,.08);border-color:rgba(255,150,200,.3);transform:translateY(-4px)}

@media(max-width:768px){
  .main-wrap{padding:24px 16px}
  .main-header{margin-bottom:32px}
  .main-grid{grid-template-columns:1fr}
  .main-card{grid-template-columns:1fr;gap:20px}
  .card-right{grid-template-columns:1fr 1fr}
  .card-right{grid-template-columns:1fr}
}

@media(max-width:640px){
  .main-wrap{padding:16px 12px}
  .glass-pink{padding:20px!important}
  .main-header{flex-direction:column;align-items:flex-start;gap:16px;margin-bottom:24px}
  .card-right{grid-template-columns:1fr}
  .token-row{flex-direction:column;align-items:flex-start;gap:12px}
  .token-rotation{display:none!important}
  .footer-wrap{flex-direction:column;align-items:center;gap:10px;text-align:center}
}
</style>
</head>
<body>
<div class="bg"></div>
<div id="stars"></div>
<div id="petals"></div>

<div class="main-wrap">
  <!-- 顶部标题 -->
  <header class="main-header">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:32px">🌸</span>
        <h1 style="font-size:clamp(24px,5vw,36px);font-weight:900" class="title-grad">订阅控制台</h1>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="dot-live"></div>
        <span style="font-size:11px;color:#a78bfa;letter-spacing:.2em;font-weight:700">系统运行中</span>
        <span style="font-size:11px;color:#e879aa;letter-spacing:.1em;font-weight:700;margin-left:10px;background:rgba(232,121,170,0.1);padding:4px 8px;border-radius:12px;">✅ 外部接口共被调用 ${callCount} 次</span>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center">
      <span class="badge mono">v2.3.7</span>
      <a href="/admin" style="background:linear-gradient(135deg,#c084fc,#ec4899);color:#fff;font-weight:700;font-size:12px;padding:10px 20px;border-radius:50px;text-decoration:none;display:flex;align-items:center;gap:6px;box-shadow:0 4px 20px rgba(192,132,252,.4);transition:all .3s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 30px rgba(192,132,252,.5)'" onmouseout="this.style.transform='';this.style.boxShadow='0 4px 20px rgba(192,132,252,.4)'">⚙️ 管理中心</a>
    </div>
  </header>

  <!-- 主信息区 -->
  <div class="main-grid">
    <!-- 顶部快捷入口与复制 (重新设计：增加说明与复制按钮) -->
    <div style="grid-column: 1/-1; display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px; margin-bottom: 24px">
      
      <!-- JOEY.JS -->
      <div class="card" style="border:1px solid rgba(59,130,246,0.2); background: rgba(59,130,246,0.03)">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <span class="badge" style="background:rgba(59,130,246,0.1); color:#60a5fa">JOEY.JS 专用接口</span>
          <i data-lucide="zap" class="w-4 h-4 text-blue-400"></i>
        </div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.6; margin-bottom:15px">
          <p style="color:#60a5fa; font-weight:700; margin-bottom:4px">配置说明：</p>
          进入Joey项目后台找到并点击<span style="color:#fff">延迟测试</span>，再选择<span style="color:#fff">URL获取</span>，再将复制的接口粘贴进<span style="color:#fff">URL框</span>。
        </div>
        <div style="display:flex; gap:8px; justify-content: flex-end">
          <button onclick="copyToClipboard('${url.origin}/sub?joey')" style="background:#3b82f6; color:#fff; border:none; border-radius:8px; padding:8px 20px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; width:100%; justify-content:center">
            <i data-lucide="copy" class="w-4 h-4"></i> 复制 Joey 接口
          </button>
        </div>
      </div>

      <!-- CMLIU -->
      <div class="card" style="border:1px solid rgba(168,85,247,0.2); background: rgba(168,85,247,0.03)">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <span class="badge" style="background:rgba(168,85,247,0.1); color:#c084fc">CMLIU 订阅接口</span>
          <i data-lucide="layers" class="w-4 h-4 text-purple-400"></i>
        </div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.6; margin-bottom:15px">
          <p style="color:#c084fc; font-weight:700; margin-bottom:4px">配置说明：</p>
          进入cmliu项目后台找到并点击<span style="color:#fff">优选订阅生成</span>，选择<span style="color:#fff">优选订阅生成器</span>，再将复制的接口粘贴进<span style="color:#fff">URL输入框</span>。
        </div>
        <div style="display:flex; gap:8px; justify-content: flex-end">
          <button onclick="copyToClipboard('${url.origin}')" style="background:#9333ea; color:#fff; border:none; border-radius:8px; padding:8px 20px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; width:100%; justify-content:center">
            <i data-lucide="copy" class="w-4 h-4"></i> 复制 CMLIU 接口
          </button>
        </div>
      </div>

      <!-- SNI -->
      <div class="card" style="border:1px solid rgba(236,72,153,0.2); background: rgba(236,72,153,0.03)">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <span class="badge" style="background:rgba(236,72,153,0.1); color:#f472b6">SNI 接口说明</span>
          <i data-lucide="globe" class="w-4 h-4 text-pink-400"></i>
        </div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.6; margin-bottom:15px">
          <p style="color:#f472b6; font-weight:700; margin-bottom:4px">配置说明：</p>
          改写代码时的位置一般为<span style="color:#fff">上游订阅器位置</span>。点击下方复制按钮获取接口地址后按需替换。
        </div>
        <div style="display:flex; gap:8px; justify-content: flex-end">
          <button onclick="copyToClipboard('${url.origin}')" style="background:#db2777; color:#fff; border:none; border-radius:8px; padding:8px 20px; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; width:100%; justify-content:center">
            <i data-lucide="copy" class="w-4 h-4"></i> 复制 SNI 接口
          </button>
        </div>
      </div>
    </div>
    <!-- Toast 提示框 -->
    <div id="toast" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(59,130,246,0.9);color:white;padding:10px 20px;border-radius:30px;font-size:12px;font-weight:700;box-shadow:0 5px 15px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:9999">已复制</div>
    </div>
    <div class="glass-pink" style="padding:28px;grid-column:1/-1">
      <div class="main-card">
        <div>
          <p class="badge" style="margin-bottom:12px;width:fit-content">🗺 节点分布</p>
          <div style="font-size:clamp(40px,8vw,64px);font-weight:900;line-height:1" class="title-grad">${regions.length > 0 ? regions.length : '∞'}</div>
          <p style="color:#c084fc;font-size:12px;font-weight:700;letter-spacing:.15em;margin-top:4px">活跃区域</p>
          <p style="color:#a78bfa;font-size:13px;margin-top:12px;line-height:1.6;max-height:80px;overflow-y:auto">${regionNames}</p>
          <div class="sep" style="margin-top:16px"></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
            <span style="font-size:11px;color:#7c3aed;font-weight:700">节点数量上限</span>
            <span style="font-size:20px;font-weight:900;color:#e879aa" class="mono">${limit === 0 ? '不限' : limit}<small style="font-size:10px;opacity:.5"> 个/区</small></span>
          </div>

          <!-- 身份令牌 (已移动至左侧列下方) -->
          <div class="sep" style="margin: 20px 0"></div>
          <div class="token-row">
            <div>
              <p class="badge" style="margin-bottom:8px;width:fit-content">🔑 身份令牌 · 每周自动轮换</p>
              <div class="token-dates">
                <div>
                  <p style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:.1em">上次更新</p>
                  <p style="font-size:13px;color:#e879aa;font-weight:700" class="mono">${uuidInfo.lastUpdate}</p>
                </div>
                <div>
                  <p style="font-size:10px;color:#7c3aed;font-weight:700;letter-spacing:.1em">下次更新</p>
                  <p style="font-size:13px;color:#c084fc;font-weight:900" class="mono">${uuidWeeklyEnabled ? uuidInfo.nextUpdateIn : '已禁用'}</p>
                </div>
              </div>
            </div>
            <div class="token-rotation" style="text-align:right;opacity:${uuidWeeklyEnabled ? '1' : '0.3'}">
              <div style="width:36px;height:36px;background:rgba(59,130,246,${uuidWeeklyEnabled ? '0.15' : '0.05'});border:1px solid rgba(59,130,246,0.3);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;animation:${uuidWeeklyEnabled ? 'pulse-dot 3s ease-in-out infinite' : 'none'};margin-bottom:2px">🔄</div>
              <p style="font-size:8px;color:#7c3aed;font-weight:700;letter-spacing:0.05em;white-space:nowrap">${uuidWeeklyEnabled ? 'WEEKLY ROTATION' : 'ROTATION OFF'}</p>
            </div>
          </div>
        </div>
        <div class="card-right">
          <div class="glass-btn p-5 group flex flex-col items-center justify-center text-center">
            <div class="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <i data-lucide="message-square-more" class="w-5 h-5 text-purple-400"></i>
            </div>
            <div class="text-[10px] text-purple-300/60 font-bold uppercase tracking-wider mb-1">节点备注</div>
            <div class="text-sm font-bold text-white truncate max-w-full">${config.nodeRemarkEnabled ? config.nodeRemark : '已禁用'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>


  <!-- 底部 -->
  <footer class="footer-wrap" style="display:flex;justify-content:space-between;align-items:center;padding-top:24px;border-top:1px solid rgba(255,150,200,.08);opacity:.5;flex-wrap:wrap;gap:8px">
    <span style="font-size:11px;font-weight:700;letter-spacing:.2em">🌸 专业节点订阅服务</span>
    <span class="badge mono">v2.2.2</span>
  </footer>
</div>

<script>
// 生成星星背景
const starsEl = document.getElementById('stars');
for(let i=0;i<80;i++){
  const s=document.createElement('div');
  s.className='star';
  const size=Math.random()*3+1;
  s.style.cssText=\`left:\${Math.random()*100}%;top:\${Math.random()*100}%;width:\${size}px;height:\${size}px;background:#fff;--d:\${Math.random()*4+2}s;--o:\${Math.random()*0.8+0.2};animation-delay:\${Math.random()*5}s\`;
  starsEl.appendChild(s);
}
// 生成樱花飘落
const petalsEl = document.getElementById('petals');
const petalChars = ['🌸','🌺','✿','❀','🌷'];
for(let i=0;i<18;i++){
  const p=document.createElement('div');
  p.className='petal';
  const char=petalChars[Math.floor(Math.random()*petalChars.length)];
  p.textContent=char;
  const size=Math.random()*14+12;
  p.style.cssText=\`left:\${Math.random()*100}%;--s:\${size}px;--d:\${Math.random()*12+6}s;--x:\${(Math.random()-0.5)*120}px;animation-delay:\${Math.random()*10}s\`;
  petalsEl.appendChild(p);
}

function copyToClipboard(text) {
  console.log('copyToClipboard called with:', text);
  const copy = (t) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(t);
    }
    const input = document.createElement('textarea');
    input.value = t;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(input);
    return ok ? Promise.resolve() : Promise.reject();
  };

  copy(text).then(() => {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.innerText = '已复制: ' + text;
      toast.style.opacity = '1';
      setTimeout(() => toast.style.opacity = '0', 2000);
    }
  }).catch(() => {
    alert('复制失败，请点击链接后手动全选复制');
  });
}
</script>
</body>
</html>
`;
}



/**
 * 获取基于周数的 UUID 及其更新状态
 */
function getUuidStatus() {
  const now = new Date();

  // 获取当前周的周一 00:00 UTC
  const monday = new Date(now);
  const day = now.getUTCDay() || 7;
  monday.setUTCDate(now.getUTCDate() - (day - 1));
  monday.setUTCHours(0, 0, 0, 0);

  // 获取下周一 00:00 UTC
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  const diff = +nextMonday - +now;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  // UUID 生成逻辑 (保持与原逻辑一致)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((+d - +yearStart) / 86400000) + 1) / 7);
  const seed = `${d.getUTCFullYear()}-W${weekNo}-CML-Salt`;

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  };

  const rng = (s) => {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  let s = hash;
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) uuid += '-';
    else if (i === 14) uuid += '4';
    else if (i === 19) uuid += hex[(rng(s + i) * 4 | 0) + 8];
    else uuid += hex[rng(s + i) * 16 | 0];
  }

  return {
    uuid,
    lastUpdate: monday.toISOString().split('T')[0],
    nextUpdateIn: `${days}天 ${hours}小时`,
    isWeekly: true
  };
}

// 读取环境配置：优先使用环境变量中的值，若无则使用默认常量。
function getAppConfig(env) {
  let regions = DEFAULT_REGIONS;
  let limit = DEFAULT_LIMIT;
  let pip = DEFAULT_PIP;
  const uuidInfo = getUuidStatus();
  let uuid = DEFAULT_UUID || uuidInfo.uuid;
  let adEnabled = DEFAULT_AD_ENABLED;
  let adName = DEFAULT_AD_NAME;
  let nodeRemark = DEFAULT_NODE_REMARK;
  let nodeRemarkEnabled = DEFAULT_NODE_REMARK_ENABLED;
  let weeklyEnabled = DEFAULT_UUID_WEEKLY_ENABLED;
  let fp = DEFAULT_FP;
  let alpn = DEFAULT_ALPN;
  let lastSaveTime = '';
  let subExpire = DEFAULT_SUB_EXPIRE;
  let subTotal = DEFAULT_SUB_TOTAL;
  let subUsed = DEFAULT_SUB_USED;
  try {
    if (env.SUB_REGIONS) regions = JSON.parse(env.SUB_REGIONS);
  } catch (e) { }
  try {
    if (env.SUB_LIMIT) limit = parseInt(env.SUB_LIMIT);
  } catch (e) { }
  try {
    if (env.SUB_PIP) pip = env.SUB_PIP;
  } catch (e) { }
  try {
    if (env.SUB_UUID) uuid = env.SUB_UUID;
  } catch (e) { }
  try {
    if (env.SUB_UUID_WEEKLY_ENABLED !== undefined) weeklyEnabled = String(env.SUB_UUID_WEEKLY_ENABLED) === 'true';
  } catch (e) { }
  try {
    if (uuid === '' && weeklyEnabled) uuid = uuidInfo.uuid;
  } catch (e) { }
  try {
    if (env.SUB_AD_ENABLED !== undefined) adEnabled = String(env.SUB_AD_ENABLED) === 'true';
  } catch (e) { }
  try {
    if (env.SUB_AD_NAME !== undefined) adName = env.SUB_AD_NAME;
  } catch (e) { }
  try {
    if (env.SUB_NODE_REMARK !== undefined) nodeRemark = env.SUB_NODE_REMARK;
  } catch (e) { }
  try {
    if (env.SUB_NODE_REMARK_ENABLED !== undefined) nodeRemarkEnabled = String(env.SUB_NODE_REMARK_ENABLED) === 'true';
  } catch (e) { }
  try {
    if (env.SUB_LAST_SAVE_TIME) lastSaveTime = env.SUB_LAST_SAVE_TIME;
  } catch (e) { }
  try {
    if (env.SUB_EXPIRE) subExpire = env.SUB_EXPIRE;
    if (env.SUB_TOTAL) subTotal = env.SUB_TOTAL;
    if (env.SUB_USED) subUsed = env.SUB_USED;
  } catch (e) { }
  return { regions, limit, pip, uuid, adEnabled, adName, nodeRemark, nodeRemarkEnabled, lastSaveTime, uuidInfo, uuidWeeklyEnabled: weeklyEnabled, subExpire, subTotal, subUsed };
}

/**
 * 管理后台 HTML
 * showLogin=true  → 显示登录页
 * showLogin=false → 已认证，显示配置面板
 */
function getAdminHtml(showLogin, errorMsg = '') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>订阅管理后台</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<script>tailwind.config={darkMode:'class'}<\/script>
<script src="https://unpkg.com/lucide@latest"><\/script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  body{font-family:'Inter',sans-serif;background:#0f172a;color:#f8fafc;min-height:100vh;}
  .glass{background:rgba(255,255,255,.06);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.1);}
  .region-btn{transition:all .15s;border:2px solid transparent;}
  .region-btn.active{border-color:#3b82f6;background:rgba(59,130,246,.15);font-weight:700;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .fade-in{animation:fadeIn .4s ease-out;}
</style>
</head>
<body class="flex items-start justify-center p-4 min-h-screen">

${showLogin ? `
<!-- 登录页 -->
<div class="glass rounded-3xl p-8 w-full max-w-sm fade-in text-center">
  <div class="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
    <i data-lucide="lock" class="w-7 h-7 text-blue-400"></i>
  </div>
  <h1 class="text-xl font-bold mb-1">管理后台</h1>
  <p class="text-sm text-slate-400 mb-6">请输入密码以继续</p>
  <input id="pwdInput" type="password" placeholder="输入密码" autofocus
    class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-center outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition mb-4"
    onkeydown="if(event.key==='Enter')doLogin()">
  <div id="errMsg" class="${errorMsg ? '' : 'hidden'} text-red-400 text-xs mb-3 italic font-medium ring-1 ring-red-400/20 bg-red-400/5 py-2 rounded-lg">${errorMsg || '密码错误，请重试'}</div>
  <button onclick="doLogin()" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition">
    登 录
  </button>
</div>
<script>
function doLogin(){
  const p=document.getElementById('pwdInput').value;
  document.cookie='admin_auth='+p+';path=/';
  fetch('/admin',{method:'GET',credentials:'include'}).then(r=>{
    if(r.ok && r.url.includes('/admin')){location.reload();}
  });
  // 直接设置 cookie 后刷新让服务端验证
  location.reload();
}
lucide.createIcons();
<\/script>
` : `
<!-- 配置面板 -->
<div class="w-full max-w-3xl fade-in">
  <!-- 顶栏 -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-xl bg-blue-600/20 flex items-center justify-center">
        <i data-lucide="settings-2" class="w-5 h-5 text-blue-400"></i>
      </div>
      <div>
        <h1 class="text-base font-bold">订阅管理后台 <span class="text-[10px] font-normal text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">v1.9.5-PRO</span></h1>
        <p class="text-xs text-slate-400">/sub 接口默认配置</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button onclick="logout()" class="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition flex items-center gap-1.5">
        <i data-lucide="log-out" class="w-3.5 h-3.5"></i> 退出
      </button>
    </div>
  </div>

  <div class="glass rounded-3xl p-6 md:p-8">
    <!-- 地区 -->
    <div class="mb-6">
      <div class="flex flex-wrap items-center justify-between gap-y-2 mb-3">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">默认节点地区 <span class="normal-case font-normal text-slate-500">（留空 = 全部）</span></label>
        <div class="flex gap-2">
          <button onclick="cfgSelectAll()" class="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 transition">全选</button>
          <button onclick="cfgClearAll()" class="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 transition">清空</button>
        </div>
      </div>
      <div id="cfgRegionGrid" class="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-64 overflow-y-auto pr-1">
        <div class="col-span-full text-center text-slate-500 text-xs py-6 animate-pulse">加载地区数据...</div>
      </div>
    </div>

    <!-- 数量 -->
    <div class="mb-6 flex items-center gap-4">
      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">每区节点上限</label>
      <input id="cfgLimitInput" type="number" min="0" value="0"
        class="w-24 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center outline-none focus:border-blue-500 transition">
      <span class="text-xs text-slate-500">0 = 不限制</span>
    </div>

    <!-- ProxyIP -->
    <div class="mb-8">
      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">中转 IP (ProxyIP) <span class="normal-case font-normal text-slate-500">（留空 = 不使用中转）</span></label>
      <div class="space-y-2 mb-3">
        <div class="text-[11px] text-slate-500 font-bold uppercase">⭐ CMLiussss 全部自动</div>
        <div class="flex flex-wrap gap-2">
          <button onclick="setPip('ProxyIP.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🏤 全球自动</button>
        </div>
        <div class="text-[11px] text-slate-500 font-bold uppercase mt-2">🌏 亚洲</div>
        <div class="flex flex-wrap gap-2">
          <button onclick="setPip('ProxyIP.HK.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇭🇰 香港</button>
          <button onclick="setPip('ProxyIP.SG.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇸🇬 新加坡</button>
          <button onclick="setPip('ProxyIP.JP.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇯🇵 日本</button>
          <button onclick="setPip('ProxyIP.KR.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇰🇷 韩国</button>
          <button onclick="setPip('ProxyIP.IN.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇮🇳 印度</button>
        </div>
        <div class="text-[11px] text-slate-500 font-bold uppercase mt-2">🇪🇺 欧洲</div>
        <div class="flex flex-wrap gap-2">
          <button onclick="setPip('ProxyIP.GB.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇬🇧 英国</button>
          <button onclick="setPip('ProxyIP.FR.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇫🇷 法国</button>
          <button onclick="setPip('ProxyIP.DE.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇩🇪 德国</button>
          <button onclick="setPip('ProxyIP.NL.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇳🇱 荷兰</button>
          <button onclick="setPip('ProxyIP.SE.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇸🇪 瑞典</button>
          <button onclick="setPip('ProxyIP.FI.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇫🇮 芬兰</button>
          <button onclick="setPip('ProxyIP.PL.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇵🇱 波兰</button>
          <button onclick="setPip('ProxyIP.RU.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇷🇺 俄罗斯</button>
          <button onclick="setPip('ProxyIP.CH.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇨🇭 瑞士</button>
          <button onclick="setPip('ProxyIP.LV.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇱🇻 拉脱维亚</button>
        </div>
        <div class="text-[11px] text-slate-500 font-bold uppercase mt-2">🇺🇸 北美</div>
        <div class="flex flex-wrap gap-2">
          <button onclick="setPip('ProxyIP.US.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇺🇸 美国</button>
          <button onclick="setPip('ProxyIP.CA.CMLiussss.net')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇨🇦 加拿大</button>
        </div>
        <div class="text-[11px] text-slate-500 font-bold uppercase mt-2">📣 第三方</div>
        <div class="flex flex-wrap gap-2">
          <button onclick="setPip('kr.william.us.ci')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇰🇷 韩国 (William)</button>
          <button onclick="setPip('tw.william.us.ci')" class="pip-btn px-2 py-1 rounded-lg bg-slate-700 hover:bg-blue-600/40 text-[11px] transition border border-slate-600">🇹🇼 台湾 (William)</button>
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <input id="cfgPipInput" type="text" placeholder="手动输入或点击上方快选" class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
        <button onclick="setPip('')" class="text-xs px-3 py-2 rounded-xl bg-slate-700 hover:bg-red-600/40 transition border border-slate-600 whitespace-nowrap">清空</button>
      </div>
    </div>

    <!-- UUID -->
    <div class="mb-8 p-4 rounded-2xl border border-slate-700 bg-slate-800/50">
      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">UUID <span class="normal-case font-normal text-slate-500">（留空则根据下方开关逻辑处理）</span></label>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <input id="cfgUuidInput" type="text" placeholder="留空则由Worker 的 uuid= 参数决定"
          class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
        <button onclick="randomUuid()" title="随机生成 UUID"
          class="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/60 transition border border-purple-500/40 whitespace-nowrap">
          <i data-lucide="dices" class="w-3.5 h-3.5"></i> 随机
        </button>
        <button onclick="document.getElementById('cfgUuidInput').value=''" class="text-xs px-3 py-2 rounded-xl bg-slate-700 hover:bg-red-600/40 transition border border-slate-600 whitespace-nowrap">清空</button>
      </div>
      
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700/50">
        <div>
          <p class="text-xs font-bold text-slate-200">每周自动轮换 UUID</p>
          <p class="text-[10px] text-slate-500 mt-0.5">当 UUID 留空时，系统每周自动生成一个动态 ID 增强安全性</p>
        </div>
        <button id="uuidWeeklyToggleBtn" onclick="toggleUuidWeekly()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 bg-blue-500" aria-pressed="true">
          <span id="uuidWeeklyToggleKnob" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-6"></span>
        </button>
      </div>
    </div>

    <!-- 流量与到期 (核心逻辑) -->
    <div class="mb-8 p-4 rounded-2xl border border-slate-700 bg-slate-800/50">
      <label class="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">🔥 订阅详情配置 <span class="normal-case font-normal text-slate-500">（用于显示在机器人的流量详情中）</span></label>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="text-[10px] text-slate-500 font-bold uppercase mb-1 block">到期日期</label>
          <input id="cfgSubExpire" type="date"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
        </div>
        <div>
          <label class="text-[10px] text-slate-500 font-bold uppercase mb-1 block">总流量 (带单位)</label>
          <input id="cfgSubTotal" type="text" placeholder="例如: 1024 GB"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
        </div>
        <div>
          <label class="text-[10px] text-slate-500 font-bold uppercase mb-1 block">已用流量 (带单位)</label>
          <input id="cfgSubUsed" type="text" placeholder="例如: 10 GB"
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
        </div>
      </div>
      <p class="text-[10px] text-slate-500 mt-2 italic font-medium">提示: 留空则系统会尝试解析下方“机场模拟”中的文字信息。</p>
    </div>

      <!-- 机场模拟 (原广告节点) -->
    <div class="mb-8 p-4 rounded-2xl border border-slate-700 bg-slate-800/50 transition-all duration-300">
      <div class="flex items-center justify-between mb-4">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">机场模拟 <span class="normal-case font-normal text-slate-500">（在订阅最前方插入自定义信息节点）</span></label>
        <div class="flex items-center gap-3">
          <button onclick="addAdRow('')" class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition text-xs font-bold">
            <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> 添加
          </button>
          <button id="adToggleBtn" onclick="toggleAd()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 bg-blue-500" aria-pressed="true">
            <span id="adToggleKnob" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-6"></span>
          </button>
        </div>
      </div>
      <div id="adItemsContainer" class="flex flex-col gap-2 mb-3">
        <!-- 动态添加的配置行将显示在这里 -->
      </div>
      <div id="adActionRow" style="display:none"></div>
      <p class="text-[11px] text-slate-500 mt-2">开启后将从 HK 地区取优选节点，作为模拟信息的载体展示在订阅最上方</p>
    </div>

    <!-- 节点备注 -->
    <div class="mb-8 p-4 rounded-2xl border border-slate-700 bg-slate-800/50">
      <div class="flex items-center justify-between mb-3">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-wider">节点备注 <span class="normal-case font-normal text-slate-500">（追加到每个节点名称后）</span></label>
        <button id="nodeRemarkToggleBtn" onclick="toggleNodeRemark()" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 bg-slate-600" aria-pressed="false">
          <span id="nodeRemarkToggleKnob" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-1"></span>
        </button>
      </div>
      <input id="cfgNodeRemarkInput" type="text" placeholder="例如：@hc990275"
        class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
    </div>


    <div class="flex flex-col gap-3">
      <div class="flex gap-3">
        <button onclick="saveKvConfig()" class="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition shadow-lg shadow-blue-500/20">
          <i data-lucide="save" class="w-4 h-4"></i> 保存设置
        </button>
        <button onclick="loadKvConfig()" class="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 font-bold px-5 py-3 rounded-2xl transition">
          <i data-lucide="refresh-cw" id="refreshIcon" class="w-4 h-4"></i>
        </button>
      </div>
      <div id="cfgLastSaveTime" class="text-center text-[11px] text-slate-500 mt-1">最后保存时间: 未知</div>
    </div>
  </div>

  <!-- Toast -->
  <div id="toast" class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-xl opacity-0 transition-opacity pointer-events-none">已保存</div>
</div>

<script>
  const regionMap = {
    'JP':'日本','KR':'韩国','SG':'新加坡','HK':'香港','TW':'台湾','MY':'马来西亚','TH':'泰国',
    'VN':'越南','PH':'菲律宾','ID':'印尼','IN':'印度','AU':'澳大利亚','NZ':'新西兰',
    'US':'美国','CA':'加拿大','MX':'墨西哥',
    'GB':'英国','DE':'德国','FR':'法国','NL':'荷兰','IT':'意大利','ES':'西班牙',
    'PT':'葡萄牙','RU':'俄罗斯','SE':'瑞典','FI':'芬兰','NO':'挪威','CH':'瑞士',
    'AT':'奥地利','PL':'波兰','TR':'土耳其','UA':'乌克兰','BE':'比利时',
    'BR':'巴西','AR':'阿根廷','CL':'智利','CO':'哥伦比亚',
    'ZA':'南非','AE':'阿联酋','SA':'沙特','IL':'以色列','SG':'新加坡',
    'KZ':'哈萨克斯坦'
  };
  function getFlag(c){
    if(c==='TW')return'🇹🇼';if(c==='UK')return'🇬🇧';
    if(!c||c.length!==2)return'🌐';
    return String.fromCodePoint(...c.toUpperCase().split('').map(x=>127397+x.charCodeAt()));
  }

  let cfgAllRegions=[], cfgSelected=new Set();

  async function init(){
    console.log('Admin UI initializing...');
    try{
      const r=await fetch('/?get_regions=1');
      cfgAllRegions=(await r.json()).filter(x=>x!=='CN');
    }catch{cfgAllRegions=[];}
    renderGrid();
    await loadKvConfig();
  }

  function renderGrid(){
    const g=document.getElementById('cfgRegionGrid');
    if(!cfgAllRegions.length){g.innerHTML='<div class="col-span-full text-center text-slate-500 text-xs py-4">无数据</div>';return;}
    g.innerHTML=cfgAllRegions.map(r=>{
      const a=cfgSelected.has(r)?'active':'';
      return \`<button onclick="tog('\${r}')" class="region-btn \${a} p-2 rounded-xl text-center text-[11px] bg-slate-800 hover:bg-slate-700">
        <div>\${getFlag(r)}</div><div class="opacity-60 mt-0.5">\${regionMap[r]||r}</div>
      </button>\`;
    }).join('');
    lucide.createIcons();
  }
  function tog(r){cfgSelected.has(r)?cfgSelected.delete(r):cfgSelected.add(r);renderGrid();}
  function cfgSelectAll(){cfgSelected=new Set(cfgAllRegions);renderGrid();}
  function cfgClearAll(){cfgSelected.clear();renderGrid();}

  // Generic toggle function for switches
  function updateToggle(idPrefix, active) {
    const btn = document.getElementById(idPrefix + 'Btn');
    const knob = document.getElementById(idPrefix + 'Knob');
    if (active) {
      btn.classList.replace('bg-slate-600', idPrefix === 'echToggle' ? 'bg-purple-500' : 'bg-blue-500');
      knob.classList.replace('translate-x-1', 'translate-x-6');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.replace(idPrefix === 'echToggle' ? 'bg-purple-500' : 'bg-blue-500', 'bg-slate-600');
      knob.classList.replace('translate-x-6', 'translate-x-1');
      btn.setAttribute('aria-pressed', 'false');
    }
  }

  // 设置 ProxyIP 快捷选择
  function setPip(v){
    document.getElementById('cfgPipInput').value=v;
    // 高亮当前按钮
    document.querySelectorAll('.pip-btn').forEach(b=>b.classList.remove('border-blue-500','bg-blue-600/20'));
    if(v){
      const btn=Array.from(document.querySelectorAll('.pip-btn')).find(b=>b.getAttribute('onclick')===\`setPip('\${v}')\`);
      if(btn){btn.classList.add('border-blue-500','bg-blue-600/20');}
    }
  }

  // 生成随机 UUID v4
  function randomUuid(){
    const uuid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
      const r=Math.random()*16|0;
      return(c==='x'?r:(r&0x3|0x8)).toString(16);
    });
    document.getElementById('cfgUuidInput').value=uuid;
  }

  // 机场模拟开关
  let _adEnabled = true;
  function toggleAd(){
    _adEnabled = !_adEnabled;
    const btn = document.getElementById('adToggleBtn');
    const knob = document.getElementById('adToggleKnob');
    const container = document.getElementById('adItemsContainer');
    const action = document.getElementById('adActionRow');
    if (_adEnabled) {
      btn.classList.replace('bg-slate-600', 'bg-blue-500');
      knob.classList.replace('translate-x-1', 'translate-x-6');
      container.style.removeProperty('display');
      action.style.removeProperty('display');
    } else {
      btn.classList.replace('bg-blue-500', 'bg-slate-600');
      knob.classList.replace('translate-x-6', 'translate-x-1');
      container.style.setProperty('display', 'none', 'important');
      action.style.setProperty('display', 'none', 'important');
    }
  }
  function setAdEnabled(v){
    if (v !== _adEnabled) toggleAd();
  }

  function addAdRow(val){
    const container = document.getElementById('adItemsContainer');
    const row = document.createElement('div');
    row.className = 'flex gap-2 items-center ad-row';
    row.innerHTML = \`
      <input type="text" value="\${val}" placeholder="例如：套餐到期：2029-01-01"
        class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 transition">
      <button onclick="this.parentElement.remove()" class="p-2 text-slate-500 hover:text-red-400 transition">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    \`;
    container.appendChild(row);
    lucide.createIcons();
  }

  // ECH 开关
  let _echEnabled = false;
  function toggleEch(){
    _echEnabled = !_echEnabled;
    const btn = document.getElementById('echToggleBtn');
    const knob = document.getElementById('echToggleKnob');
    if (_echEnabled) {
      btn.classList.replace('bg-slate-600', 'bg-purple-500');
      knob.classList.replace('translate-x-1', 'translate-x-6');
    } else {
      btn.classList.replace('bg-purple-500', 'bg-slate-600');
      knob.classList.replace('translate-x-6', 'translate-x-1');
    }
  }
  function setEchEnabled(v){
    if (v !== _echEnabled) toggleEch();
  }
  function setEchConfig(v){
    document.getElementById('cfgEchConfigInput').value = v;
    document.querySelectorAll('.ech-preset-btn').forEach(b => b.classList.remove('border-purple-500','bg-purple-600/20'));
    const btn = Array.from(document.querySelectorAll('.ech-preset-btn')).find(b => b.getAttribute('onclick') === \`setEchConfig('\${v}')\`);
    if (btn) btn.classList.add('border-purple-500','bg-purple-600/20');
  }

  // 备注开关
  let _nodeRemarkEnabled = false;
  function toggleNodeRemark(){
    _nodeRemarkEnabled = !_nodeRemarkEnabled;
    const btn = document.getElementById('nodeRemarkToggleBtn');
    const knob = document.getElementById('nodeRemarkToggleKnob');
    if (_nodeRemarkEnabled) {
      btn.classList.replace('bg-slate-600', 'bg-blue-500');
      knob.classList.replace('translate-x-1', 'translate-x-6');
    } else {
      btn.classList.replace('bg-blue-500', 'bg-slate-600');
      knob.classList.replace('translate-x-6', 'translate-x-1');
    }
  }
  function setNodeRemarkEnabled(v){
    if (v !== _nodeRemarkEnabled) toggleNodeRemark();
  }

  async function loadKvConfig(){
    const ri=document.getElementById('refreshIcon');
    if(ri) ri.classList.add('animate-spin');
    try{
      const r=await fetch('/api/config');
      const {regions,limit,pip,uuid,uuidWeeklyEnabled,adEnabled,adName,nodeRemark,nodeRemarkEnabled,lastSaveTime,subExpire,subTotal,subUsed}=await r.json();
      cfgSelected=new Set(regions||[]);
      document.getElementById('cfgLimitInput').value=limit??0;
      // 回显 ProxyIP
      if(pip!==undefined) setPip(pip||'');
      // 回显 UUID
      if(uuid!==undefined) document.getElementById('cfgUuidInput').value=uuid||'';
      // 回显自动轮换
      if(uuidWeeklyEnabled!==undefined) setUuidWeeklyEnabled(!!uuidWeeklyEnabled);
      // 回显机场模拟
      setAdEnabled(!!adEnabled);
      const container = document.getElementById('adItemsContainer');
      container.innerHTML = '';
      if(adName){
        try {
          const names = JSON.parse(adName);
          if (Array.isArray(names)) names.forEach(n => addAdRow(n));
          else if (names) addAdRow(names);
        } catch {
          if (adName) addAdRow(adName);
        }
      }
      if (container.children.length === 0) {
        addAdRow('套餐到期：长期有效');
        addAdRow('剩余流量：999.99 PB');
        addAdRow('已用流量：1 MB');
      }
      if(nodeRemark!==undefined) document.getElementById('cfgNodeRemarkInput').value=nodeRemark||'';
      
      // 回显新配置
      if(subExpire!==undefined) document.getElementById('cfgSubExpire').value=subExpire||'';
      if(subTotal!==undefined) document.getElementById('cfgSubTotal').value=subTotal||'';
      if(subUsed!==undefined) document.getElementById('cfgSubUsed').value=subUsed||'';
      
      const timeEl = document.getElementById('cfgLastSaveTime');
      if (timeEl) {
        timeEl.innerText = lastSaveTime ? '最后保存时间: ' + lastSaveTime : '最后保存时间: 未知';
      }
      
      renderGrid();
    }catch(e){console.error(e);}
    finally{ if(ri) ri.classList.remove('animate-spin'); }
  }

  let _uuidWeeklyEnabled = true;
  function toggleUuidWeekly(){
    _uuidWeeklyEnabled = !_uuidWeeklyEnabled;
    const btn = document.getElementById('uuidWeeklyToggleBtn');
    const knob = document.getElementById('uuidWeeklyToggleKnob');
    if (_uuidWeeklyEnabled) {
      btn.classList.replace('bg-slate-600', 'bg-blue-500');
      knob.classList.replace('translate-x-1', 'translate-x-6');
    } else {
      btn.classList.replace('bg-blue-500', 'bg-slate-600');
      knob.classList.replace('translate-x-6', 'translate-x-1');
    }
  }
  function setUuidWeeklyEnabled(v){
    if (v !== _uuidWeeklyEnabled) toggleUuidWeekly();
  }

  async function saveKvConfig(){
    const limit=parseInt(document.getElementById('cfgLimitInput').value)||0;
    const regions=[...cfgSelected];
    const pip=(document.getElementById('cfgPipInput').value||'').trim();
    const uuid=(document.getElementById('cfgUuidInput').value||'').trim();
    const uuidWeeklyEnabled=_uuidWeeklyEnabled;
    const adEnabled=_adEnabled;
    const adRows = document.querySelectorAll('.ad-row input');
    const adNames = Array.from(adRows).map(input => input.value.trim()).filter(Boolean);
    const adName = JSON.stringify(adNames);
    const nodeRemarkEnabled=_nodeRemarkEnabled;
    const nodeRemark=(document.getElementById('cfgNodeRemarkInput').value||'').trim();
    const subExpire=(document.getElementById('cfgSubExpire').value||'').trim();
    const subTotal=(document.getElementById('cfgSubTotal').value||'').trim();
    const subUsed=(document.getElementById('cfgSubUsed').value||'').trim();
    const btn = document.querySelector('button[onclick="saveKvConfig()"]');
    const oriText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> 保存中...';
    btn.disabled = true;
    
    try{
      const r=await fetch('/api/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({regions,limit,pip,uuid,uuidWeeklyEnabled,adEnabled,adName,nodeRemark,nodeRemarkEnabled,subExpire,subTotal,subUsed})});
      if(r.ok){
        const { wait, serverTime } = await r.json();
        
        const timeEl = document.getElementById('cfgLastSaveTime');
        if (timeEl && serverTime) {
          timeEl.innerText = '最后保存时间: ' + serverTime;
        }

        const t=document.getElementById('toast');
        const joeyUrl = window.location.origin + '/sub?yx';
        if (wait) {
          t.textContent=\`保存成功！需等待约 \${wait} 秒生效\`;
        } else {
          t.innerHTML=\`已保存！<br><span style="font-size:10px;color:#00ff00">机场模拟已生效。Joey 专用地址（已点击复制）: \${joeyUrl}</span>\`;
          if (navigator.clipboard) navigator.clipboard.writeText(joeyUrl).catch(()=>{});
        }
        t.style.opacity='1';setTimeout(()=>t.style.opacity='0',8000);
      } else {
        const body = await r.text();
        alert('保存错误: ' + body);
      }
    }catch(e){
      alert('网络错误');
    }finally{
      btn.innerHTML = oriText;
      btn.disabled = false;
      lucide.createIcons();
    }
  }

  function logout(){document.cookie='admin_auth=;expires=Thu,01 Jan 1970 00:00:00 UTC;path=/;';location.reload();}
  init();
</script>
`}
</body>
</html>`;
}

async function handleSubRequest(url, env, request) {
  // 读取 VLESS 连接参数Worker 传入，替换后返回给客户端
  const urlUuid = url.searchParams.get('uuid') || '';
  const host = url.searchParams.get('host') || '';
  const sni = url.searchParams.get('sni') || host;
  const path = url.searchParams.get('path') || '/';
  const type = url.searchParams.get('type') || 'ws';
  const encryption = url.searchParams.get('encryption') || 'none';
  const security = url.searchParams.get('security') || 'tls';
  const alpnParam = url.searchParams.get('alpn') || '';
  const allowInsecure = url.searchParams.get('allowInsecure') || '0';

  const { regions: envRegions, limit: envLimit, pip: envPip, uuid: envUuid, adEnabled, adName, nodeRemark, nodeRemarkEnabled, subExpire, subTotal, subUsed } = getAppConfig(env);

  const fp = 'chrome';

  // UUID 优先级：URL 参数 > 环境变量配置 > 顶部常量
  const uuid = urlUuid || envUuid || DEFAULT_UUID;

  // 优先级：URL 参数 > 环境变量配置 > 顶部常量
  const regionParam = url.searchParams.get('region') || '';
  const targetRegions = regionParam
    ? regionParam.split(',').map(r => r.trim().toUpperCase()).filter(Boolean)
    : envRegions.length > 0 ? envRegions : null;

  // 每区节点数量上限
  const limitParams = url.searchParams.get('limit');
  const limit = limitParams !== null ? parseInt(limitParams) : envLimit;

  // ProxyIP：URL 参数 > 环境变量配置 > 默认常量
  const pipParam = url.searchParams.get('pip') || url.searchParams.get('proxyip') || '';
  const activePip = pipParam || envPip || DEFAULT_PIP;

  // UUID 留空时不报错，以支持纯下发 IP+名称 场景

  try {
    // 拉取优选 IP 数据源（与现有逻辑复用同一数据源）
    const res = await fetch('https://raw.githubusercontent.com/hc990275/yx/main/cfyxip.txt');
    let text = await res.text();
    // 去除 BOM
    text = text.replace(/^\uFEFF/, '');

    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l && l.includes('#'));

    const regionCounters = {};
    const nodes = [];

    for (const line of lines) {
      const sepIdx = line.indexOf('#');
      const ipPort = line.slice(0, sepIdx).trim();
      const code = line.slice(sepIdx + 1).trim().toUpperCase();

      // 跳过中国节点（通常不需要）
      if (code === 'CN') continue;

      // 地区过滤
      if (targetRegions && !targetRegions.includes(code)) continue;

      // 每区数量限制
      regionCounters[code] = (regionCounters[code] || 0) + 1;
      if (limit > 0 && regionCounters[code] > limit) continue;

      // 解析 IPv6 地址（带方括号）或普通 IP
      let ip, port;
      if (ipPort.startsWith('[')) {
        // IPv6 格式：[::1]:443
        const m = ipPort.match(/^(\[.+?\]):(\d+)$/);
        if (!m) continue;
        [, ip, port] = m;
      } else {
        const colonIdx = ipPort.lastIndexOf(':');
        if (colonIdx === -1) continue;
        ip = ipPort.slice(0, colonIdx);
        port = ipPort.slice(colonIdx + 1);
      }

      // 节点备注名（国旗 + 国家名 + 序号）
      const flag = getFlagEmoji(code);
      const region = REGION_MAP[code] || code;
      const seq = String(regionCounters[code]).padStart(2, '0');
      const baseRemark = `${flag} ${region} ${seq}`;
      const remark = (nodeRemarkEnabled && nodeRemark) ? `${baseRemark} | ${nodeRemark}` : baseRemark;

      // 路径：如果配置了 ProxyIP，则拼入路径；否则使用默认路径
      const effectivePath = activePip ? `/proxyip=${activePip.trim()}` : path;

      // 强行锁定安全参数
      const finalSecurity = 'tls';
      const finalFp = 'chrome';

      // 构造参数 Map，仅保留有值的参数
      const pMap = {
        encryption,
        security: finalSecurity,
        sni,
        fp: finalFp,
        type,
        host,
        path: effectivePath,
        allowInsecure: (allowInsecure && allowInsecure !== '0') ? allowInsecure : null,
      };

      // 拼接完整 VLESS 分享链接
      let queryParts = [];
      for (const [k, v] of Object.entries(pMap)) {
        if (v) queryParts.push(`${k}=${(k === 'security') ? v : encodeURIComponent(v)}`);
      }
      const query = queryParts.join('&');

      nodes.push(`vless://${uuid}@${ip}:${port}?${query}#${encodeURIComponent(remark)}`);
    }

    if (nodes.length === 0) {
      // 返回空字符串（Worker 会优雅处理空响应）
      return new Response('', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    // --- [识别与适配逻辑] ---
    const isJoey = url.searchParams.get('joey') !== null || url.searchParams.get('yx') !== null;
    const forceRaw = url.searchParams.get('base64') === '0' || url.searchParams.get('format') === 'txt';
    const isSubConverter = url.searchParams.has('sub'); // snippets.js 或转换器请求

    // 默认输出结果（Base64 编码的 VLESS 列表）
    let result = '';
    let contentType = 'text/plain; charset=utf-8';

    if (!forceRaw && !isJoey && !isSubConverter) {
      // 标准模式：返回 Base64 订阅
      const textToEncode = nodes.join('\n');
      if (env.isNode && typeof Buffer !== 'undefined') {
        result = Buffer.from(textToEncode, 'utf8').toString('base64');
      } else {
        result = btoa(unescape(encodeURIComponent(textToEncode)));
      }
    } else {
      // 适配模式 (适配 joey.js 的 yxURL 或明文需求)
      // 如果目标是 joey.js 的 yxURL，只需提取 IP:Port#Remark 格式
      if (isJoey) {
        result = nodes.map(n => {
          const m = n.match(/@([^?]+).*#(.+)$/);
          if (m) return `${m[1]}#${decodeURIComponent(m[2])}`;
          return n;
        }).join(','); // 使用逗号隔开，符合 joey.js yxURL 最新需求
      } else {
        // 其他明文请求返回完整 VLESS 链接
        result = nodes.join('\n');
      }
    }

    // --- [Subscription-Userinfo Header Logic] ---
    const finalHeaders = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    const parseBytes = (str) => {
      const m = str.match(/(\d+(?:\.\d+)?)\s*([KMGTPE]B)/i);
      if (!m) return 0;
      const num = parseFloat(m[1]);
      const unit = m[2].toUpperCase();
      const units = { 'KB': 1, 'MB': 2, 'GB': 3, 'TB': 4, 'PB': 5, 'EB': 6 };
      const p = units[unit] || 0;
      return Math.floor(num * Math.pow(1024, p));
    };

    if (adEnabled || subExpire || subTotal || subUsed) {
      try {
        let upload = 0, download = 0, total = 0, expire = 0;

        // 1. 优先使用独立配置字段
        if (subExpire) expire = Math.floor(new Date(subExpire).getTime() / 1000);
        if (subTotal) total = parseBytes(subTotal);
        if (subUsed) download = parseBytes(subUsed);

        // 2. 如果缺少关键信息，尝试从 adName 解析 (兜底)
        if ( (total === 0 || expire === 0) && adName ) {
          let adNames = [];
          try {
            adNames = JSON.parse(adName);
            if (!Array.isArray(adNames)) adNames = [adName];
          } catch { adNames = [adName]; }

          for (const n of adNames) {
            if (!download && n.includes('已用')) download = parseBytes(n);
            if (!total && n.includes('剩余')) total += parseBytes(n);
            if (!total && n.includes('总计')) total = parseBytes(n);
            if (!expire && (n.includes('到期') || n.includes('有效'))) {
              if (n.includes('长期有效')) expire = 4070908800; // 2099-01-01
              else {
                const dm = n.match(/(\d{4}-\d{2}-\d{2})/);
                if (dm) expire = Math.floor(new Date(dm[1]).getTime() / 1000);
              }
            }
          }
          if (adName.includes('剩余') && total > 0 && download > 0) total += download;
        }
        
        // 3. 最终兜底默认值
        if (total === 0) total = 1099511627776000; // 1000 TB
        if (expire === 0) expire = 4070908800;

        finalHeaders['Subscription-Userinfo'] = `upload=${upload}; download=${download}; total=${total}; expire=${expire}`;
      } catch (e) {}
    }

    return new Response(result, {
      status: 200,
      headers: finalHeaders
    });

  } catch (e) {
    return new Response('Sub Request Error: ' + e.message + '\n\nStack:\n' + e.stack, {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

/**
 * 环境变量控制接口
 * GET  /api/config          — 返回当前环境变量配置
 * POST /api/config  body: { regions: ['HK','JP'], limit: 10 }
 *
 * @param {Request} request
 * @param {object}  env
 * @returns {Promise<Response>}
 */

async function handleConfigApi(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

  if (request.method === 'GET') {
    const config = getAppConfig(env);
    return new Response(JSON.stringify(config), { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const lastSaveTimeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

      const newConfig = {
        SUB_REGIONS: JSON.stringify(body.regions || []),
        SUB_LIMIT: String(body.limit || 0),
        SUB_PIP: (body.pip || '').trim(),
        SUB_UUID: (body.uuid || '').trim(),
        SUB_AD_ENABLED: body.adEnabled === true ? 'true' : 'false',
        SUB_AD_NAME: (body.adName || '').trim(),
        SUB_NODE_REMARK_ENABLED: body.nodeRemarkEnabled === true ? 'true' : 'false',
        SUB_NODE_REMARK: (body.nodeRemark || '').trim(),
        SUB_UUID_WEEKLY_ENABLED: body.uuidWeeklyEnabled === true ? 'true' : 'false',
        SUB_LAST_SAVE_TIME: lastSaveTimeStr,
        SUB_EXPIRE: (body.subExpire || '').trim(),
        SUB_TOTAL: (body.subTotal || '').trim(),
        SUB_USED: (body.subUsed || '').trim()
      };

      if (env.isNode && typeof env.saveConfig === 'function') {
        const ok = await env.saveConfig(newConfig);
        if (ok) {
          return new Response(JSON.stringify({
            ok: true,
            serverTime: lastSaveTimeStr,
            wait: 0,
            note: "配置已全自动同步到本地 config.json"
          }), { headers: corsHeaders });
        }
      }
      return new Response(JSON.stringify({ error: '保存失败：权限不足或非本地服务器' }), { status: 500, headers: corsHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: '数据处理失败: ' + e.message }), { status: 500, headers: corsHeaders });
    }
  }
  return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: corsHeaders });
}


// =============================================
// NATIVE NODE.JS ENGINE (V4 FINAL PURGE)
// =============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = _worker_main_export;
}

if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
  const http = require('http');
  const fs = require('fs');
  const path = require('path');

  const PORT = process.env.SERVER_PORT || process.env.PORT || 20225;
  // NOTE: 使用 __dirname 确保代码与其配置文件在同一目录下，即使 pm2 启动也能准确定位
  const CONFIG_FILE = path.join(__dirname, 'config.json');
  let config = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      console.log('[config] 已加载配置文件:', CONFIG_FILE, Object.keys(config));
    } catch (e) {
      console.error('[config] 配置文件读取失败:', e.message);
    }
  } else {
    console.log('[config] 未找到配置文件，将使用默认值:', CONFIG_FILE);
  }

  global.Response = class {
    constructor(body, init) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    async text() { return (typeof this.body === 'string') ? this.body : JSON.stringify(this.body); }
    async json() { return (typeof this.body === 'string') ? JSON.parse(this.body) : this.body; }
  };

  const server = http.createServer(async (req, res) => {
    try {
      let host = req.headers.host || '127.0.0.1';
      let proto = req.headers['x-forwarded-proto'] || 'http';
      const fullUrl = proto + '://' + host + req.url;
      const urlObj = new (require('url').URL)(fullUrl);

      let bodyData = Buffer.alloc(0);
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        bodyData = Buffer.concat(chunks);
      }

      const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

      const request = {
        url: fullUrl,
        method: req.method,
        headers: { get: (n) => req.headers[n.toLowerCase()] },
        json: async () => JSON.parse(bodyData.toString() || '{}'),
        text: async () => bodyData.toString(),
        searchParams: urlObj.searchParams,
        search: urlObj.search,
        clientIp: clientIp
      };

      const env = {
        ...process.env,
        ...config,
        isNode: true,
        saveConfig: async (cfg) => {
          try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
            config = cfg;
            return true;
          } catch (e) {
            console.error('[Error] 保存配置失败:', e);
            return false;
          }
        },
        incrementCounter: () => {
          const COUNTER_FILE = path.join(__dirname, 'call_count.txt');
          // 异步写入文件，不阻塞请求
          fs.promises.writeFile(COUNTER_FILE, String(_subCallCount), 'utf8').catch(() => { });
        }
      };



      const response = await _worker_main_export.fetch(request, env);
      res.statusCode = response.status || 200;
      // NOTE: 用 forEach 代替 for...of entries()，兼容 Map 的所有 Node.js 版本
      response.headers.forEach((v, k) => res.setHeader(k, v));

      let resBody = response.body;
      if (resBody instanceof Promise) resBody = await resBody;
      res.end(resBody || '');

    } catch (err) {
      res.statusCode = 500;
      const errMsg = err?.stack || err?.message || String(err);
      res.end('INTERNAL ERROR: ' + errMsg);
      console.error('[Fatal Error]', err);
    }
  });

  server.listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', '[订阅器] 服务已启动！');
    console.log('[本地访问] http://127.0.0.1:' + PORT + '/admin');

    // 初始化内存 counter
    try {
      const COUNTER_FILE = path.join(__dirname, 'call_count.txt');
      if (fs.existsSync(COUNTER_FILE)) {
        _subCallCount = parseInt(fs.readFileSync(COUNTER_FILE, 'utf8').trim()) || 0;
        console.log('[config] 已加载调用计数:', _subCallCount);
      }
    } catch (e) { }

    // 尝试获取公网 IP 并显示
    require('http').get('http://ip.sb', r => {
      let d = ''; r.on('data', c => d += c);
      r.on('end', () => {
        const ip = d.trim();
        if (ip && ip.length < 20) {
          console.log('[公网访问] http://' + ip + ':' + PORT + '/admin');
        }
      });
    }).on('error', () => { });
  });
}



