import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Створює сцену, камеру, рендерер та контролери
 * @param {HTMLElement} container - DOM-елемент, куди вставляється канвас
 * @returns {Object} - об'єкт з scene, camera, renderer, controls
 */
export function setupScene(container) {
  //  Створення сцени (середовище, куди ми додаємо об'єкти)
  const scene = new THREE.Scene();

  //  Камера — точка спостереження
  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.8, 3); // трохи вище рівня очей

  //  Рендерер — двигун, який виводить сцену на екран
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  //  Контролери — дозволяють керувати камерою мишкою
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; 
  controls.dampingFactor = 0.1;
  controls.enablePan = false;    
  controls.enableZoom = false;   
  controls.target.set(0, 1, 0);  
  controls.update();

  const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.ShadowMaterial({ opacity: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0; // можеш підняти/опустити як потрібно
  ground.receiveShadow = true;
  scene.add(ground);

  //  Світло — освітлює сцену, важливо для 3D
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.6));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(2, 4, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 20;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
  rimLight.position.set(-2, 3, -3);
  scene.add(rimLight);

  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  //  Адаптація до зміни розміру вікна
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  console.log('🖼️ renderer.domElement вставляється в:', container);
  
  //  Повертаємо всі ключові елементи для подальшого використання
  return { scene, camera, renderer, controls };

}
