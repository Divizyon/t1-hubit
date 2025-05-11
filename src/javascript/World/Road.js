import * as THREE from 'three'
import * as CANNON from 'cannon'

export default class Road {
    constructor(options) {
        // Set options
        this.debug = options.debug
        this.time = options.time
        this.resources = options.resources
        this.objects = options.objects
        this.physics = options.physics

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

            this.setModel()
    }

    setModel() {
        this.model = {}
        this.model.mesh = this.resources.items.roadModel.scene

        // Material
        const material = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.5,
            roughness: 0.5
        })

        // Traverse meshes
        this.model.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = material
                child.castShadow = true
                child.receiveShadow = true
            }
        })

        // Set position
        this.model.mesh.position.set(30, 0, 0.002)

        this.container.add(this.model.mesh)

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(30, 0.1, 15))
        this.model.body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(30, 0, 0.002),
            shape
        })

        this.physics.world.addBody(this.model.body)
    }
} 