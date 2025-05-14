import * as THREE from 'three'

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
    this.container.updateMatrix()
    
    this.setupModel()
    
    // Etkileşim alanını ayarla (areas parametresi varsa)
    if (this.areas) {
      this.setSosyalinoInteraction()
    }
  }
  
  setupModel() {
    try {
      console.log("Sosyalino model yükleniyor...")
      
      // Clone the model scene to avoid modifying the original
      const sosyalinoScene = this.resources.items.Sosyalino.scene.clone()
      
      // Make sure all materials are preserved
      sosyalinoScene.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => mat.clone())
            } else {
              child.material = child.material.clone()
            }
          }
        }
      })
      
      // Add the model with preserved materials
      this.sosyalinoModel = this.objects.add({
        base: sosyalinoScene,
        collision: this.resources.items.brickCollision.scene,
        offset: new THREE.Vector3(67.58, 29.55, 0.00), // Z-değeri yerden biraz yukarıda
        offset: new THREE.Vector3(15, 15, 0.5), // Z-değeri yerden biraz yukarıda
        rotation: new THREE.Euler(Math.PI/2, Math.PI, 0),
        shadow: { sizeX: 6, sizeY: 6, offsetZ: -0.5, alpha: 0.5 },
        mass: 0,
        sleep: true,
        preserveMaterials: true // Malzemeleri koru
      })
      
      // Add to container
      if (this.sosyalinoModel && this.sosyalinoModel.container) {
        this.container.add(this.sosyalinoModel.container)
        console.log("Sosyalino modeli başarıyla eklendi")
      } else {
        console.warn("Sosyalino modeli container bulunamadı!")
      }
      
    } catch (error) {
      console.error("Sosyalino modeli yüklenirken hata:", error)
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
        position: new THREE.Vector2(68, 23), // Sosyalino konumu
        halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
      });

      // Etkileşim fonksiyonunu tanımla - PopupModule tarafından yönetilecek
      this.sosyalinoArea.on("interact", () => {
        // PopupModule tarafından yönetileceği için buradaki popup kodu kaldırıldı
        console.log("Sosyalino etkileşimi: PopUpModule tarafından yönetilecek");
        
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