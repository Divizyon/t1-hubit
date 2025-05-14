import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon'

export default class AlaaddinTepesi {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.areas = _options.areas;
        this.resources = _options.resources;
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
    }

    setModel() {
        if (!this.scene) {
            console.warn('AlaaddinTepesi: scene parametresi verilmedi, model sahneye eklenmeyecek.');
            return;
        }

        if (this.resources && this.resources.items.aladdinTepesi) {
            console.log('Alaaddin Tepesi modeli resources.items\'dan yükleniyor');
            
            // Clone the model - don't modify the original resource
            this.model = this.resources.items.aladdinTepesi.scene.clone();
            
            // Set up the model (position, scale, etc.)
            this.setupModel();
            
            // Handle animations from resources
            if (this.resources.items.aladdinTepesi.animations && 
                this.resources.items.aladdinTepesi.animations.length > 0) {
                
                console.log('Resources animasyonları yükleniyor...');
                console.log('Animasyon sayısı:', this.resources.items.aladdinTepesi.animations.length);
                
                this.mixer = new THREE.AnimationMixer(this.model);
                
                this.resources.items.aladdinTepesi.animations.forEach((clip, index) => {
                    console.log(`Animasyon ${index} yükleniyor:`, clip.name);
                    const action = this.mixer.clipAction(clip);
                    action.reset().play();
                });
                
                console.log('Mixer oluşturuldu:', this.mixer);
            } else {
                console.warn('Resources içinde hiç animasyon bulunamadı!');
                this.loadExternalModel();
            }
        } else {
            console.log('Resources bulunamadı, Alaaddin Tepesi modeli doğrudan yükleniyor...');
            this.loadExternalModel();
        }
    }
    
    loadExternalModel() {
        const loader = new GLTFLoader();
        loader.load('./models/alladintepesi/AlaaddinTepesi.glb', (gltf) => {
            console.log('Alaaddin Tepesi modeli dışarıdan yüklendi:', gltf);
            console.log('Animasyonlar:', gltf.animations);
            
            this.model = gltf.scene;
            this.setupModel();
            
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

    setupModel() {
        this.model.position.set(14, -14, 0);
        this.model.scale.set(0.5, 0.5, 0.5);
        this.model.rotation.x = Math.PI / 2;
        
        this.scene.add(this.model);

        if (this.physics) {
            this.collisionBody = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(14, -14, 0),
                material: this.physics.materials.items.floor
            });

            const radius = 5;
            const sphereShape = new CANNON.Sphere(radius);
            this.collisionBody.addShape(sphereShape);
            
            this.physics.world.addBody(this.collisionBody);
        }

        if (!this.scene.__balikLightAdded) {
            this.scene.add(new THREE.AmbientLight(0xffffff, 2));
            const dirLight = new THREE.DirectionalLight(0xffffff, 2);
            dirLight.position.set(5, 10, 7.5);
            this.scene.add(dirLight);
            this.scene.__balikLightAdded = true;
        }

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
    }

    tick(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}