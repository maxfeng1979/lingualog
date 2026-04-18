import { createContext, useContext, useState } from 'react';
import { AIConfig } from '../types/ai';

const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  endpoint: '',
  apiKey: '',
  model: 'gpt-4o',
};

interface SettingsContextValue {
  aiConfig: AIConfig;
  setAIConfig: (c: AIConfig) => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  aiConfig: DEFAULT_AI_CONFIG,
  setAIConfig: () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [aiConfig, setAIConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  return (
    <SettingsContext.Provider value={{ aiConfig, setAIConfig }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);