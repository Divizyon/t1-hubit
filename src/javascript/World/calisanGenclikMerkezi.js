import * as THREE from 'three'
import CANNON from 'cannon'

export default class CalisanGenclikMerkezi {
    constructor(resources, objects, shadows, debug, scene, physics, time, areas) {
        this.resources = resources
        this.objects = objects
        this.shadows = shadows
        this.debug = debug
        this.scene = scene
        this.physics = physics // Fizik motoru için physics eklendi
        this.time = time // Time nesnesi eklendi
        this.areas = areas // Etkileşim alanları için areas eklendi
        this.sounds = resources.sounds // Ses sistemi referansı

        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('calisanGenclikMerkezi')
        }

        this.setModel()
        
        // Collision kutusunu oluştur
        if(this.physics) {
            this.createCollisionBox()
        }
        
        // Etkileşim alanını oluştur
        if(this.areas) {
            this.createInteractionArea()
        }
    }

    setModel() {
        console.log('Loading CalisanGenclikMerkezi model...')
        console.log('Resources:', this.resources.items)

        if (!this.resources.items) {
            console.error('Resources items not initialized')
            return
        }

        if (!this.resources.items.calisanGenclikMerkezi) {
            console.error('CalisanGenclikMerkezi model not found in resources')
            console.log('Available resources:', Object.keys(this.resources.items))
            return
        }

        this.model = this.objects.add({
            base: this.resources.items.calisanGenclikMerkezi.scene,
            collision: { children: [] }, // Boş collision nesnesi, içinden geçilebilir!
            offset: new THREE.Vector3(70, -30, 0),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true
        })

        if (this.model && this.model.container && this.model.container instanceof THREE.Object3D) {
            this.scene.add(this.model.container)
            console.log('Model added to scene at position:', this.model.container.position)
        } else if (this.model instanceof THREE.Object3D) {
            this.scene.add(this.model)
            console.log('Model added to scene at position:', this.model.position)
        } else {
            console.error('Eklenebilecek bir THREE.Object3D bulunamadı:', this.model)
        }

        // Debug
        if (this.debug) {
            this.debugFolder
                .add(this.model.container.position, 'x')
                .name('positionX')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'y')
                .name('positionY')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'z')
                .name('positionZ')
                .min(-50)
                .max(50)
                .step(0.1)
        }
    }
    
    // 5x5x5 boyutlarında collision kutusu oluşturma metodu
    createCollisionBox() {
        // Modelin konumu
        const position = new THREE.Vector3(70, -28, 1)
        
        // Collision için küp boyutları (5x5x5)
        const halfExtents = new CANNON.Vec3(2.5, 2.5, 2.5) // halfExtents olduğu için boyutların yarısı
        
        // Küp için şekil oluştur
        const boxShape = new CANNON.Box(halfExtents)
        
        // Fizik gövdesi oluştur - kütle 0 olarak ayarlandı (statik)
        const boxBody = new CANNON.Body({
            mass: 0, // Kütle 0 olarak ayarlandı - statik nesne olacak
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: boxShape,
            material: this.physics ? this.physics.materials.items.dummy : undefined
        })
        
        // Modele uygun rotasyon uygula
        const rotationQuaternion = new CANNON.Quaternion()
        rotationQuaternion.setFromEuler(0, 0, 0) // Model rotasyonu ile uyumlu
        boxBody.quaternion = boxBody.quaternion.mult(rotationQuaternion)
        
        // Fizik motoruna ekle
        if (this.physics && this.physics.world) {
            this.physics.world.addBody(boxBody)
            
            // Collision gövdesini kaydet
            this.collisionBody = boxBody
            
            // Collision gövdesi için ses olayı ekle
            if (this.sounds) {
                this.collisionBody.addEventListener('collide', (_event) => {
                    const relativeVelocity = _event.contact.getImpactVelocityAlongNormal()
                    this.sounds.play('brick', relativeVelocity)
                })
            }
            
            // Debug görsel (opsiyonel)
            if (this.physics.models && this.physics.models.container) {
                const boxGeometry = new THREE.BoxGeometry(5, 5, 5)
                const boxMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                })
                
                this.collisionMesh = new THREE.Mesh(boxGeometry, boxMaterial)
                this.collisionMesh.position.copy(position)
                
                // Debug görselinin görünürlüğünü fizik modelleriyle sync et
                this.physics.models.container.add(this.collisionMesh)
            }
            
            console.log('Çalışan Gençlik Merkezi collision kutusu oluşturuldu:', position)
        } else {
            console.error("Fizik motoru bulunamadı, collision box oluşturulamadı!")
        }
    }
    
    // Etkileşim alanı oluşturma metodu
    createInteractionArea() {
        try {
            if (!this.areas) {
                console.error("Çalışan Gençlik Merkezi etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }
            
            
            const areaPosition = new THREE.Vector2(70, -33);
            
            // Etkileşim alanı oluştur (3x3 birim)
            this.interactionArea = this.areas.add({
                position: areaPosition,
                halfExtents: new THREE.Vector2(1.5, 1.5), // 3x3 birimlik alan için halfExtents 1.5x1.5
            });
            
            // Etkileşim fonksiyonunu tanımla
            this.interactionArea.on("interact", () => {
                // Popup oluştur
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
                
                // Popup içeriği
                const popupBox = document.createElement("div");
                popupBox.style.backgroundColor = "white";
                popupBox.style.color = "black";
                popupBox.style.padding = "30px 40px";
                popupBox.style.borderRadius = "8px";
                popupBox.style.minWidth = "350px";
                popupBox.style.maxWidth = "90%";
                popupBox.style.textAlign = "center";
                popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";
                
                // Başlık
                const titleEl = document.createElement("h2");
                titleEl.style.margin = "0 0 25px 0";
                titleEl.style.fontSize = "24px";
                titleEl.style.fontWeight = "bold";
                titleEl.textContent = "Çalışan Gençlik Web Sitesi";
                
                // Link oluştur
                const linkEl = document.createElement("a");
                linkEl.href = "https://www.calisangenclik.com/";
                linkEl.textContent = "www.calisangenclik.com";
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
                
                // Link hover efekti
                linkEl.addEventListener("mouseover", () => {
                    linkEl.style.backgroundColor = "#2980b9";
                });
                linkEl.addEventListener("mouseout", () => {
                    linkEl.style.backgroundColor = "#3498db";
                });
                
                // Açıklama metni
                const descriptionEl = document.createElement("p");
                descriptionEl.textContent = "Çalışan Gençlik Meclisi hakkında daha fazla bilgi almak için tıklayın.";
                descriptionEl.style.margin = "0 0 20px 0";
                
                // Kapatma butonu
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
                
                // Kapatma fonksiyonu
                closeButton.addEventListener("click", () => {
                    document.body.removeChild(popupContainer);
                });
                
                // Popup dışına tıklamayla kapatma
                popupContainer.addEventListener("click", (event) => {
                    if (event.target === popupContainer) {
                        document.body.removeChild(popupContainer);
                    }
                });
                
                // Elementleri popupa ekle
                popupBox.appendChild(titleEl);
                popupBox.appendChild(descriptionEl);
                popupBox.appendChild(linkEl);
                popupBox.appendChild(closeButton);
                popupContainer.appendChild(popupBox);
                document.body.appendChild(popupContainer);
                
                // Ses efekti çal
                if (this.sounds) {
                    this.sounds.play("click");
                }
            });
            
            console.log("Çalışan Gençlik Merkezi etkileşim alanı başarıyla eklendi:", areaPosition);
        } catch (error) {
            console.error("Çalışan Gençlik Merkezi etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
} 
