# DNS 动态多账号管理面板

这是一个基于 Cloudflare Pages 和 DNSHE API 的动态多账号DNS管理面板，支持无限账号、多子域、多DNS记录管理。

## 项目结构

```
dns-panel/
├─ public/
│   ├─ index.html        ← 前端页面
│   └─ style.css         ← 样式
├─ functions/
│   ├─ api/
│   │   ├─ subdomains.ts ← 子域名管理 API
│   │   └─ dns.ts        ← DNS记录管理 API
│   └─ lib/
│       └─ dnshe_api.ts  ← 封装 DNSHE API
├─ wrangler.toml
└─ README.md
```

## 功能特性

- ✅ 动态多账号支持（无限账号）
- ✅ 子域名管理（注册/删除/续期）
- ✅ DNS记录管理（增删改查）
- ✅ 美观的前端界面
- ✅ 安全的API调用

## 如何使用

### ✅ 第一步：准备环境
```bash
npm install -g wrangler
wrangler login
```

### ✅ 第二步：创建项目
```bash
# 已完成，当前目录即为项目目录
```

### ✅ 第三步：设置 DNSHE 密钥（核心）
```bash
wrangler pages secret put DNSHE_KEY_1
wrangler pages secret put DNSHE_SECRET_1
wrangler pages secret put DNSHE_KEY_2
wrangler pages secret put DNSHE_SECRET_2
wrangler pages secret put DNSHE_KEY_3
wrangler pages secret put DNSHE_SECRET_3
# 可以继续添加更多账号，如 DNSHE_KEY_4/DNSHE_SECRET_4 等
```

这一步决定了你是不是在裸奔，别跳过。

### ✅ 第四步：本地预览
```bash
wrangler pages dev
```

浏览器打开提示的地址，你会看到 DNS 控制台。

### ✅ 第五步：部署上线
```bash
wrangler pages deploy
```

几秒钟后，Cloudflare 会给你一个 .pages.dev 域名。

## 构建设置

- 框架预设：无
- 构建命令：空
- 构建输出目录：public
- 根目录：/

## 使用功能

- 刷新所有账号的子域列表
- 注册/删除/续期子域
- 管理DNS记录（新增/编辑/删除）
- 动态账号支持（新增账号只需在环境变量中添加即可）

## 扩展账号

新增账号只需在 Cloudflare Pages → Environment Variables 添加新的 DNSHE_KEY_N / DNSHE_SECRET_N，无需修改任何代码。