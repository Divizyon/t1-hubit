import * as THREE from 'three'

export default class CalisanGenclikMerkezi {
    constructor(resources, objects, shadows, debug, scene) {
        this.resources = resources
        this.objects = objects
        this.shadows = shadows
        this.debug = debug
        // We don't need the scene reference as the parent will handle adding to the scene
        
        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('calisanGenclikMerkezi')
        }

        this.setModel()
    }

    setModel() {
        console.log('Loading CalisanGenclikMerkezi model...')

        if (!this.resources.items) {
            console.error('Resources items not initialized')
            return
        }

        if (!this.resources.items.calisanGenclikMerkezi) {
            console.error('CalisanGenclikMerkezi model not found in resources')
            console.log('Available resources:', Object.keys(this.resources.items))
            return
        }
       
        // Create the model using objects.add() which returns a structured object
        // with container, collision and other properties
        this.model = this.objects.add({
            base: this.resources.items.calisanGenclikMerkezi.scene,
            collision: { children: [] }, // Empty collision object, can be passed through
            offset: new THREE.Vector3(63, -32, 0),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true
        })

        // We no longer need to add to scene here as the parent World class will handle that
        console.log('CalisanGenclikMerkezi model created')
 
        // Debug
        if (this.debug && this.model && this.model.container) {
            this.debugFolder
                .add(this.model.container.position, 'x')
                .name('positionX')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'y')
                .name('positionY')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'z')
                .name('positionZ')
                .min(-50)
                .max(50)
                .step(0.1)
        }
    }
} 
