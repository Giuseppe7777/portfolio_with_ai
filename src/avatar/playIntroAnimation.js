import * as THREE from 'three';
/**
 * Відтворює анімацію WalkAndWave та міміку усмішки
 * @param {THREE.AnimationMixer} mixer
 * @param {THREE.Group} avatar
 * @param {THREE.Mesh} faceMesh - меш з shape keys (наприклад, Body_1)
 */

export function playIntroAnimation(mixer, avatar, faceMesh) {
  // 🔹 Запускаємо анімацію з fadeIn
  const action = mixer._actions[0];
  action.paused = false;
  action.fadeIn(0.001);

  // mixer.addEventListener('finished', () => {
  //   import('./startIntroVoice.js').then(({ startIntroVoice }) => {
  //     startIntroVoice(faceMesh, avatar);
  //   });
  // });

  // 🔹 Міміка — усмішка та м’який погляд
  if (faceMesh && faceMesh.morphTargetDictionary) {
    const dict = faceMesh.morphTargetDictionary;
    const infl = faceMesh.morphTargetInfluences;

    const smileR = dict['A39_Mouth_Smile_Right'];
    const smileL = dict['A38_Mouth_Smile_Left'];
    const eyeWideR = dict['A19_Eye_Wide_Right'];
    const eyeWideL = dict['A18_Eye_Wide_Left'];
    const squintR = dict['A17_Eye_Squint_Right'];
    const squintL = dict['A16_Eye_Squint_Left'];

    // 🟤 Забрати "виряченість"
    infl[eyeWideR] = 0;
    infl[eyeWideL] = 0;
    infl[squintR] = 0.15;
    infl[squintL] = 0.15;

    // 🟢 Плавне включення усмішки
    let smileValue = 0;
    const smileInterval = setInterval(() => {
      smileValue += 0.05;
      infl[smileR] = smileValue;
      infl[smileL] = smileValue;
      if (smileValue >= 1) clearInterval(smileInterval);
    }, 50);
  }

  // 🔹 Цільова позиція, щоб підплив до кадру (якщо треба)
  const targetPosition = new THREE.Vector3(-0.15, 0.2, 0.36);
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    mixer.update(delta);
    avatar.position.lerp(targetPosition, 0.03);
  }

  animate();
}
