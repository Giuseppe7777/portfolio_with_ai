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

  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const silenceThreshold = 0.01;
  let speaking = false;
  let lastSpokeTime = null;
  let initialSilenceTimer = null;

  const checkSilence = () => {
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      let value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);
    const now = Date.now();

    if (rms > silenceThreshold) {
      if (!speaking) {
        console.log('🔊 Користувач почав говорити');
        speaking = true;

        // Видаляємо таймер на 10 сек, бо користувач заговорив
        if (initialSilenceTimer) {
          clearTimeout(initialSilenceTimer);
          initialSilenceTimer = null;
        }
      }

      lastSpokeTime = now;

    } else if (speaking && lastSpokeTime && now - lastSpokeTime > 3000) {
      console.log('🤐 Тиша понад 3 сек — зупиняємо запис');
      stopAll();
    }
  };

  const silenceInterval = setInterval(checkSilence, 200);

  // Якщо користувач нічого не скаже протягом 10 секунд — зупиняємо
  initialSilenceTimer = setTimeout(() => {
    if (!speaking) {
      console.log('⌛ Нічого не сказав за 10 сек — зупиняємо запис');
      stopAll();
    }
  }, 10000);

  const stopAll = () => {
    clearInterval(silenceInterval);
    clearTimeout(initialSilenceTimer);
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

    if (isFirstMessage) {
      console.log('📨 Перше повідомлення: надсилаємо на пошту + Speech-to-Text');

      fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/proxy.php', {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => console.log('📬 Відповідь від proxy.php (email):', data))
        .catch(error => console.error('❌ Email error:', error));

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

  fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/questionAnswer.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question: text })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'error') {
        console.error('❌ GPT error:', data.message);
        alert('GPT не відповів 😢');
        return;
      }

      console.log('✅ GPT-відповідь:', data.answer);

      fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/tts.php', {
        method: 'POST',
        body: new URLSearchParams({ text: data.answer })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`🛑 HTTP error! status: ${response.status}`);
          }
          console.log('🔊 Отримано відповідь від tts.php (mp3 stream)');
          return response.blob();
        })
        .then(audioBlob => {
          console.log('📥 Отримано MP3-файл від ElevenLabs. Розмір:', audioBlob.size, 'байт');

          const audioURL = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioURL);

          // Відтворюємо голос
          audio.play().then(() => {
            console.log('▶️ Голос відтворюється...');
          }).catch(err => {
            console.error('❌ Помилка відтворення голосу:', err);
          });

          // Запускаємо міміку (якщо реалізована)
          if (typeof startMouthMovement === 'function') {
            startMouthMovement(audio);
            console.log('🗣️ Анімація рота активована');
          } else {
            console.warn('⚠️ Функція startMouthMovement не знайдена');
          }
        })
        .catch(err => {
          console.error('❌ Помилка під час запиту до tts.php:', err);
          alert('Не вдалося озвучити відповідь. Спробуй ще раз.');
        });

    })
    .catch(err => {
      console.error('❌ GPT fetch помилка:', err);
      alert('Не вдалося отримати відповідь від GPT');
    });
}





