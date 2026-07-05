export interface AIConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  useSimulated: boolean;
}

function loadConfig(): AIConfig {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
  return {
    apiKey,
    model: 'openrouter/free',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    useSimulated: apiKey.length < 8,
  };
}

export function getAIConfig(): AIConfig {
  return loadConfig();
}
