// src/avatar/blink.js
export function startBlinking(faceMesh) {
  const dict = faceMesh.morphTargetDictionary;
  const infl = faceMesh.morphTargetInfluences;

  const blinkL = dict['A14_Eye_Blink_Left'];
  const blinkR = dict['A15_Eye_Blink_Right'];
  if (blinkL === undefined || blinkR === undefined) return;

  /* одна “міготлива” анімація = 150 мс закриття + 150 мс відкриття */
  const blinkOnce = () => {
    let t = 0;
    const speed = 0.12;              // чим більше ‑ тим швидше

    const step = () => {
      t += speed;
      const v = t <= 1 ? t : 2 - t;  // трикутна хвиля 0‒1‒0
      infl[blinkL] = v;
      infl[blinkR] = v;

      if (t < 2) requestAnimationFrame(step);
    };
    step();
  };

  /* запускаємо із випадковим інтервалом 3‑6 сек */
  const loop = () => {
    blinkOnce();
    const next = 3000 + Math.random() * 3000;
    setTimeout(loop, next);
  };
  loop();
}
