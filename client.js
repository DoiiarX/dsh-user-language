/**
 * @doiiarx/dsh-user-language —— 浏览器设置页（用户语言小节）。
 * 与 @doiiarx/dsh-weather-plugin 的 client.js 同一套加载模式：
 * `window.__ModuleLoader__.load` 注册浏览器端插件，绑定 `user-language`
 * settings 命名空间，渲染设置在 sidebar 的「用户语言」小节。
 * 保存后宿主端 systemPrompt 段落会在下一轮按新语言渲染。
 */
window.__ModuleLoader__.load({
  id: "@doiiarx/dsh-user-language",
  factory: (require) => {
    const React = require("react");
    const inject = ["slots", "settingsScope", "connection", "remote"];
    const h = React.createElement;

    const NAMESPACE = "user-language";
    const DEFAULT_LANGUAGE = "简体中文（Simplified Chinese）";

    function UserLanguageSettings({ scope }) {
      const snapshot = React.useSyncExternalStore(
        (fn) => scope.subscribe(fn),
        () => scope.getSnapshot(),
      );
      const value = snapshot.value;
      const busy = snapshot.status !== "ready" || value === undefined;
      const current = busy || typeof value.language !== "string" || !value.language.trim()
        ? DEFAULT_LANGUAGE
        : value.language;
      return h("div", { style: { display: "grid", gap: "18px", color: "var(--dsw-alias-label-primary)" } },
        h("div", null,
          h("h2", { style: { margin: "0 0 6px" } }, "用户语言"),
          h("p", { style: { margin: 0, color: "var(--dsw-alias-label-secondary)" } },
            "设置模型应答所用的语言。保存后下一次回复即按此语言输出（避免中文提问、英文回答）。")
        ),
        busy ? h("p", { style: { color: "var(--dsw-alias-label-secondary)" } }, "正在读取配置…")
          : h("label", { "data-settings-item": "language", style: { display: "grid", gap: "8px", padding: "18px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "14px", background: "var(--dsw-alias-bg-layer-1)" } },
              h("strong", null, "应答语言"),
              h("small", { style: { color: "var(--dsw-alias-label-tertiary)" } },
                "写一种语言，例如：简体中文 / 中文 / English / 日本語。"),
              h("input", {
                value: current,
                disabled: !snapshot.writable,
                placeholder: DEFAULT_LANGUAGE,
                style: { height: "38px", padding: "0 11px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "10px", color: "var(--dsw-alias-label-primary)", background: "var(--dsw-specific-input-major)", font: "inherit" },
                onChange: (event) => { void scope.set("language", event.target.value); },
              })
            )
      );
    }

    function apply(ctx) {
      const scope = ctx.settingsScope.bind({ namespace: NAMESPACE });
      ctx.slots.inject("settings.section", () =>
        ctx.slots.register({
          name: "settings.section",
          id: NAMESPACE,
          order: 130,
          label: "用户语言",
          inject: () => ({ scope }),
        }, UserLanguageSettings),
      );
      const search = (globalThis.__DSH_SETTINGS_SEARCH__ ??= {
        sections: new Map(),
        register(sectionId, spec) {
          this.sections.set(sectionId, spec);
          return () => { this.sections.delete(sectionId) };
        },
      });
      search.register(NAMESPACE, {
        label: "用户语言",
        keywords: "语言 language 应答 回答 中文 英文",
        items: [
          { id: "language", label: "应答语言", desc: "模型应答所用语言", keywords: "语言 应答 回复 language" },
        ],
      });
    }

    return { inject, apply };
  },
});
