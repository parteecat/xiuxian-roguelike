# 修仙 Roguelike

一个纯前端修仙主题 Roguelike 游戏，完全由 LLM 实时驱动游戏内容生成。

## 技术栈

- Vite + React 18 + TypeScript
- TailwindCSS + shadcn/ui
- Zustand (状态管理)
- lucide-react (图标)
- Vitest (测试)

## 功能特色

- 完全纯前端、无后端
- 用户自填 API Key，支持 OpenAI 兼容格式
- 本地存储存档，支持导出/导入
- 手机完美适配
- LLM 实时驱动：世界生成、NPC、事件、剧情全部由大模型生成

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
npm run test
```

## 支持的 LLM 供应商

- OpenAI
- DeepSeek
- Qwen (通义千问)
- Grok
- OpenRouter
- 其他 OpenAI 兼容格式的 API

## 推荐模型

- deepseek-chat
- qwen-turbo
- gpt-4-turbo-preview
- gpt-3.5-turbo

## 部署

### 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/xianxia-roguelike)

### 其他部署方式

项目是纯前端应用，可以部署到任何静态文件托管服务，如：
- GitHub Pages
- Netlify
- Cloudflare Pages
- AWS S3

## 项目结构

```
xianxia-roguelike/
├── src/
│   ├── components/       # React 组件
│   ├── stores/         # Zustand stores
│   ├── types/          # TypeScript 类型定义
│   ├── services/       # API/LLM 服务
│   ├── prompts/        # LLM 提示词
│   ├── lib/            # 工具函数
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── AGENTS.md
```

## 开发指南

详见 [AGENTS.md](./AGENTS.md)

## 许可证

MIT
