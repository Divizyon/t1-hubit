import * as THREE from 'three'
import * as CANNON from 'cannon'

export default class sesOdasi {
    constructor(_options) {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.sounds = _options.sounds
        this.physics = _options.physics
        this.debug = _options.debug

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
    }

    setModel() {
        // First, clone the scene to avoid modifying the original
        const clonedScene = this.resources.items.sesOdasiModel.scene.clone()
        
        // Log the structure to help debug
        console.log("SesOdasi model structure:", clonedScene)
        
        // Make sure all child meshes have their materials preserved
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                // Ensure each mesh's material is cloned and preserved
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone())
                    } else {
                        child.material = child.material.clone()
                    }
                }
                // Make sure material is not overridden 
                if (child.userData) {
                    child.userData.preserveMaterial = true
                }
            }
        })

        // Model pozisyon ve rotasyonu
        const modelOffset = new THREE.Vector3(-62, -13, 0.2)
        const modelRotation = new THREE.Euler(0, 0, 90)
        
        this.model = this.objects.add({
            base: clonedScene,
            offset: modelOffset,
            rotation: modelRotation,
            shadow: { sizeX: 0, sizeY: 0, offsetZ: 0, alpha: 0.4 },
            mass: 0,
            sleep: true,
            preserveMaterials: true,
        })

        // Add to container
        this.container.add(this.model.container)

        // Bounding box hesapla
        clonedScene.updateMatrixWorld(true)
        const bbox = new THREE.Box3().setFromObject(clonedScene)
        const size = bbox.getSize(new THREE.Vector3())
        
        // Collision ekleme
        this.addCollisions(clonedScene, modelOffset, modelRotation, size)

        // Ses odası yanına uzamsal ses ekle
        if (this.sounds) {
            console.log("Ses odası için uzamsal ses ekleniyor...")
            
            // Uzamsal ses pozisyonunu modelin merkezine göre ayarla
            const soundPosition = {
                x: modelOffset.x + 3, // Model merkezinden biraz sağa
                y: modelOffset.y,
                z: modelOffset.z + 1, // Biraz yukarı
            }
            
            const sesOdasiSes = this.sounds.setSpatialSoundAtLocation({
                x: soundPosition.x,
                y: soundPosition.y,
                z: soundPosition.z,
                sound: "sesOdasi",
                customSoundPath: "./sounds/car-horns/duman.mp3",
                maxDistance: 15,
                refDistance: 4,
                rolloffFactor: 1.2,
                volume: 0.2,
                autoplay: true,
                loop: true,
            })
        }

        console.log("Ses odası başarıyla eklendi:", this.model)
    }

    addCollisions(model, modelOffset, modelRotation, modelSize) {
        // Bounding box'a dayalı olarak collision kutuları oluştur
        
        // Ana collision kutusu - modelin boyutuna göre ayarla
        const mainBoxWidth = modelSize.x * 0.8
        const mainBoxDepth = modelSize.y * 0.8
        const mainBoxHeight = modelSize.z

        // Modelin gerçek orta noktasını hesapla
        const centerPos = new THREE.Vector3(
            modelOffset.x,
            modelOffset.y,
            modelOffset.z + (mainBoxHeight / 2)
        )
        
        // Ana çarpışma kutusu
        this.addCollisionBox(
            centerPos,
            modelRotation,
            new CANNON.Vec3(mainBoxWidth/2, mainBoxDepth/2, mainBoxHeight/2)
        )
        
        // Modelin etrafında ek bir çarpışma kutusu (gerekiyorsa)
        const secondaryBoxPos = new THREE.Vector3(
            modelOffset.x - 3,
            modelOffset.y - 2,
            modelOffset.z + (mainBoxHeight / 2)
        )
        
        this.addCollisionBox(
            secondaryBoxPos,
            modelRotation,
            new CANNON.Vec3(2, 1, mainBoxHeight/2)
        )
    }
    
    addCollisionBox(position, rotation, halfExtents) {
        // Fizik gövdesi oluştur
        const boxShape = new CANNON.Box(halfExtents)

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        })

        // Dönüşü quaternion olarak ayarla
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ')
        body.quaternion.copy(quat)

        body.addShape(boxShape)
        this.physics.world.addBody(body)

        console.log("Ses odası için collision eklendi:", body)
        
        // Debug modda gösterim için
        if (this.debug && this.debug.active) {
            this.visualizeCollisionBox(position, rotation, halfExtents, 0x00ff00)
        }
    }
    
    visualizeCollisionBox(position, rotation, halfExtents, color) {
        // Çarpışma kutusunun görsel temsilini oluştur
        const geometry = new THREE.BoxGeometry(
            halfExtents.x * 2, 
            halfExtents.y * 2, 
            halfExtents.z * 2
        )
        
        // Yarı saydam malzeme 
        const material = new THREE.MeshBasicMaterial({ 
            color: color || 0x00ff00,
            transparent: true, 
            opacity: 0.3,    
            wireframe: true,
            wireframeLinewidth: 2
        })
        
        const collisionMesh = new THREE.Mesh(geometry, material)
        
        // Pozisyonu ve rotasyonu ayarla
        collisionMesh.position.copy(position)
        collisionMesh.rotation.copy(rotation)
        
        // Sahneye ekle
        this.container.add(collisionMesh)
        
        console.log("Çarpışma kutusu görselleştirildi:", collisionMesh)
    }
} 