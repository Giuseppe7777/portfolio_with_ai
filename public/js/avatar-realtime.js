
let pc, dc;

async function startRealtimeAvatar() {
  console.log('[🔁 INIT] request session-token…');

  /* ── 1. BER token для WebRTC ───────────────────── */
  const tokenRes = await fetch('http://localhost/my-portfolio-fullstack-ai/my-portfolio-fullstack-ai/php/realtime-session-token.php');
  const tokenJson  = await tokenRes.json();
  const clientKey  = tokenJson?.client_secret?.value;

  if (!clientKey) {                      // без ключа — стоп
    console.error('[⛔]  client_secret missing');
    return;
  }
  console.log('[🔐 TOKEN]', clientKey);

  /* ── 2. WebRTC peer-connection ─────────────────── */
  pc = new RTCPeerConnection({
    bundlePolicy : 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceServers   : []          // STUN / TURN не потрібні
  });

  /* ── 3. мікрофон → аудіо-трек ──────────────────── */
  const mic = await navigator.mediaDevices.getUserMedia({ audio:true });
  pc.addTrack(mic.getTracks()[0]);

  /* ── 4. дата-канал для івентів GPT ─────────────── */
  dc = pc.createDataChannel('oai-events');
  dc.onmessage = (e)=>{
    const msg = JSON.parse(e.data);
    console.log('[📥 EVENT]', msg);

    if (msg.type === 'response.text.delta')   console.log('[🧠 TEXT ]', msg.delta?.value);
    if (msg.type === 'response.audio.delta')  console.log('[🗣️ CHUNK]', msg.delta);
  };

  /* ── 5. вхідне аудіо від GPT ───────────────────── */
  const audioEl = document.createElement('audio');
  audioEl.autoplay = true;
  pc.ontrack = ev => {
    console.log('[🎧 AUDIO STREAM]');
    audioEl.srcObject = ev.streams[0];
  };

  /* ── 6. SDP-offer → OpenAI Realtime ────────────── */
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  console.log('[📤 SDP OFFER]', offer.sdp);

  const base   = 'https://api.openai.com/v1/realtime';
  const model  = 'gpt-4o-realtime-preview-2024-12-17'; // ↞ той самий, що у PHP

  const resp = await fetch(`${base}?model=${model}`, {
    method : 'POST',
    body   : offer.sdp,                 // НЕ JSON!
    headers: {
      'Authorization': `Bearer ${clientKey}`,
      'Content-Type' : 'application/sdp',
      'OpenAI-Beta'  : 'realtime=v1'
    }
  });

  if (!resp.ok){
    console.error('[❌ API ERROR]', await resp.text());
    return;
  }

  /* ── 7. SDP-answer ← OpenAI ────────────────────── */
  const answerSdp = await resp.text();
  await pc.setRemoteDescription({ type:'answer', sdp:answerSdp });

  console.log('[✅ CONNECTED] Realtime GPT session ready.');
}

/* робимо функцію глобальною, щоб викликати з консолі */
window.startRealtimeAvatar = startRealtimeAvatar;




//  startRealtimeAvatar()  