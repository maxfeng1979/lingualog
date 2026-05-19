# Model Auto-Fetch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain text model input in settings with a dropdown that auto-fetches available models from the configured API, with a manual input fallback.

**Architecture:** Add a `fetchModels()` function to `aiService.ts` that calls each provider's models API. Modify `SettingsPage.tsx` to show a dual-mode model selector (dropdown vs. text input) with a fetch button. No new files needed.

**Tech Stack:** React 19, TypeScript, existing CSS variables and patterns.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/services/aiService.ts` | Modify | Add `fetchModels(config)` function |
| `src/components/SettingsPage.tsx` | Modify | Replace model `<input>` with dual-mode selector |

---

### Task 1: Add `fetchModels` to `aiService.ts`

**Files:**
- Modify: `src/services/aiService.ts` — append new export after `lookupWord`

- [ ] **Step 1: Add the `fetchModels` function**

Append the following after the `lookupWord` function (after line 178):

```typescript
export async function fetchModels(config: AIConfig): Promise<string[]> {
  if (!config.endpoint || !config.apiKey) {
    throw new Error('请先填写 Endpoint 和 API Key');
  }

  let modelsUrl: string;
  let headers: Record<string, string>;

  if (config.provider === 'anthropic') {
    // Anthropic: replace /v1/messages with /v1/models, or append /models
    modelsUrl = config.endpoint.replace(/\/v1\/messages\/?$/, '/v1/models');
    if (!modelsUrl.includes('/models')) {
      modelsUrl = config.endpoint.replace(/\/$/, '') + '/models';
    }
    headers = {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  } else {
    // OpenAI compatible: strip known paths, append /models
    let base = config.endpoint;
    base = base.replace(/\/chat\/completions\/?$/, '');
    base = base.replace(/\/$/, '');
    modelsUrl = base + '/models';
    headers = {
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  const response = await fetch(modelsUrl, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`获取模型列表失败 (${response.status})`);
  }

  const data = await response.json();

  let models: string[];
  if (config.provider === 'anthropic') {
    // Anthropic: { data: [{ id: "..." }, ...] } or { data: [{ type: "model", id: "..." }] }
    models = (data.data || []).map((m: any) => m.id || m.name).filter(Boolean);
  } else {
    // OpenAI: { data: [{ id: "..." }, ...] }
    models = (data.data || []).map((m: any) => m.id).filter(Boolean);
  }

  if (models.length === 0) {
    throw new Error('未找到可用模型');
  }

  return models.sort((a, b) => a.localeCompare(b));
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors related to the new function.

---

### Task 2: Replace model input with dual-mode selector in `SettingsPage.tsx`

**Files:**
- Modify: `src/components/SettingsPage.tsx` — lines 1-140

- [ ] **Step 1: Add new imports and state**

At the top, add `fetchModels` to the imports from `../services/aiService`. Then add three new state variables after the existing `testing` state (after line 8):

Change line 1 to:
```typescript
import { useState } from 'react';
```

(No change needed, already correct.)

Add import after line 3:
```typescript
import { fetchModels } from '../services/aiService';
```

Add state after line 8 (`const [testing, setTesting] = useState(false);`):
```typescript
const [models, setModels] = useState<string[]>([]);
const [fetchingModels, setFetchingModels] = useState(false);
const [fetchError, setFetchError] = useState('');
const [useManualInput, setUseManualInput] = useState(false);
```

- [ ] **Step 2: Add the `handleFetchModels` handler**

After the `handleTestAI` function (after line 43), add:

```typescript
const handleFetchModels = async () => {
  if (!aiConfig.endpoint || !aiConfig.apiKey) {
    setFetchError('请先填写 Endpoint 和 API Key');
    return;
  }
  setFetchingModels(true);
  setFetchError('');
  try {
    const list = await fetchModels(aiConfig);
    setModels(list);
    setUseManualInput(false);
    // If current model not in list, select first
    if (list.length > 0 && !list.includes(aiConfig.model)) {
      setAIConfig({ ...aiConfig, model: list[0] });
    }
  } catch (e: any) {
    setFetchError(e.message || '获取模型列表失败');
    setModels([]);
  } finally {
    setFetchingModels(false);
  }
};
```

- [ ] **Step 3: Replace the model label block**

Replace lines 85–94 (the model `<label>` block):

```typescript
// OLD:
//           <label className="settings-label">
//             模型
//             <input
//               className="settings-input"
//               type="text"
//               value={aiConfig.model}
//               onChange={e => setAIConfig({ ...aiConfig, model: e.target.value })}
//               placeholder="gpt-4o"
//             />
//           </label>
```

With:

```typescript
<label className="settings-label">
  模型
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
    {!useManualInput && models.length > 0 ? (
      <select
        className="settings-select"
        style={{ flex: 1 }}
        value={models.includes(aiConfig.model) ? aiConfig.model : '__manual__'}
        onChange={e => {
          if (e.target.value === '__manual__') {
            setUseManualInput(true);
          } else {
            setAIConfig({ ...aiConfig, model: e.target.value });
          }
        }}
      >
        {!models.includes(aiConfig.model) && aiConfig.model && (
          <option value={aiConfig.model}>{aiConfig.model}</option>
        )}
        {models.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
        <option value="__manual__">手动输入...</option>
      </select>
    ) : (
      <>
        <input
          className="settings-input"
          style={{ flex: 1 }}
          type="text"
          value={aiConfig.model}
          onChange={e => setAIConfig({ ...aiConfig, model: e.target.value })}
          placeholder="gpt-4o"
        />
        {models.length > 0 && (
          <button
            className="test-btn"
            style={{ padding: '9px 12px', fontSize: 12 }}
            onClick={() => setUseManualInput(false)}
          >
            选择
          </button>
        )}
      </>
    )}
    <button
      className="test-btn"
      style={{ padding: '9px 12px', fontSize: 12, whiteSpace: 'nowrap' }}
      onClick={handleFetchModels}
      disabled={fetchingModels || !aiConfig.endpoint || !aiConfig.apiKey}
    >
      {fetchingModels ? '获取中...' : '获取模型'}
    </button>
  </div>
  {fetchError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 2 }}>{fetchError}</div>}
</label>
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Test manually with `npm run tauri dev`**

1. Open Settings page
2. Enter an OpenAI-compatible endpoint and API key
3. Click "获取模型" — should populate dropdown
4. Select a model from dropdown
5. Click "手动输入..." — should switch to text input
6. Click "选择" — should switch back to dropdown
7. Test with empty/invalid credentials — should show error gracefully
