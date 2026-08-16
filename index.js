/**
 * @doiiarx/dsh-user-language —— 应答语言设置 + 系统提示词注入插件（host 级）。
 *
 * 双面包（与 @doiiarx/dsh-weather-plugin 同一套工作模式）：
 *   - 宿主端（本文件）：注册 `user-language` settings 命名空间（接受
 *     `language` 字段），并在 systemPrompt 注册一个段落。段落文本按当下
 *     settings 里的语言求值，所以用户在设置页改语言后，下一次组装系统
 *     提示词即按新语言渲染，无需重启、无需重建 web 产物。
 *   - 浏览器端（client.js）：在设置页渲染「用户语言」小节，编辑 language。
 *
 * 失败隔离（与 weather 相同）：本文件保持零外部依赖，schemastery 与
 * implementation 都在 apply() 里动态 import，任何失败降级为诊断日志，
 * 不会拖垮整个 profile。
 */

export const name = 'pn-user-language'
export const inject = ['settings', 'systemPrompt']

const SETTINGS_NS = 'user-language'
const DEFAULT_LANGUAGE = '简体中文（Simplified Chinese）'

function report(ctx, scope, error) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
  const message = `[pn-user-language] ${scope} unavailable: ${detail}`
  const logger = ctx.root?.logger?.('pn-user-language')
  if (logger?.error) logger.error('%s', message)
  console.error(message)
}

export async function apply(ctx, config = {}) {
  // 1) 注册可持久化的 settings 命名空间（用户在设置页编辑它）。
  let scope
  try {
    // `schemastery` 是 CJS 风格模块，ESM 互操作下取 `default`（Schema.object）。
    const { default: Schema } = await import('schemastery')
    const base = { language: config.language ?? DEFAULT_LANGUAGE }
    scope = ctx.settings.register(SETTINGS_NS, Schema.object({
      language: Schema.string().default(base.language),
    }), { base })
  } catch (error) {
    report(ctx, 'settings', error)
    scope = null
  }

  // 2) 注册系统提示词段落：每次组装时从 settings 读取当前语言。
  //    未配置/读取失败时返回空串，renderPrompt 会跳过空段落。
  ctx.systemPrompt.section({
    name: 'user:language',
    order: -90,
    text: () => {
      try {
        let language = null
        if (scope) {
          language = scope.get().language
        } else {
          language = ctx.get('settings')?.get(SETTINGS_NS)?.language
        }
        if (!language || !String(language).trim()) return ''
        const value = String(language).trim()
        return '始终只用以下语言完整回答用户（所有回复、解释、工具调用后的说明都用这种语言）：'
          + value + '。绝不要因为用户偶尔用了英文/代码/术语就切换成英文回复正文。'
      } catch (error) {
        report(ctx, 'system-prompt', error)
        return ''
      }
    },
  })

  return undefined
}
