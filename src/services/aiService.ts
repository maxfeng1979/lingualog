// src/services/aiService.ts
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

    const response = await fetch(config.endpoint, {
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
    responseText = data.content?.[0]?.text;
  } else {
    // OpenAI compatible
    body = {
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
    };

    const response = await fetch(config.endpoint, {
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
