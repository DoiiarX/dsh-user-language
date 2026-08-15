# dsh-user-language

[简体中文](README.md) | [English](README.en.md)

DeepSeek Harness（DSH）应答语言插件：在 Web 设置页提供一个「用户语言」小节，
并据此在每次组装系统提示词时注入一条指令，让模型按配置的语言回答。
解决"用户用中文提问、模型却用英文回答"的问题。

## 组成

- `index.js`（宿主端）：注册 `user-language` settings 命名空间（`language`
  字段），并注册一个 `systemPrompt` 段落（`user:language`，order -90）。
  段落文本按当下 settings 里的语言求值；未配置语言时渲染为空并跳过。
- `client.js`（浏览器端）：在设置页渲染「用户语言」小节，编辑 `language`。
- `cordis.patch.yml`：声明 `pn-user-language` 插件行。
- `package.json`：`@local/dsh-user-language` 包清单，声明 `dsh.client` 注入与
  `schemastery` 依赖。

## 安装接线

插件目录需要装依赖（宿主端在 `index.js` 里 `import('schemastery')`）：

```sh
cd <本插件目录>
pnpm install
```

### 1. 挂进 web profile

在 `$HOME/.dsh/profiles/web/package.json`：

```json
{
  "dependencies": {
    "@local/dsh-user-language": "link:<本插件目录绝对路径>"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@local/dsh-user-language"
      ]
    }
  }
}
```

然后在 profile 目录 `pnpm install`。

### 2. 把命名空间暴露给浏览器设置页

浏览器的设置页要读到 `user-language` 命名空间，必须把它加进宿主 apiproxy 的
设置白名单 `WEB_SETTINGS_NAMESPACES`（`packages/host/apiproxy/src/api-proxy.ts`）：
否则设置页会一直显示"正在读取配置…"（命名空间未暴露给客户端）。

```ts
const WEB_SETTINGS_NAMESPACES = [
  'agent-loop', 'shell', 'locale', 'permission', 'ui-conversation', 'ui-theme', 'web-search-deepseek',
  // ...本地插件命名单...
  'user-language',
] as const
```

改完重build apiproxy（`pnpm run build:lib:host`）并重启 web 进程。

## 效果

默认应答语言为简体中文。开任意新会话，系统提示词都含类似：

> 始终只用以下语言完整回答用户（所有回复、解释、工具调用后的说明都用这种
> 语言）：简体中文（Simplified Chinese）。绝不要因为用户偶尔用了英文/代码/术语
> 就切换成英文回复正文。

在设置页「用户语言」小节可把 `language` 改成别的（如 English / 日本語），
保存后下一次回复即切换。

## 说明

- 系统提示词本身不显示在对话界面里；"对话里看不到语言段落"不代表没注入。
- `client.js` 沿用 DSH `@local/` 插件常见的浏览器端加载方式
  （`window.__ModuleLoader__.load` + `settings.section` slot），与宿主端设置
  命名空间配对。
