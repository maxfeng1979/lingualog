# Model Auto-Fetch Design

## Summary

In the AI settings section, replace the plain text model input with a dropdown selector that auto-fetches available models from the configured API endpoint. A manual input fallback is always available.

## Data Flow

### New function: `fetchModels` in `aiService.ts`

**OpenAI-compatible mode:**
- Derive models URL from the configured endpoint (strip chat/completions path, append `/models`)
- Special case: `bigmodel.cn` endpoints strip to base URL then append `/models`
- Request: `GET {modelsUrl}` with `Authorization: Bearer {apiKey}`
- Parse: extract `response.data[].id`, sort alphabetically, return `string[]`

**Anthropic mode:**
- Replace endpoint path `/v1/messages` with `/v1/models` (or append `/models` if no known path)
- Request: `GET {modelsUrl}` with `x-api-key: {apiKey}` and `anthropic-version: 2023-06-01`
- Parse model IDs from response, sort alphabetically, return `string[]`

**Error handling:**
- On failure (404, network error, parse error), throw with a user-friendly message like "该端点不支持获取模型列表"
- Caller handles gracefully — user can still type manually

### SettingsPage changes

New state:
- `models: string[]` — fetched model list
- `fetchingModels: boolean` — loading state
- `fetchError: string` — error message from fetch attempt

## UI Design

### Model selector has two modes

**Dropdown mode (default when models are available):**
- `<select>` element with fetched models as options
- Currently selected model (from `aiConfig.model`) pre-selected if present in list
- Last option: "手动输入..." which switches to input mode
- A refresh button (icon) next to the select to re-fetch models

**Manual input mode (when "手动输入..." selected, or fetch failed, or no models yet):**
- Plain `<input type="text">` — same as current implementation
- A "选择模型" button to switch back to dropdown mode (if models list is non-empty)

### Fetch button behavior
- Disabled when endpoint or apiKey is empty
- Shows loading state while fetching
- On success: populate select, switch to dropdown mode
- On failure: show error message, stay in or switch to manual input mode

## Files to modify

1. `src/services/aiService.ts` — add `fetchModels(config: AIConfig): Promise<string[]>`
2. `src/components/SettingsPage.tsx` — replace model input with dual-mode selector, add fetch button and state
