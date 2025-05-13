import * as THREE from 'three'

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
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(-65, -15, 0.5), // Z coordinate above the plane
            rotation: new THREE.Euler(0, 0, 90),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true,
            preserveMaterials: true,
        })

        // Add to container
        this.container.add(this.model.container)

        // Ses odası yanına uzamsal ses ekle
        if (this.sounds) {
            console.log("Ses odası için uzamsal ses ekleniyor...")
            const sesOdasiSes = this.sounds.setSpatialSoundAtLocation({
                x: -62,
                y: 30,
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
} 