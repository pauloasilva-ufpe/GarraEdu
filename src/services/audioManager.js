import { Howl, Howler } from 'howler';

// Sons gerados via URL de dados (sine wave) para não depender de arquivos externos.
// Em produção, substitua pelos arquivos .mp3 reais.
const SOUNDS = {
  correct: new Howl({
    src: ['https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8f7a8fe.mp3'],
    volume: 0.6,
    html5: true,
  }),
  wrong: new Howl({
    src: ['https://cdn.pixabay.com/audio/2021/08/04/audio_c6ccf41fa3.mp3'],
    volume: 0.5,
    html5: true,
  }),
  claw_drop: new Howl({
    src: ['https://cdn.pixabay.com/audio/2022/03/24/audio_d7e5a8a44b.mp3'],
    volume: 0.7,
    html5: true,
  }),
  win: new Howl({
    src: ['https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1c23.mp3'],
    volume: 0.8,
    html5: true,
  }),
  click: new Howl({
    src: ['https://cdn.pixabay.com/audio/2021/08/09/audio_88447e769f.mp3'],
    volume: 0.4,
    html5: true,
  }),
};

export function playSound(name) {
  try {
    if (SOUNDS[name]) SOUNDS[name].play();
  } catch {
    // silently ignore — usuário pode ter bloqueado áudio
  }
}

export function setVolume(v) {
  Howler.volume(v);
}
