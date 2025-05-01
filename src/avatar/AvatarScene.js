
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { saveAs } from 'file-saver';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createAvatarScene(container) {
  /* 1 ─ Сцена, камера, рендер */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );

  camera.position.set(0, 1.8, 3);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; // для плавності
  controls.dampingFactor = 0.1;

  controls.enablePan = false;      // Заборонити переміщення по сцені
  controls.enableZoom = false;     // Заборонити зум
  controls.target.set(0, 1, 0);  // Центрувати на голову або груди
  controls.update();

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
    '/models/model-avatar-5-1.glb',     
    (gltf) => {
      const avatar = gltf.scene;

      // Знайдемо меш, який має shape keys (зазвичай голова або тіло)

      // avatar.traverse((obj) => {
      //   if (obj.isMesh && obj.morphTargetDictionary) {
      //     console.log('🔹 Mesh with Shape Keys found:', obj.name);
      
      //     const dict = obj.morphTargetDictionary;
      //     console.log('🔸 Shape Keys:', Object.keys(dict)); 
      
      //     for (const [key, index] of Object.entries(dict)) {
      //       console.log(`  ➤ ${key}: index ${index}`);
      //     }
      //   }
      // });

      // Знайдемо меш, який має shape keys (зазвичай голова або тіло)



      avatar.position.set(0, -3, -10);
      avatar.rotation.y = THREE.MathUtils.degToRad(-5);
      scene.add(avatar);

      //  ========================================= МІЙ КОД ДЛЯ ВИТЯГАННЯ КІСТОК Start
      const allBones = []; // Створюємо масив для збору всіх кісток

      gltf.scene.traverse((object) => {
        if (object.type === 'Bone') {
          allBones.push({
            name: object.name,
            position: {
              x: object.position.x,
              y: object.position.y,
              z: object.position.z,
            },
            rotation: {
              x: object.rotation.x,
              y: object.rotation.y,
              z: object.rotation.z,
            },
            scale: {
              x: object.scale.x,
              y: object.scale.y,
              z: object.scale.z,
            },
            quaternion: {
              x: object.quaternion.x,
              y: object.quaternion.y,
              z: object.quaternion.z,
              w: object.quaternion.w,
            }
          });
        }
      });

      // Після збору всіх кісток — зберігаємо файл
      // const boneDataBlob = new Blob([JSON.stringify(allBones, null, 2)], { type: 'application/json' });
      // saveAs(boneDataBlob, 'bones.json');

      //  ========================================= МІЙ КОД ДЛЯ ВИТЯГАННЯ КІСТОК End
      

      // Якщо є анімації у файлі — активуємо їх
      const mixer = new THREE.AnimationMixer(avatar);
      const clip = gltf.animations[0];
      const action = mixer.clipAction(clip);

      action.reset();                            
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();                             
      action.paused = true;    

      setTimeout(() => {
        action.paused = false;                   
        action.fadeIn(0.001);
      }, 1200); 

      // Вмикаємо міміку усмішки під час руху
      // === МІМІКА: усмішка + м’який погляд ===
const faceMesh = avatar.getObjectByName('Body_1');
if (faceMesh && faceMesh.morphTargetDictionary) {
  // Індекси shape keys
  const smileR = faceMesh.morphTargetDictionary['A39_Mouth_Smile_Right'];
  const smileL = faceMesh.morphTargetDictionary['A38_Mouth_Smile_Left'];
  const browInnerUp = faceMesh.morphTargetDictionary['A01_Brow_Inner_Up'];
  const eyeWideR = faceMesh.morphTargetDictionary['A19_Eye_Wide_Right'];
  const eyeWideL = faceMesh.morphTargetDictionary['A18_Eye_Wide_Left'];
  const squintR = faceMesh.morphTargetDictionary['A17_Eye_Squint_Right'];
  const squintL = faceMesh.morphTargetDictionary['A16_Eye_Squint_Left'];

  // 🟤 Початкове — забрати виряченість
  faceMesh.morphTargetInfluences[eyeWideR] = 0;
  faceMesh.morphTargetInfluences[eyeWideL] = 0;
  faceMesh.morphTargetInfluences[squintR] = 0.15;
  faceMesh.morphTargetInfluences[squintL] = 0.15;

  // 🟢 1. Плавно включити усмішку
  let smileValue = 0;
  const smileInterval = setInterval(() => {
    smileValue += 0.05;
    faceMesh.morphTargetInfluences[smileR] = smileValue;
    faceMesh.morphTargetInfluences[smileL] = smileValue;
    if (smileValue >= 1) clearInterval(smileInterval);
  }, 50);
}

      // Вмикаємо міміку усмішки під час руху



      /* 4 ─ Цикл */
      const clock = new THREE.Clock();
      const targetAvatarPosition = new THREE.Vector3(-0.15, 0.2, 0.36); // ціль
      
      (function loop() {
        requestAnimationFrame(loop);
        const delta = clock.getDelta();
        mixer.update(delta);
      
        // Плавне підпливання моделі
        avatar.position.lerp(targetAvatarPosition, 0.03);
      
        renderer.render(scene, camera);
        controls.update();
      })();
    },
    undefined,
    (e) => console.error('GLB load error', e)
  );

  /* 5 ─ Resize */
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
