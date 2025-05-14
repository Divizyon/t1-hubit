import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

const DEFAULT_POSITION = new THREE.Vector3(-5, -26, .7); // Varsayılan pozisyon
const DEFAULT_SCALE = new THREE.Vector3(1.7, 1.7, 1.7); // Varsayılan ölçek

export default class Japonparki {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.areas = _options.areas;
        this.mixer = null;
        this.model = null;
        this.collisionBody = null;
        
        // Pozisyon ve rotasyon parametrelerini al veya varsayılanları kullan
        this.position = _options.position ? _options.position.clone() : DEFAULT_POSITION.clone();
        this.scale = _options.scale ? _options.scale.clone() : DEFAULT_SCALE.clone();
        this.rotationX = _options.rotationX !== undefined ? _options.rotationX : Math.PI / 2;
        this.rotationY = _options.rotationY !== undefined ? _options.rotationY : 2.7;
        this.rotationZ = _options.rotationZ !== undefined ? _options.rotationZ : 0;
        
        this.setModel();
        
        if (this.time) {
            this.time.on('tick', () => {
                this.tick(this.time.delta * 0.001);
            });
        } else {
            console.warn('Japonparki: time parametresi verilmedi, animasyonlar çalışmayacak.');
        }

        if (this.areas) {
            this.setJaponparkiInteraction();
        }
    }

    setModel() {
        if (!this.scene) {
            console.warn('Japonparki: scene parametresi verilmedi, model sahneye eklenmeyecek.');
            return;
        }

        const loader = new GLTFLoader();
        loader.load('./models/japonparki/japonparki.glb', (gltf) => {
            console.log('Balık modeli yüklendi:', gltf);
            console.log('Animasyonlar:', gltf.animations);
             
           
            
            
            this.model = gltf.scene;
            // Modelin pozisyonunu parametre olarak alınan değerle ayarla
            this.model.position.copy(this.position);
            // Modelin ölçeğini parametre olarak alınan değerle ayarla
            this.model.scale.copy(this.scale);
            
            // Modeli döndür
            this.model.rotation.x = this.rotationX;
            this.model.rotation.y = this.rotationY;
            this.model.rotation.z = this.rotationZ;
            
    
            this.scene.add(this.model);

          
            if (this.physics) {
                this.collisionBody = new CANNON.Body({
                    mass: 0,
                    position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z + 0.2), // Pozisyonu modelden al, z değerini biraz yükselt
                    material: this.physics.materials.items.floor
                });

                // Çarpışma küresinin boyutunu model ölçeğine göre ayarla
                const baseRadius = 5; // Temel yarıçap
                const scaleFactor = Math.max(this.scale.x, this.scale.y, this.scale.z); // En büyük ölçek faktörünü al
                const radius = baseRadius * scaleFactor;
              
                const sphereShape = new CANNON.Sphere(radius);
                this.collisionBody.addShape(sphereShape);
                
                this.physics.world.addBody(this.collisionBody);
            }

            // Işık ekle (sadece bir kez)
            if (!this.scene.__balikLightAdded) {
                this.scene.add(new THREE.AmbientLight(0xffffff, 2));
                const dirLight = new THREE.DirectionalLight(0xffffff, 2);
                dirLight.position.set(10, 4, 7.5);
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

    setJaponparkiInteraction() {
        try {
            if (!this.areas) {
                console.error("Japon Parkı etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

            // Create interaction area near the model
            this.japonparkiArea = this.areas.add({
                // Etkileşim alanını modelin pozisyonuna göre ayarla
                position: new THREE.Vector2(this.position.x -2, this.position.y+10), 
                halfExtents: new THREE.Vector2(1.5, 1.5), // 2x2 unit area
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
            
            // Position the label near the model
            labelMesh.position.set(this.position.x -2, this.position.y+10, 0);
            labelMesh.matrixAutoUpdate = false;
            labelMesh.updateMatrix();
            labelMesh.renderOrder = 999;
            
            // Add label to scene
            this.scene.add(labelMesh);

            // Define interaction function
            this.japonparkiArea.on("interact", () => {
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
                titleEl.textContent = "Japon Parkı";

                // Link
                const linkEl = document.createElement("a");
                linkEl.href = "https://www.konya.bel.tr/hizmet-binalari-ve-sosyal-tesisler/japon-parki";
                linkEl.textContent = "Japon Parkı Hakkında";
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
                descriptionEl.textContent = "Japon Parkı, Konya'nın merkezinde yer alan, Japon kültürünü yansıtan özel bir parktır. Japon bahçe sanatının örneklerini barındırır.";
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
            
            console.log("Japon Parkı etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Japon Parkı etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
}

