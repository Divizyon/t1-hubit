import * as THREE from 'three'
import EventEmitter from '../Utils/EventEmitter.js'

export default class CompleteScene extends EventEmitter {
    constructor(_options) {
        super()

        // Options
        this.debug = _options.debug
        this.resources = _options.resources
        this.time = _options.time
        this.sizes = _options.sizes
        this.camera = _options.camera
        this.renderer = _options.renderer
        this.container = _options.container
        this.physics = _options.physics
        this.areas = _options.areas
        this.objects = _options.objects
        this.scene = _options.scene

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        // Model registry to access individual parts
        this.modelRegistry = {}

        // Set up scene lighting first (previously in AladdinTepesi)
        this.setLights()
        
        // Set up the model
        this.setModel()
    }

    setLights() {
        // Skip if lights already added (prevent duplicate lights)
        if (this.scene && !this.scene.__sceneLightsAdded) {
            console.log('Adding main scene lighting (moved from AladdinTepesi)')
            
            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 2)
            this.scene.add(ambientLight)
            
            // Add directional light
            const dirLight = new THREE.DirectionalLight(0xffffff, 2)
            dirLight.position.set(5, 10, 7.5)
            this.scene.add(dirLight)
            
            // Mark lights as added
            this.scene.__sceneLightsAdded = true
        }
    }

    setModel() {
        this.model = {}
        
        // Get the resource
        this.model.resource = this.resources.items.completeScene
        
        // Create model container
        this.model.container = new THREE.Object3D()
        this.model.container.matrixAutoUpdate = false
        
        // Rotate the model so it's not upside down
        this.model.container.rotation.x = Math.PI / 2
        
        this.container.add(this.model.container)

        // Create the scene
        this.model.scene = this.model.resource.scene
        this.model.container.add(this.model.scene)

        // Register all models in the hierarchy
        this.registerModels(this.model.scene)

        // Update the matrix after rotation
        this.model.container.updateMatrix()

        // Debug
        if(this.debug) {
            this.debugFolder = this.debug.addFolder('completeScene')
            this.debugFolder.add(this.model.container.position, 'x').name('position x').min(-100).max(100).step(0.1)
            this.debugFolder.add(this.model.container.position, 'y').name('position y').min(-100).max(100).step(0.1)
            this.debugFolder.add(this.model.container.position, 'z').name('position z').min(-100).max(100).step(0.1)
        }
    }

    registerModels(object, prefix = '') {
        // Register this object in the registry if it has a name
        if(object.name && object.name !== '') {
            const registryKey = prefix ? `${prefix}.${object.name}` : object.name
            this.modelRegistry[registryKey] = object
            
            // Log for debugging
            console.log(`Registered model: ${registryKey}`)
        }

        // Recursively register all children
        if(object.children && object.children.length > 0) {
            for(const child of object.children) {
                const newPrefix = object.name && object.name !== '' ? 
                    (prefix ? `${prefix}.${object.name}` : object.name) : 
                    prefix
                this.registerModels(child, newPrefix)
            }
        }
    }

    // Method to get a specific model by path (e.g., "Scene.BilimMerkezi")
    getModel(path) {
        return this.modelRegistry[path]
    }

    // Method to manipulate a specific model
    manipulateModel(path, transformFn) {
        const model = this.getModel(path)
        if(model) {
            transformFn(model)
            this.model.container.updateMatrix()
        }
    }
} 