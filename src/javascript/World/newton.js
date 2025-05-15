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
            this.model.position.set(12, 20, 0);
            this.model.scale.set(.7, .7, .7);
            
            this.model.rotation.x = Math.PI / 2;
            this.model.rotation.y = Math.PI / 4;
            
            this.scene.add(this.model);

            // Model için özel ışıklandırma
            const modelLight = new THREE.PointLight(0xffffff, 10.0, 100);
            modelLight.position.set(12, 22, 0);
            this.scene.add(modelLight);

            // Model için ikinci ışık (ön taraftan)
            const frontLight = new THREE.PointLight(0xffffff, 8.0, 100);
            frontLight.position.set(12, 20, 10);
            this.scene.add(frontLight);

            // Model için üçüncü ışık (arka taraftan)
            const backLight = new THREE.PointLight(0xffffff, 8.0, 100);
            backLight.position.set(12, 20, -10);
            this.scene.add(backLight);

            // Model için dördüncü ışık (yan taraftan)
            const sideLight = new THREE.PointLight(0xffffff, 8.0, 100);
            sideLight.position.set(20, 20, 0);
            this.scene.add(sideLight);

            if (this.physics) {
                const bbox = new THREE.Box3().setFromObject(this.model);
                const size = bbox.getSize(new THREE.Vector3());
                
                this.collisionBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(12, 20, 0),
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
                    
                    // Shadow ayarları
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Yeni materyal oluştur
                    const newMaterial = new THREE.MeshPhongMaterial({
                        color: 0xffffff,
                        shininess: 100,
                        specular: 0xffffff,
                        flatShading: false,
                        transparent: false,
                        opacity: 1.0
                    });

                    // Eğer orijinal materyal varsa rengini kullan
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => {
                                const phongMat = newMaterial.clone();
                                phongMat.color = mat.color;
                                return phongMat;
                            });
                        } else {
                            const phongMat = newMaterial.clone();
                            phongMat.color = child.material.color;
                            child.material = phongMat;
                        }
                    } else {
                        child.material = newMaterial;
                    }

                    // Material özelliklerini ayarla
                    if (child.material) {
                        child.material.needsUpdate = true;
                    }

                    console.log('Material color:', child.material.color);
                }
            });

            // Işık ekle (sadece bir kez)
            if (!this.scene.__newtonLightAdded) {
                // Ana ambient ışık
                const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
                this.scene.add(ambientLight);

                // Ana directional ışık
                const dirLight = new THREE.DirectionalLight(0xffffff, 5.0);
                dirLight.position.set(12, 30, 0);
                dirLight.castShadow = true;
                dirLight.shadow.mapSize.width = 2048;
                dirLight.shadow.mapSize.height = 2048;
                this.scene.add(dirLight);
                
                // Spot ışıklar
                const spotLight1 = new THREE.SpotLight(0xffffff, 5.0);
                spotLight1.position.set(12, 28, 0);
                spotLight1.angle = Math.PI / 2;
                spotLight1.penumbra = 0.2;
                spotLight1.decay = 1;
                spotLight1.distance = 100;
                this.scene.add(spotLight1);

                const spotLight2 = new THREE.SpotLight(0xffffff, 5.0);
                spotLight2.position.set(17, 23, 5);
                spotLight2.angle = Math.PI / 2;
                spotLight2.penumbra = 0.2;
                spotLight2.decay = 1;
                spotLight2.distance = 100;
                this.scene.add(spotLight2);

                const spotLight3 = new THREE.SpotLight(0xffffff, 5.0);
                spotLight3.position.set(7, 23, -5);
                spotLight3.angle = Math.PI / 2;
                spotLight3.penumbra = 0.2;
                spotLight3.decay = 1;
                spotLight3.distance = 100;
                this.scene.add(spotLight3);
                
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