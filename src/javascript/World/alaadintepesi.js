import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as CANNON from 'cannon'

// Varsayılan konum ve ölçek için sabitler
const DEFAULT_POSITION = new THREE.Vector3(17, -30, 0);
const DEFAULT_SCALE = new THREE.Vector3(0.7, 0.7, 0.7);

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
        
        // Model pozisyonu ve ölçeği
        this.position = _options.position ? _options.position.clone() : DEFAULT_POSITION.clone();
        this.scale = _options.scale ? _options.scale.clone() : DEFAULT_SCALE.clone();
        
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
        // Model konumunu ve ölçeğini kullan
        this.model.position.copy(this.position);
        this.model.scale.copy(this.scale);
        this.model.rotation.x = Math.PI / 2;
        
        this.scene.add(this.model);

        if (this.physics) {
            this.collisionBody = new CANNON.Body({
                mass: 0,
                // Fizik gövdesi konumunu model konumundan al
                position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
                material: this.physics.materials.items.floor
            });

            // Çarpışma küresinin boyutunu model ölçeğine göre ayarla
            const baseRadius = 7; // Temel yarıçap
            const scaleFactor = Math.max(this.scale.x, this.scale.y, this.scale.z); // En büyük ölçek faktörünü al
            const radius = baseRadius * scaleFactor;
            
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


    setAlaaddinInteraction() {
        try {
            if (!this.areas) {
                console.error("Alaaddin Tepesi etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

            // Etkileşim alanının konumunu model konumuna göre hesapla
            // Model konumunun biraz aşağısında olacak şekilde
            const interactionOffset = new THREE.Vector2(0, 8); // Y ekseninde 8 birim aşağıda
            const interactionPosition = new THREE.Vector2(
                this.position.x,
                this.position.y - interactionOffset.y
            );

            // Create interaction area relative to the model position
            this.alaaddinArea = this.areas.add({
                position: interactionPosition, 
                halfExtents: new THREE.Vector2(1.5, 1.5), // 3x3 birim alan
            });

            // Create ENTER label using canvas
            const labelCanvas = document.createElement('canvas');
            const context = labelCanvas.getContext('2d');
            
            // Canvas size
            labelCanvas.width = 256;
            labelCanvas.height = 128;
            
            // Configure text style
            context.font = 'bold 64px Arial';
            context.textAlign = 'center';
            context.fillStyle = 'white';
            context.shadowColor = 'rgba(0, 0, 0, 0.5)';
            context.shadowBlur = 5;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
            
            // Draw text
            context.fillText("ENTER", labelCanvas.width / 2, labelCanvas.height / 2 + 20);
            
            // Create texture from canvas
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            labelTexture.minFilter = THREE.LinearFilter;
            labelTexture.wrapS = THREE.ClampToEdgeWrapping;
            labelTexture.wrapT = THREE.ClampToEdgeWrapping;
            
            // Create material for the label
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                opacity: 1.0,
                depthWrite: false,
                depthTest: false,
                side: THREE.DoubleSide,
                toneMapped: false,
                blending: THREE.AdditiveBlending
            });
            
            // Create label mesh
            const labelMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.8),
                labelMaterial
            );
            
            // Etiketi etkileşim alanıyla aynı konuma yerleştir
            labelMesh.position.set(interactionPosition.x, interactionPosition.y, 0);
            labelMesh.matrixAutoUpdate = false;
            labelMesh.updateMatrix();
            labelMesh.renderOrder = 999;
            
            // Add label to scene
            this.scene.add(labelMesh);

            // Define interaction function
            this.alaaddinArea.on("interact", () => {
                // Create popup
                const popupContainer = document.createElement("div");
                popupContainer.style.position = "fixed";
                popupContainer.style.top = "0";
                popupContainer.style.left = "0";
                popupContainer.style.width = "100%";
                popupContainer.style.height = "100%";
                popupContainer.style.display = "flex";
                popupContainer.style.justifyContent = "center";
                popupContainer.style.alignItems = "center";
                popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
                popupContainer.style.zIndex = "9999";

                // Popup content
                const popupBox = document.createElement("div");
                popupBox.style.backgroundColor = "white";
                popupBox.style.color = "black";
                popupBox.style.padding = "30px 40px";
                popupBox.style.borderRadius = "8px";
                popupBox.style.minWidth = "350px";
                popupBox.style.maxWidth = "90%";
                popupBox.style.textAlign = "center";
                popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";

                // Title
                const titleEl = document.createElement("h2");
                titleEl.style.margin = "0 0 25px 0";
                titleEl.style.fontSize = "24px";
                titleEl.style.fontWeight = "bold";
                titleEl.textContent = "Alaaddin Tepesi";

                // Link
                const linkEl = document.createElement("a");
                linkEl.href = "https://kilicarslanyarisma.konya.bel.tr/";
                linkEl.textContent = "Alaaddin Tepesi Hakkında";
                linkEl.target = "_blank";
                linkEl.style.display = "inline-block";
                linkEl.style.padding = "12px 25px";
                linkEl.style.backgroundColor = "#3498db";
                linkEl.style.color = "white";
                linkEl.style.textDecoration = "none";
                linkEl.style.borderRadius = "5px";
                linkEl.style.fontWeight = "bold";
                linkEl.style.margin = "15px 0";
                linkEl.style.transition = "background-color 0.3s";

                // Link hover effect
                linkEl.addEventListener("mouseover", () => {
                    linkEl.style.backgroundColor = "#2980b9";
                });
                linkEl.addEventListener("mouseout", () => {
                    linkEl.style.backgroundColor = "#3498db";
                });

                // Description text
                const descriptionEl = document.createElement("p");
                descriptionEl.textContent = "Alaaddin Tepesi, Konya'nın merkezinde yer alan tarihi bir tepedir. Selçuklu döneminden kalma önemli eserleri barındırır.";
                descriptionEl.style.margin = "0 0 20px 0";

                // Close button
                const closeButton = document.createElement("button");
                closeButton.textContent = "Kapat";
                closeButton.style.padding = "10px 20px";
                closeButton.style.border = "none";
                closeButton.style.backgroundColor = "#e0e0e0";
                closeButton.style.color = "#333";
                closeButton.style.cursor = "pointer";
                closeButton.style.borderRadius = "5px";
                closeButton.style.fontSize = "14px";
                closeButton.style.marginTop = "20px";

                // Close function
                closeButton.addEventListener("click", () => {
                    document.body.removeChild(popupContainer);
                });

                // Close on outside click
                popupContainer.addEventListener("click", (event) => {
                    if (event.target === popupContainer) {
                        document.body.removeChild(popupContainer);
                    }
                });

                // Add elements to popup
                popupBox.appendChild(titleEl);
                popupBox.appendChild(descriptionEl);
                popupBox.appendChild(linkEl);
                popupBox.appendChild(closeButton);
                popupContainer.appendChild(popupBox);
                document.body.appendChild(popupContainer);
            });
            
            console.log("Alaaddin Tepesi etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Alaaddin Tepesi etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
}