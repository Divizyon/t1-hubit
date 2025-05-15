import * as THREE from 'three'
import CANNON from 'cannon'

// Base position
let posizyonX = 56
let posizyonY = -2
let posizyonZ = 3

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

        this.collisionBodies = []
        this.collisionMeshes = []

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

        // Print all mesh names to debug
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                console.log("Found mesh:", child.name);
            }
        });

        // Collect collision cubes and make them invisible
        this.collisionMeshes = []
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                // Check if it's a collision cube (naming convention: cube_box.XX from Blender)
                if (child.name.includes('cube_box')) {
                    console.log("Found collision cube:", child.name)
                    
                    // Store mesh data before removing it from the scene
                    const meshData = {
                        name: child.name,
                        width: child.geometry.parameters ? child.geometry.parameters.width : 1,
                        height: child.geometry.parameters ? child.geometry.parameters.height : 1,
                        depth: child.geometry.parameters ? child.geometry.parameters.depth : 1,
                        position: child.position.clone(),
                        quaternion: child.quaternion.clone(),
                        scale: child.scale.clone(),
                        worldPosition: new THREE.Vector3(),
                        worldQuaternion: new THREE.Quaternion(),
                        worldScale: new THREE.Vector3()
                    }
                    
                    // Calculate world position/rotation/scale
                    child.updateMatrixWorld(true)
                    child.getWorldPosition(meshData.worldPosition)
                    child.getWorldQuaternion(meshData.worldQuaternion)
                    child.getWorldScale(meshData.worldScale)
                    
                    this.collisionMeshes.push(meshData)
                    
                    // Make invisible instead of removing (in case removal is causing issues)
                    child.visible = false
                    // Optional: Make it not render at all
                    child.material = new THREE.MeshBasicMaterial({visible: false, transparent: true, opacity: 0});
                }
                else {
                    // Set up materials for visible meshes
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
            }
        })
        
        console.log(`Found ${this.collisionMeshes.length} collision cubes in the model`)
        if (this.collisionMeshes.length === 0) {
            console.warn("⚠️ NO COLLISION CUBES FOUND! Check naming pattern in Blender model.");
        }
        
        let baseChildren = []
        if (clonedScene.children && clonedScene.children.length > 0) {
            baseChildren = clonedScene.children
        } else {
            baseChildren = [clonedScene]
        }

        // Kelebek model configurations
        this.kelebek = {}
        this.kelebek.x = posizyonX
        this.kelebek.y = posizyonY
        this.kelebek.z = posizyonZ

        // Add the model to the scene
        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(this.kelebek.x, this.kelebek.y, this.kelebek.z),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 4, sizeY: 4, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            preserveMaterials: true
        })
        
        this.container.add(this.model.base.container)
        
        // Create collision bodies from the saved collision mesh data
        this.createCollisionBodies()
        
        console.log("Kelebekler Vadisi modeli başarıyla eklendi")
        
        // Add debug controls if debug is available
        if (this.debug) {
            const kelebekFolder = this.debug.addFolder('kelebeklervadisi')
            
            // Position control
            const modelFolder = kelebekFolder.addFolder('model position')
            modelFolder.add(this.kelebek, 'x').step(0.1).name('modelX').onChange(() => {
                this.updatePositions()
            })
            modelFolder.add(this.kelebek, 'y').step(0.1).name('modelY').onChange(() => {
                this.updatePositions()
            })
            modelFolder.add(this.kelebek, 'z').step(0.1).name('modelZ').onChange(() => {
                this.updatePositions()
            })
            
            // Add collision visualization for debugging
            const collisionFolder = kelebekFolder.addFolder('collision visualization')
            const collisionConfig = { 
                visible: false,
                createDebugMeshes: () => { this.createDebugCollisionMeshes() },
                removeDebugMeshes: () => { this.removeDebugCollisionMeshes() }
            }
            collisionFolder.add(collisionConfig, 'createDebugMeshes').name('Show collision boxes')
            collisionFolder.add(collisionConfig, 'removeDebugMeshes').name('Hide collision boxes')
        }
    }
    
    createCollisionBodies() {
        if (!this.physics || !this.physics.world) {
            console.error("Physics system not available for Kelebekler Vadisi collision")
            return
        }
        
        if (this.collisionMeshes.length === 0) {
            console.warn("No collision cubes found in the model")
            return
        }
        
        console.log(`Creating collision bodies from ${this.collisionMeshes.length} collision cubes`)
        
        // Clear existing collision bodies
        this.collisionBodies = []
        
        // Create a new collision body for each collision cube
        this.collisionMeshes.forEach((meshData, index) => {
            console.log(`Creating collision body for ${meshData.name}`)
            console.log(`- World position:`, meshData.worldPosition)
            console.log(`- Dimensions: ${meshData.width * meshData.worldScale.x} x ${meshData.height * meshData.worldScale.y} x ${meshData.depth * meshData.worldScale.z}`)
            
            // Create a box shape based on the mesh's dimensions
            // Note: Each dimension is multiplied by the object's scale
            const halfWidth = (meshData.width / 2) * meshData.worldScale.x
            const halfHeight = (meshData.height / 2) * meshData.worldScale.y
            const halfDepth = (meshData.depth / 2) * meshData.worldScale.z
            
            const box = new CANNON.Box(new CANNON.Vec3(
                halfWidth,
                halfHeight,
                halfDepth
            ))
            
            // Create a body at the mesh's position
            const body = new CANNON.Body({
                mass: 0, // Static body
                position: new CANNON.Vec3(
                    meshData.worldPosition.x + this.kelebek.x,
                    meshData.worldPosition.y + this.kelebek.y,
                    meshData.worldPosition.z + this.kelebek.z
                ),
                material: this.physics.materials ? this.physics.materials.items.floor : null
            })
            
            // Apply the quaternion to the body
            body.quaternion.set(
                meshData.worldQuaternion.x,
                meshData.worldQuaternion.y,
                meshData.worldQuaternion.z,
                meshData.worldQuaternion.w
            )
            
            body.addShape(box)
            this.physics.world.addBody(body)
            this.collisionBodies.push(body)
            
            // Add debug visualization if debug mode is enabled
            if (this.debug) {
                this.debug.physics.addBody(body, `kelebekCollision_${index}`)
            }
        })
        
        // Store a reference to the first collision body (for compatibility)
        if (this.collisionBodies.length > 0) {
            this.model.base.collision = { body: this.collisionBodies[0] }
        }
        
        console.log(`Created ${this.collisionBodies.length} collision bodies for Kelebekler Vadisi`)
    }
    
    createDebugCollisionMeshes() {
        // Remove existing debug meshes
        this.removeDebugCollisionMeshes()
        
        // Create visualization meshes for each collision box
        this.debugMeshes = []
        this.collisionMeshes.forEach((meshData, index) => {
            const geometry = new THREE.BoxGeometry(
                meshData.width * meshData.worldScale.x,
                meshData.height * meshData.worldScale.y,
                meshData.depth * meshData.worldScale.z
            )
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true,
                transparent: true,
                opacity: 0.7
            })
            
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(
                meshData.worldPosition.x + this.kelebek.x,
                meshData.worldPosition.y + this.kelebek.y,
                meshData.worldPosition.z + this.kelebek.z
            )
            
            mesh.quaternion.copy(meshData.worldQuaternion)
            
            this.container.add(mesh)
            this.debugMeshes.push(mesh)
        })
        
        console.log(`Created ${this.debugMeshes.length} debug visualization meshes`)
    }
    
    removeDebugCollisionMeshes() {
        if (this.debugMeshes && this.debugMeshes.length) {
            this.debugMeshes.forEach(mesh => {
                this.container.remove(mesh)
                if (mesh.geometry) mesh.geometry.dispose()
                if (mesh.material) mesh.material.dispose()
            })
            this.debugMeshes = []
        }
    }
    
    updatePositions() {
        // Update model position
        if (this.model && this.model.container) {
            this.model.container.position.x = this.kelebek.x
            this.model.container.position.y = this.kelebek.y
            this.model.container.position.z = this.kelebek.z
            
            // Update collision bodies positions
            this.collisionBodies.forEach((body, index) => {
                const meshData = this.collisionMeshes[index]
                if (meshData) {
                    body.position.x = meshData.worldPosition.x + this.kelebek.x
                    body.position.y = meshData.worldPosition.y + this.kelebek.y
                    body.position.z = meshData.worldPosition.z + this.kelebek.z
                }
            })
            
            // Update debug meshes if they exist
            if (this.debugMeshes && this.debugMeshes.length) {
                this.debugMeshes.forEach((mesh, index) => {
                    const meshData = this.collisionMeshes[index]
                    if (meshData) {
                        mesh.position.x = meshData.worldPosition.x + this.kelebek.x
                        mesh.position.y = meshData.worldPosition.y + this.kelebek.y
                        mesh.position.z = meshData.worldPosition.z + this.kelebek.z
                    }
                })
            }
        }
    }
} 