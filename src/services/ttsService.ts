export type VoiceGender = 'male' | 'female';

export async function speak(text: string, gender: VoiceGender = 'male'): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    return;
  }

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    if (enVoices.length > 0) {
      // Heuristic: male = index 0, female = index 1 (if available)
      utterance.voice = gender === 'male' ? enVoices[0] : enVoices[Math.min(1, enVoices.length - 1)];
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}
