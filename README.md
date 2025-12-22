# DNS 管理面板

这是一个基于 Cloudflare Pages 和 DNSHE API 的 DNS 管理面板。

## 项目结构

```
dns-panel/
├─ public/
│  └─ index.html        # 前端页面（已写好）
├─ functions/
│  └─ api/
│     ├─ subdomains.ts  # 子域管理
│     └─ dns.ts         # DNS 记录管理
├─ wrangler.toml
└─ README.md
```

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
wrangler pages secret put DNSHE_KEY
wrangler pages secret put DNSHE_SECRET
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