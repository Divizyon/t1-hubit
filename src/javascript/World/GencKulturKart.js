import * as THREE from 'three'

export default class GencKulturKart {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    this.areas = _options.areas
    
    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = true
    
    // Modeli ekle
    this.setModel()
    this.setGencKulturKartArea()
  }
  
  setModel() {
    this.model = {}
    this.model.resource = this.resources.items.gencKulturKartModel
    this.model.container = new THREE.Object3D()
    this.model.container.matrixAutoUpdate = true
    this.container.add(this.model.container)

    try {
      if (this.model.resource && this.model.resource.scene) {
        // Modeli klonla ve konumlandır
        const gencKulturKartModel = this.model.resource.scene.clone()
        this.model.gencKulturKartModel = gencKulturKartModel
        gencKulturKartModel.position.set(-15, 35, 0)
        gencKulturKartModel.rotation.set(0, 0, 90)
        gencKulturKartModel.visible = true
        gencKulturKartModel.scale.set(1, 1, 1)

        // Modeli zemine oturt
        const box = new THREE.Box3().setFromObject(gencKulturKartModel);
        if (box.min.z !== 0) {
          gencKulturKartModel.position.z -= box.min.z;
        }
        

        // Tüm mesh'lerin materyallerini override etme, sadece gölge ayarlarını yap
        gencKulturKartModel.traverse((child) => {
          if (child.isMesh) {
            child.visible = true
            child.castShadow = true
            child.receiveShadow = true
            // Materyali varsa dokunma, yoksa varsayılan ata
            /*if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0xcccccc,
                roughness: 0.5,
                metalness: 0.2,
                side: THREE.DoubleSide,
                emissive: 0x111111,
                wireframe: false
              })
            } else {
              child.material.side = THREE.DoubleSide
              child.material.transparent = false
              child.material.opacity = 1.0
              child.material.needsUpdate = true
            }*/
          }
        })

        // Modeli ekle
        this.model.container.add(gencKulturKartModel)

        // Eğer modelin birden fazla parçası varsa hepsini ekle
        if (gencKulturKartModel.children && gencKulturKartModel.children.length > 1) {
          gencKulturKartModel.children.forEach((child) => {
            if (child.isMesh || child.type === 'Group') {
              child.visible = true
            }
          })
        }

        // Physics veya objects.add ile de eklemek istersen buraya ekleyebilirsin
      } else {
        // Scene yoksa doğrudan modeli ekle
        const gencKulturKartModel = this.model.resource
        this.model.gencKulturKartModel = gencKulturKartModel
        gencKulturKartModel.position.set(-15, 35, 0)
        gencKulturKartModel.rotation.set(0, 0, 0)
        gencKulturKartModel.visible = true
        gencKulturKartModel.scale.set(1, 1, 1)
        this.model.container.add(gencKulturKartModel)
      }
    } catch (error) {
      console.error('HATA: Genç Kültür Kart modeli eklenirken bir hata oluştu:', error)
    }
  }

  setGencKulturKartArea() {
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
    areaLabelMesh.position.set(-12, 30, 0); // Modelin üzerinde
    areaLabelMesh.matrixAutoUpdate = false;
    areaLabelMesh.updateMatrix();
    this.container.add(areaLabelMesh);

    // Etkileşim alanı oluştur
    this.gencKulturKartArea = this.areas.add({
      position: new THREE.Vector2(-12, 30),
      halfExtents: new THREE.Vector2(2, 2),
    });

    // Etkileşim fonksiyonu
    this.gencKulturKartArea.on("interact", () => {
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
      titleEl.textContent = "Genç Kültür Kart";

      // Açıklama metni
      const descriptionEl = document.createElement("p");
      descriptionEl.textContent = "Genç Kültür Kart hakkında daha fazla bilgi almak için tıklayın.";
      descriptionEl.style.margin = "0 0 20px 0";

      // Link oluştur
      const linkEl = document.createElement("a");
      linkEl.href = "https://www.genckulturkart.com/";
      linkEl.textContent = "www.genckulturkart.com";
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
