import { playVoiceWithMimic } from "../voice/playVoiceWithMimic";
import { setMicStream, getConversationActive } from './state.js';

/**
 * Показує кнопку для дозволу на мікрофон і починає слухати, якщо користувач погодився
 */

let faceMesh = null;
let avatar = null;
let micStream = null;
let silenceCount = 0;

export function setAvatarContext(mesh, model) {
  faceMesh = mesh;
  avatar = model;
}

export function promptMicrophoneAccess() {
  const micBtn = document.createElement('button');
  micBtn.textContent = '🎤 Allow microphone';
  micBtn.id = 'mic-permission-btn';

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
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(micStream);
      console.log('🎤 Доступ до мікрофона надано');
      micBtn.remove();
      if (!micStream || micStream.getTracks().some(t => t.readyState === 'ended')) {
        console.warn('🎤 Мікрофон вимкнено. Слухання скасовано.');
        return;
      }

      listenToSpeech(micStream);
    } catch (err) {
      console.error('❌ Не вдалося отримати доступ до мікрофона:', err);
      alert('Мікрофон не активовано. Я не зможу тебе почути 😢');
    }
  });
}

let isFinalSilence = false;
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
        if (initialSilenceTimer) {
          clearTimeout(initialSilenceTimer);
          initialSilenceTimer = null;
        }
      }
      lastSpokeTime = now;
    } else if (speaking && lastSpokeTime && now - lastSpokeTime > 1000) {
      console.log('🤐 Тиша понад 1 сек — зупиняємо запис');
      stopAll();
    }
  };

  const silenceInterval = setInterval(checkSilence, 200);

  initialSilenceTimer = setTimeout(() => {
    if (!speaking) {
      console.log('⌛ Нічого не сказав за 10 сек — зупиняємо запис');
      stopAll();
    }
  }, 10000);

  const stopAll = () => {
    clearInterval(silenceInterval);
    clearTimeout(initialSilenceTimer);
    audioContext.close();

    if (!speaking) {
      silenceCount++;
      console.log(`🤐 Виявлено тишу. Мовчанок поспіль: ${silenceCount}`);

      if (silenceCount === 1) {
        console.log('🟡 Перша мовчанка — надсилаємо __SILENCE__1 до GPT');
        handleFirstUserText('__SILENCE__1');
      } else if (silenceCount === 2) {
        console.log('🔴 Друга мовчанка — надсилаємо __SILENCE__2 до GPT');
        handleFirstUserText('__SILENCE__2');
      }
      return; 
    }
    console.log('🗣️ Користувач щось сказав — обнуляємо лічильник мовчанок');
    silenceCount = 0;
    mediaRecorder.stop();
  };

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
    console.log('📥 Отримано шматок аудіо:', event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    if (audioBlob.size === 0) {
      console.warn('⚠️ Порожній аудіо-файл. Пропускаємо розпізнавання.');
      return;
    }

    const timestamp = new Date().toISOString();

    console.log('✅ Запис завершено. Blob:', audioBlob);
    console.log('🕓 Timestamp запису:', timestamp);

    const formData = new FormData();
    formData.append('audio', audioBlob, `voice-${timestamp}.webm`);
    formData.append('timestamp', timestamp);

    console.log('📤 Відправляємо аудіо на розпізнавання мови...');

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
  };

  mediaRecorder.start();
  console.log('⏺️ Запис запущено');
}

function handleFirstUserText(text) {
  if (text === '__SILENCE__1') {
    console.log('📡 GPT: це перша мовчанка. Формуємо фразу з проханням повторити.');
    isFinalSilence = false;
    text = 'Користувач мовчить. Скажи, що не почув його і попроси повторити.';
  } else if (text === '__SILENCE__2') {
    console.log('📡 GPT: це друга мовчанка. Формуємо прощальну фразу.');
    isFinalSilence = true;
    text = 'Користувач знову мовчить. Попрощайся і заверши розмову.';
  } else {
    isFinalSilence = false;
  }


  if (!getConversationActive()) {
    console.warn('🛑 Розмова була зупинена до GPT-запиту — не звертаємося до GPT.');
    return;
  }

  console.log('🤖 Готуємо запит до GPT з текстом користувача:', text);

  if (!text || text.trim() === '' || text === 'undefined') {
    console.warn('⚠️ Текст пустий або невизначений. Не звертаємося до GPT.');
    return;
  }


  fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/questionAnswer.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
          if (!response.ok) throw new Error(`🛑 HTTP error! status: ${response.status}`);
          return response.blob();
        })
        .then(audioBlob => {
          const audioURL = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioURL);

          if (!getConversationActive()) {
            console.warn('🛑 Розмова зупинена — не запускаємо відтворення голосу.');
            return;
          }

          if (faceMesh && avatar) {
            playVoiceWithMimic(audioURL, faceMesh, avatar).then(() => {
              console.log('🔁 Відповідь завершено. Повертаємось до прослуховування...');

              if (isFinalSilence) {
                console.log('👋 Завершуємо сцену після другої мовчанки');
                import('./avatar-entry.js').then(module => module.stopConversation());
                return;
              }
              
              if (!micStream || micStream.getTracks().some(t => t.readyState === 'ended')) {
                console.warn('🎤 Мікрофон вимкнено. Слухання скасовано.');
                return;
              }

              listenToSpeech(micStream);
            });
          } else {
            audio.play().then(() => {
              console.log('▶️ Голос відтворюється (без міміки)...');
            });
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
