import * as THREE from 'three'
import CANNON from 'cannon'

export default class Sosyalino {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    this.areas = _options.areas // Etkileşim alanları için areas objesi ekledim
    this.physics = _options.physics // Fizik motoru için physics eklendi
    this.time = _options.time // Time nesnesi eklendi
    
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
    // Ana modeli oluştur, şimdilik collision yok
    this.model = this.objects.add({
      base: this.resources.items.Sosyalino.scene,
      offset: new THREE.Vector3(62, 23, 1.5),
      rotation: new THREE.Euler(Math.PI/2, Math.PI, 0),
      shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
      mass: 0, // Kütle sıfır olabilir çünkü modelin hareketi fizik nesnesi ile kontrol edilecek
      soundName: 'brick',
      sleep: false
    })
    
    // Container'a ekle
    if (this.model && this.model.container) {
      this.container.add(this.model.container)
    }
    
    // Sosyalino için 4x4x4'lük collision küpünü oluştur
    this.createCollisionBox()
  }
  
  // Yeni bir metot: 4x4x4 boyutlarında bir collision küpü oluştur
  createCollisionBox() {
    // Modelin konumu
    const position = new THREE.Vector3(62, 23, 0)
    
    // Collision için küp boyutları (4x4x4)
    const halfExtents = new CANNON.Vec3(1.5, 1.5, 1.5) // halfExtents olduğu için boyutların yarısı
    
    // Küp için şekil oluştur
    const boxShape = new CANNON.Box(halfExtents)
    
    // Fizik gövdesi oluştur
    const boxBody = new CANNON.Body({
      mass: 0, // Kütle 0 olarak ayarlandı - statik nesne olacak
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: boxShape,
      material: this.physics ? this.physics.materials.items.dummy : undefined
    })
    
    // Modele uygun rotasyon uygula
    const rotationQuaternion = new CANNON.Quaternion()
    rotationQuaternion.setFromEuler(Math.PI/2, Math.PI, 0)
    boxBody.quaternion = boxBody.quaternion.mult(rotationQuaternion)
    
    const base = this.resources.items.baseModel;
    if (!base || !base.scene) {
      console.error('Stadyum modeli bulunamadı');
      return;
    }

    // Fizik motoruna ekle
    if (this.physics && this.physics.world) {
      this.physics.world.addBody(boxBody)
      
      // Fizik gövdesini modele bağla (model fizik gövdesini takip etsin)
      this.time.on('tick', () => {
        if (this.model && this.model.container) {
          this.model.container.position.copy(boxBody.position)
          this.model.container.quaternion.copy(boxBody.quaternion)
        }
      })
      
      // Collision gövdesini kaydet
      this.collisionBody = boxBody
      
      // Collision gövdesi için ses olayı ekle
      if (this.sounds) {
        this.collisionBody.addEventListener('collide', (_event) => {
          const relativeVelocity = _event.contact.getImpactVelocityAlongNormal()
          this.sounds.play('brick', relativeVelocity)
        })
      }
      // Base modelini klonla ve Kapsül modeline ekle
    const baseModel = base.scene.clone(true);
    baseModel.position.set(62, 23, 0); // Base modelinin Kapsül altına yerleştirilmesi için pozisyon ayarı
    baseModel.scale.set(1, 1, 1.5); // Base modelinin ölçeği
    this.container.add(baseModel);
      // Debug görsel (opsiyonel)
      if (this.physics.models && this.physics.models.container) {
        const boxGeometry = new THREE.BoxGeometry(4, 4, 4)
        const boxMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
          wireframe: true,
          transparent: true,
          opacity: 0.5
        })
        
        this.collisionMesh = new THREE.Mesh(boxGeometry, boxMaterial)
        this.collisionMesh.position.copy(position)
        this.collisionMesh.quaternion.copy(this.model.container.quaternion)
        
        // Debug görselinin görünürlüğünü fizik modelleriyle sync et
        this.physics.models.container.add(this.collisionMesh)
        
        // Tick ile pozisyon güncelleme
        this.time.on('tick', () => {
          this.collisionMesh.position.copy(boxBody.position)
          this.collisionMesh.quaternion.set(
            boxBody.quaternion.x,
            boxBody.quaternion.y,
            boxBody.quaternion.z,
            boxBody.quaternion.w
          )
        })
      }
    } else {
      console.error("Fizik motoru bulunamadı, collision box oluşturulamadı!")
    }
  }
  


  // Sosyalino için etkileşim butonu ve alanı oluştur
  setSosyalinoInteraction() {
    try {
      if (!this.areas) {
        console.error("Sosyalino etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
        return;
      }

      // Etkileşim alanı oluştur
      this.sosyalinoArea = this.areas.add({
        position: new THREE.Vector2(68, 23), // Aynı koordinatlar
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