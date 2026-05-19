import { useCallback } from 'react';
import { speak, VoiceGender } from '../services/ttsService';

export function useTTS() {
  const play = useCallback((text: string, gender?: VoiceGender) => {
    return speak(text, gender);
  }, []);
  return { play };
}
