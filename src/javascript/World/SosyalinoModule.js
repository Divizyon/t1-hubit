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
    this.container.updateMatrix()
    
    this.setupModel()
  }
  
  setupModel() {
    try {
      console.log("Sosyalino model yükleniyor...")
      
      // Clone the model scene to avoid modifying the original
      const sosyalinoScene = this.resources.items.Sosyalino.scene.clone()
      
      // Model pozisyonu
      const position = new THREE.Vector3(64, 22, 0)
      
      // Make sure all materials are preserved
      sosyalinoScene.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map(mat => mat.clone())
            } else {
              child.material = child.material.clone()
            }
            child.castShadow = true
            child.receiveShadow = true
          }
        }
      })
      
      // Modeli container'a ekle
      sosyalinoScene.position.copy(position)
      sosyalinoScene.rotation.set(Math.PI/2, Math.PI, 0)
      
      // Bounding box hesapla
      sosyalinoScene.updateMatrixWorld(true)
      const bbox = new THREE.Box3().setFromObject(sosyalinoScene)
      const size = bbox.getSize(new THREE.Vector3())
      
      // Fizik gövdesi oluştur
      const halfExtents = new CANNON.Vec3(size.x / 2.5, size.y / 2.5, size.z / 2)
      const boxShape = new CANNON.Box(halfExtents)
      
      const body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(position.x, position.y, position.z),
        material: this.physics.materials.items.floor
      })
      
      // Dönüşü quaternion olarak ayarla
      const quat = new CANNON.Quaternion()
      quat.setFromEuler(Math.PI/2, Math.PI, 0, 'XYZ')
      body.quaternion.copy(quat)
      
      body.addShape(boxShape)
      this.physics.world.addBody(body)
      
      // Add the model with preserved materials
      this.sosyalinoModel = this.objects.add({
        base: sosyalinoScene,
        offset: position,
        rotation: new THREE.Euler(Math.PI/2, Math.PI, 0),
        shadow: { sizeX: 6, sizeY: 6, offsetZ: -0.5, alpha: 0.5 },
        mass: 0,
        sleep: true,
        preserveMaterials: true // Malzemeleri koru
      })
      
      // Fizik gövdesini ekle
      this.sosyalinoModel.collision = { body }
      
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
}