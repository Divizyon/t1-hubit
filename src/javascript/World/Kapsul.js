import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

export default class Kapsul {
    constructor(_options) {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.areas = _options.areas
        this.sounds = _options.sounds
        this.physics = _options.physics

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
        
        if (this.time) {
            this.time.on('tick', () => {
                this.tick(this.time.delta * 0.001)
            })
        }
    }

    setModel() {
        // Use the resource system instead of direct loading
        if (!this.resources.items.kapsulModel) {
            console.error('Kapsul model resource not found in resources')
            return
        }

        // Kapsül konumu
        this.kapsul = {}
        this.kapsul.x = 37
        this.kapsul.y = -1
        this.kapsul.z = 2.6

        // Clone the original model to avoid modifying it
        const clonedModel = this.resources.items.kapsulModel.scene.clone()
        
        // Process all meshes in the model
        clonedModel.traverse((child) => {
            if (child.isMesh) {
                // Ensure each mesh's material is cloned
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone())
                    } else {
                        child.material = child.material.clone()
                    }
                }
                // Set shadow properties
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        // Add the model to the scene using the objects system (like other models)
        this.model = this.objects.add({
            base: clonedModel,
            offset: new THREE.Vector3(this.kapsul.x, this.kapsul.y, this.kapsul.z), // Position from the original manual setting
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            preserveMaterials: true,
        })
        
        // Add to container
        this.container.add(this.model.container)
        
        // Add base model if available (similar to other implementations)
        if (this.resources.items.baseModel && this.resources.items.baseModel.scene) {
            const baseModel = this.resources.items.baseModel.scene.clone()
            baseModel.position.set(this.kapsul.x + 1, this.kapsul.y, 0)
            baseModel.scale.set(1.5, 1.5, 0.5)
            this.container.add(baseModel)
            console.log("Base model added to Kapsul")
        } else {
            console.warn("Base model not found for Kapsul")
        }

        // Çarpışma kutusunu ekle 
        this.addCollisions()

        // Add interaction area (from the previous setKapsulArea functionality)
        if (this.areas) {
            this.areas.add({
                position: new THREE.Vector2(this.kapsul.x -7, this.kapsul.y),
                halfExtents: new THREE.Vector2(3, 3),
                hasKey: false,
                testCar: true,
                active: true,
                informations: {
                    title: 'Kapsül Teknoloji Merkezi',
                    description: 'Bu merkez, teknoloji ve inovasyonu teşvik etmek amacıyla kurulmuştur.',
                    moreInformation: 'https://www.konya.bel.tr'
                }
            })
            console.log("Kapsul interaction area added")
        }
        
        // Add spatial sound if needed
        if (this.sounds) {
            this.sounds.play("kapsul", {
                position: new THREE.Vector3(this.kapsul.x , this.kapsul.y, 0),
                maxDistance: 20,
                refDistance: 5,
                rolloffFactor: 1.2,
                volume: 0.7,
                loop: true
            })
        }

        // Debug kontrollerini ekle
        if (this.debug) {
            const kapsulFolder = this.debug.addFolder('kapsul')
            
            // Kapsül pozisyon kontrolü
            const modelFolder = kapsulFolder.addFolder('model position')
            modelFolder.add(this.kapsul, 'x').step(0.1).name('modelX').onChange(() => {
                this.updatePositions()
            })
            modelFolder.add(this.kapsul, 'y').step(0.1).name('modelY').onChange(() => {
                this.updatePositions()
            })
            modelFolder.add(this.kapsul, 'z').step(0.1).name('modelZ').onChange(() => {
                this.updatePositions()
            })
        }

        console.log("Kapsul model successfully added")
    }

    updatePositions() {
        // Model pozisyonunu güncelle
        if(this.model && this.model.container) {
            this.model.container.position.x = this.kapsul.x
            this.model.container.position.y = this.kapsul.y
            this.model.container.position.z = this.kapsul.z
            
            // Eğer çarpışma kutusu varsa, onun da pozisyonunu güncelle
            if(this.collisionBody) {
                this.collisionBody.position.x = this.kapsul.x+1
                this.collisionBody.position.y = this.kapsul.y
                this.collisionBody.position.z = 0 // Z konumu sabit kalabilir
            }
        }
    }

    addCollisions() {
        if(this.physics && this.physics.world) {
            // Kapsül için çarpışma kutusu oluştur
            const boxShape = new CANNON.Box(new CANNON.Vec3(4.3, 4, 2))
            
            this.collisionBody = new CANNON.Body({
                mass: 0, // Statik çarpışma kutusu
                position: new CANNON.Vec3(this.kapsul.x+1, this.kapsul.y, 0),
                material: this.physics.materials ? this.physics.materials.items.floor : null
            })
            
            this.collisionBody.addShape(boxShape)
            this.physics.world.addBody(this.collisionBody)
            
            console.log("Kapsul için collision kutusu eklendi:", this.collisionBody)
        } else {
            console.warn("Physics system not available for Kapsul collision")
        }
    }

    tick(delta) {
        // Update model animations or other time-based behaviors if needed
    }
}

/* 
Resource.js   { name: 'aladdinTepesi', source: './models/hubit/aladdinTepesi/base.glb' },
İndex Js
    setAladdinTepesi() {
        this.aladdinTepesi = new AladdinTepesi({
            scene: this.scene,
            time: this.time,
            physics: this.physics
        });
    }
this.setAladdinTepesi()
import AladdinTepesi from './Hubit/AlaaddinTepesi.js'
*/