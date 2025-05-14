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

        // Collision objects
        this.collisionBodies = []

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

        // Set up collisions for the model
        this.setupCollisions()

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
    
    setupCollisions() {
        // Skip if physics is not available
        if (!this.physics) {
            console.warn('Physics not available, skipping collision setup');
            return;
        }
        
        console.log('Setting up collisions for complete scene model...');
        
        // Find all collision meshes
        const boxColliders = [];
        const sphereColliders = [];
        const cylinderColliders = [];
        
        // Traverse the model to find collision objects
        this.model.scene.traverse((child) => {
            if (child.isMesh) {
                // Check for different collision types based on naming
                if (child.name.match(/^cube_|^box_/i)) {
                    console.log(`Found box collider: ${child.name}`);
                    boxColliders.push(child);
                    child.visible = false; // Hide collision mesh
                }
                else if (child.name.match(/^sphere_/i)) {
                    console.log(`Found sphere collider: ${child.name}`);
                    sphereColliders.push(child);
                    child.visible = false; // Hide collision mesh
                }
                else if (child.name.match(/^cylinder_/i)) {
                    console.log(`Found cylinder collider: ${child.name}`);
                    cylinderColliders.push(child);
                    child.visible = false; // Hide collision mesh
                }
            }
        });
        
        // Get model container position and rotation
        const modelPosition = this.model.container.position.clone();
        const modelRotation = {
            x: this.model.container.rotation.x,
            y: this.model.container.rotation.y,
            z: this.model.container.rotation.z,
            order: this.model.container.rotation.order
        };
        
        console.log('Model position:', modelPosition);
        console.log('Model rotation:', modelRotation);
        
        // Create physics bodies for box colliders
        if (boxColliders.length > 0) {
            console.log(`Creating physics for ${boxColliders.length} box colliders`);
            const boxCollision = this.physics.addObjectFromThree({
                meshes: boxColliders,
                offset: modelPosition,  // Use model position as offset
                rotation: modelRotation, // Apply model rotation to colliders
                mass: 0, // Static objects
                sleep: false  // Don't put them to sleep initially
            });
            
            if (boxCollision) {
                this.collisionBodies.push(boxCollision);
                console.log('Box colliders created with position:', boxCollision.body.position);
            }
        }
        
        // Create physics bodies for sphere colliders
        if (sphereColliders.length > 0) {
            console.log(`Creating physics for ${sphereColliders.length} sphere colliders`);
            const sphereCollision = this.physics.addObjectFromThree({
                meshes: sphereColliders,
                offset: modelPosition,
                rotation: modelRotation,
                mass: 0,
                sleep: false
            });
            
            if (sphereCollision) {
                this.collisionBodies.push(sphereCollision);
                console.log('Sphere colliders created with position:', sphereCollision.body.position);
            }
        }
        
        // Create physics bodies for cylinder colliders
        if (cylinderColliders.length > 0) {
            console.log(`Creating physics for ${cylinderColliders.length} cylinder colliders`);
            const cylinderCollision = this.physics.addObjectFromThree({
                meshes: cylinderColliders,
                offset: modelPosition,
                rotation: modelRotation,
                mass: 0,
                sleep: false
            });
            
            if (cylinderCollision) {
                this.collisionBodies.push(cylinderCollision);
                console.log('Cylinder colliders created with position:', cylinderCollision.body.position);
            }
        }
        
        // Force bodies to be awake and active
        this.collisionBodies.forEach(collision => {
            if (collision.body) {
                collision.body.wakeUp();
                
                // Safely check if updateAABB exists - it may not be in your version of Cannon.js
                if (typeof collision.body.updateAABB === 'function') {
                    collision.body.updateAABB();
                }
                
                console.log(`Collision body activated at position: ${collision.body.position.x}, ${collision.body.position.y}, ${collision.body.position.z}`);
                
                // Enable collision detection - important to ensure car collides with these objects
                if (collision.body.collisionResponse !== undefined) {
                    collision.body.collisionResponse = true;
                    console.log('Collision response enabled for body');
                }
                
                // Force collision filter to match car
                if (collision.body.collisionFilterGroup !== undefined && this.physics.car && this.physics.car.chassis && this.physics.car.chassis.body) {
                    collision.body.collisionFilterGroup = this.physics.car.chassis.body.collisionFilterGroup;
                    collision.body.collisionFilterMask = this.physics.car.chassis.body.collisionFilterMask;
                    console.log('Collision filter matched with car chassis');
                }
            }
        });
        
        const totalColliders = boxColliders.length + sphereColliders.length + cylinderColliders.length;
        console.log(`Total collision objects created: ${this.collisionBodies.length} for ${totalColliders} colliders`);
        
        // Debug folder for collisions
        if (this.debug && this.debugFolder) {
            const collisionFolder = this.debugFolder.addFolder('Collisions');
            
            // Add option to show/hide colliders
            collisionFolder.add({ showColliders: false }, 'showColliders')
                .name('Show Colliders')
                .onChange((value) => {
                    // Show/hide collision meshes for debugging
                    boxColliders.forEach(mesh => { mesh.visible = value; });
                    sphereColliders.forEach(mesh => { mesh.visible = value; });
                    cylinderColliders.forEach(mesh => { mesh.visible = value; });
                });
            
            // Add option to show/hide physics models
            if (this.physics && this.physics.models) {
                collisionFolder.add(this.physics.models.container, 'visible')
                    .name('Show Physics Models');
            }
            
            // Add button to reset collisions
            collisionFolder.add({ 
                resetCollisions: () => {
                    this.collisionBodies.forEach(collision => {
                        if (collision.reset) {
                            collision.reset();
                            collision.body.wakeUp();
                        }
                    });
                }
            }, 'resetCollisions').name('Reset Collisions');
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