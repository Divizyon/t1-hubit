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
        
        // Animation components
        this.mixer = null
        this.animations = {}

        // Building block following car
        this.buildingBlockModel = null
        this.buildingBlockOffset = new THREE.Vector3(0, 0, 0)
        this.isFollowingCar = false

        // Set up scene lighting first (previously in AladdinTepesi)
        this.setLights()
        
        // Set up the model
        this.setModel()
        
        // Setup animations from the model
        this.setupAnimations()
        
        // Setup building block to follow car if needed
        this.setupCarFollowing()
        
        // Time tick
        this.time.on('tick', () => {
            // Update animations
            if(this.mixer) {
                this.mixer.update(this.time.delta * 0.001)
            }
            
            // Update building block position to follow car if enabled
            if (this.isFollowingCar) {
                this.updateBuildingBlockPosition()
            }
        })
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
    
    setupAnimations() {
        // Check if the model has animations
        const animations = this.model.resource.animations
        
        if (!animations || animations.length === 0) {
            console.warn('No animations found in model')
            return
        }
        
        console.log(`Found ${animations.length} animations in model`)
        
        // Create animation mixer
        this.mixer = new THREE.AnimationMixer(this.model.scene)
        
        // Create and play all animations automatically
        animations.forEach((clip, index) => {
            const name = clip.name || `animation_${index}`
            
            // Create action for this animation
            const action = this.mixer.clipAction(clip)
            
            // Configure for looping
            action.reset()
            action.setLoop(THREE.LoopRepeat)
            action.clampWhenFinished = false
            
            // Play animation
            action.play()
            
            // Save for reference
            this.animations[name] = action
            
            console.log(`Started looping animation: ${name}`)
        })
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

    setupCarFollowing() {
        // Find the building block model by name in the registry
        // Note: You may need to adjust the name based on your model structure
        const possibleNames = ['greenbox', 'buildingBlock', 'carPlatform', 'Scene.greenbox', 'Scene.BuildingBlock'];
        
        // Try to find the building block using different possible names
        for (const name of possibleNames) {
            const model = this.getModel(name);
            if (model) {
                this.buildingBlockModel = model;
                console.log(`Found building block model: ${name}`);
                break;
            }
        }
        
        // If we couldn't find it by common names, try to find it by position or structure
        if (!this.buildingBlockModel) {
            // Log all model names to help identify the building block
            console.log("Couldn't find building block by name. Available models:");
            Object.keys(this.modelRegistry).forEach(key => {
                console.log(`- ${key}`);
            });
            
            // Don't enable following if building block wasn't found
            return;
        }
        
        // Disable car following by default (enable manually when needed)
        this.isFollowingCar = false;
        console.log("Building block car following is disabled by default");
    }
    
    enableCarFollowing() {
        if (this.buildingBlockModel) {
            // Store the initial offset between car and block only once when enabling
            if (this.physics && this.physics.car && this.physics.car.chassis && this.physics.car.chassis.body) {
                const carPosition = this.physics.car.chassis.body.position;
                this.buildingBlockOffset.set(
                    this.buildingBlockModel.position.x - carPosition.x,
                    this.buildingBlockModel.position.y - carPosition.y,
                    this.buildingBlockModel.position.z - carPosition.z
                );
                console.log("Initial offset between car and building block:", this.buildingBlockOffset);
            }
            
            this.isFollowingCar = true;
            console.log("Building block will now follow the car");
        } else {
            console.warn("Cannot enable car following - building block model not found");
        }
    }
    
    disableCarFollowing() {
        this.isFollowingCar = false;
        console.log("Building block will no longer follow the car");
    }
    
    updateBuildingBlockPosition() {
        if (!this.isFollowingCar || !this.buildingBlockModel) return;
        
        // Get the car position from physics
        if (this.physics && this.physics.car && this.physics.car.chassis && this.physics.car.chassis.body) {
            const carPosition = this.physics.car.chassis.body.position;
            
            // Update building block position based on car position and stored offset
            this.buildingBlockModel.position.set(
                carPosition.x + this.buildingBlockOffset.x,
                carPosition.y + this.buildingBlockOffset.y,
                carPosition.z + this.buildingBlockOffset.z
            );
            
            // Create a copy of the car's quaternion instead of directly referring to it
            // This prevents any issues with the car's physics body
            if (this.physics.car.chassis.body.quaternion) {
                const carQuat = this.physics.car.chassis.body.quaternion;
                const quaternionCopy = new THREE.Quaternion(carQuat.x, carQuat.y, carQuat.z, carQuat.w);
                this.buildingBlockModel.quaternion.copy(quaternionCopy);
            }
            
            // Update this specific model's matrix
            this.buildingBlockModel.updateMatrix();
        }
    }
} 