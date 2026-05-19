import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { useSettings } from '../context/SettingsContext';
import { fetchModels } from '../services/aiService';

export function SettingsPage() {
  const { aiConfig, setAIConfig, exportDir, setExportDir } = useSettings();
  const [testResult, setTestResult] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);

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

      let endpoint = aiConfig.endpoint;
      if (aiConfig.provider === 'anthropic') {
        if (!endpoint.includes('/messages')) {
          endpoint = endpoint.replace(/\/$/, '') + '/v1/messages';
        }
      } else {
        if (!endpoint.includes('/chat/completions')) {
          endpoint = endpoint.replace(/\/$/, '') + '/chat/completions';
        }
      }
      const res = await tauriFetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
      setTestResult(res.ok ? '✅ 连接成功' : `❌ ${res.status} ${res.statusText}`);
    } catch (e: any) {
      setTestResult(`❌ ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

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

  return (
    <div className="settings-page">
      <header className="settings-header">
        <span className="settings-title">设置</span>
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
              placeholder={aiConfig.provider === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1'}
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="settings-input"
                type="text"
                value={exportDir}
                readOnly
                placeholder="点击右侧按钮选择目录"
                style={{ flex: 1 }}
              />
              <button
                className="test-btn"
                onClick={async () => {
                  const selected = await open({ directory: true });
                  if (selected) setExportDir(selected as string);
                }}
              >
                浏览...
              </button>
            </div>
          </label>
        </section>
      </div>
    </div>
  );
}
