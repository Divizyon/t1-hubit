import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

export default class Newton {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.materials = _options.materials;
        this.mixer = null;
        this.model = null;
        this.collisionBody = null;
        this.setModel();
        
        if (this.time) {
            this.time.on('tick', () => {
                this.tick(this.time.delta * 0.001);
            });
        } else {
            console.warn('Newton: time parametresi verilmedi, animasyonlar çalışmayacak.');
        }
    }

    setModel() {
        if (!this.scene) {
            console.warn('Newton: scene parametresi verilmedi, model sahneye eklenmeyecek.');
            return;
        }

        const loader = new GLTFLoader();
        loader.load('./models/newton/newton.glb', (gltf) => {
            console.log('Newton modeli yüklendi:', gltf);
            console.log('Animasyonlar:', gltf.animations);
            
            this.model = gltf.scene;
            this.model.position.set(12, 23, 0);
            this.model.scale.set(.7, .7, .7);
            
            this.model.rotation.x = Math.PI / 2;
            this.model.rotation.y = Math.PI / 4;
            
            this.scene.add(this.model);

            if (this.physics) {
                const bbox = new THREE.Box3().setFromObject(this.model);
                const size = bbox.getSize(new THREE.Vector3());
                
                this.collisionBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(12, 23, 0),
                    material: this.physics.materials.items.floor
                });

                const mainShape = new CANNON.Box(new CANNON.Vec3(
                    size.x * 0.36,
                    size.y * 0.36,
                    size.z * 0.40
                ));
                
                this.collisionBody.addShape(mainShape);
                
                const sphereShape = new CANNON.Sphere(size.x * 0.3);
                this.collisionBody.addShape(sphereShape, new CANNON.Vec3(0, size.y * 0.3, 0));
                
                this.collisionBody.quaternion.setFromEuler(Math.PI / 2, Math.PI / 4, 0);
                
                this.physics.world.addBody(this.collisionBody);
                
                if (this.debug) {
                    const helper = new THREE.Box3Helper(bbox, 0xff0000);
                    this.scene.add(helper);
                }
            }

            // Materyal ve mesh kontrolü
            this.model.traverse((child) => {
                if (child.isMesh) {
                    console.log('Mesh bulundu:', child.name);
                    
                    // Mesh detaylarını logla
                    console.log('Mesh detayları:', {
                        name: child.name,
                        material: child.material,
                        geometry: child.geometry,
                        position: child.position,
                        rotation: child.rotation,
                        scale: child.scale
                    });

                    // Shadow ayarları
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Materyal kontrolü ve ataması
                    if (child.material) {
                        // Eğer material bir array ise
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => {
                                if (mat.type === 'MeshBasicMaterial') {
                                    return new THREE.MeshStandardMaterial({
                                        color: mat.color,
                                        metalness: 0.5,
                                        roughness: 0.5,
                                        envMapIntensity: 1
                                    });
                                }
                                return mat;
                            });
                        } else {
                            // Tek material varsa
                            if (child.material.type === 'MeshBasicMaterial') {
                                child.material = new THREE.MeshStandardMaterial({
                                    color: child.material.color || 0xffffff,
                                    metalness: 0.5,
                                    roughness: 0.5,
                                    envMapIntensity: 1
                                });
                            }
                        }
                    } else {
                        // Material yoksa varsayılan material ata
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            metalness: 0.5,
                            roughness: 0.5,
                            envMapIntensity: 1
                        });
                    }

                    // Material özelliklerini ayarla
                    if (child.material) {
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        child.material.needsUpdate = true;
                    }

                    console.log('Material color:', child.material.color);
                }
            });

            // Işık ekle (sadece bir kez)
            if (!this.scene.__newtonLightAdded) {
                const ambientLight = new THREE.AmbientLight(0xffffff, 1);
                this.scene.add(ambientLight);

                const dirLight = new THREE.DirectionalLight(0xffffff, 2);
                dirLight.position.set(5, 10, 7.5);
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;
                this.scene.add(dirLight);
                
                this.scene.__newtonLightAdded = true;
            }

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