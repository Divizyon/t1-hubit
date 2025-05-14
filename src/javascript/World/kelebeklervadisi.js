import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 52
let posizyonY = 3
let posizyonZ = 1

export default class kelebeklervadisi {
    constructor(_options) {
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.areas = _options.areas
        this.sounds = _options.sounds

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
    }

    setModel() {
        console.log("Loading Kelebekler Vadisi model...")
        const baseScene = this.resources.items.kelebeklerVadisiModel?.scene
        if (!baseScene) {
            console.error('Kelebekler Vadisi modeli yüklenemedi!')
            return
        }

        const clonedScene = baseScene.clone()
        
        console.log("Kelebekler Vadisi model structure:", clonedScene)
        
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                console.log("Found mesh in Kelebekler model:", child.name)
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone())
                    } else {
                        child.material = child.material.clone()
                    }
                    child.castShadow = true
                    child.receiveShadow = true
                } else {
                    console.warn("Mesh has no material:", child.name)
                }
            }
        })
        
        let baseChildren = []
        if (clonedScene.children && clonedScene.children.length > 0) {
            baseChildren = clonedScene.children
        } else {
            baseChildren = [clonedScene]
        }

        const bbox = new THREE.Box3().setFromObject(clonedScene)
        const size = bbox.getSize(new THREE.Vector3())
        console.log("Kelebekler Vadisi model size:", size)
        
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ),
            material: this.physics.materials.items.floor
        })

        const mainShape = new CANNON.Box(new CANNON.Vec3(
            Math.abs(size.x) * 0.5,
            Math.abs(size.y) * 0.5,
            Math.abs(size.z) * 0.5
        ))
        body.addShape(mainShape)
        this.physics.world.addBody(body)

        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ + 0.5),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 4, sizeY: 4, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            preserveMaterials: true
        })

        this.model.base.collision = { body }
        this.container.add(this.model.base.container)
        console.log("Kelebekler Vadisi modeli başarıyla eklendi")
    }
} 