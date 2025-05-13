import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import CANNON from 'cannon'

export default class Kapsul {
    constructor(_options) {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.areas = _options.areas
        this.sounds = _options.sounds

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
            collision: this.resources.items.brickCollision ? this.resources.items.brickCollision.scene : null,
            offset: new THREE.Vector3(36.5, -1, 4.5), // Position from the original manual setting
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true,
            preserveMaterials: true,
        })
        
        // Create a static body manually since addStaticBody isn't available
        if (this.physics && this.physics.world) {
            // Create a body for the physics
            const kapsulBody = new CANNON.Body({
                mass: 0, // Static body
                position: new CANNON.Vec3(36.5, -1, 0),
                material: this.physics.materials.items.dummy
            })
            
            // Add a sphere shape
            kapsulBody.addShape(new CANNON.Sphere(5))
            
            // Add to physics world
            this.physics.world.addBody(kapsulBody)
            
            console.log("Kapsul physics body added")
        } else {
            console.warn("Physics system not available for Kapsul")
        }

        // Add to container
        this.container.add(this.model.container)
        
        // Add base model if available (similar to other implementations)
        if (this.resources.items.baseModel && this.resources.items.baseModel.scene) {
            const baseModel = this.resources.items.baseModel.scene.clone()
            baseModel.position.set(38, -1, 0)
            baseModel.scale.set(2.5, 2.5, 1.5)
            this.container.add(baseModel)
            console.log("Base model added to Kapsul")
        } else {
            console.warn("Base model not found for Kapsul")
        }

        // Add interaction area (from the previous setKapsulArea functionality)
        if (this.areas) {
            this.areas.add({
                position: new THREE.Vector2(36.5, -1),
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
                position: new THREE.Vector3(36.5, -1, 0),
                maxDistance: 20,
                refDistance: 5,
                rolloffFactor: 1.2,
                volume: 0.7,
                loop: true
            })
        }

        console.log("Kapsul model successfully added")
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