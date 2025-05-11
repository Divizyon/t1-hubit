import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

export default class Kapsul {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.resources = _options.resources;
        this.objects = _options.objects;
        this.debug = _options.debug;
        this.mixer = null;
        this.model = null;
        this.collisionBody = null;
        
        // Create container
        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;
        
        this.setModel();
        
        if (this.time) {
            this.time.on('tick', () => {
                this.tick(this.time.delta * 0.001);
            });
        } else {
            console.warn('Kapsul: time parametresi verilmedi, animasyonlar çalışmayacak.');
        }
    }

    setModel() {
        if (!this.scene) {
            console.warn('Kapsul: scene parametresi verilmedi, model sahneye eklenmeyecek.');
            return;
        }

        const loader = new GLTFLoader();
        loader.load('./models/kapsul/Kapsul_Bina.glb', (gltf) => {
            console.log('Kapsul modeli yüklendi:', gltf);
            console.log('Animasyonlar:', gltf.animations);

            const base = this.resources.items.baseModel;
    if (!base || !base.scene) {
      console.error('Stadyum modeli bulunamadı');
      return;
    }
            
            this.model = gltf.scene;
            this.model.position.set(29, -24, 5);// Model Pozisyonu - Etkileşim alanının yanında
            this.model.scale.set(1.5, 1.5, 1.5);
            
            // Modeli döndür
            this.model.rotation.x = 0;
            
            // Model artık container'a ekleniyor, doğrudan scene'e değil
            this.container.add(this.model);
            this.container.updateMatrix();

          // Base modelini klonla ve Kapsül modeline ekle
    const baseModel = base.scene.clone(true);
    baseModel.position.set(29.5, -23.2, 0); // Base modelinin Kapsül altına yerleştirilmesi için pozisyon ayarı
    baseModel.scale.set(2.5, 2.5, 1.5); // Base modelinin ölçeği
    this.container.add(baseModel);

            if (this.physics) {
                this.collisionBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(32, -25, 0), // Collision Body Pozisyonu
                    material: this.physics.materials.items.floor
                });

              
                const radius = 5;
                const sphereShape = new CANNON.Sphere(radius);
                this.collisionBody.addShape(sphereShape);

                
                this.physics.world.addBody(this.collisionBody);
            }

            // Işık ekle (sadece bir kez)
            if (!this.container.__kapsulLightAdded) {
                const ambientLight = new THREE.AmbientLight(0xffffff, 2);
                const dirLight = new THREE.DirectionalLight(0xffffff, 2);
                dirLight.position.set(5, 10, 7.5);
                this.container.add(ambientLight);
                this.container.add(dirLight);
                this.container.__kapsulLightAdded = true;
            }

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

/* 
Resource.js   { name: 'aladdinTepesi', source: './models/hubit/aladdinTepesi/base.glb' },
İndex Js
    setAladdinTepesi() {
        this.aladdinTepesi = new AladdinTepesi({
            scene: this.scene,
            time: this.time,
            physics: this.physics
        });
    }
this.setAladdinTepesi()
import AladdinTepesi from './Hubit/AlaaddinTepesi.js'
*/