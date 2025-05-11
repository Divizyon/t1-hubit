import * as THREE from 'three'

export default class CalisanGenclikMerkezi {
    constructor(resources, objects, shadows, debug, scene) {
        this.resources = resources
        this.objects = objects
        this.shadows = shadows
        this.debug = debug
        this.scene = scene
        
        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('calisanGenclikMerkezi')
        }

        this.setModel()
    }

    setModel() {
        console.log('Loading CalisanGenclikMerkezi model...')
        console.log('Resources:', this.resources.items)

        if (!this.resources.items) {
            console.error('Resources items not initialized')
            return
        }

        if (!this.resources.items.calisanGenclikMerkezi) {
            console.error('CalisanGenclikMerkezi model not found in resources')
            console.log('Available resources:', Object.keys(this.resources.items))
            return
        }
       

        this.model = this.objects.add({
            base: this.resources.items.calisanGenclikMerkezi.scene,
            collision: { children: [] }, // Boş collision nesnesi, içinden geçilebilir!
            offset: new THREE.Vector3(70, -30, 0),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true
        })

      

        if (this.model && this.model.container && this.model.container instanceof THREE.Object3D) {
            this.scene.add(this.model.container)
            console.log('Model added to scene at position:', this.model.container.position)
        } else if (this.model instanceof THREE.Object3D) {
            this.scene.add(this.model)
            console.log('Model added to scene at position:', this.model.position)
        } else {
            console.error('Eklenebilecek bir THREE.Object3D bulunamadı:', this.model)
        }
 ;
        // Debug
        if (this.debug) {
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
