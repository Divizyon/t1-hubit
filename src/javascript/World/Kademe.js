import * as THREE from 'three'
import CANNON from 'cannon'

export default class Kademe {
    constructor({ scene, resources, objects, physics, debug }) {
        this.scene = scene
        this.resources = resources
        this.objects = objects
        this.physics = physics
        this.debug = debug

        // Container
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        // Model pozisyonu
        this.position = new THREE.Vector3(-22, -6, 0)

        this._setModel()
        this._setPhysics()

        // Debug için pozisyon kontrolü ekleyelim
        if (this.debug) {
            const debugFolder = this.debug.addFolder('Kademe Position')
            debugFolder.add(this.position, 'x').min(-50).max(50).step(1).onChange(() => {
                this.updatePosition()
            })
            debugFolder.add(this.position, 'y').min(-50).max(50).step(1).onChange(() => {
                this.updatePosition()
            })
            debugFolder.add(this.position, 'z').min(-50).max(50).step(1).onChange(() => {
                this.updatePosition()
            })
        }
    }

    _setPhysics() {
        if (!this.physics) return

        // Fizik gövdesi oluştur
        const shape = new CANNON.Box(new CANNON.Vec3(2, 2, 2))
        this.body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(this.position.x, this.position.y, this.position.z),
            shape: shape,
            material: this.physics.materials.items.floor
        })

        // Rotasyonu sabitle
        this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), 0)
        this.body.fixedRotation = true

        // Fizik dünyasına ekle
        this.physics.world.addBody(this.body)
    }

    updatePosition() {
        if (this.modelScene) {
            this.modelScene.position.copy(this.position)
            if (this.body) {
                this.body.position.x = this.position.x
                this.body.position.y = this.position.y
                this.body.position.z = this.position.z
            }
            this.container.updateMatrix()
        }
    }

    _setModel() {
        try {
            // Model yükleme
            const model = this.resources.items.kademe
            if (!model) {
                console.error('Kademe modeli bulunamadı!')
                return
            }

            // Modeli klonla
            this.modelScene = model.scene.clone()

            // Pozisyon ve rotasyon ayarları
            this.modelScene.position.copy(this.position)
            this.modelScene.rotation.set(0, 0, 0)

            // Materyal ve gölge ayarları
            this.modelScene.traverse((child) => {
                if (child.isMesh) {
                    // Orijinal materyali kopyala
                    const material = child.material.clone()

                    // Materyal özelliklerini ayarla
                    material.side = THREE.DoubleSide
                    material.shadowSide = THREE.DoubleSide
                    material.needsUpdate = true

                    // Yeni materyali uygula
                    child.material = material

                    // Gölge ayarları
                    child.castShadow = true
                    child.receiveShadow = true

                    // Mesh'i statik yap
                    child.matrixAutoUpdate = false
                    child.updateMatrix()
                }
            })

            // Container'a ekle
            this.container.add(this.modelScene)
            this.container.updateMatrix()

            console.log('Kademe modeli başarıyla yüklendi')

        } catch (error) {
            console.error('Kademe modeli yüklenirken hata:', error)
        }
    }
} 