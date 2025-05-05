/**
 * Показує кнопку для дозволу на мікрофон і починає слухати, якщо користувач погодився
 */
export function promptMicrophoneAccess() {
  const micBtn = document.createElement('button');
  micBtn.textContent = '🎤 Allow microphone';
  micBtn.id = 'mic-permission-btn';

  // Стилі — мінімальний гарний вигляд
  Object.assign(micBtn.style, {
    position: 'absolute',
    bottom: '70px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 20px',
    fontSize: '18px',
    background: '#111',
    color: 'white',
    border: '2px solid white',
    borderRadius: '10px',
    cursor: 'pointer',
    zIndex: 9999
  });

  document.body.appendChild(micBtn);

  micBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log('🎤 Доступ до мікрофона надано');
      micBtn.remove(); // прибираємо кнопку після дозволу

      listenToSpeech(stream); // ⏳ Далі: слухаємо голос (реалізуємо окремо)
    } catch (err) {
      console.error('❌ Не вдалося отримати доступ до мікрофона:', err);
      alert('Мікрофон не активовано. Я не зможу тебе почути 😢');
    }
  });
}

/**
 * Поки тимчасовий лог — тут буде повна реалізація мовного розпізнавання
 */
function listenToSpeech(stream) {
  console.log('🧠 Починаємо слухати голос користувача… (це буде реалізовано на наступному кроці)');
}
