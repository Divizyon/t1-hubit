import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon'

export default class AlaaddinTepesi {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.areas = _options.areas;
        this.mixer = null;
        this.model = null;
        this.collisionBody = null;
        this.setModel();
        
        if (this.time) {
            this.time.on('tick', () => {
                this.tick(this.time.delta * 0.001);
            });
        } else {
            console.warn('AlaaddinTepesi: time parametresi verilmedi, animasyonlar çalışmayacak.');
        }

        if (this.areas) {
            this.setAlaaddinInteraction();
        }
    }

    setModel() {
        if (!this.scene) {
            console.warn('AlaaddinTepesi: scene parametresi verilmedi, model sahneye eklenmeyecek.');
            return;
        }

        const loader = new GLTFLoader();
        loader.load('./models/alladintepesi/AlaaddinTepesi.glb', (gltf) => {
            console.log('Balık modeli yüklendi:', gltf);
            console.log('Animasyonlar:', gltf.animations);
            
            this.model = gltf.scene;

            
            this.model.position.set(15,-15, .7)
            this.model.scale.set(.5, .5, .5);
            
            // Modeli döndür
            this.model.rotation.x = Math.PI / 2;
            
            this.scene.add(this.model);

          
            if (this.physics) {
                this.collisionBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(15, -15, .7),
                    material: this.physics.materials.items.floor
                });

              
                const radius = 5;
                const sphereShape = new CANNON.Sphere(radius);
                this.collisionBody.addShape(sphereShape);

                
                this.physics.world.addBody(this.collisionBody);
            }

            // Işık ekle (sadece bir kez)
            if (!this.scene.__balikLightAdded) {
                this.scene.add(new THREE.AmbientLight(0xffffff, 2));
                const dirLight = new THREE.DirectionalLight(0xffffff, 2);
                dirLight.position.set(5, 10, 7.5);
                this.scene.add(dirLight);
                this.scene.__balikLightAdded = true;
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

    setAlaaddinInteraction() {
        try {
            if (!this.areas) {
                console.error("Alaaddin Tepesi etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

            // Create interaction area 6 units below the model
            this.alaaddinArea = this.areas.add({
                position: new THREE.Vector2(15, -21), // 6 units below the model's position (15, -15)
                halfExtents: new THREE.Vector2(2, 2), // 2x2 unit area
            });

            // Define interaction function
            this.alaaddinArea.on("interact", () => {
                // PopupModule tarafından yönetileceği için buradaki popup kodu kaldırıldı
                console.log("Alaaddin Tepesi etkileşimi: PopUpModule tarafından yönetilecek");
            });
            
            console.log("Alaaddin Tepesi etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Alaaddin Tepesi etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
}