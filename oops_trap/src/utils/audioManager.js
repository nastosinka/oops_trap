class AudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;

    this.buffers = new Map();
    this.currentMusic = null;
    this.currentMusicName = null;

    this.unlocked = false;
  }

  /* --------------------------------------------
       Инициализация AudioContext
    --------------------------------------------- */
  async init() {
    if (this.audioContext) return;

    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();

    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);
  }

  /* --------------------------------------------
       Разблокировка звука (user gesture)
    --------------------------------------------- */
  async unlock() {
    await this.init();

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.unlocked = true;
  }

  /* --------------------------------------------
       Загрузка аудио в buffer
    --------------------------------------------- */
  async load(name, url) {
    await this.init();

    if (this.buffers.has(name)) return;

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.buffers.set(name, buffer);
  }

  /* --------------------------------------------
       Проигрывание фоновой музыки
    --------------------------------------------- */
  async playMusic(name, { loop = true, volume = 0.3 } = {}) {
    if (!this.unlocked) return;

    if (this.currentMusicName === name) return;

    if (!this.buffers.has(name)) {
      console.warn(`Audio "${name}" not loaded`);
      return;
    }

    this.stopMusic();

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    gain.gain.value = volume;

    source.buffer = this.buffers.get(name);
    source.loop = loop;

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();

    this.currentMusic = { source, gain };
    this.currentMusicName = name;
  }

  /* --------------------------------------------
       Остановка музыки
    --------------------------------------------- */
  stopMusic() {
    if (!this.currentMusic) return;

    this.currentMusic.source.stop();
    this.currentMusic.source.disconnect();
    this.currentMusic.gain.disconnect();

    this.currentMusic = null;
    this.currentMusicName = null;
  }

  /* --------------------------------------------
       Fade out музыки
    --------------------------------------------- */
  fadeOutMusic(duration = 1) {
    if (!this.currentMusic) return;

    const { gain } = this.currentMusic;
    const now = this.audioContext.currentTime;

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    setTimeout(() => this.stopMusic(), duration * 1000);
  }

  /* --------------------------------------------
       One-shot звук (эффекты)
    --------------------------------------------- */
  playSfx(name, { volume = 1 } = {}) {
    if (!this.unlocked) return;
    if (!this.buffers.has(name)) return;

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    gain.gain.value = volume;

    source.buffer = this.buffers.get(name);

    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  playSfxWithVolume(name, volume = 1) {
    if (!this.unlocked) return;
    if (!this.buffers.has(name)) return;

    const source = this.audioContext.createBufferSource();
    const gain = this.audioContext.createGain();

    gain.gain.value = volume;

    source.buffer = this.buffers.get(name);
    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
  }

  /* --------------------------------------------
       Громкость
    --------------------------------------------- */
  setMasterVolume(value) {
    if (!this.masterGain) return;
    this.masterGain.gain.value = value;
  }
}

export const audioManager = new AudioManager();
