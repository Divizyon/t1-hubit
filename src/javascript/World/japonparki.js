import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

const DEFAULT_POSITION = new THREE.Vector3(-5, -26, .7); // Varsayılan pozisyon
const DEFAULT_SCALE = new THREE.Vector3(2, 2, 2); // Varsayılan ölçek

export default class Japonparki {
    constructor(_options) {
        this.time = _options.time;
        this.scene = _options.scene;
        this.physics = _options.physics;
        this.mixer = null;
        this.model = null;
        this.container = _options.container || this.scene;
        this.car = _options.car; // Araba referansını al
        
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

            // Restart butonları ekle
            this.addRestartButton();
            this.addSecondRestartButton();
            this.addLinkButton();

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
            
            // Çarpışma kutuları ekle
            if (this.physics) {
                this.addCollisions(this.model);
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

    addRestartButton() {
        // Buton için konum belirle
        const buttonPosition = new THREE.Vector3(
            this.position.x-3,
            this.position.y+3,
            this.position.z -0.3
        );
        
        // Buton boyutları
        const buttonWidth = 10;
        const buttonHeight = 4;
        const buttonDepth = 0.1;
        
        // Buton rotasyonu - derece cinsinden
        const rotX = 0; 
        const rotY = 0;
        const rotZ = 70;
        
        // Dereceleri radyana çevir
        const buttonRotationX = (rotX * Math.PI) / 180;
        const buttonRotationY = (rotY * Math.PI) / 180;
        const buttonRotationZ = (rotZ * Math.PI) / 180;
        
        // Buton geometrisi oluştur
        const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
        
        // Buton materyali - tamamen görünmez
        const buttonMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,       // Tamamen görünmez
            depthWrite: false // Derinlik bilgisi yazma (diğer objelerle çakışmasın)
        });
        
        // Buton mesh'i oluştur
        this.restartButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
        this.restartButton.position.copy(buttonPosition);
        this.restartButton.rotation.set(buttonRotationX, buttonRotationY, buttonRotationZ);
        this.restartButton.name = "restartButton";
        
        // Butonu sahneye ekle
        this.scene.add(this.restartButton);
        
        // Buton için collision kutusu ekle
        this.addButtonCollision(buttonPosition, buttonWidth, buttonHeight, buttonDepth, buttonRotationX, buttonRotationY, buttonRotationZ);
    }
    
    addSecondRestartButton() {
        // İkinci buton için konum belirle (farklı bir konumda)
        const buttonPosition = new THREE.Vector3(
            this.position.x+4.5,  // İlk butondan farklı bir x konumu
            this.position.y+0.5,
            this.position.z-0.3
        );
        
        // Buton boyutları - ilk butonla aynı
        const buttonWidth = 9.5;
        const buttonHeight = 3.8;
        const buttonDepth = 0.1;
        
        // Buton rotasyonu - ilk butonla aynı
        const rotX = 0; 
        const rotY = 0;
        const rotZ = 70;
        
        // Dereceleri radyana çevir
        const buttonRotationX = (rotX * Math.PI) / 180;
        const buttonRotationY = (rotY * Math.PI) / 180;
        const buttonRotationZ = (rotZ * Math.PI) / 180;
        
        // Buton geometrisi oluştur
        const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
        
        // Buton materyali - tamamen görünmez
        const buttonMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,       // Tamamen görünmez
            depthWrite: false // Derinlik bilgisi yazma
        });
        
        // Buton mesh'i oluştur
        this.secondRestartButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
        this.secondRestartButton.position.copy(buttonPosition);
        this.secondRestartButton.rotation.set(buttonRotationX, buttonRotationY, buttonRotationZ);
        this.secondRestartButton.name = "secondRestartButton";
        
        // Butonu sahneye ekle
        this.scene.add(this.secondRestartButton);
        
        // Buton için collision kutusu ekle
        this.addSecondButtonCollision(buttonPosition, buttonWidth, buttonHeight, buttonDepth, buttonRotationX, buttonRotationY, buttonRotationZ);
    }
    
    addButtonCollision(position, width, height, depth, rotX, rotY, rotZ) {
        // Çarpışma gövdesi boyutları
        const halfExtents = new CANNON.Vec3(
            width/2,
            height/2,
            depth/2
        );
        
        // Çarpışma kutusu oluştur
        const buttonShape = new CANNON.Box(halfExtents);
        
        // Fizik gövdesi oluştur
        const buttonBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        });
        
        // Şekli ekle
        buttonBody.addShape(buttonShape);
        
        // Rotasyonu ayarla
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(rotX, rotY, rotZ, 'XYZ');
        buttonBody.quaternion.copy(quat);
        
        // Fizik dünyasına ekle
        this.physics.world.addBody(buttonBody);
        
        // Çarpışma olayı dinle
        buttonBody.addEventListener('collide', (event) => {
            // Araba çarpışması kontrolü
            if (event.body === this.physics.car.chassis.body) {
                // Araba yeniden yaratılıyor
                if (this.physics.car && this.physics.car.recreate) {
                    this.physics.car.recreate();
                }
            }
        });
        
        this.buttonBody = buttonBody;
    }
    
    addSecondButtonCollision(position, width, height, depth, rotX, rotY, rotZ) {
        // Çarpışma gövdesi boyutları
        const halfExtents = new CANNON.Vec3(
            width/2,
            height/2,
            depth/2
        );
        
        // Çarpışma kutusu oluştur
        const buttonShape = new CANNON.Box(halfExtents);
        
        // Fizik gövdesi oluştur
        const buttonBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        });
        
        // Şekli ekle
        buttonBody.addShape(buttonShape);
        
        // Rotasyonu ayarla
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(rotX, rotY, rotZ, 'XYZ');
        buttonBody.quaternion.copy(quat);
        
        // Fizik dünyasına ekle
        this.physics.world.addBody(buttonBody);
        
        // Çarpışma olayı dinle
        buttonBody.addEventListener('collide', (event) => {
            // Araba çarpışması kontrolü
            if (event.body === this.physics.car.chassis.body) {
                // Araba yeniden yaratılıyor
                if (this.physics.car && this.physics.car.recreate) {
                    this.physics.car.recreate();
                }
            }
        });
        
        this.secondButtonBody = buttonBody;
    }

    addLinkButton() {
        // Link buton için konum belirle
        const buttonPosition = new THREE.Vector3(
            this.position.x-6,
            this.position.y-13.5,
            this.position.z-0.3
        );
        
        // Buton boyutları
        const buttonWidth = 10;
        const buttonHeight = 15;
        const buttonDepth = 0.1;
        
        // Buton rotasyonu - derece cinsinden
        const rotX = 0; 
        const rotY = 0;
        const rotZ = 70;
        
        // Dereceleri radyana çevir
        const buttonRotationX = (rotX * Math.PI) / 180;
        const buttonRotationY = (rotY * Math.PI) / 180;
        const buttonRotationZ = (rotZ * Math.PI) / 180;
        
        // Buton geometrisi oluştur
        const buttonGeometry = new THREE.BoxGeometry(buttonWidth, buttonHeight, buttonDepth);
        
        // Buton materyali - tamamen görünmez
        const buttonMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0,       // Tamamen görünmez
            depthWrite: false // Derinlik bilgisi yazma
        });
        
        // Buton mesh'i oluştur
        this.linkButton = new THREE.Mesh(buttonGeometry, buttonMaterial);
        this.linkButton.position.copy(buttonPosition);
        this.linkButton.rotation.set(buttonRotationX, buttonRotationY, buttonRotationZ);
        this.linkButton.name = "linkButton";
        
        // Butonu sahneye ekle
        this.scene.add(this.linkButton);
        
        // Buton için collision kutusu ekle
        this.addLinkButtonCollision(buttonPosition, buttonWidth, buttonHeight, buttonDepth, buttonRotationX, buttonRotationY, buttonRotationZ);
    }
    
    addLinkButtonCollision(position, width, height, depth, rotX, rotY, rotZ) {
        // Çarpışma gövdesi boyutları
        const halfExtents = new CANNON.Vec3(
            width/2,
            height/2,
            depth/2
        );
        
        // Çarpışma kutusu oluştur
        const buttonShape = new CANNON.Box(halfExtents);
        
        // Fizik gövdesi oluştur
        const buttonBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        });
        
        // Şekli ekle
        buttonBody.addShape(buttonShape);
        
        // Rotasyonu ayarla
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(rotX, rotY, rotZ, 'XYZ');
        buttonBody.quaternion.copy(quat);
        
        // Fizik dünyasına ekle
        this.physics.world.addBody(buttonBody);
        
        // Son çarpışma zamanını takip et (çok sık çarpma durumunda tekrar tekrar açılmasın diye)
        let lastCollisionTime = 0;
        
        // Çarpışma olayı dinle
        buttonBody.addEventListener('collide', (event) => {
            // Araba çarpışması kontrolü
            if (event.body === this.physics.car.chassis.body) {
                const now = Date.now();
                
                // Çarpışmalar arasında en az 2 saniye olsun
                if (now - lastCollisionTime > 2000) {
                    lastCollisionTime = now;
                    
                    // Kafem web sitesine yönlendir
                    window.open('https://kafem.com.tr/', '_blank');
                    console.log("Kafem.com.tr sitesine yönlendiriliyor...");
                    
                    // Arabayı hafifçe geri it
                    this.pushCarBack(event.body);
                }
            }
        });
        
        this.linkButtonBody = buttonBody;
    }
    
    pushCarBack(carBody) {
        // Arabayı itme gücü
        const pushForce = 70; 
        
        // Arabayı geri itme vektörü
        // Not: Buton normalde -z ekseni yönündedir, dolayısıyla +z yönünde bir kuvvet uygulayacağız
        const pushVector = new CANNON.Vec3(
            0,            // X: Yatay itme yok
            -pushForce/2, // Y: Hafif aşağı yönlü itme (arabanın havaya zıplamaması için)
            pushForce     // Z: Butondan uzaklaştıran kuvvet
        );
        
        // Vektörü butonun rotasyonuna göre döndür
        const rotatedPushVector = carBody.quaternion.vmult(pushVector);
        
        // Arabaya kuvvet uygula - impulse anlık bir kuvvet uygular
        carBody.applyImpulse(rotatedPushVector, carBody.position);
        
        // Arabanın hızını sınırla
        setTimeout(() => {
            // Arabanın hızını belirli bir değerde sınırla (çok fazla hızlanmaması için)
            const currentVelocity = carBody.velocity;
            const maxSpeed = 15;
            
            if (currentVelocity.length() > maxSpeed) {
                currentVelocity.normalize();
                currentVelocity.scale(maxSpeed, carBody.velocity);
            }
        }, 50); // Çok kısa bir gecikme ile hız sınırlaması yapalım
        
        console.log("Araba butondan geri itildi");
    }

    addCollisions(model) {
        // Bounding box hesapla
        model.updateMatrixWorld(true)
        const bbox = new THREE.Box3().setFromObject(model)
        const size = bbox.getSize(new THREE.Vector3())
        
        // Göreceli konumları hesapla (Japon parkının konumuna göre)
        const relPos1 = new THREE.Vector3(
            this.position.x -2,
            this.position.y-4 ,
            this.position.z-0.65
        );
        
        // Küresel çarpışma kutusu için konum
        const spherePos = new THREE.Vector3(
            this.position.x ,
            this.position.y +1.5,
            this.position.z-5.8
        );
        
        // İlk çarpışma kutusu
        this.addCollisionBox(
            relPos1,
            new THREE.Euler(0, 0, 45),
            new CANNON.Vec3(17, 13, 0.15),
        )
        
        // Küresel çarpışma kutusu ekle
        this.addCollisionSphere(
            spherePos,
            7, // yarıçap
        )
        
    }
    
    addCollisionBox(position, rotation, halfExtents, color) {
        // Fizik gövdesi oluştur
        const boxShape = new CANNON.Box(halfExtents)

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        })

        // Dönüşü quaternion olarak ayarla
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ')
        body.quaternion.copy(quat)

        body.addShape(boxShape)
        this.physics.world.addBody(body)

        console.log("Japon parkı için collision eklendi:", body)
        
    }
    
    visualizeCollisionBox(position, rotation, halfExtents, color) {
        // Çarpışma kutusunun görsel temsilini oluştur
        const geometry = new THREE.BoxGeometry(
            halfExtents.x * 2, 
            halfExtents.y * 2, 
            halfExtents.z * 2
        )
        
        // Yarı saydam malzeme 
        const material = new THREE.MeshBasicMaterial({ 
            color: color,  // Parametre olarak gelen renk
            transparent: true, 
            opacity: 0.7,    
            wireframe: false,  // Katı görünüm için wireframe kapalı
            wireframeLinewidth: 2
        })
        
        const collisionMesh = new THREE.Mesh(geometry, material)
        
        // Pozisyonu ve rotasyonu ayarla
        collisionMesh.position.copy(position)
        collisionMesh.rotation.copy(rotation)
        
        // Sahneye ekle
        this.container.add(collisionMesh)
        
        console.log("Çarpışma kutusu görselleştirildi:", collisionMesh)
    }

    addCollisionSphere(position, radius, color) {
        // Fizik gövdesi için küre şekli oluştur
        const sphereShape = new CANNON.Sphere(radius);
        
        // Fizik gövdesi oluştur
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        });
        
        // Şekli gövdeye ekle
        body.addShape(sphereShape);
        this.physics.world.addBody(body);
        
        console.log("Japon parkı için küresel collision eklendi:", body);
        
        
    }
    
    visualizeCollisionSphere(position, radius, color) {
        // Küre geometrisi oluştur
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        
        // Yarı saydam malzeme
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            wireframe: false
        });
        
        // Mesh oluştur
        const sphereMesh = new THREE.Mesh(geometry, material);
        
        // Pozisyonu ayarla
        sphereMesh.position.copy(position);
        
        // Sahneye ekle
        this.container.add(sphereMesh);
        
        console.log("Küresel çarpışma kutusu görselleştirildi:", sphereMesh);
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

