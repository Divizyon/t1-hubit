import * as THREE from "three";

export default class FutbolKaleSection {
  constructor(_options) {
    // Options
    this.config = _options.config;
    this.time = _options.time;
    this.resources = _options.resources;
    this.objects = _options.objects;
    this.areas = _options.areas;
    this.debug = _options.debug;

    // Set up
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;
    this.container.updateMatrix();

    this.setFutbolKale();
  }

  setFutbolKale() {
    // Kale modelini yükle
    this.futbolKale = {};
    
    // Resources'da bu modelin olduğundan emin olalım
    if (this.resources.items.kale) {
      this.futbolKale.model = this.resources.items.kale.scene.clone();
      
      // Modeli belirtilen konuma yerleştir: -25, -45, 0
      this.futbolKale.model.position.set(-15, -40, 0);
      
      // Model boyutunu ayarla (gerekirse)
      // this.futbolKale.model.scale.set(1, 1, 1);
      
      // Modeli rotasyonunu ayarla (gerekirse)
      // this.futbolKale.model.rotation.set(0, 0, 0);
      
      // Modelin matris güncellemesini kapat ve değişiklikleri uygula
      this.futbolKale.model.matrixAutoUpdate = false;
      this.futbolKale.model.updateMatrix();
      
      // Modeli konteynere ekle
      this.container.add(this.futbolKale.model);
      
      console.log("Futbol kalesi başarıyla eklendi");
    } else {
      console.warn("Futbol kalesi modeli bulunamadı");
    }
  }
} 