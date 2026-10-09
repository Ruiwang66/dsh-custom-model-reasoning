window.__ModuleLoader__.load({
  id: 'dsh-custom-model-reasoning',
  factory(require) {
const React = require('react')
const h = React.createElement
const { useState } = React

const SETTINGS_NS = 'llm-pi-ai'
const LOCALE_NS = 'customModelReasoning'
const LEVELS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max']
const LEVEL_LABELS = {
  minimal: 'levelMinimal',
  low: 'levelLow',
  medium: 'levelMedium',
  high: 'levelHigh',
  xhigh: 'levelXhigh',
  max: 'levelMax',
}

const en = {
  title: 'Reasoning effort',
  subtitle: 'Per-model controls',
  loading: 'Loading model settings…',
  noRows: 'No customized models are available on this provider.',
  modelId: 'Model ID',
  unsupported: 'This model does not support reasoning effort',
  off: 'off',
  offHelp: 'Blank means the request omits the reasoning effort field.',
  wireValue: 'API value',
  save: 'Save',
  saving: 'Saving…',
  saved: 'Saved. The model selector will use these levels.',
  rejected: 'Save was refused. Reopen the model settings and try again.',
  unavailable: 'Settings are read-only or unavailable.',
  chooseLevel: 'Select at least one reasoning level, or mark the model as unsupported.',
  emptyWireValue: 'Every selected level needs a non-empty API value.',
  note: 'The level is shown in the model selector. API value is sent to the provider.',
  levelMinimal: 'Minimal',
  levelLow: 'Low',
  levelMedium: 'Medium',
  levelHigh: 'High',
  levelXhigh: 'Extra high',
  levelMax: 'Maximum',
}

const zh = {
  title: '模型推理强度',
  subtitle: '按模型设置',
  loading: '正在读取模型设置…',
  noRows: '此提供商没有可配置的自定义模型。',
  modelId: '模型 ID',
  unsupported: '此模型不支持推理强度',
  off: '关闭',
  offHelp: '留空表示请求中不发送推理强度字段。',
  wireValue: '接口实际值',
  save: '保存',
  saving: '保存中…',
  saved: '已保存，模型选择器将使用这些档位。',
  rejected: '保存未通过。请重新打开模型设置后重试。',
  unavailable: '当前设置为只读或不可用。',
  chooseLevel: '至少选择一个推理档位，或标记此模型不支持推理。',
  emptyWireValue: '已选档位必须填写接口实际值。',
  note: '档位名称会显示在模型选择器中；接口实际值会发送给提供商。',
  levelMinimal: '最少',
  levelLow: '低',
  levelMedium: '中',
  levelHigh: '高',
  levelXhigh: '更高',
  levelMax: '最高',
}

const inputStyle = {
  boxSizing: 'border-box',
  minWidth: 0,
  width: '100%',
  padding: '7px 9px',
  border: '1px solid var(--dsh-border, #d0d0d0)',
  borderRadius: '8px',
  background: 'var(--dsh-input-background, transparent)',
  color: 'inherit',
  font: 'inherit',
}

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(125px, 1fr) minmax(120px, 1fr)',
  alignItems: 'center',
  gap: '8px',
  marginTop: '8px',
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function rowsFor(profile) {
  const rows = []
  if (Array.isArray(profile?.models)) {
    for (const model of profile.models) {
      if (isObject(model) && typeof model.id === 'string' && model.id.length > 0) {
        rows.push({ kind: 'models', id: model.id, name: model.name, model })
      }
    }
  }
  if (isObject(profile?.modelOverrides)) {
    for (const [id, model] of Object.entries(profile.modelOverrides)) {
      if (id.length > 0 && isObject(model)) rows.push({ kind: 'modelOverrides', id, name: model.name, model })
    }
  }
  return rows
}

function draftFor(model) {
  const saved = model.reasoningEfforts
  const mapping = isObject(saved) ? saved : {}
  const levels = Object.fromEntries(LEVELS.map((level) => {
    const value = mapping[level]
    return [level, {
      enabled: typeof value === 'string' && value.length > 0,
      wire: typeof value === 'string' && value.length > 0 ? value : level,
    }]
  }))
  return {
    unsupported: saved === false,
    off: typeof mapping.off === 'string' ? mapping.off : '',
    levels,
  }
}

function saveValue(draft, t) {
  if (draft.unsupported) return { value: false }
  const selected = LEVELS.filter(level => draft.levels[level].enabled)
  if (selected.length === 0) return { error: t('chooseLevel') }
  const value = { off: draft.off.trim() || null }
  for (const level of selected) {
    const wire = draft.levels[level].wire.trim()
    if (wire.length === 0) return { error: t('emptyWireValue') }
    value[level] = wire
  }
  return { value }
}

async function mutateModel(form, providerId, kind, modelId, reasoningEfforts, t) {
  const snapshot = form.getSnapshot()
  if (snapshot.status !== 'ready' || !snapshot.writable || snapshot.revision === undefined) {
    return { ok: false, message: t('unavailable') }
  }
  const profile = snapshot.value?.providers?.[providerId]
  if (!isObject(profile)) return { ok: false, message: t('rejected') }

  let path
  if (kind === 'models') {
    const index = Array.isArray(profile.models) ? profile.models.findIndex(model => model?.id === modelId) : -1
    if (index < 0) return { ok: false, message: t('rejected') }
    path = ['providers', providerId, 'models', String(index), 'reasoningEfforts']
  } else {
    if (!isObject(profile.modelOverrides) || !Object.hasOwn(profile.modelOverrides, modelId)) {
      return { ok: false, message: t('rejected') }
    }
    path = ['providers', providerId, 'modelOverrides', modelId, 'reasoningEfforts']
  }

  const accepted = await form.mutate([
    { op: 'set', path, value: reasoningEfforts },
  ], snapshot.revision)
  return accepted ? { ok: true } : { ok: false, message: t('rejected') }
}

function ModelEffortEditor({ providerId, row, revision, writable, t, saveModel }) {
  const [draft, setDraft] = useState(() => draftFor(row.model))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const disabled = draft.unsupported || !writable || saving

  function patchLevel(level, patch) {
    setDraft(current => ({
      ...current,
      levels: {
        ...current.levels,
        [level]: { ...current.levels[level], ...patch },
      },
    }))
    setMessage('')
  }

  async function submit() {
    const result = saveValue(draft, t)
    if (result.error !== undefined) {
      setMessage(result.error)
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const response = await saveModel(providerId, row.kind, row.id, result.value)
      setMessage(response.ok ? t('saved') : response.message)
    } catch (_error) {
      setMessage(t('rejected'))
    } finally {
      setSaving(false)
    }
  }

  const options = LEVELS.map((level) => {
    const state = draft.levels[level]
    return h('div', { key: level, style: rowStyle },
      h('label', { style: { display: 'flex', alignItems: 'center', gap: '7px' } },
        h('input', {
          type: 'checkbox',
          checked: state.enabled,
          disabled,
          onChange: event => patchLevel(level, { enabled: event.target.checked }),
          'aria-label': t(`levels.${level}`),
        }),
        h('span', null, t(LEVEL_LABELS[level])),
      ),
      h('input', {
        type: 'text',
        value: state.wire,
        disabled: !state.enabled || !writable || saving,
        style: inputStyle,
        'aria-label': `${t(LEVEL_LABELS[level])} — ${t('wireValue')}`,
        onChange: event => patchLevel(level, { wire: event.target.value }),
      }),
    )
  })

  return h('fieldset', {
    key: `${row.kind}:${row.id}:${revision}`,
    style: {
      minWidth: 0,
      margin: '10px 0 0',
      padding: '10px 12px 12px',
      border: '1px solid var(--dsh-border, #d0d0d0)',
      borderRadius: '10px',
    },
  },
  h('legend', { style: { padding: '0 4px', fontWeight: 600 } }, row.name || row.id),
  h('label', { style: { display: 'flex', alignItems: 'center', gap: '7px' } },
    h('input', {
      type: 'checkbox',
      checked: draft.unsupported,
      disabled: !writable || saving,
      onChange: event => {
        setDraft(current => ({ ...current, unsupported: event.target.checked }))
        setMessage('')
      },
    }),
    h('span', null, t('unsupported')),
  ),
  h('div', { style: rowStyle },
    h('span', null, t('off')),
    h('input', {
      type: 'text',
      value: draft.off,
      disabled: disabled,
      style: inputStyle,
      'aria-label': `${t('off')} — ${t('wireValue')}`,
      onChange: event => {
        setDraft(current => ({ ...current, off: event.target.value }))
        setMessage('')
      },
    }),
  ),
  h('small', { style: { display: 'block', marginTop: '4px', opacity: 0.72 } }, t('offHelp')),
  ...options,
  h('small', { style: { display: 'block', marginTop: '10px', opacity: 0.72 } }, t('note')),
  message ? h('div', { role: 'status', style: { marginTop: '8px' } }, message) : null,
  h('button', {
    type: 'button',
    disabled: !writable || saving,
    onClick: () => { void submit() },
    style: {
      marginTop: '10px',
      padding: '7px 12px',
      border: 0,
      borderRadius: '8px',
      background: 'var(--dsh-accent, #111827)',
      color: 'var(--dsh-accent-foreground, #ffffff)',
      font: 'inherit',
      cursor: writable && !saving ? 'pointer' : 'default',
    },
  }, saving ? t('saving') : t('save')),
  )
}

function ReasoningEffortCard(props) {
  const snapshot = props.useSettings(state => state)
  const { provider, configured, t } = props
  if (provider.settingsNs !== SETTINGS_NS || !configured) return null
  if (snapshot.status !== 'ready' || !isObject(snapshot.value)) {
    return h('details', { style: { marginTop: '10px' } },
      h('summary', { style: { cursor: 'pointer' } }, t('title')),
      h('p', null, t('loading')),
    )
  }

  const profile = snapshot.value.providers?.[provider.provider]
  const rows = isObject(profile) ? rowsFor(profile) : []
  if (rows.length === 0) return null
  const writable = snapshot.writable === true

  return h('details', {
    style: {
      marginTop: '10px',
      padding: '10px 12px 12px',
      border: '1px solid var(--dsh-border, #d0d0d0)',
      borderRadius: '10px',
    },
  },
  h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, `${t('title')} · ${t('subtitle')}`),
  rows.map(row => h(ModelEffortEditor, {
    key: `${row.kind}:${row.id}:${snapshot.revision}`,
    providerId: provider.provider,
    row,
    revision: snapshot.revision,
    writable,
    t,
    saveModel: props.saveModel,
  })),
  )
}

const inject = ['slots', 'locale', 'configForms']

function apply(ctx) {
  const t = ctx.locale.bind(LOCALE_NS)
  const form = ctx.configForms.get(SETTINGS_NS)
  ctx.effect(() => ctx.locale.register(LOCALE_NS, { zh, en }), 'custom-model-reasoning: dictionaries')

  ctx.slots.inject('settings.models.provider-card', () => ctx.slots.register({
    name: 'settings.models.provider-card',
    key: SETTINGS_NS,
    order: 30,
    locale: LOCALE_NS,
    inject: () => ({
      hooks: { settings: form },
      saveModel: (providerId, kind, modelId, value) => mutateModel(form, providerId, kind, modelId, value, t),
    }),
  }, ReasoningEffortCard))
}
return { inject, apply }
  },
})

