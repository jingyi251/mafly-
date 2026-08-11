export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const ADMIN_PWD = env.ADMIN_PASSWORD || "apao123";

    // 前台主页
    if (path === "/" || path === "") {
      const bookmarkRaw = await env.BOOKMARK_KV.get("bookmark");
      const bookmarkData = bookmarkRaw ? JSON.parse(bookmarkRaw) : { bookmarks: [] };
      return new Response(getFrontHtml(bookmarkData), {
        headers: { "content-type": "text/html;charset=utf-8" }
      });
    }

    // 管理后台入口
    if (path === "/admin") {
      const cookie = request.headers.get("cookie") || "";
      const loginToken = cookie.match(/admin_token=([^;]+)/)?.[1];
      if (!loginToken || loginToken !== "valid_apao_token") {
        return new Response(getLoginHtml(), {
          headers: { "content-type": "text/html;charset=utf-8" }
        });
      }
      const bookmarkRaw = await env.BOOKMARK_KV.get("bookmark");
      const bookmarkData = bookmarkRaw ? JSON.parse(bookmarkRaw) : { bookmarks: [] };
      return new Response(getAdminHtml(bookmarkData), {
        headers: { "content-type": "text/html;charset=utf-8" }
      });
    }

    // 登录接口
    if (path === "/api/login" && request.method === "POST") {
      const body = await request.json();
      if (body.pwd === ADMIN_PWD) {
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            "content-type": "application/json",
            "set-cookie": "admin_token=valid_apao_token; Path=/; Max-Age=86400"
          }
        });
      }
      return new Response(JSON.stringify({ success: false, msg: "密码错误" }), {
        headers: { "content-type": "application/json" }
      });
    }

    // ========== 新增：退出登录接口 ==========
    if (path === "/api/logout" && request.method === "POST") {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          // 设置cookie立即过期
          "set-cookie": "admin_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 UTC"
        }
      });
    }

    // 保存配置接口
    if (path === "/api/save" && request.method === "POST") {
      const cookie = request.headers.get("cookie") || "";
      const loginToken = cookie.match(/admin_token=([^;]+)/)?.[1];
      if (!loginToken || loginToken !== "valid_apao_token") {
        return new Response(JSON.stringify({ success: false, msg: "未登录" }), { status: 401 });
      }
      const body = await request.json();
      try {
        JSON.parse(body.json);
        await env.BOOKMARK_KV.put("bookmark", body.json);
        return new Response(JSON.stringify({ success: true, msg: "保存成功" }), {
          headers: { "content-type": "application/json" }
        });
      } catch (e) {
        return new Response(JSON.stringify({ success: false, msg: "JSON格式错误" }), {
          headers: { "content-type": "application/json" }
        });
      }
    }

    // 清空书签接口
    if (path === "/api/clear" && request.method === "POST") {
      const cookie = request.headers.get("cookie") || "";
      const loginToken = cookie.match(/admin_token=([^;]+)/)?.[1];
      if (!loginToken || loginToken !== "valid_apao_token") {
        return new Response(JSON.stringify({ success: false, msg: "未登录" }), { status: 401 });
      }
      const emptyData = JSON.stringify({ bookmarks: [] });
      await env.BOOKMARK_KV.put("bookmark", emptyData);
      return new Response(JSON.stringify({ success: true, msg: "已清空全部书签" }), {
        headers: { "content-type": "application/json" }
      });
    }

    return new Response("404 Not Found", { status: 404 });
  }
};

// 前台页面【修复class关键字语法报错】
function getFrontHtml(data) {
  const rawJson = JSON.stringify(data);
  const safeJson = rawJson.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>TVBOX阿炮导航-本地书签自动加载</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230066cc'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white' font-family='Microsoft Yahei'>炮</text></svg>">
<style>
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Microsoft Yahei", system-ui, -apple-system, sans-serif;
    -webkit-tap-highlight-color: transparent;
}
body{
    background: linear-gradient(135deg, #0052b3 0%, #0066cc 40%, #0080ff 100%);
    background-attachment: fixed;
    min-height: 100vh;
    padding: clamp(10px, 3vw, 24px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    position: relative;
    overflow-x: hidden;
}
body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 45%);
    pointer-events: none;
    z-index: 0;
}
:root {
    --page-side: clamp(10px, 3vw, 60px);
    --inner-padding: clamp(10px, 2vw, 16px);
    --card-radius: clamp(6px, 1vw, 10px);
    --main-gold: #d49428;
    --main-blue: #0066cc;
    --min-screen: 320px;
}
.main-window{
    width: clamp(var(--min-screen), 96%, 1280px);
    background-color: #2c3040;
    border-radius: var(--card-radius);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08);
    position: relative;
    z-index: 1;
}
.window-header{
    height: clamp(36px, 4vh, 40px);
    background: #e8e8e8;
    display: flex;
    align-items: center;
    padding: 0 var(--page-side);
    font-size: clamp(12px, 1.2vw, 15px);
    color: #222;
    user-select: none;
    font-weight: 500;
    flex-wrap: wrap;
    gap: 6px;
}
.window-header::before{
    content: "";
    width: clamp(16px, 1.5vw, 18px);
    height: clamp(16px, 1.5vw, 18px);
    background: #2c3040;
    margin-right: clamp(8px, 1vw, 10px);
    border-radius: 2px;
}
.header-right{
    margin-left: auto;
    display: flex;
    gap: clamp(8px, 2vw, 16px);
    font-size: clamp(11px, 1vw, 13px);
    color: #555;
    flex-wrap: wrap;
}
.header-right a{
    color: #0056b3;
    text-decoration: none;
    white-space: nowrap;
}
.header-right a:hover{
    text-decoration: underline;
}
.load-btn-wrap{
    padding: clamp(10px, 2vw, 14px) var(--page-side);
}
#fileInput{
    display: none;
}
.search-wrap{
    padding: clamp(12px, 3vw, 20px) var(--page-side);
}
.search-row{
    display: flex;
    gap: 0;
    flex-wrap: wrap;
}
#searchInput{
    flex: 1;
    min-width: clamp(160px, 30vw, 300px);
    height: clamp(42px, 6vh, 48px);
    padding: 0 var(--inner-padding);
    font-size: clamp(13px, 1.2vw, 14px);
    border: 1px solid #ccc;
    border-right: none;
    border-radius: 4px 0 0 0;
    background: #f5f5f5;
    transition: all 0.2s;
    pointer-events: auto !important;
    user-select: text !important;
}
#searchInput:focus {
    outline: none;
    border-color:var(--main-gold);
    box-shadow: 0 0 0 2px rgba(212, 148, 40, 0.2);
}
#searchBtn{
    width: clamp(90px, 12vw, 140px);
    min-width: 80px;
    height: clamp(42px, 6vh, 48px);
    background: var(--main-gold);
    color: #fff;
    border: 1px solid #b87e1f;
    border-radius: 0 4px 0 0;
    font-size: clamp(13px, 1.2vw, 14px);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
}
#searchBtn:hover { 
    opacity: 0.9;
    box-shadow: 0 0 10px rgba(212,148,40,0.3);
}
.class-title{
    padding: 0 var(--page-side);
    margin-bottom: clamp(8px, 2vw, 12px);
    font-size: clamp(13px, 1.3vw, 16px);
    color: #fff;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
}
.class-title::after{
    flex:1;
    height: 1px;
    background: linear-gradient(90deg, #6699ff, transparent);
}
.nav-container{
    padding: 0 var(--page-side) clamp(16px, 4vw, 30px);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(clamp(140px, 25vw, 220px), 1fr));
    gap: clamp(8px, 2vw, 16px);
}
.nav-card{
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: var(--card-radius);
    padding: clamp(10px, 2vw, 16px);
    text-align: center;
    transition: all 0.24s ease;
    cursor: pointer;
    min-height: clamp(70px, 12vw, 90px);
    position: relative;
}
.nav-card:active{
    transform: scale(0.97);
}
.nav-card:hover{
    background: rgba(255,255,255,0.14);
    border-color: rgba(153, 209, 255, 0.4);
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(0,130,255,0.2);
}
.nav-card a{
    text-decoration: none;
    display: block;
    pointer-events: none;
}
.card-name{
    color: #fff;
    font-size: clamp(11px, 1.1vw, 14px);
    font-weight: 500;
    margin-top: 6px;
}
.card-desc{
    color: #b0c8e8;
    font-size: clamp(9px, 0.9vw, 11px);
    margin-top: 4px;
}
.empty-text{
    padding: 40px var(--page-side);
    color: #a0b8d8;
    text-align: center;
    font-size: 13px;
}
.copyright-bar {
    width: 100%;
    padding: clamp(10px, 2vw, 14px) var(--page-side);
    text-align: center;
    font-size: clamp(10px, 1vw, 12px);
    color: #b0b8d0;
    border-top: 1px solid #3a3f54;
    user-select: none;
}
.copyright-bar span.year-auto {
    color: #fff;
    font-weight: 500;
}
.copy-toast{
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%,-50%);
    background: rgba(0,0,0,0.75);
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
}
.copy-toast.show{
    opacity: 1;
}
@media screen and (max-width: 640px) {
    .search-row{
        flex-direction: column;
    }
    #searchInput{
        border-radius: 6px;
        border-right: 1px solid #ccc;
    }
    #searchBtn{
        width: 100%;
        border-radius: 6px;
    }
    .nav-container{
        grid-template-columns: repeat(2, 1fr);
    }
    .window-header{
        height: auto;
        padding: 8px var(--page-side);
    }
}
@media screen and (min-width: 641px) and (max-width: 1024px) {
    .nav-container{
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    }
}
</style>
</head>
<body>
<div class="main-window">
    <div class="window-header">
        TVBOX阿炮导航
        <div class="header-right">
            
        </div>
    </div>

    <div class="load-btn-wrap">
        <input id="fileInput" accept=".json" type="file">
    </div>

    <div class="search-wrap">
        <div class="search-row">
            <input id="searchInput" placeholder="搜索线路、工具、站点">
            <button id="searchBtn">搜索</button>
        </div>
    </div>

    <div id="bookBox"></div>

    <div class="copyright-bar">
        © <span id="yearTxt">2026</span> TVBOX阿炮导航 All Rights Reserved.
        <div style="margin-top:6px;font-size:11px;color:#888;">单击卡片跳转 | 长按卡片复制链接</div>
    </div>
</div>
<div class="copy-toast" id="toast">复制成功</div>

<script>
const rawJsonStr = '${safeJson}';
const initData = JSON.parse(rawJsonStr);

const bookBox = document.getElementById('bookBox');
const sInput = document.getElementById('searchInput');
const sBtn = document.getElementById('searchBtn');
const yearTxt = document.getElementById('yearTxt');
const toast = document.getElementById('toast');

function showToast(text){
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'), 1200);
}

async function copyText(text){
    try{
        await navigator.clipboard.writeText(text);
        showToast("链接已复制");
    }catch(err){
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("链接已复制");
    }
}

function escapeHtml(str){
    if(!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

function renderBookmark(data) {
    if (!data || !data.bookmarks || !Array.isArray(data.bookmarks) || data.bookmarks.length === 0) {
        bookBox.innerHTML = '<div class="empty-text">暂无线路，请前往 /admin 后台添加书签配置</div>';
        return;
    }
    let html = '';
    data.bookmarks.forEach(group => {
        html += '<div class="class-title">' + escapeHtml(group.category) + '</div><div class="nav-container">';
        group.items.forEach(item => {
            html += '<div class="nav-card" data-url="' + escapeHtml(item.url) + '"><a href="' + escapeHtml(item.url) + '"><div class="card-name">' + escapeHtml(item.name) + '</div><div class="card-desc">' + escapeHtml(item.description) + '</div></a></div>';
        });
        html += '</div>';
    });
    bookBox.innerHTML = html;
    bindLongPress();
}

function bindLongPress(){
    const cards = document.querySelectorAll('.nav-card');
    const LONG_PRESS_TIME = 400;
    let pressTimer = null;
    let isLongClick = false;

    cards.forEach(card=>{
        card.addEventListener('mousedown', startPress);
        card.addEventListener('touchstart', startPress, {passive:true});
        card.addEventListener('mouseup', endPress);
        card.addEventListener('mouseleave', endPress);
        card.addEventListener('touchend', endPress);

        function startPress(e){
            isLongClick = false;
            pressTimer = setTimeout(()=>{
                isLongClick = true;
                copyText(card.dataset.url);
            }, LONG_PRESS_TIME);
        }
        function endPress(e){
            clearTimeout(pressTimer);
            if(isLongClick) e.preventDefault();
        }
        card.addEventListener('contextmenu', e=>{
            e.preventDefault();
            copyText(card.dataset.url);
        })
    })
}

sBtn.onclick = function () {
    const key = sInput.value.trim();
    if (!key) {
        alert('请输入搜索关键词');
        return;
    }
    alert('检索关键词：' + key);
};
sInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sBtn.click();
});

window.onload = function () {
    yearTxt.textContent = new Date().getFullYear();
    renderBookmark(initData);
};
</script>
</body>
</html>`;
}

// 登录页面
function getLoginHtml() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>后台登录 - TVBOX阿炮导航</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230066cc'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white' font-family='Microsoft Yahei'>炮</text></svg>">
<style>
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: "Microsoft Yahei", sans-serif;
    user-select: text !important;
    -webkit-user-select: text !important;
}
body {
    background-color: #0066cc;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: none;
}
.login-box {
    width: min(92%, 400px);
    background: #ffffff;
    padding: 32px 24px;
    border-radius: 12px;
    position: relative;
    z-index: 9999;
}
h2 {
    text-align: center;
    color: #222;
    margin-bottom: 26px;
    font-size: 20px;
}
#pwd {
    width: 100%;
    height: 46px;
    padding: 0 14px;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    font-size: 15px;
    margin-bottom: 18px;
    background: #fff;
    pointer-events: auto !important;
    cursor: text;
}
#pwd:focus {
    border-color: #0066cc;
    outline: none;
    box-shadow: 0 0 0 3px rgba(0,102,204,0.18);
}
#loginBtn {
    width: 100%;
    height: 46px;
    border: none;
    border-radius: 8px;
    background: #0066cc;
    color: #fff;
    font-size: 15px;
    cursor: pointer;
}
#loginBtn:active {
    opacity: 0.88;
}
#msg {
    margin-top: 14px;
    text-align: center;
    font-size: 13px;
    color: #e53935;
}
.back-link {
    display: block;
    text-align: center;
    margin-top: 20px;
    color: #0066cc;
    text-decoration: none;
    font-size: 14px;
}
</style>
</head>
<body>
<div class="login-box">
    <h2>TVBOX阿炮导航 后台登录</h2>
    <input type="password" id="pwd" placeholder="请输入管理密码">
    <button id="loginBtn">登录后台</button>
    <div id="msg"></div>
    <a href="/" class="back-link">返回前台导航</a>
</div>
<script>
const pwdInput = document.getElementById('pwd');
const loginBtn = document.getElementById('loginBtn');
const tipMsg = document.getElementById('msg');

async function doLogin() {
    const pwd = pwdInput.value.trim();
    if (!pwd) {
        tipMsg.textContent = "请输入密码";
        return;
    }
    const res = await fetch("/api/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ pwd: pwd })
    });
    const data = await res.json();
    if (data.success) {
        location.href = "/admin";
    } else {
        tipMsg.textContent = data.msg;
    }
}
loginBtn.onclick = doLogin;
pwdInput.onkeydown = e => {
    if (e.key === "Enter") doLogin();
};
</script>
</body>
</html>`;
}

// 可视化编辑后台（新增退出按钮、登出逻辑）
function getAdminHtml(initData) {
  const rawJson = JSON.stringify(initData);
  const safeJsJson = rawJson.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>可视化书签管理 - TVBOX阿炮导航后台</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230066cc'/><text x='50' y='65' font-size='50' text-anchor='middle' fill='white' font-family='Microsoft Yahei'>炮</text></svg>">
<style>
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:微软雅黑, system-ui;
    user-select:text !important;
}
body{
    background:#2c3040;
    padding:20px;
    color:#fff;
}
.wrap{
    max-width:1300px;
    margin:0 auto;
}
.top-bar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
    flex-wrap:wrap;
    gap:12px;
}
h1{
    font-size:22px;
}
.back{
    color:#99d1ff;
    text-decoration:none;
}
.action-bar{
    display:flex;
    gap:12px;
    margin-bottom:20px;
    flex-wrap:wrap;
}
button{
    padding:10px 18px;
    border:none;
    border-radius:6px;
    cursor:pointer;
    font-size:14px;
    transition:0.2s;
}
button:hover{opacity:0.9}
#saveAll{background:#0080ff;color:#fff;}
#clearAll{background:#d43628;color:#fff;}
#addCategory{background:#27ae60;color:#fff;}
#exportJson{background:#8844dd;color:#fff;}
#logoutBtn{background:#aa2222;color:#fff;} /*退出按钮红色样式*/
#tip{
    margin:12px 0;
    font-size:14px;
    padding:8px 12px;
    border-radius:4px;
}
.success{background:rgba(111,223,111,0.15);color:#6fdf6f;}
.error{background:rgba(255,119,119,0.15);color:#ff7777;}
.category-block{
    background:#1f2330;
    border:1px solid #444;
    border-radius:8px;
    padding:16px;
    margin-bottom:16px;
}
.cat-header{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:12px;
    gap:10px;
    flex-wrap:wrap;
}
.cat-name-input{
    flex:1;
    min-width:200px;
    padding:8px 10px;
    background:#1a1d28;
    border:1px solid #555;
    color:#fff;
    border-radius:4px;
    font-size:14px;
}
.del-cat{background:#c0392b;color:#fff;padding:6px 10px;font-size:13px;}
.book-item{
    background:#272c3c;
    border:1px solid #444;
    border-radius:6px;
    padding:12px;
    margin-bottom:10px;
    display:grid;
    grid-template-columns: 1fr 1fr 2fr auto;
    gap:10px;
    align-items:center;
}
@media(max-width:860px){
    .book-item{
        grid-template-columns:1fr;
    }
}
.book-item input{
    padding:8px;
    background:#1a1d28;
    border:1px solid #555;
    color:#fff;
    border-radius:4px;
    font-size:13px;
}
.del-book{background:#e74c3c;color:#fff;padding:6px 10px;font-size:13px;}
.add-book-btn{
    background:#2980b9;color:#fff;margin-top:8px;
}
.json-preview{
    margin-top:30px;
}
.json-preview textarea{
    width:100%;
    height:300px;
    padding:12px;
    font-size:13px;
    background:#11141c;
    color:#aaffaa;
    border:1px solid #444;
    border-radius:6px;
    resize:none;
}
.empty-hint{
    color:#aaa;
    padding:30px;
    text-align:center;
    font-size:14px;
}
</style>
</head>
<body>
<div class="wrap">
    <div class="top-bar">
        <h1>可视化书签配置管理</h1>
        <a href="/" class="back">返回前台导航</a>
    </div>

    <div class="action-bar">
        <button id="saveAll">保存全部配置</button>
        <button id="addCategory">新增分类</button>
        <button id="clearAll">清空所有书签</button>
        <button id="exportJson">查看/导出JSON</button>
        <!-- 新增退出后台按钮 -->
        <button id="logoutBtn">退出后台</button>
    </div>

    <div id="tip"></div>
    <div id="container"></div>

    <div class="json-preview" style="display:none;">
        <h3 style="margin-bottom:10px;">原始JSON预览</h3>
        <textarea id="jsonViewer" readonly></textarea>
    </div>
</div>

<script>
const rawJsonStr = '${safeJsJson}';
let data = JSON.parse(rawJsonStr);
const container = document.getElementById('container');
const saveAllBtn = document.getElementById('saveAll');
const addCatBtn = document.getElementById('addCategory');
const clearAllBtn = document.getElementById('clearAll');
const exportBtn = document.getElementById('exportJson');
const logoutBtn = document.getElementById('logoutBtn'); //退出按钮
const jsonPreview = document.querySelector('.json-preview');
const jsonViewer = document.getElementById('jsonViewer');
const tipBox = document.getElementById('tip');

function showTip(text, type) {
    tipBox.textContent = text;
    tipBox.className = type;
    setTimeout(()=>tipBox.className='',3000);
}

function escapeHtml(str){
    if(!str) return '';
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;');
}

function render() {
    if(!data.bookmarks || !Array.isArray(data.bookmarks) || data.bookmarks.length === 0){
        container.innerHTML = '<div class="empty-hint">暂无分类，点击【新增分类】开始添加书签</div>';
        return;
    }
    let html = '';
    data.bookmarks.forEach((cat, catIdx)=>{
        html += \`
        <div class="category-block" data-cat-index="\${catIdx}">
            <div class="cat-header">
                <input class="cat-name-input" data-cat="\${catIdx}" value="\${escapeHtml(cat.category)}" placeholder="分类名称">
                <button class="del-cat" data-del-cat="\${catIdx}">删除该分类</button>
            </div>
            <div class="book-list">
        \`;
        if(cat.items && cat.items.length > 0){
            cat.items.forEach((item, itemIdx)=>{
                html += \`
                <div class="book-item" data-cat="\${catIdx}" data-item="\${itemIdx}">
                    <input class="name" value="\${escapeHtml(item.name)}" placeholder="线路名称">
                    <input class="desc" value="\${escapeHtml(item.description)}" placeholder="描述备注">
                    <input class="url" value="\${escapeHtml(item.url)}" placeholder="JSON链接地址">
                    <button class="del-book" data-cat="\${catIdx}" data-item="\${itemIdx}">删除</button>
                </div>
                \`;
            })
        }
        html += \`
            </div>
            <button class="add-book-btn" data-add-book="\${catIdx}">添加一条书签</button>
        </div>
        \`;
    })
    container.innerHTML = html;
    bindAllEvent();
}

function bindAllEvent(){
    document.querySelectorAll('.cat-name-input').forEach(input=>{
        input.oninput = function(){
            const idx = Number(this.dataset.cat);
            data.bookmarks[idx].category = this.value;
        }
    })

    document.querySelectorAll('.del-cat').forEach(btn=>{
        btn.onclick = function(){
            const idx = Number(this.dataset.delCat);
            if(!confirm('确定删除整个分类及其所有书签？')) return;
            data.bookmarks.splice(idx,1);
            render();
        }
    })

    document.querySelectorAll('.add-book-btn').forEach(btn=>{
        btn.onclick = function(){
            const catIdx = Number(this.dataset.addBook);
            if(!data.bookmarks[catIdx].items) data.bookmarks[catIdx].items = [];
            data.bookmarks[catIdx].items.push({
                name:"新线路",
                description:"填写备注",
                url:"https://"
            });
            render();
        }
    })

    document.querySelectorAll('.del-book').forEach(btn=>{
        btn.onclick = function(){
            const c = Number(this.dataset.cat);
            const i = Number(this.dataset.item);
            data.bookmarks[c].items.splice(i,1);
            render();
        }
    })

    document.querySelectorAll('.book-item').forEach(block=>{
        const cIdx = Number(block.dataset.cat);
        const iIdx = Number(block.dataset.item);
        const nameIn = block.querySelector('.name');
        const descIn = block.querySelector('.desc');
        const urlIn = block.querySelector('.url');

        nameIn.oninput = ()=> data.bookmarks[cIdx].items[iIdx].name = nameIn.value;
        descIn.oninput = ()=> data.bookmarks[cIdx].items[iIdx].description = descIn.value;
        urlIn.oninput = ()=> data.bookmarks[cIdx].items[iIdx].url = urlIn.value;
    })
}

addCatBtn.onclick = ()=>{
    data.bookmarks.push({
        category:"新分类",
        items:[]
    });
    render();
}

clearAllBtn.onclick = async ()=>{
    if(!confirm('确定清空所有分类和书签数据，不可恢复？')) return;
    const res = await fetch('/api/clear',{method:'POST'});
    const d = await res.json();
    if(d.success){
        data = {bookmarks:[]};
        render();
        showTip(d.msg, 'success');
    }else{
        showTip(d.msg, 'error');
    }
}

saveAllBtn.onclick = async ()=>{
    try{
        JSON.parse(JSON.stringify(data));
    }catch(e){
        showTip('数据格式异常：'+e.message, 'error');
        return;
    }
    const jsonStr = JSON.stringify(data);
    const res = await fetch('/api/save',{
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({json: jsonStr})
    });
    const d = await res.json();
    if(d.success) showTip('保存成功，前台刷新即可生效！','success');
    else showTip(d.msg,'error');
}

exportBtn.onclick = ()=>{
    const str = JSON.stringify(data,null,2);
    jsonViewer.value = str;
    jsonPreview.style.display = jsonPreview.style.display === 'none' ? 'block' : 'none';
}

// ========== 退出登录逻辑 ==========
logoutBtn.onclick = async ()=>{
    if(!confirm("确认退出后台登录？")) return;
    await fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    });
    // 清除cookie后自动跳转到管理页，触发登录界面
    location.href = "/admin";
}

render();
</script>
</body>
</html>`;
}
