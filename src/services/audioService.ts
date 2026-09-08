// src/services/audioService.ts

class AudioService {
  private preloadedAudios = new Map<string, HTMLAudioElement>();
  private currentAudio: HTMLAudioElement | null = null;

  /**
   * Tạo đường dẫn trực tiếp đến kho âm thanh Oxford MP3 trên Google Global CDN (0ms API roundtrip)
   */
  public getDirectOxfordUrl(word: string, lang = 'en-US'): string {
    const clean = word.trim().toLowerCase();
    const accent = lang.includes('GB') || lang.includes('UK') ? 'gb' : 'us';
    return `https://ssl.gstatic.com/dictionary/static/sounds/oxford/${encodeURIComponent(clean)}--_${accent}_1.mp3`;
  }

  /**
   * Nạp trước (Preload) âm thanh vào bộ nhớ đệm ngay khi thẻ bài hiển thị
   */
  public preload(word: string, lang = 'en-US'): void {
    if (!word || typeof window === 'undefined') return;
    const clean = word.trim().toLowerCase();
    const cacheKey = `${clean}_${lang}`;
    if (this.preloadedAudios.has(cacheKey)) return;

    try {
      const url = this.getDirectOxfordUrl(clean, lang);
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      this.preloadedAudios.set(cacheKey, audio);
    } catch (e) {
      // Ignore background preload errors
    }
  }

  /**
   * Phát âm thanh từ vựng với tốc độ phản hồi tức thì (< 30ms):
   * Tầng 1: Direct Google Oxford CDN MP3 (Thu âm người thật chuẩn Oxford)
   * Tầng 2: Google Stream CDN (Dự phòng mạng nhẹ)
   * Tầng 3: Native Web Speech API với bộ lọc Natural/Premium
   */
  public async playPronunciation(word: string, lang = 'en-US', rate = 0.9): Promise<void> {
    const cleanWord = word.trim();
    if (!cleanWord) return;

    // Dừng âm thanh đang phát trước đó để tránh đè tiếng
    this.stopCurrentAudio();

    const cacheKey = `${cleanWord.toLowerCase()}_${lang}`;

    // ================= TẦNG 1: DIRECT OXFORD CDN MP3 =================
    try {
      // 1.1 Kiểm tra nếu đã nạp trước trong RAM
      let audioToPlay = this.preloadedAudios.get(cacheKey);
      if (audioToPlay && audioToPlay.error === null) {
        audioToPlay.currentTime = 0;
        this.currentAudio = audioToPlay;
        await audioToPlay.play();
        return;
      }

      // 1.2 Nếu chưa có trong cache, phát trực tiếp link Oxford CDN
      const directUrl = this.getDirectOxfordUrl(cleanWord, lang);
      await this.playAudioFromUrl(directUrl);
      return;
    } catch (e) {
      console.warn('[AudioEngine] Tầng 1 (Oxford CDN) không khả dụng, chuyển sang Tầng 2...');
    }

    // ================= TẦNG 2: GOOGLE STREAM CDN =================
    try {
      const googleCdnUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
        lang
      )}&q=${encodeURIComponent(cleanWord)}`;
      await this.playAudioFromUrl(googleCdnUrl);
      return;
    } catch (e) {
      console.warn('[AudioEngine] Tầng 2 thất bại, chuyển sang Tầng 3 (Offline)...');
    }

    // ================= TẦNG 3: NATIVE NATURAL SYNTHESIS =================
    this.playOfflineSpeech(cleanWord, lang, rate);
  }

  /**
   * Dừng toàn bộ âm thanh hiện tại
   */
  public stopCurrentAudio(): void {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (err) {
        // Ignore
      }
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (err) {
        // Ignore
      }
    }
  }

  private playAudioFromUrl(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      audio.onended = () => {
        this.currentAudio = null;
        resolve();
      };
      audio.onerror = (e) => {
        this.currentAudio = null;
        reject(e);
      };
      audio.play().catch((err) => {
        this.currentAudio = null;
        reject(err);
      });
    });
  }

  private playOfflineSpeech(word: string, lang = 'en-US', rate = 0.9): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = lang;
    utterance.rate = rate;

    // Tự động tìm giọng đọc Natural hoặc US cao cấp nhất có sẵn trên thiết bị
    const voices = window.speechSynthesis.getVoices();
    const highQualityVoice = voices.find(
      (v) =>
        (v.name.includes('Natural') ||
          v.name.includes('Google US English') ||
          v.name.includes('Google UK English') ||
          v.name.includes('Samantha') ||
          v.name.includes('Aria') ||
          v.name.includes('Jenny') ||
          v.name.includes('Microsoft')) &&
        v.lang.startsWith(lang.substring(0, 2))
    ) || voices.find((v) => v.lang === lang || v.lang.startsWith(lang.substring(0, 2)));

    if (highQualityVoice) {
      utterance.voice = highQualityVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const soundEngine = new AudioService();
