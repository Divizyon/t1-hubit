import * as THREE from 'three'

export default class Sosyalino {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    this.areas = _options.areas // Etkileşim alanları için areas objesini ekledim
    
    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false
    
    this.setSosyalino()
    
    // Etkileşim alanını ayarla (areas parametresi varsa)
    if (this.areas) {
      this.setSosyalinoInteraction()
    }
  }
  
  setSosyalino() {
    this.model = this.objects.add({
      base: this.resources.items.Sosyalino.scene,
      collision: { children: [] }, // Boş collision nesnesi tanımlandı, içinden geçilebilmesi için
      offset: new THREE.Vector3(82, 50, 0),
      rotation: new THREE.Euler(Math.PI/2, Math.PI, 0),
      shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
      mass: 0,
      soundName: 'brick',
      sleep: false
    })
    
    // Container'a ekle
    if (this.model && this.model.container) {
      this.container.add(this.model.container)
    }
  }
  
  // Sosyalino için etkileşim butonu ve alanı oluştur
  setSosyalinoInteraction() {
    try {
      if (!this.areas) {
        console.error("Sosyalino etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
        return;
      }

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
      areaLabelMesh.position.set(78, 50, 5); // Modelin önüne konumlandırdım
      areaLabelMesh.matrixAutoUpdate = false;
      areaLabelMesh.updateMatrix();
      this.container.add(areaLabelMesh);

      // Etkileşim alanı oluştur
      this.sosyalinoArea = this.areas.add({
        position: new THREE.Vector2(78, 50), // Aynı koordinatlar
        halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
      });

      // Etkileşim fonksiyonunu tanımla
      this.sosyalinoArea.on("interact", () => {
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
        titleEl.textContent = "Sosyal İnovasyon Ajansı";

        // Link oluştur
        const linkEl = document.createElement("a");
        linkEl.href = "https://www.sosyalinovasyonajansi.com/";
        linkEl.textContent = "www.sosyalinovasyonajansi.com";
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
        descriptionEl.textContent = "Sosyal İnovasyon Ajansı hakkında daha fazla bilgi almak için tıklayın.";
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
      
      console.log("Sosyalino etkileşim alanı başarıyla eklendi");
    } catch (error) {
      console.error("Sosyalino etkileşim alanı eklenirken hata oluştu:", error);
    }
  }
} 