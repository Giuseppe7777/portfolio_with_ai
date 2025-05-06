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
      micBtn.remove();

      listenToSpeech(stream); // ⏳ Далі: слухаємо голос (реалізуємо окремо)
    } catch (err) {
      console.error('❌ Не вдалося отримати доступ до мікрофона:', err);
      alert('Мікрофон не активовано. Я не зможу тебе почути 😢');
    }
  });
}

/**
 * Записує голос користувача у форматі webm і виводить лог про запис
 */
function listenToSpeech(stream) {
  console.log('🎙️ Починаємо запис голосу...');

  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
    console.log('📥 Отримано шматок аудіо:', event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log('✅ Запис завершено. Blob:', audioBlob);
    console.log('🧾 Тип:', audioBlob.type, 'Розмір:', audioBlob.size, 'байт');
  
    // 🕓 Формуємо timestamp
    const timestamp = new Date().toISOString();
    console.log('🕓 Timestamp запису:', timestamp);
  
    // 📦 Формуємо FormData
    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${timestamp}.webm`);
    formData.append('timestamp', timestamp);
  
    // 🚀 Відправляємо запит на сервер
    fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/proxy.php', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json()) // 🟢 тепер очікуємо JSON, не текст!
      .then(data => {
        console.log('📬 Відповідь від proxy.php:', data);
      })
      .catch(error => {
        console.error('❌ Помилка під час надсилання на сервер:', error);
      });
  };
  

  mediaRecorder.start();
  console.log('⏺️ Запис запущено');

  // ⏱️ Обмежуємо запис до 5 секунд для тесту
  setTimeout(() => {
    mediaRecorder.stop();
    console.log('🛑 Примусово зупиняємо запис через 5 секунд');
  }, 5000);
}
