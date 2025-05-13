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
        
        this.model = this.objects.add({
            base: clonedScene,
            offset: new THREE.Vector3(-65, -15, 0.5), // Z coordinate above the plane
            rotation: new THREE.Euler(0, 0, 90),
            shadow: { sizeX: 0, sizeY: 0, offsetZ: 0, alpha: 0.4 },
            mass: 0,
            sleep: true,
            preserveMaterials: true,
        })

        // Add to container
        this.container.add(this.model.container)

        // Collision ekleme
        this.addCollisions(clonedScene)

        // Ses odası yanına uzamsal ses ekle
        if (this.sounds) {
            console.log("Ses odası için uzamsal ses ekleniyor...")
            const sesOdasiSes = this.sounds.setSpatialSoundAtLocation({
                x: -62,
                y: -15,
                z: 1.5,
                sound: "sesOdasi",
                customSoundPath: "./sounds/car-horns/duman.mp3",
                maxDistance: 30,
                refDistance: 8,
                rolloffFactor: 1.2,
                volume: 1.0,
                autoplay: true,
                loop: true,
            })
        }

        console.log("Ses odası başarıyla eklendi:", this.model)
    }

    addCollisions(model) {
        // Bounding box hesapla
        model.updateMatrixWorld(true)
        const bbox = new THREE.Box3().setFromObject(model)
        const size = bbox.getSize(new THREE.Vector3())
        
        // İlk çarpışma kutusu
        this.addCollisionBox(
            new THREE.Vector3(-67.5, -14, 0.5),
            new THREE.Euler(0, 0, 90),
            new CANNON.Vec3(2, 3.2, 2),
            
        )
        
        // İkinci çarpışma kutusu
        this.addCollisionBox(
            new THREE.Vector3(-68, -17, 0.5),  // Farklı konum
            new THREE.Euler(0, 0, 90),
            new CANNON.Vec3(3, 1, 1.5),  // Farklı boyut
            
        )
    }
    
    addCollisionBox(position, rotation, halfExtents, color) {
        // Fizik gövdesi oluştur
        const boxShape = new CANNON.Box(halfExtents)

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y-1, position.z),
            material: this.physics.materials.items.floor
        })

        // Dönüşü quaternion olarak ayarla
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ')
        body.quaternion.copy(quat)

        body.addShape(boxShape)
        this.physics.world.addBody(body)

        console.log("Ses odası için collision eklendi:", body)
        
        
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
            color: color,  // Parametre olarak gelen renk
            transparent: true, 
            opacity: 1,    
            wireframe: true,  // Tel kafes görünümü
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