import { SOUNDS } from '../constants';

class AudioService {
  private static instance: AudioService;
  private sounds: Record<string, HTMLAudioElement> = {};

  private constructor() {
    this.preloadSounds();
  }

  public static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private preloadSounds() {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.volume = 0.3; // Low volume for subtlety
      this.sounds[key] = audio;
    });
  }

  public play(key: keyof typeof SOUNDS) {
    const audio = this.sounds[key];
    if (audio) {
      audio.currentTime = 0;
      // Randomize pitch slightly for organic feel
      // Note: playbackRate changes pitch and speed
      audio.playbackRate = 0.95 + Math.random() * 0.1; 
      audio.play().catch(() => {
        // Ignored: Audio play failures (e.g., user hasn't interacted yet) are expected
      });
    }
  }
}

export const audioService = AudioService.getInstance();