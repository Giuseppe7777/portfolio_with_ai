import { playVoiceWithMimic } from "../voice/playVoiceWithMimic";
import { setMicStream, getConversationActive } from './state.js';

let faceMesh = null;
let avatar = null;
let micStream = null;
let silenceCount = 0;
let skipSTT = false;
let isFinalSilence = false;
let lastUserText = '';
let lastRealUserText = '';

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
    } else if (speaking && lastSpokeTime && now - lastSpokeTime > 2500) {
      console.log('🤐 Тиша понад 2.5 сек — зупиняємо запис');
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
      skipSTT = true;
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
    if (!getConversationActive()) {
      console.warn('🛑 Розмова вже завершена — пропускаємо onstop повністю');
      return;
    }

    if (skipSTT) {
      console.warn('🛑 Пропускаємо STT — це була мовчанка');
      skipSTT = false;
      return;
    }

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
        lastRealUserText = lastUserText;
        console.log('📌 Збережено текст користувача:', lastUserText);

        if (lastUserText === '__SILENCE__1') {
          const prompt = `${lastRealUserText} - визнач яка це мова і встанови її як мову відповіді тільки цього разу. Цю мову треба використати для того аби сказати що ти не почув ніякого питання і попросити про якесь питання. Тобто зараз тобі треба сказати, що ти нічого не почув і попроси щось сказати або запитати`;
          isFinalSilence = false;
          askGPTAndSpeak(prompt);
        } else if (lastUserText === '__SILENCE__2') {
          const prompt = `${lastRealUserText} - визнач яка це мова виключно для того, щоб цією мовою сказати, що ти дякуєш за розмову, бажаєш всього найкращого і до наступного разу.`;
          isFinalSilence = true;
          askGPTAndSpeak(prompt);
        } else {
          handleFirstUserText(lastUserText);
        }
      })
      .catch(err => console.error('❌ Speech-to-Text помилка:', err));
  };

  mediaRecorder.start();
  console.log('⏺️ Запис запущено');
}

function handleFirstUserText(text) {
  if (!getConversationActive()) {
    console.warn('🛑 Розмова була зупинена до GPT-запиту — не звертаємося до GPT.');
    return;
  }

  if (!text || text.trim() === '' || text === 'undefined') {
    console.warn('⚠️ Текст пустий або невизначений. Не звертаємося до GPT.');
    return;
  }

  fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/questionAnswer.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: `Текст: "${text}". Це прощальна фраза? Відповідай ТІЛЬКИ "yes" або "no".`
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'error') {
        console.error('❌ GPT error при перевірці прощання:', data.message);
        return;
      }

      const isGoodbye = data.answer.trim().toLowerCase().includes('yes');
      if (isGoodbye) {
        console.log('👋 GPT підтвердив: це прощальна фраза');

        isFinalSilence = true;

        const goodbyePrompt = `"${text}" — визнач мову цієї фрази і ВІДПОВІДАЙ ЛИШЕ ТІЄЮ МОВОЮ. Скажи ввічливо, що дякуєш за розмову, бажаєш усього найкращого і сподіваєшся побачити людину знову. У відповіді НЕ МОЖНА використовувати жодної іншої мови.`;

        askGPTAndSpeak(goodbyePrompt);
      } else {
        console.log('🙂 Це не прощальна фраза. Продовжуємо діалог.');
        isFinalSilence = false;
        askGPTAndSpeak(text);
      }
    })
    .catch(err => {
      console.error('❌ Помилка при перевірці на прощання:', err);
    });
}

function askGPTAndSpeak(text) {
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
            console.warn('🛑 Розмова зупинена — не запускаємо голос.');
            return;
          }

          if (faceMesh && avatar) {
            playVoiceWithMimic(audioURL, faceMesh, avatar).then(() => {
              console.log('🔁 Відповідь завершено. Повертаємось до прослуховування...');

              if (isFinalSilence) {
                console.log('👋 Завершуємо сцену після прощання');
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
          console.error('❌ Помилка при озвученні:', err);
          alert('Не вдалося озвучити відповідь. Спробуй ще раз.');
        });
    })
    .catch(err => {
      console.error('❌ GPT fetch помилка:', err);
      alert('Не вдалося отримати відповідь від GPT');
    });
}
