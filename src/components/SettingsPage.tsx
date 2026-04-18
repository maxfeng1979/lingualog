// src/components/SettingsPage.tsx
import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';

interface SettingsPageProps {
  onBack: () => void;
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const { aiConfig, setAIConfig } = useSettings();
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);

  const handleTestAI = async () => {
    if (!aiConfig.endpoint || !aiConfig.apiKey) {
      setTestResult('请填写 Endpoint 和 API Key');
      return;
    }
    setTesting(true);
    setTestResult('');
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (aiConfig.provider === 'anthropic') {
        headers['x-api-key'] = aiConfig.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else {
        headers['Authorization'] = `Bearer ${aiConfig.apiKey}`;
      }

      const body = aiConfig.provider === 'anthropic'
        ? { model: aiConfig.model || 'claude-3-5-sonnet-20241022', max_tokens: 10, messages: [{ role: 'user', content: 'Hi' }] }
        : { model: aiConfig.model || 'gpt-4o', messages: [{ role: 'user', content: 'Hi' }] };

      const res = await fetch(aiConfig.endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      setTestResult(res.ok ? '✅ 连接成功' : `❌ ${res.status} ${res.statusText}`);
    } catch (e: any) {
      setTestResult(`❌ ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="back-btn" onClick={onBack}>← 返回</button>
        <span className="settings-title">设置</span>
        <div style={{ width: 60 }} />
      </header>

      <div className="settings-content">
        <section className="settings-section">
          <h3>AI 配置</h3>
          <label className="settings-label">
            Provider
            <select
              className="settings-select"
              value={aiConfig.provider}
              onChange={e => setAIConfig({ ...aiConfig, provider: e.target.value as 'openai' | 'anthropic' })}
            >
              <option value="openai">OpenAI (兼容格式)</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </label>
          <label className="settings-label">
            Endpoint URL
            <input
              className="settings-input"
              type="text"
              value={aiConfig.endpoint}
              onChange={e => setAIConfig({ ...aiConfig, endpoint: e.target.value })}
              placeholder={aiConfig.provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : 'https://api.openai.com/v1/chat/completions'}
            />
          </label>
          <label className="settings-label">
            API Key
            <input
              className="settings-input"
              type="password"
              value={aiConfig.apiKey}
              onChange={e => setAIConfig({ ...aiConfig, apiKey: e.target.value })}
              placeholder="sk-..."
            />
          </label>
          <label className="settings-label">
            模型
            <input
              className="settings-input"
              type="text"
              value={aiConfig.model}
              onChange={e => setAIConfig({ ...aiConfig, model: e.target.value })}
              placeholder="gpt-4o"
            />
          </label>
          <button className="test-btn" onClick={handleTestAI} disabled={testing}>
            {testing ? '测试中...' : '测试连接'}
          </button>
          {testResult && <div className="test-result">{testResult}</div>}
        </section>

        <section className="settings-section">
          <h3>TTS 配置</h3>
          <label className="settings-label">
            模式
            <select className="settings-select">
              <option>Web Speech API（免费）</option>
              <option disabled>自定义（即将支持）</option>
            </select>
          </label>
        </section>

        <section className="settings-section">
          <h3>导出设置</h3>
          <label className="settings-label">
            导出目录
            <input className="settings-input" type="text" value="~/Documents/LinguaLog" readOnly />
          </label>
        </section>
      </div>
    </div>
  );
}