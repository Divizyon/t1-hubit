import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 40  // Model konumları
let posizyonY = -40
let posizyonZ = 0

export default class KelebeklerSection { // Kup modelini temsil eden sınıf
    constructor(_options) {
        // Dosya Ayarları
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setModel()
    }

    setModel() {

        const baseScene = this.resources.items.kelebeklerVadisiModel?.scene; // kup yerine materialjs den gelen sahnenin ismi konulacak   
        if (!baseScene) {
            console.error('kup ajansı modeli yüklenemedi!'); //debug için isterseniz ismini değiştirebilirsiniz
            return;
        }
        let baseChildren = [];
        if (baseScene.children && baseScene.children.length > 0) {
            baseChildren = baseScene.children;
        } else {
            baseChildren = [baseScene];
        }
        // Calculate precise model bounds
        const bbox = new THREE.Box3().setFromObject(baseScene)
        const size = bbox.getSize(new THREE.Vector3())
        
        // Scale factor to match model size
        const scaleFactor = 1;

        // Create CANNON body (tek collision)
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ),
            material: this.physics.materials.items.floor
        })

        // Tek bir box collision (modelin tamamı için)
        const mainShape = new CANNON.Box(new CANNON.Vec3(
            Math.abs(size.x) * scaleFactor / 2,
            Math.abs(size.y) * scaleFactor / 2,
            Math.abs(size.z) * scaleFactor / 2
        ))
        body.addShape(mainShape)

        // Collision Eklemek İçin
        this.physics.world.addBody(body)

        // Modeli Ekliyoruz
        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ),
            mass: 0
        })

        this.model.base.collision = { body }

        this.container.add(this.model.base.container)

    }
    
    

   /*setKelebeklerVadisiArea() {
        const areaLabelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                color: 0xffffff,
                alphaMap: this.resources.items.areaEnterTexture,
            })
        )
        areaLabelMesh.position.set(posizyonX + 6, posizyonY, 0.5)
        areaLabelMesh.matrixAutoUpdate = false
        areaLabelMesh.updateMatrix()
        this.container.add(areaLabelMesh)

        this.kelebeklerVadisiArea = this.areas.add({
            position: new THREE.Vector2(posizyonX + 6, posizyonY),
            halfExtents: new THREE.Vector2(2, 2),
        })

        this.kelebeklerVadisiArea.on("interact", () => {
            const popupContainer = document.createElement("div")
            popupContainer.style.position = "fixed"
            popupContainer.style.top = "0"
            popupContainer.style.left = "0"
            popupContainer.style.width = "100%"
            popupContainer.style.height = "100%"
            popupContainer.style.display = "flex"
            popupContainer.style.justifyContent = "center"
            popupContainer.style.alignItems = "center"
            popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
            popupContainer.style.zIndex = "9999"

            const popupBox = document.createElement("div")
            popupBox.style.backgroundColor = "white"
            popupBox.style.color = "black"
            popupBox.style.padding = "30px 40px"
            popupBox.style.borderRadius = "8px"
            popupBox.style.minWidth = "350px"
            popupBox.style.maxWidth = "90%"
            popupBox.style.textAlign = "center"
            popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)"

            const titleEl = document.createElement("h2")
            titleEl.style.margin = "0 0 25px 0"
            titleEl.style.fontSize = "24px"
            titleEl.style.fontWeight = "bold"
            titleEl.textContent = "Kelebekler Vadisi"

            const descriptionEl = document.createElement("p")
            descriptionEl.textContent = "Kelebekler Vadisi hakkında daha fazla bilgi almak için tıklayın."
            descriptionEl.style.margin = "0 0 20px 0"

            const linkEl = document.createElement("a")
            linkEl.href = "https://www.kelebeklervadisi.com/"
            linkEl.textContent = "www.kelebeklervadisi.com"
            linkEl.target = "_blank"
            linkEl.style.display = "inline-block"
            linkEl.style.padding = "12px 25px"
            linkEl.style.backgroundColor = "#3498db"
            linkEl.style.color = "white"
            linkEl.style.textDecoration = "none"
            linkEl.style.borderRadius = "5px"
            linkEl.style.fontWeight = "bold"
            linkEl.style.margin = "15px 0"
            linkEl.style.transition = "background-color 0.3s"
            linkEl.addEventListener("mouseover", () => {
                linkEl.style.backgroundColor = "#2980b9"
            })
            linkEl.addEventListener("mouseout", () => {
                linkEl.style.backgroundColor = "#3498db"
            })

            const closeButton = document.createElement("button")
            closeButton.textContent = "Kapat"
            closeButton.style.padding = "10px 20px"
            closeButton.style.border = "none"
            closeButton.style.backgroundColor = "#e0e0e0"
            closeButton.style.color = "#333"
            closeButton.style.cursor = "pointer"
            closeButton.style.borderRadius = "5px"
            closeButton.style.fontSize = "14px"
            closeButton.style.marginTop = "20px"
            closeButton.addEventListener("click", () => {
                document.body.removeChild(popupContainer)
            })
            popupContainer.addEventListener("click", (event) => {
                if (event.target === popupContainer) {
                    document.body.removeChild(popupContainer)
                }
            })

            popupBox.appendChild(titleEl)
            popupBox.appendChild(descriptionEl)
            popupBox.appendChild(linkEl)
            popupBox.appendChild(closeButton)
            popupContainer.appendChild(popupBox)
            document.body.appendChild(popupContainer)

            if (this.sounds) {
                this.sounds.play("click")
            }
        })
    }*/


 
}


/* 

Resources.js de  { name: 'kup', source: './models/hubit/kup/base.glb' }, şeklinde eklenmeli

Index.js de this.setKup() şeklinde çağırılacak setKup yerine setAbc şeklinde de isimlendirebilirsiniz
Ayrıca
setKup() { //küpü değiştir
        this.kup = new Kup({ // Burada ödemli olan birinin küçük harf ile diğerinin ise büyük harf ile yazılması gerekiyor farklı şeyler
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            physics: this.physics,
            debug: this.debugFolder
        })
        this.container.add(this.kup.container) // Küçük harfle yazılmalı
    }
Bu şekilde index.js de çağırılmalı en son kısımda yazılabilir süslü parantezden önce
*/


/*import * as THREE from 'three'

export default class KelebeklerSection
{
    constructor(_options)
    {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.time = _options.time
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.areas = _options.areas
        this.sounds = _options.sounds

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('kelebeklerVadisi')
            this.debugFolder.open()
        }
        
        // Kelebekler Vadisi modelinin varlığını kontrol et
        if(this.resources.items.kelebeklerVadisiModel) {
            this.setModel()
        } else {
            console.error('HATA: Kelebekler Vadisi modeli (kelebeklerVadisiModel) resources içinde bulunamadı!')
        }
    }

    setModel()
    {
        this.model = {}
        
        // Resource
        this.model.resource = this.resources.items.kelebeklerVadisiModel
        
        // Model container
        this.model.container = new THREE.Object3D()
        this.model.container.matrixAutoUpdate = true
        this.container.add(this.model.container)

        // Ana modeli ekle
        try {
            if(this.model.resource && this.model.resource.scene) {
                // Model referansını küresel olarak kaydet
                const kelebeklerModel = this.model.resource.scene.clone()
                this.model.kelebeklerModel = kelebeklerModel;
                
                // Kelebekler Vadisi için konumu ayarla
                kelebeklerModel.position.set(70, -40, 0);
                
                // Tüm mesh'lerin materyallerini düzenle
                kelebeklerModel.traverse((child) => {
                    if (child.isMesh) {
                        // Orijinal materyali koruyoruz, yeni materyal ataması yapmıyoruz
                        // Sadece gölge ayarlarını yapıyoruz
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Eğer modelinizde materyal yoksa, varsayılan bir materyal atayabiliriz
                        if (!child.material) {
                            console.warn("Mesh üzerinde materyal bulunamadı, varsayılan materyal atanıyor");
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x3498db,
                                roughness: 0.3,
                                metalness: 0.5,
                                side: THREE.DoubleSide,
                                emissive: 0x111111,
                                wireframe: false
                            });
                        }
                    }
                })
                
                // İlk yerleştirdiğimiz modeli görünür yapma, direkt obje olarak ekle
                // this.model.container.add(kelebeklerModel)
                
                // Fizik özelliklerini ekle (sadece modeli ekle, area ekleme)
                const centerPosition = new THREE.Vector3(40, -35, -0.5);
                
                // Ana kelebekler vadisi nesnesini görünür yap
                this.kelebeklerObject = this.objects.add({
                    base: this.model.kelebeklerModel, // model.resource.scene yerine klonlanan modeli kullan
                    // collision parametresi kaldırıldı
                    offset: centerPosition,
                    rotation: new THREE.Euler(0, 0, 0),
                    shadow: { sizeX: 4, sizeY: 4, offsetZ: -0.6, alpha: 0.4 },
                    mass: 0,
                    sleep: true
                });
                
                console.log("Kelebekler Vadisi modeli başarıyla eklendi");

                // Etkileşimli alan oluştur (Kapsul binasındakine benzer)
                this.createInteractiveArea();
            }
        } catch (error) {
            console.error('HATA: Kelebekler Vadisi modeli eklenirken bir hata oluştu:', error)
        }
        
        // Debug paneli
        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('position')
            folder.add(this.model.container.position, 'x').step(0.1).name('positionX')
            folder.add(this.model.container.position, 'y').step(0.1).name('positionY')
            folder.add(this.model.container.position, 'z').step(0.1).name('positionZ')
            
            const scaleFolder = this.debugFolder.addFolder('scale')
            scaleFolder.add(this.model.container.scale, 'x').min(0.1).max(5).step(0.1).name('scaleX')
            scaleFolder.add(this.model.container.scale, 'y').min(0.1).max(5).step(0.1).name('scaleY')
            scaleFolder.add(this.model.container.scale, 'z').min(0.1).max(5).step(0.1).name('scaleZ')
            
            const rotationFolder = this.debugFolder.addFolder('rotation')
            rotationFolder.add(this.model.container.rotation, 'x').step(0.1).name('rotationX')
            rotationFolder.add(this.model.container.rotation, 'y').step(0.1).name('rotationY')
            rotationFolder.add(this.model.container.rotation, 'z').step(0.1).name('rotationZ')
        }
    }

    createInteractiveArea() {
        try {
            // Etkileşim etiketi oluştur
            const areaLabelMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.5),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    depthWrite: false,
                    color: 0xffffff,
                    alphaMap: this.resources.items.areaResetTexture,
                })
            );
            
            // Etiketin konumunu ayarla (modelin Y ekseninde -2 biriminde)
            const areaX = posizyonX + 6; // 6 birim sağa
            const areaY = posizyonY;
            areaLabelMesh.position.set(areaX, areaY, 0.5);
            areaLabelMesh.matrixAutoUpdate = false;
            areaLabelMesh.updateMatrix();
            this.container.add(areaLabelMesh);

            // Etkileşim alanı oluştur
            this.kelebeklerArea = this.areas.add({
                position: new THREE.Vector2(areaX, areaY),
                halfExtents: new THREE.Vector2(2, 2),
            });

            // Etkileşim fonksiyonunu tanımla
            this.kelebeklerArea.on("interact", () => {
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
                titleEl.textContent = "Kelebekler Vadisi";

                // Açıklama metni
                const descriptionEl = document.createElement("p");
                descriptionEl.textContent = "Kelebekler Vadisi, doğanın ve vahşi yaşamın korunduğu, onlarca kelebek türüne ev sahipliği yapan eşsiz bir doğa harikasıdır.";
                descriptionEl.style.margin = "0 0 20px 0";

                // Link oluştur
                const linkEl = document.createElement("a");
                linkEl.href = "https://konyatropikalkelebekbahcesi.com/tr";
                linkEl.textContent = "Kelebekler Vadisi'ni Ziyaret Et";
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
            
            console.log("Kelebekler Vadisi etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Kelebekler Vadisi etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
} */

