/**
 * Показує кнопку для дозволу на мікрофон і починає слухати, якщо користувач погодився
 */

let isFirstMessage = true;

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
let lastUserText = '';

function listenToSpeech(stream) {
  console.log('🎙️ Починаємо запис голосу...');

  const mediaRecorder = new MediaRecorder(stream);
  const audioChunks = [];

  let audioContext = new AudioContext();
  let source = audioContext.createMediaStreamSource(stream);
  let analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;

  source.connect(analyser);

  const silenceThreshold = 0.01; // чутливість — можна налаштувати
  let speaking = false;
  let lastSpokeTime = Date.now();

  const checkSilence = () => {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    // Вираховуємо середнє відхилення від центру (128)
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      let value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length); // root mean square

    const now = Date.now();

    if (rms > silenceThreshold) {
      if (!speaking) {
        console.log('🔊 Користувач почав говорити');
        speaking = true;
      }
      lastSpokeTime = now;
    } else if (speaking && now - lastSpokeTime > 4000) {
      console.log('🤐 Тиша понад 4 сек — зупиняємо запис');
      stopAll();
    }
  };

  const silenceInterval = setInterval(checkSilence, 200);

  const maxDurationTimeout = setTimeout(() => {
    console.log('⏱ Макс. час запису вичерпано — зупиняємо');
    stopAll();
  }, 10000);

  const stopAll = () => {
    clearInterval(silenceInterval);
    clearTimeout(maxDurationTimeout);
    mediaRecorder.stop();
    audioContext.close();
  };

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
    console.log('📥 Отримано шматок аудіо:', event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    console.log('✅ Запис завершено. Blob:', audioBlob);
    console.log('🧾 Тип:', audioBlob.type, 'Розмір:', audioBlob.size, 'байт');

    const timestamp = new Date().toISOString();
    console.log('🕓 Timestamp запису:', timestamp);

    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${timestamp}.webm`);
    formData.append('timestamp', timestamp);

    // --- Перше повідомлення: і пошта, і Speech-to-Text
    if (isFirstMessage) {
      console.log('📨 Перше повідомлення: надсилаємо на пошту + Speech-to-Text');

      // 1. Email
      fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/proxy.php', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => console.log('📬 Відповідь від proxy.php (email):', data))
        .catch(error => console.error('❌ Email error:', error));

      // 2. Whisper
      fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/speechToText.php', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'error') {
            console.error('⚠️ Помилка від speechToText.php:', data.message);
            alert('Не вдалося розпізнати мову. Спробуй ще раз 😊');
            return;
          }

          lastUserText = data.text;
          console.log('📌 Збережено текст користувача:', lastUserText);
          handleFirstUserText(lastUserText);
        })
        .catch(err => console.error('❌ Speech-to-Text помилка:', err));

      isFirstMessage = false;
    } else {
      console.log('🗣️ Наступне повідомлення: тільки Speech-to-Text');

      fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/speechToText.php', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          console.log('📝 Speech-to-Text результат:', data);
        })
        .catch(err => console.error('❌ Speech-to-Text помилка:', err));
    }
  };

  mediaRecorder.start();
  console.log('⏺️ Запис запущено');
}


function handleFirstUserText(text) {
  console.log('🤖 Готуємо запит до GPT з текстом користувача:', text);

  // Далі сюди вставимо GPT-запит (через proxy, callAPI або fetch)
}
