import * as THREE from 'three'

export default class roketplatformu {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    
    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false
    
    this.setroketplatformu()
  }
  
  setroketplatformu() {
    this.model = this.objects.add({
      base: this.resources.items.roketplatform.scene,
      collision: { children: [] }, // Boş collision nesnesi tanımlandı, içinden geçilebilmesi için
      offset: new THREE.Vector3(19, 15, 0),
      rotation: new THREE.Euler(0, 0, 0),
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
} 