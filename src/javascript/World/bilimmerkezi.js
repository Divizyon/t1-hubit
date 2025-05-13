import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 25  // Model konumları
let posizyonY = 30
let posizyonZ = 0


export default class bilimmerkezi  { // Kup modelini temsil eden sınıf
    constructor(_options) {
        // Dosya Ayarları
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.areas = _options.areas

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
        this.setBilimMerkeziArea()
    }

    setModel() {
        const baseScene = this.resources.items.bilimmerkezi?.scene;
        if (!baseScene) {
            console.error('Bilim Merkezi modeli yüklenemedi!');
            return;
        }

        // Clone the model scene to avoid modifying the original
        const clonedScene = baseScene.clone();
        
        // Make sure all materials are preserved
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone());
                    } else {
                        child.material = child.material.clone();
                    }
                }
            }
        });
        
        let baseChildren = [];
        if (clonedScene.children && clonedScene.children.length > 0) {
            baseChildren = clonedScene.children;
        } else {
            baseChildren = [clonedScene];
        }
        
        // Calculate precise model bounds
        const bbox = new THREE.Box3().setFromObject(clonedScene)
        const size = bbox.getSize(new THREE.Vector3())
        
        // Scale factor to match model size
        const scaleFactor = 1;

        // Create CANNON body (tek collision)
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX+2, posizyonY-2, posizyonZ),
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
            rotation: new THREE.Euler(Math.PI/20, Math.PI, Math.PI),
            mass: 0,
            preserveMaterials: true // Malzemeleri koru
        })

        this.model.base.collision = { body }

        this.container.add(this.model.base.container)
        console.log("Bilim Merkezi modeli başarıyla eklendi");
    }
    setBilimMerkeziArea() {
      // Etkileşim etiketi oluştur
      const areaLabelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 0.5),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          color: 0xffffff,
          alphaMap: this.resources.items.areaEnterTexture,
        })
      );
      // ENTER yazısını butonla aynı hizaya getir, sadece biraz yukarıda olsun (37.5, 23)
      areaLabelMesh.position.set(27.6, 23, 0);
      areaLabelMesh.matrixAutoUpdate = false;
      areaLabelMesh.updateMatrix();
      this.container.add(areaLabelMesh);
  
      // Etkileşim alanı oluştur
      this.bilimMerkeziArea = this.areas.add({
        position: new THREE.Vector2(27.3, 23),
        halfExtents: new THREE.Vector2(2, 2),
      });
  
      // Etkileşim fonksiyonu
      this.bilimMerkeziArea.on("interact", () => {
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
        titleEl.textContent = "Bilim Merkezi";
  
        // Açıklama metni
        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = "Bilim Merkezi hakkında daha fazla bilgi almak için tıklayın.";
        descriptionEl.style.margin = "0 0 20px 0";
  
        // Link oluştur
        const linkEl = document.createElement("a");
        linkEl.href = "https://www.bilimmerkezi.org.tr/";
        linkEl.textContent = "www.bilimmerkezi.org.tr";
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
        closeButton.addEventListener("click", () => {
          document.body.removeChild(popupContainer);
        });
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
    }

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

export default class bilimmerkezi {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    this.areas = _options.areas

    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false

    this.setbilimmerkezi()
    
  }

  setbilimmerkezi() {
    this.model = this.objects.add({
      base: this.resources.items.bilimmerkezi.scene,
      collision: { children: [] },
      offset: new THREE.Vector3(10, 18, -3),
      rotation: new THREE.Euler(Math.PI / 20, Math.PI, Math.PI),
      shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
      mass: 0,
      soundName: 'brick',
      sleep: false
    })
    if (this.model && this.model.container) {
      this.container.add(this.model.container)
    }
  }

  setBilimMerkeziArea() {
    // Etkileşim etiketi oluştur
    const areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        alphaMap: this.resources.items.areaEnterTexture,
      })
    );
    areaLabelMesh.position.set(2, -17, 0); // Bilim Merkezi yakınında
    areaLabelMesh.matrixAutoUpdate = false;
    areaLabelMesh.updateMatrix();
    this.container.add(areaLabelMesh);

    // Etkileşim alanı oluştur
    this.bilimMerkeziArea = this.areas.add({
      position: new THREE.Vector2(2, -17),
      halfExtents: new THREE.Vector2(2, 2),
    });

    // Etkileşim fonksiyonu
    this.bilimMerkeziArea.on("interact", () => {
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
      titleEl.textContent = "Bilim Merkezi";

      // Açıklama metni
      const descriptionEl = document.createElement("p");
      descriptionEl.textContent = "Bilim Merkezi hakkında daha fazla bilgi almak için tıklayın.";
      descriptionEl.style.margin = "0 0 20px 0";

      // Link oluştur
      const linkEl = document.createElement("a");
      linkEl.href = "https://www.bilimmerkezi.org.tr/";
      linkEl.textContent = "www.bilimmerkezi.org.tr";
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
      closeButton.addEventListener("click", () => {
        document.body.removeChild(popupContainer);
      });
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
  }
}
*/