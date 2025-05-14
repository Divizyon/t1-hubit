import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-10, 25, 0);

export default class KonyaGenckart {
  constructor(_options) {
    this.time = _options.time;
    this.scene = _options.scene;
    this.physics = _options.physics;
    this.resources = _options.resources;
    this.areas = _options.areas;
    this.sounds = _options.sounds;
    this.mixer = null;
    this.model = null;
    this.collisionBody = null;
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;
    
    this.setModel();
    
    if (this.time) {
      this.time.on('tick', () => {
        this.tick(this.time.delta * 0.001);
      });
    } else {
      console.warn('KonyaGenckart: time parametresi verilmedi, animasyonlar çalışmayacak.');
    }
  }

  setModel() {
    if (!this.scene) {
      console.warn('KonyaGenckart: scene parametresi verilmedi, model sahneye eklenmeyecek.');
      return;
    }

    const loader = new GLTFLoader();
    loader.load('./models/konyaGencKart/3D_Ekran_Bina.glb', (gltf) => {
      console.log('Konya Genç Kart modeli yüklendi:', gltf);
      console.log('Animasyonlar:', gltf.animations);
      
      this.model = gltf.scene;
      this.model.position.set(-10, 25, 0);
      this.model.scale.set(1, 1, 1);
      
      // Modeli döndür
      this.model.rotation.set(0, 0, 15);
      
      this.scene.add(this.model);

      if (this.physics) {
        this.collisionBody = new CANNON.Body({
          mass: 0,
          position: new CANNON.Vec3(-10, 25, 0),
          material: this.physics.materials.items.floor
        });

        // Bounding box hesapla
        const bbox = new THREE.Box3().setFromObject(this.model);
        const size = bbox.getSize(new THREE.Vector3());
        // Collision alanını büyüt
        const halfExtents = new CANNON.Vec3(
            size.x * 0.5, // Genişliği 
            size.y * 0.5, // Yüksekliği
            size.z * 0.8  // Derinliği
        );
        const boxShape = new CANNON.Box(halfExtents);
        this.collisionBody.addShape(boxShape);

        this.physics.world.addBody(this.collisionBody);
      }

      // Işık ekle (sadece bir kez)
      /*if (!this.scene.__konyaGenckartLightAdded) {
        this.scene.add(new THREE.AmbientLight(0xffffff, 2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(dirLight);
        this.scene.__konyaGenckartLightAdded = true;
      }*/

      // Materyal ve mesh kontrolü
      this.model.traverse((child) => {
        if (child.isMesh) {
          console.log('Mesh bulundu:', child.name);
          if (child.isSkinnedMesh) {
            console.log('SkinnedMesh bulundu:', child.name);
          }
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
          }
          if (child.material && child.material.type === 'MeshBasicMaterial') {
            child.material = new THREE.MeshStandardMaterial({ color: child.material.color || 0xffffff });
          }
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      });

      // Animasyonları başlat
      if (gltf.animations && gltf.animations.length > 0) {
        console.log('Animasyonlar yükleniyor...');
        this.mixer = new THREE.AnimationMixer(this.model);
        gltf.animations.forEach((clip, index) => {
          console.log(`Animasyon ${index} yükleniyor:`, clip.name);
          const action = this.mixer.clipAction(clip);
          action.reset().play();
        });
        console.log('Mixer oluşturuldu:', this.mixer);
      } else {
        console.warn('Hiç animasyon bulunamadı!');
      }
    });
  }

  tick(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
} 