import { setMicStream, getConversationActive } from './state.js';
import { playVoiceStreamWithMimic } from "../voice/playVoiceStreamWithMimic.js";

/**
 * Показує кнопку для дозволу на мікрофон і починає слухати, якщо користувач погодився
 */

function parseTextWithGestures(text) {
  const regex = /\[gesture:(explain|attention)\]/g;
  let match;
  let lastIndex = 0;
  let wordCount = 0;
  let resultText = '';
  const gestures = [];

  while ((match = regex.exec(text)) !== null) {
    // Текст до gesture-маркера
    const plain = text.slice(lastIndex, match.index);
    resultText += plain;
    // Додаємо кількість слів до цього місця
    wordCount += plain.split(/\s+/).filter(w => w).length;

    // Записуємо gesture і позицію в загальному тексті (у словах)
    gestures.push({
      type: match[1],
      wordPos: wordCount // після plain, тобто gesture відноситься до наступного слова
    });

    lastIndex = regex.lastIndex;
  }

  // Додаємо текст після останньої мітки
  const plain = text.slice(lastIndex);
  resultText += plain;

  // Всього слів у всьому тексті (без gesture-тегів)
  const totalWords = resultText.split(/\s+/).filter(w => w).length;

  return {
    plainText: resultText.trim(),
    gestures,       // [{type: 'attention', wordPos: 5}, ...]
    totalWords
  };
}

let faceMesh = null;
let avatar = null;
let micStream = null;
let silenceCount = 0;
let skipSTT = false;

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
let lastRealUserText = '';

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

        skipSTT = false;

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

      handleFirstUserText(lastUserText);
    })
    .catch(err => console.error('❌ Speech-to-Text помилка:', err));
};

  mediaRecorder.start();
  console.log('⏺️ Запис запущено');
}

async function sendToGPT(text) {
const systemPrompt = `
You are a multilingual assistant.
If the user is clearly saying goodbye in any language (e.g. “goodbye”, “see you”, “bye”, “до побачення”, “tschüss”, “auf wiedersehen”, etc.),
respond politely in the same language.
✅ But only if the message is clearly and unmistakably a farewell, add "##END##" at the end of your response.
❌ Do NOT add "##END##" for polite phrases like “thanks”, “thank you”, “have a nice day”, “you’re welcome”, “talk later”, etc.
Only add "##END##" when it is 100% obvious that the user wants to end the conversation.

If the answer contains a phrase or sentence that logically requires attention, emphasis, or explanation (for example: a list of reasons, a key argument, an especially important warning, or a direct explanation), always insert a gesture marker in square brackets as a separate word, directly before the sentence or phrase that requires the gesture. For example: [gesture:explain] or [gesture:attention].
The marker [gesture:attention] should be used before key points, warnings, or especially important facts, even if the word "attention" is not used in the text.
The marker [gesture:explain] should be used before sentences where an explanation or detailed reasoning is given, even if the word "explain" is not explicitly mentioned.
Use only these two markers: "explain" and "attention".
Only one marker can appear before a phrase.
Do not overuse the markers, but use them whenever the communication logic of the answer requires highlighting or explaining something important.
Here are some examples:
- [gesture:attention] Always look both ways before crossing the street.
- [gesture:explain] The main reason for this is that English is the language of global business.
- [gesture:attention] Key point: Don't share your password with anyone.
Insert the marker as a separate word, directly before the relevant phrase.
`.trim();


  try {
    const response = await fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/questionAnswer.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: `${text}\n\n---\n\n${systemPrompt}`
      })
    });

    const data = await response.json();

    if (data.status === 'error') {
      console.error('❌ GPT error:', data.message);
      alert('GPT не відповів 😢');
      return { answer: null, farewell: false };
    }

    const raw = (data.answer ?? '').trim();

    const isFarewell = raw.includes('##END##');

    const cleanAnswer = raw.replace('##END##', '').trim();

    return { answer: cleanAnswer, farewell: isFarewell };

  } catch (err) {
    console.error('❌ GPT fetch помилка:', err);
    alert('Не вдалося отримати відповідь від GPT');
    return { answer: null, farewell: false };
  }
}


async function handleFirstUserText(text) {
  if (text === '__SILENCE__1') {
    isFinalSilence = false;

    if (!lastRealUserText || lastRealUserText.trim() === '') {
      console.log('📡 GPT: інтро-спіч → перша мовчанка. Відповідь англійською.');
      text = 'Please say something. I didn’t hear any question.';
    } else {
      console.log('📡 GPT: це перша мовчанка після розмови. Формуємо прохання повторити.');
      text = `${lastRealUserText}\n\nPlease detect the language of the user's message above. Do not say what language it is. Just use that language — and only that language — to say that you didn't hear any question and politely ask the user to say something or ask a question.`;
    }

  } else if (text === '__SILENCE__2') {
    isFinalSilence = true;

    if (!lastRealUserText || lastRealUserText.trim() === '') {
      console.log('📡 GPT: інтро-спіч → друга мовчанка. Відповідь англійською.');
      text = 'Thanks for the talk. Hope to see you again next time!';
    } else {
      console.log('📡 GPT: це друга мовчанка після розмови. Формуємо прощальну фразу.');
      text = `${lastRealUserText} This is just a helper text to detect the language. Do not repeat or react to it. Do not mention which language it is. Simply say, in that detected language only, that you are thankful for the conversation, you wish the user all the best, and hope to see them next time.`;
    }
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

  // 🧠 Використовуємо sendToGPT — ЄДИНЕ джерело
  const { answer: cleanAnswer, farewell } = await sendToGPT(text);
  if (!cleanAnswer) return;

  const { plainText, gestures, totalWords } = parseTextWithGestures(cleanAnswer);

  console.log('---------------------------');
  console.log('🪄 Оригінал із gesture:', cleanAnswer);
  console.log('📝 Розпарсений текст (без тегів):', plainText);
  console.log('🎬 Масив gesture для TTS:', gestures, 'Всього слів:', totalWords);
  console.log('---------------------------');
    
  // Шукаємо всі gesture-теги
  const gestureTags = [...cleanAnswer.matchAll(/\[gesture:([^\]]+)\]/g)].map(m => m[1]);
  console.log('🎯 gesture-теги у відповіді:', gestureTags);

  /* ---------- STREAM-TTS ---------- */  
  try {
    await playVoiceStreamWithMimic(plainText, faceMesh, avatar, gestures, totalWords);      

    console.log('🔁 Відповідь (stream) завершена');
    if (isFinalSilence || farewell) {
      console.log('🔍 Перевірка умови виходу: isFinalSilence =', isFinalSilence, ', farewell =', farewell);
      console.log('👋 Завершуємо сцену після мовчанки / прощання');
      import('./avatar-entry.js').then(m => m.stopConversation());
      return;
    }
    if (!getConversationActive()) {
      console.warn('🛑 Розмова зупинена — не слухаємо далі');
      return;
    }
    if (!micStream || micStream.getTracks()
        .some(t => t.readyState === 'ended')) {
      console.warn('🎤 Мікрофон вимкнено.');
      return;
    }
    listenToSpeech(micStream);
  } catch (err) {
    console.error('❌ STREAM-TTS помилка:', err);
    alert('Не вдалося озвучити відповідь (stream).');
  };
}


/*

--------------------------
listenUserSpeech.js:344 🪄 Оригінал із gesture: Ось 8 коротких пунктів, чому водій за кермом має бути дуже уважним:

1. [gesture:attention] Порушення правил дорожнього руху може призвести до аварій.
2. Увага допомагає уникнути небезпечних ситуацій на дорозі.
3. [gesture:attention] Реакція на несподівані дії інших учасників руху може врятувати життя.
4. Водії повинні слідкувати за дорожніми знаками та сигналами.
5. [gesture:explain] Технічні несправності автомобіля можуть виникнути раптово, тому важливо бути уважним до звуків та поведінки автомобіля.
6. Стан дороги може змінюватися, тому важливо адаптувати швидкість відповідно до умов.
7. [gesture:attention] Відволікання, такі як телефонні дзвінки чи розмови з пасажирами, підвищують ризик аварій.
8. Безпека пішоходів та велосипедистів залежить від уважності водіїв.
listenUserSpeech.js:345 📝 Розпарсений текст (без тегів): Ось 8 коротких пунктів, чому водій за кермом має бути дуже уважним:

1.  Порушення правил дорожнього руху може призвести до аварій.
2. Увага допомагає уникнути небезпечних ситуацій на дорозі.
3.  Реакція на несподівані дії інших учасників руху може врятувати життя.
4. Водії повинні слідкувати за дорожніми знаками та сигналами.
5.  Технічні несправності автомобіля можуть виникнути раптово, тому важливо бути уважним до звуків та поведінки автомобіля.
6. Стан дороги може змінюватися, тому важливо адаптувати швидкість відповідно до умов.
7.  Відволікання, такі як телефонні дзвінки чи розмови з пасажирами, підвищують ризик аварій.
8. Безпека пішоходів та велосипедистів залежить від уважності водіїв.
listenUserSpeech.js:346 🎬 Масив gesture для TTS: (4) [{…}, {…}, {…}, {…}] Всього слів: 99
listenUserSpeech.js:347 ---------------------------
listenUserSpeech.js:351 🎯 gesture-теги у відповіді: (4) ['attention', 'attention', 'explain', 'attention']
playVoiceStreamWithMimic.js:15 [TTS-STREAM] ▶️ старт потокового озвучення…
playVoiceStreamWithMimic.js:188 [TTS-STREAM] 🚀 Відправляємо текст у ElevenLabs: Ось 8 коротких пунктів, чому водій за кермом має бути дуже уважним:

1.  Порушення правил дорожнього руху може призвести до аварій.
2. Увага допомагає уникнути небезпечних ситуацій на дорозі.
3.  Реакція на несподівані дії інших учасників руху може врятувати життя.
4. Водії повинні слідкувати за дорожніми знаками та сигналами.
5.  Технічні несправності автомобіля можуть виникнути раптово, тому важливо бути уважним до звуків та поведінки автомобіля.
6. Стан дороги може змінюватися, тому важливо адаптувати швидкість відповідно до умов.
7.  Відволікання, такі як телефонні дзвінки чи розмови з пасажирами, підвищують ризик аварій.
8. Безпека пішоходів та велосипедистів залежить від уважності водіїв.
playVoiceStreamWithMimic.js:195 Response content-type: audio/mpeg
playVoiceStreamWithMimic.js:101 [TTS-STREAM] ▶️ audio.play() успішно
playVoiceStreamWithMimic.js:110 ⏰ Gesture "attention" (approximate) спрацює через 5.65 сек (позиція: слово 13 з 99)
playVoiceStreamWithMimic.js:110 ⏰ Gesture "attention" (approximate) спрацює через 13.04 сек (позиція: слово 30 з 99)
playVoiceStreamWithMimic.js:110 ⏰ Gesture "explain" (approximate) спрацює через 21.74 сек (позиція: слово 50 з 99)
playVoiceStreamWithMimic.js:110 ⏰ Gesture "attention" (approximate) спрацює через 33.91 сек (позиція: слово 78 з 99)
playVoiceStreamWithMimic.js:204 [TTS-STREAM] ∎ кінець потоку
playVoiceStreamWithMimic.js:115 🟢 Виконую gesture: attention (на 5.65s, approx)
playVoiceStreamWithMimic.js:115 🟢 Виконую gesture: attention (на 13.04s, approx)
playVoiceStreamWithMimic.js:115 🟢 Виконую gesture: explain (на 21.74s, approx)
playVoiceStreamWithMimic.js:115 🟢 Виконую gesture: attention (на 33.91s, approx)

*/

