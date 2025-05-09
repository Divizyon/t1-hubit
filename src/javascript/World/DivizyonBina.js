import * as THREE from 'three'

export default class DiviziyonBinaModule {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    
    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false
    
    this.setDiviziyonBina()
  }
  
  setDiviziyonBina() {
    // Modelin varlığını kontrol et
    if (!this.resources.items.DiviziyonModel) {
      console.error('HATA: DiviziyonModel modeli kaynaklar içinde bulunamadı!', this.resources.items);
      return;
    }
    
    this.model = this.objects.add({
      base: this.resources.items.DiviziyonModel.scene,
      collision: { children: [] }, // Boş collision nesnesi tanımlandı, içinden geçilebilmesi için
      offset: new THREE.Vector3(-55, 40, 0), // Ses odasının yakınına yerleştirme (-62, 30 ses odası konumu)
      rotation: new THREE.Euler(0, 0, 0), // Düz duracak şekilde rotasyonu sıfırla
      scale: new THREE.Vector3(2, 2, 2), // Modeli 2 kat büyüt
      shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
      mass: 0,
      soundName: 'brick',
      sleep: true
    })
    
    // Tüm mesh'lerin materyallerini düzenle
    if(this.model && this.model.container) {
      // Model kapsayıcısını döndür
      this.model.container.rotation.set(-Math.PI/2, 0, 0); // X ekseninde -90 derece çevir (dik durması için)
      this.model.container.position.y += 1; // Biraz yukarı kaldır
      
      this.model.container.traverse((child) => {
        if (child.isMesh) {
          // Gölge ayarları
          child.castShadow = true
          child.receiveShadow = true
          
          // Orijinal materyalleri koruyalım
          if (child.material) {
            // Sadece materyal özelliklerini iyileştirelim
            child.material.needsUpdate = true
            child.material.side = THREE.DoubleSide
            
            // Eğer mavi renkli shade varsa onu canlandıralım
            if(child.name.includes('shadeBlue') || child.material.name.includes('blue')) {
              child.material.emissive = new THREE.Color(0x111155)
              child.material.emissiveIntensity = 0.5
            }
          }
        }
      })
      
      // Container'a ekle
      this.container.add(this.model.container)
    }
  }
}