import * as THREE from 'three'

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
    this.setBilimMerkeziArea()
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
