import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// import { saveAs } from 'file-saver'; // якщо треба зберігати кістки

/**
 * Завантажує GLB модель аватара та додає до сцени
 * @param {THREE.Scene} scene - сцена, куди додається аватар
 * @returns {Promise<{ avatar: THREE.Group, mixer: THREE.AnimationMixer, faceMesh: THREE.Mesh }>} 
 */
export function loadAvatarModel(scene) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      '/models/model-avatar-5-1.glb',
      (gltf) => {
        const avatar = gltf.scene;
        avatar.position.set(0, -3, -10);
        avatar.rotation.y = THREE.MathUtils.degToRad(-5);
        scene.add(avatar);

        console.log('✅ GLB завантажено, avatar:', avatar);

        // 🔸 Витягування кісток — лише якщо потрібно
        const allBones = [];
        gltf.scene.traverse((object) => {
          if (object.type === 'Bone') {
            allBones.push({
              name: object.name,
              position: { ...object.position },
              rotation: { ...object.rotation },
              scale: { ...object.scale },
              quaternion: { ...object.quaternion },
            });
          }
        });
        // const boneDataBlob = new Blob([JSON.stringify(allBones, null, 2)], { type: 'application/json' });
        // saveAs(boneDataBlob, 'bones.json');

        // 🔸 Анімація WalkAndWave — готуємо, але не запускаємо
        const mixer = new THREE.AnimationMixer(avatar);
        const clip = gltf.animations[0];
        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();
        action.paused = true;

        console.log('🎞️ Тривалість анімації WalkAndWave:', clip.duration, 'секунд');

        // 🔸 FaceMesh для міміки
        const faceMesh = avatar.getObjectByName('Body_1');

        // Shape Keys ==========================================================
        
        // if (faceMesh && faceMesh.morphTargetDictionary) {
        //   console.log('Доступні shape keys:', Object.keys(faceMesh.morphTargetDictionary));
        // }
        
        // Shape Keys ==========================================================

        resolve({ avatar, mixer, faceMesh });
      },
      undefined,
      (error) => {
        console.error('GLB load error', error);
        reject(error);
      }
    );
  });
}

