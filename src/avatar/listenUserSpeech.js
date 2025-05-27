import { playVoiceStreamWithMimic } from "../voice/playVoiceStreamWithMimic.js";
import { 
  setMicStream, 
  getConversationActive
} from './state.js';

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

async function checkLimitOnBackend() {
  // !!! Замінити URL на свій PHP-ендпоінт !!!
  const resp = await fetch('/php/checkLimit.php', { method: 'GET' });
  if (!resp.ok) return { status: 'error' };
  try {
    return await resp.json(); // {status: 'ok'|'limit', message: '...'}
  } catch {
    return { status: 'error' };
  }
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

export async function sendToGPT(text) {
const systemPrompt = `
You are a multilingual assistant.
If the user is clearly saying goodbye in any language (e.g. “goodbye”, “see you”, “bye”, “до побачення”, “tschüss”, “auf wiedersehen”, etc.),
respond politely in the same language.
✅ But only if the message is clearly and unmistakably a farewell, add "##END##" at the end of your response.
❌ Do NOT add "##END##" for polite phrases like “thanks”, “thank you”, “have a nice day”, “you’re welcome”, “talk later”, etc.
Only add "##END##" when it is 100% obvious that the user wants to end the conversation.

If the answer contains a phrase or sentence that logically requires attention, emphasis, or explanation, always insert a gesture marker in square brackets as a separate word, directly before the sentence or phrase that requires the gesture. For example: [gesture:explain] or [gesture:attention].
The marker [gesture:attention] should be used before key points, warnings, or especially important facts, even if the word "attention" is not used in the text.
The marker [gesture:explain] should be used before sentences where an explanation or detailed reasoning is given, even if the word "explain" is not explicitly mentioned.
Use only these two markers: "explain" and "attention".
Only one marker can appear before a phrase.
Use markers as soon as there is the slightest opportunity to convey either of these two emotions — attention or explanation.
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

    return { answer: cleanAnswer, farewell: isFarewell, status: data.status, left: data.left };

  } catch (err) {
    console.error('❌ GPT fetch помилка:', err);
    alert('Не вдалося отримати відповідь від GPT');
    return { answer: null, farewell: false };
  }
}


async function handleFirstUserText(text) {
  // 1. Перевіряємо ліміт на бекенді!
  const limitInfo = await checkLimitOnBackend();
  if (limitInfo.status === 'limit') {
    // Якщо ліміт вже досягнутий перед питанням (наприклад, після reload)
    const prompt = `
      Please detect the language of the user in previous conversations.
      Just use that language — and only that language — to politely say that the question limit for today is reached, and the user can try again in 24 hours. Thank them warmly for the conversation.
      Be brief but friendly.
    `;
    const { answer } = await sendToGPT(prompt);
    (await import('./playLimitMessageWithAvatar.js')).playLimitMessageWithAvatar(answer);
    setTimeout(() => import('./avatar-entry.js').then(m => m.stopConversation()), 3500);
    return;
  }

  // 2. Обробка мовчанки (не змінюємо цю частину)
  if (text === '__SILENCE__1' || text === '__SILENCE__2') {
    isFinalSilence = (text === '__SILENCE__2');

    if (!lastRealUserText || lastRealUserText.trim() === '') {
      text = isFinalSilence
        ? 'Thanks for the talk. Hope to see you again next time!'
        : 'Please say something. I didn’t hear any question.';
    } else {
      text = isFinalSilence
        ? `${lastRealUserText} Please detect the language of the user's message above. Do not say what language it is. Just use that language — and only that language — to say that you are thankful for the conversation, you wish the user all the best, and hope to see them next time.`
        : `${lastRealUserText}\n\nPlease detect the language of the user's message above. Do not say what language it is. Just use that language — and only that language — to say that you didn't hear any question and politely ask the user to say something or ask a question.`;
    }
  } else {
    isFinalSilence = false;
    // --- Для звичайних питань: додаємо фразу якщо залишилось 2 питання ---
    if (limitInfo.left === 3) {
      text += `
        Please, at the end of your answer, gently inform the user (using the same language as their question) that they have only two questions left for today.
      `;
    }
    // --- Для останнього питання (left === 1) ---
    if (limitInfo.left === 1) {
      text += `
        Please, at the end of your answer, gently inform the user (using the same language as their question) that this was their last question for today, thank them warmly for the conversation, and wish them a great day until next time.
      `;
    }
  }

  // 3. Валідація і відправка
  if (!getConversationActive()) return;
  if (!text || text.trim() === '' || text === 'undefined') return;

  // === ОТУТ ГОЛОВНА ЛОГІКА! ===
  const gptResult = await sendToGPT(text);

  // 3.1. Якщо status === 'limit', WOW-режим одразу (це коли питання прилетіло на перевищений ліміт)
  if (gptResult.status === 'limit') {
    (await import('./playLimitMessageWithAvatar.js')).playLimitMessageWithAvatar(gptResult.answer);
    setTimeout(() => import('./avatar-entry.js').then(m => m.stopConversation()), 3500);
    return;
  }
  // --- Далі твоя стандартна логіка ---
  const { answer: cleanAnswer, farewell, left } = gptResult;
  if (!cleanAnswer) return;

  const { plainText, gestures, totalWords } = parseTextWithGestures(cleanAnswer);
  const gestureTags = [...cleanAnswer.matchAll(/\[gesture:([^\]]+)\]/g)].map(m => m[1]);
  console.log('🎯 gesture-теги у відповіді:', gestureTags);

  try {
    await playVoiceStreamWithMimic(plainText, faceMesh, avatar, gestures, totalWords);

    // Якщо це останнє питання (left === 0 після відповіді), закриваємо розмову
    if (typeof left === 'number' && left === 0) {
      console.log('👋 Досягнутий ліміт: це була остання відповідь. Закриваємо розмову.');
      setTimeout(() => import('./avatar-entry.js').then(m => m.stopConversation()), 3500);
      return;
    }

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
    if (!micStream || micStream.getTracks().some(t => t.readyState === 'ended')) {
      console.warn('🎤 Мікрофон вимкнено.');
      return;
    }
    listenToSpeech(micStream);
  } catch (err) {
    console.error('❌ STREAM-TTS помилка:', err);
    alert('Не вдалося озвучити відповідь (stream).');
  }
}




