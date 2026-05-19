// src/services/aiService.ts
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { AIConfig, AIResponse } from '../types/ai';
import { LanguageCode } from '../constants/languages';

const SYSTEM_PROMPTS = {
  diary: (targetLang: string) =>
    `You are an English learning assistant. The user writes diary entries. ` +
    `Your task:\n` +
    `1. Split the text into natural sentences.\n` +
    `2. Organize each sentence: fix incomplete or informal phrasing while keeping original meaning.\n` +
    `3. Translate to natural, fluent ${targetLang}.\n` +
    `4. Return JSON: { "entries": [{ "original": "...", "organized": "...", "translated": "..." }] }` +
    `\nOnly return JSON, no explanation.`,

  target: (targetLang: string) =>
    `You are a writing coach. The user writes in ${targetLang}.\n` +
    `Your task:\n` +
    `1. Split the text into natural sentences.\n` +
    `2. Polish each sentence to be more natural while preserving original meaning.\n` +
    `3. Return JSON: { "entries": [{ "original": "...", "polished": "..." }] }` +
    `\nOnly return JSON, no explanation.`,
};

export async function callAI(
  content: string,
  mode: 'diary' | 'target',
  config: AIConfig,
  targetLang: LanguageCode,
  _diaryLang: LanguageCode
): Promise<AIResponse> {
  if (!config.endpoint || !config.apiKey) {
    throw new Error('AI 配置不完整，请先在设置中配置 API Endpoint 和 Key');
  }

  const langName = targetLang.toUpperCase();
  const systemPrompt = mode === 'diary'
    ? SYSTEM_PROMPTS.diary(langName)
    : SYSTEM_PROMPTS.target(langName);

  let body: object;
  let responseText: string;

  if (config.provider === 'anthropic') {
    body = {
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        { role: 'user', content: `Text to process:\n${content}` }
      ],
      system: systemPrompt,
    };

    // 自动补全 /v1/messages 路径
    let endpoint = config.endpoint;
    if (!endpoint.includes('/messages')) {
      endpoint = endpoint.replace(/\/$/, '') + '/v1/messages';
    }

    const response = await tauriFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    responseText = textBlock?.text;
  } else {
    // OpenAI compatible
    body = {
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
    };

    // 自动补全 /chat/completions 路径
    let endpoint = config.endpoint;
    if (!endpoint.includes('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }

    const response = await tauriFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    responseText = data.choices?.[0]?.message?.content;
  }

  if (!responseText) {
    throw new Error('AI 返回为空');
  }

  // Strip markdown code blocks if present
  const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as AIResponse;
}

export interface WordLookupResult {
  word: string;
  pos: string;       // part of speech, e.g. "n.", "v."
  definition: string; // definition in the word's original language
  nativeDef: string;  // translation in Chinese
  example?: string;
}

export async function lookupWord(
  word: string,
  sentence: string,
  config: AIConfig
): Promise<WordLookupResult> {
  const prompt =
    `Given the word "${word}" in this sentence: "${sentence}"\n` +
    `Provide:\n` +
    `1. Part of speech (abbr. like n. v. adj. adv. etc.)\n` +
    `2. A brief definition in the word's original language (one short phrase)\n` +
    `3. Chinese translation\n` +
    `Return JSON: { "word": "...", "pos": "...", "definition": "...", "nativeDef": "..." }` +
    `\nOnly return JSON.`;

  let responseText: string;

  if (config.provider === 'anthropic') {
    let endpoint = config.endpoint;
    if (!endpoint.includes('/messages')) {
      endpoint = endpoint.replace(/\/$/, '') + '/v1/messages';
    }
    const response = await tauriFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: 'You are a concise dictionary. Only return valid JSON, no explanation.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    responseText = textBlock?.text;
  } else {
    let endpoint = config.endpoint;
    if (!endpoint.includes('/chat/completions')) {
      endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
    }
    const response = await tauriFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a concise English dictionary.' },
          { role: 'user', content: prompt }
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI API error: ${response.status}`);
    const data = await response.json();
    responseText = data.choices?.[0]?.message?.content;
  }

  const cleaned = (responseText || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned) as WordLookupResult;
}

export async function fetchModels(config: AIConfig): Promise<string[]> {
  if (!config.endpoint || !config.apiKey) {
    throw new Error('请先填写 Endpoint 和 API Key');
  }

  let modelsUrl: string;
  let headers: Record<string, string>;

  if (config.provider === 'anthropic') {
    // Derive models URL: strip known paths, then append /v1/models
    let base = config.endpoint;
    base = base.replace(/\/v1\/messages\/?$/, '');
    base = base.replace(/\/$/, '');
    modelsUrl = base + '/v1/models';
    headers = {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  } else {
    let base = config.endpoint;
    base = base.replace(/\/chat\/completions\/?$/, '');
    base = base.replace(/\/$/, '');
    modelsUrl = base + '/models';
    headers = {
      'Authorization': `Bearer ${config.apiKey}`,
    };
  }

  const response = await tauriFetch(modelsUrl, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`获取模型列表失败 (${response.status})`);
  }

  const data = await response.json();

  let models: string[];
  if (config.provider === 'anthropic') {
    models = (data.data || []).map((m: any) => m.id || m.name).filter(Boolean);
  } else {
    models = (data.data || []).map((m: any) => m.id).filter(Boolean);
  }

  if (models.length === 0) {
    throw new Error('未找到可用模型');
  }

  return models.sort((a, b) => a.localeCompare(b));
}
