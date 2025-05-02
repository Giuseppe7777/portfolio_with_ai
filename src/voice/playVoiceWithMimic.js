/**
 * Програє озвучку тексту та анімує рот через гучність аудіо
 * @param {string} audioUrl - URL до аудіо (наприклад, від ElevenLabs)
 * @param {THREE.Mesh} faceMesh - меш із morphTargetDictionary та morphTargetInfluences
 */
export async function playVoiceWithMimic(audioUrl, faceMesh, avatar) {
  const audio = new Audio(audioUrl);
  audio.volume = 1.0;

  // 🔸 Знайти shape key для рота
  const mouthOpenKey = 'A25_Jaw_Open';
  const dict = faceMesh.morphTargetDictionary;
  const infl = faceMesh.morphTargetInfluences;
  const mouthIndex = dict[mouthOpenKey];
  console.log('👄 mouthIndex:', mouthIndex);
  const jawBone = avatar.getObjectByName('mixamorigJawRoot');
  console.log('🦴 Щелепна кістка (з avatar):', jawBone);

  if (mouthIndex === undefined) {
    console.warn(`Shape key '${mouthOpenKey}' не знайдено`);
    audio.play(); // все одно програємо без міміки
    return;
  }

  // 🔹 Створюємо аудіо-контекст для аналізу гучності
  const context = new AudioContext();
  const src = context.createMediaElementSource(audio);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  src.connect(analyser);
  analyser.connect(context.destination);

  // 🔹 Анімація рота залежно від гучності
  const animate = () => {
    analyser.getByteFrequencyData(dataArray);
    const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
    infl[mouthIndex] = volume * 3.2; // масштабування для ефекту
    if (!audio.paused && !audio.ended) {
      requestAnimationFrame(animate);
    } else {
      infl[mouthIndex] = 0;
    }
  };

  // 🔸 Старт програвання та синхронної анімації
  audio.play().then(() => {
    context.resume();
    animate();
  }).catch(err => {
    console.error('🎵 Не вдалося програти аудіо:', err);
  });
}
