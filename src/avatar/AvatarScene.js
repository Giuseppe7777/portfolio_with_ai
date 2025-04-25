
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function createAvatarScene(container) {
  /* 1 ─ Сцена, камера, рендер */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.5, 3);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  /* 2 ─ Світло */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(2, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.5);
  rim.position.set(-2, 3, -3);
  scene.add(rim);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  /* 3 ─ GLB */
  const loader = new GLTFLoader();
  loader.load(
    '/models/model-avatar-2.glb',     
    (gltf) => {
      const avatar = gltf.scene;
      avatar.position.set(0, 0.5, 0);
      avatar.rotation.y = Math.PI * 1.9;
      scene.add(avatar);

      /* 3-A  потрібні кістки */
      const B = (n) => avatar.getObjectByName(n);

      const jaw        = B('mixamorigJawRoot');

      const L_SH       = B('mixamorigLeftShoulder');
      const R_SH       = B('mixamorigRightShoulder');
      const L_UPARM    = B('mixamorigLeftArm');
      const R_UPARM    = B('mixamorigRightArm');
      const L_FOREARM  = B('mixamorigLeftForeArm');
      const R_FOREARM  = B('mixamorigRightForeArm');
      const L_HAND     = B('mixamorigLeftHand');
      const R_HAND     = B('mixamorigRightHand');

      /* 3-B  базові кути (rest-pose) */
      const rest = {
        jawX : jaw?.rotation.x ?? 0,
        L_Sz : L_SH?.rotation.z ?? 0,
        R_Sz : R_SH?.rotation.z ?? 0,
        L_Ux : L_UPARM?.rotation.x ?? 0,
        R_Ux : R_UPARM?.rotation.x ?? 0,
        L_Fx : L_FOREARM?.rotation.x ?? 0,
        R_Fx : R_FOREARM?.rotation.x ?? 0,
        L_Hx : L_HAND?.rotation.x ?? 0,
        R_Hx : R_HAND?.rotation.x ?? 0
      };

      /* 3-C  цільові кути (рад)  —  ТВОЇ перевірені значення */
      const JAW_OPEN  =  THREE.MathUtils.degToRad(10);
      const SH_FWD    =  THREE.MathUtils.degToRad(10);
      const ARM_DOWN  =  THREE.MathUtils.degToRad(65);
      const FORE_DOWN =  THREE.MathUtils.degToRad(25);
      const HAND_DOWN =  THREE.MathUtils.degToRad(10);

      /* 3-D  допоміжна функція: target(rest, Δ, active) */
      const tgt = (r, delta, on) => (on ? r + delta : r);

      /* 3-E  Idle-кліпи */
      const mixer = new THREE.AnimationMixer(avatar);
      gltf.animations.forEach((c) => mixer.clipAction(c).play());

      /* 3-F  перемикач */
      let active = false;
      container.addEventListener('click', () => { active = !active; });

      /* 3-G  цикл */
      const clock = new THREE.Clock();
      const SPEED = 0.15;                   // плавність (0.1-0.25)

      (function loop() {
        requestAnimationFrame(loop);
        const dt = clock.getDelta();

        // рот
        if (jaw)
          jaw.rotation.x = THREE.MathUtils.lerp(
            jaw.rotation.x, tgt(rest.jawX, -JAW_OPEN, active), SPEED);

        // плечі
        if (L_SH && R_SH) {
          L_SH.rotation.z = THREE.MathUtils.lerp(
            L_SH.rotation.z, tgt(rest.L_Sz,  SH_FWD,  active), SPEED);
          R_SH.rotation.z = THREE.MathUtils.lerp(
            R_SH.rotation.z, tgt(rest.R_Sz, -SH_FWD,  active), SPEED);
        }

        // upper-arm
        if (L_UPARM && R_UPARM) {
          L_UPARM.rotation.x = THREE.MathUtils.lerp(
            L_UPARM.rotation.x, tgt(rest.L_Ux, ARM_DOWN, active), SPEED);
          R_UPARM.rotation.x = THREE.MathUtils.lerp(
            R_UPARM.rotation.x, tgt(rest.R_Ux, ARM_DOWN, active), SPEED);
        }

        // fore-arm
        if (L_FOREARM && R_FOREARM) {
          L_FOREARM.rotation.x = THREE.MathUtils.lerp(
            L_FOREARM.rotation.x, tgt(rest.L_Fx, FORE_DOWN, active), SPEED);
          R_FOREARM.rotation.x = THREE.MathUtils.lerp(
            R_FOREARM.rotation.x, tgt(rest.R_Fx, FORE_DOWN, active), SPEED);
        }

        // hand
        if (L_HAND && R_HAND) {
          L_HAND.rotation.x = THREE.MathUtils.lerp(
            L_HAND.rotation.x, tgt(rest.L_Hx, HAND_DOWN, active), SPEED);
          R_HAND.rotation.x = THREE.MathUtils.lerp(
            R_HAND.rotation.x, tgt(rest.R_Hx, HAND_DOWN, active), SPEED);
        }

        mixer.update(dt);
        renderer.render(scene, camera);
      })();
    },
    undefined,
    (e) => console.error('GLB load error', e)
  );

  /* 4 ─ Resize */
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
