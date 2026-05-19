export type VoiceGender = 'male' | 'female';

export async function speak(text: string, gender?: VoiceGender): Promise<void> {
  if (!('speechSynthesis' in window)) {
    console.warn('Web Speech API not supported');
    return;
  }

  // Stop any ongoing speech before starting new one
  speechSynthesis.cancel();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const enVoices = voices.filter(v => v.lang.startsWith('en'));
    if (enVoices.length > 0) {
      // Pick a different voice for male vs female if available
      const count = enVoices.length;
      if (gender === 'female' && count > 1) {
        utterance.voice = enVoices[Math.min(1, count - 1)];
      } else {
        utterance.voice = enVoices[0];
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    speechSynthesis.speak(utterance);
  });
}
