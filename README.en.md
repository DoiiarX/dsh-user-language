# dsh-user-language

[English](README.en.md) | [简体中文](README.md)

DeepSeek Harness (DSH) response-language plugin: adds a "User language" section
in the Web settings page, and injects a directive into the assembled system
prompt so the model answers in the configured language. Solves "user asks in
Chinese but the model replies in English".

> Part of the [dsh-plugins](https://github.com/DoiiarX/dsh-plugins) collection —
> see that repository for the full index of self-built plugins.

## Contents

- `index.js` (host side): registers the `user-language` settings namespace
  (a `language` field) and a `systemPrompt` section (`user:language`, order
  -90). The section text evaluates the current language from settings on each
  assembly; when no language is configured it renders empty and is skipped.
- `client.js` (browser side): renders the "User language" section in the
  settings page, editing `language`.
- `cordis.patch.yml`: declares the `pn-user-language` plugin row.
- `package.json`: the `@doiiarx/dsh-user-language` package manifest, declaring the
  `dsh.client` inject set and the `schemastery` dependency.

## Install & wiring

Install dependencies in this plugin directory (the host half runs
`import('schemastery')` in `index.js`):

```sh
cd <this plugin directory>
pnpm install
```

### 1. Mount into the web profile

In `$HOME/.dsh/profiles/web/package.json`:

```json
{
  "dependencies": {
    "@doiiarx/dsh-user-language": "link:<absolute path to this plugin directory>"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@doiiarx/dsh-user-language"
      ]
    }
  }
}
```

Then run `pnpm install` in that profile directory.

### 2. Expose the namespace to the browser settings page

The browser settings page can only read the `user-language` namespace if it is
listed in the host apiproxy settings allowlist
`WEB_SETTINGS_NAMESPACES` (`packages/host/apiproxy/src/api-proxy.ts`); otherwise
the settings page keeps showing "正在读取配置…" (the namespace is not exposed
to the client).

```ts
const WEB_SETTINGS_NAMESPACES = [
  'agent-loop', 'shell', 'locale', 'permission', 'ui-conversation', 'ui-theme', 'web-search-deepseek',
  // ...local-plugin namespaces...
  'user-language',
] as const
```

Then rebuild the apiproxy (`pnpm run build:lib:host`) and restart the web
process.

## Effect

The default response language is Simplified Chinese. Every new session's system
prompt includes something like:

> Always reply to the user entirely in the configured language — every reply,
> explanation, and post-tool-call note. Respond in: Simplified Chinese
> (简体中文). Never switch your reply prose to English just because the user
> occasionally uses English, code, or terms.

In the settings page's "User language" section you can change `language` to
something else (e.g. English / 日本語); the next reply switches after saving.

## Notes

- The system prompt itself is not shown in the conversation UI; "I don't see
  the language paragraph in the chat" does not mean it is not injected.
- `client.js` follows the usual DSH `@doiiarx/` plugin browser loading pattern
  (`window.__ModuleLoader__.load` + the `settings.section` slot), paired with
  the host-side settings namespace.
