// public/js/avatar-realtime.js

let pc, dc;

async function startRealtimeAvatar() {
  console.log('[🔁 INIT] Requesting session token from PHP');

  const tokenRes = await fetch('/php/realtime-session-token.php');
  const tokenData = await tokenRes.json();
  const clientSecret = tokenData.client_secret?.value;

  if (!clientSecret) {
    console.error('[⛔ ERROR] No client_secret received');
    return;
  }

  console.log('[🔐 TOKEN]', clientSecret);

  // 1. Створюємо WebRTC peer connection
  pc = new RTCPeerConnection();

  // 2. Отримуємо мікрофон
  const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(mic.getTracks()[0]);

  // 3. Створюємо <audio> для прослуховування GPT
  const audioEl = document.createElement('audio');
  audioEl.autoplay = true;
  pc.ontrack = (e) => {
    console.log('[🎧 AUDIO STREAM RECEIVED]');
    audioEl.srcObject = e.streams[0];
  };

  // 4. Створюємо data channel для подій GPT (текст, функції тощо)
  dc = pc.createDataChannel("oai-events");
  dc.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    console.log('[📥 EVENT]', msg);

    if (msg.type === 'response.text.delta') {
      console.log('[🧠 TEXT]', msg.delta?.value);
    }

    if (msg.type === 'response.audio.delta') {
      console.log('[🗣️ AUDIO CHUNK]', msg.delta);
    }
  };

  // 5. Готуємо SDP
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";

  const sdpRes = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${clientSecret}`,
      "Content-Type": "application/sdp",
    },
  });

  const answer = {
    type: "answer",
    sdp: await sdpRes.text(),
  };

  await pc.setRemoteDescription(answer);

  console.log('[✅ CONNECTED] Realtime GPT session ready.');
}
