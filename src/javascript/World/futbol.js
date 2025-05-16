import * as THREE from 'three'
import CANNON from 'cannon'

// Position relative to the stadium (which is at 40, -42, -2.5)
const DEFAULT_POSITION = new THREE.Vector3(20, -55, 10)
const DEFAULT_SCALE = new THREE.Vector3(3, 3, 3)
const BALL_SPAWN_POSITION = new THREE.Vector3(20, -55, 2)

export default class Futbol {
    constructor({ scene, resources, objects, physics, debug, areas, rotateX = 0, rotateY = 0, rotateZ = Math.PI/2 }) {
        this.scene = scene
        this.resources = resources
        this.objects = objects
        this.physics = physics
        this.debug = debug
        this.areas = areas

        // Store rotation values
        this.rotateX = rotateX
        this.rotateY = rotateY
        this.rotateZ = rotateZ

        // Custom position and scale if provided
        this.position = DEFAULT_POSITION.clone()
        this.scale = DEFAULT_SCALE.clone()

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.collisionBodies = []
        this.collisionMeshes = []
        
        // Goal post pairs (will be set in createCollisionBodies)
        this.goalPosts = {
            left: [],
            right: []
        }

        this.setModel()
        this.setBall()
        this.scene.add(this.container)
    }

    setModel() {
        console.log("Loading Soccer Field model...")
        const model = this.resources.items.futbolModel?.scene
        if (!model) {
            console.error('Soccer Field model could not be loaded!')
            return
        }

        const clonedScene = model.clone()
        
        // Collect collision cubes and make them invisible
        this.collisionMeshes = []
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                // Check if it's a collision cube (naming convention: cube_box.XX from Blender)
                if (child.name.includes('cube_box')) {
                    console.log("Found collision cube:", child.name)
                    
                    // Store mesh data before making it invisible
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
                    
                    // Identify goal posts based on their position and size
                    // We'll consider vertical posts that are near the goals
                    const isVertical = meshData.height > meshData.width && meshData.height > meshData.depth
                    const isNearGoalArea = Math.abs(meshData.worldPosition.y - this.position.y) > 5 // Posts are usually at the ends of the field
                    meshData.isGoalPost = isVertical && isNearGoalArea
                    
                    if(meshData.isGoalPost) {
                        console.log(`Identified goal post: ${meshData.name} at position:`, meshData.worldPosition)
                    }
                    
                    this.collisionMeshes.push(meshData)
                    
                    // Make collision meshes invisible
                    child.visible = false
                    child.material = new THREE.MeshBasicMaterial({visible: false})
                } else {
                    // Set up materials for visible meshes
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(mat => mat.clone())
                        } else {
                            child.material = child.material.clone()
                        }
                        child.castShadow = true
                        child.receiveShadow = true
                    }
                }
            }
        })

        // Position, scale, and rotate the model
        clonedScene.position.copy(this.position)
        clonedScene.scale.copy(this.scale)
        clonedScene.rotation.set(this.rotateX, this.rotateY, this.rotateZ)
        this.container.add(clonedScene)

        // Create collision bodies
        this.createCollisionBodies()
        
        console.log("Soccer Field model successfully added")
        
        // Add debug controls if available
        if (this.debug) {
            const debugFolder = this.debug.addFolder('soccerField')
            
            // Position control
            const positionFolder = debugFolder.addFolder('position')
            positionFolder.add(this.position, 'x').step(0.1).onChange(() => this.updatePositions())
            positionFolder.add(this.position, 'y').step(0.1).onChange(() => this.updatePositions())
            positionFolder.add(this.position, 'z').step(0.1).onChange(() => this.updatePositions())
            
            // Rotation control
            const rotationFolder = debugFolder.addFolder('rotation')
            rotationFolder.add(this, 'rotateX').step(0.1).name('rotateX').onChange(() => this.updatePositions())
            rotationFolder.add(this, 'rotateY').step(0.1).name('rotateY').onChange(() => this.updatePositions())
            rotationFolder.add(this, 'rotateZ').step(0.1).name('rotateZ').onChange(() => this.updatePositions())
            
            // Add collision visualization debugging
            const collisionFolder = debugFolder.addFolder('collision visualization')
            const collisionConfig = { 
                visible: false,
                createDebugMeshes: () => { this.createDebugCollisionMeshes() },
                removeDebugMeshes: () => { this.removeDebugCollisionMeshes() }
            }
            collisionFolder.add(collisionConfig, 'createDebugMeshes').name('Show collision boxes')
            collisionFolder.add(collisionConfig, 'removeDebugMeshes').name('Hide collision boxes')
        }
    }
    
    setBall() {
        // Ball properties
        this.ballRadius = 0.7 // Reduced from 1.5 to 0.7 for better physics
        this.ballDefaultPosition = BALL_SPAWN_POSITION.clone()
        
        // Load the ball model from resources
        const ballModel = this.resources.items.tobModel?.scene
        if (!ballModel) {
            console.error('Soccer ball model (tob.glb) could not be loaded!')
            return
        }

        // Clone and set up the ball mesh
        this.ballMesh = ballModel.clone()
        this.ballMesh.scale.set(0.7, 0.7, 0.7) // Match physics radius
        
        // Make sure to traverse and set up materials properly
        this.ballMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                
                // If the material is an array
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(mat => {
                        const newMat = mat.clone()
                        newMat.needsUpdate = true
                        return newMat
                    })
                } else if (child.material) {
                    // Single material
                    child.material = child.material.clone()
                    child.material.needsUpdate = true
                }
            }
        })
        
        this.container.add(this.ballMesh)
        
        // Create ball physics body with adjusted properties
        const shape = new CANNON.Sphere(this.ballRadius)
        
        this.ballBody = new CANNON.Body({
            mass: 0.5, // Reduced mass for better physics
            position: new CANNON.Vec3(
                this.ballDefaultPosition.x,
                this.ballDefaultPosition.y,
                this.ballDefaultPosition.z
            ),
            material: this.physics.materials.items.ball,
            linearDamping: 0.4, // Increased damping to reduce rolling
            angularDamping: 0.4,
            fixedRotation: false,
            collisionFilterGroup: 1, // Default group
            collisionFilterMask: -1 // Collide with all groups
        })
        
        this.ballBody.addShape(shape)
        
        // Set up collision behavior
        this.ballBody.addEventListener('collide', (event) => {
            const contact = event.contact
            
            // If colliding with car, add some repulsion
            if (event.body === this.physics.car.chassis.body) {
                const impulse = contact.ni.scale(5) // Adjust repulsion strength
                this.ballBody.velocity.vadd(impulse, this.ballBody.velocity)
            }
        })
        
        this.physics.world.addBody(this.ballBody)
        
        // Update ball position on physics tick
        this.physics.time.on('tick', () => {
            if(this.ballMesh && this.ballBody) {
                this.ballMesh.position.copy(this.ballBody.position)
                this.ballMesh.quaternion.copy(this.ballBody.quaternion)
                
                // Check if ball is between goal posts
                this.checkGoal()
                
                // Reset if ball falls below ground
                if(this.ballBody.position.z < -5) {
                    this.resetBall()
                }
                
                // Apply small downward force to prevent floating
                this.ballBody.applyForce(new CANNON.Vec3(0, 0, -2), this.ballBody.position)
            }
        })

        // Add debug controls for ball
        if(this.debug) {
            const ballFolder = this.debug.addFolder('soccerBall')
            ballFolder.add(this, 'resetBall').name('Reset Ball')
            
            const positionFolder = ballFolder.addFolder('position')
            positionFolder.add(this.ballBody.position, 'x').step(0.1).name('X')
            positionFolder.add(this.ballBody.position, 'y').step(0.1).name('Y')
            positionFolder.add(this.ballBody.position, 'z').step(0.1).name('Z')
            
            const physicsFolder = ballFolder.addFolder('physics')
            physicsFolder.add(this.ballBody, 'mass').min(0).max(10).step(0.1).name('Mass')
            physicsFolder.add(this.ballBody, 'linearDamping').min(0).max(1).step(0.01).name('Linear Damping')
            physicsFolder.add(this.ballBody, 'angularDamping').min(0).max(1).step(0.01).name('Angular Damping')
        }
    }

    resetBall() {
        if(this.ballBody) {
            console.log('Resetting ball position')
            // Reset position and velocity
            this.ballBody.position.copy(this.ballDefaultPosition)
            this.ballBody.velocity.set(0, 0, 0)
            this.ballBody.angularVelocity.set(0, 0, 0)
            this.ballBody.wakeUp()
        }
    }

    checkGoal() {
        if(!this.ballBody || this.goalPosts.left.length < 2 || this.goalPosts.right.length < 2) return

        // Check left goal
        if(this.isBallBetweenPosts(this.goalPosts.left[0], this.goalPosts.left[1])) {
            this.onGoal('left')
        }
        // Check right goal
        else if(this.isBallBetweenPosts(this.goalPosts.right[0], this.goalPosts.right[1])) {
            this.onGoal('right')
        }
    }

    isBallBetweenPosts(post1, post2) {
        if(!this.ballBody) return false

        const ballPos = this.ballBody.position
        const post1Pos = post1.position
        const post2Pos = post2.position

        // Calculate vectors
        const postVector = new CANNON.Vec3()
        post2Pos.vsub(post1Pos, postVector)
        const postLength = postVector.length()

        const ballToPost1 = new CANNON.Vec3()
        ballPos.vsub(post1Pos, ballToPost1)

        // Project ball position onto line between posts
        const dot = ballToPost1.dot(postVector) / postLength
        const projection = new CANNON.Vec3()
        postVector.scale(dot / postLength, projection)
        post1Pos.vadd(projection, projection)

        // Check if ball is between posts
        const distanceToLine = new CANNON.Vec3()
        ballPos.vsub(projection, distanceToLine)
        
        // Increased detection range since we increased ball size
        const detectionThreshold = 3 // Increased from 1 to account for larger ball
        
        // Log positions for debugging
        console.log('Ball position:', ballPos)
        console.log('Post1 position:', post1Pos)
        console.log('Post2 position:', post2Pos)
        console.log('Distance to line:', distanceToLine.length())
        console.log('Dot product:', dot)
        console.log('Post length:', postLength)
        
        // Ball must be within detection threshold of the goal line and between the posts
        return distanceToLine.length() < detectionThreshold && dot > 0 && dot < postLength
    }

    onGoal(side) {
        const now = Date.now()
        // Prevent multiple triggers within 2 seconds
        if(!this.lastGoalCollision || (now - this.lastGoalCollision > 2000)) {
            this.lastGoalCollision = now
            
            // Create goal message
            const goalMessage = document.createElement('div')
            goalMessage.style.position = 'fixed'
            goalMessage.style.top = '50%'
            goalMessage.style.left = '50%'
            goalMessage.style.transform = 'translate(-50%, -50%)'
            goalMessage.style.fontSize = '5em'
            goalMessage.style.color = '#fff'
            goalMessage.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)'
            goalMessage.style.fontFamily = 'Arial, sans-serif'
            goalMessage.style.zIndex = '1000'
            goalMessage.textContent = 'GOAAAL!'
            
            document.body.appendChild(goalMessage)
            
            // Animate message
            goalMessage.animate([
                { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
                { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 1 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0 }
            ], {
                duration: 2000,
                easing: 'ease-out'
            }).onfinish = () => {
                document.body.removeChild(goalMessage)
            }
            
            // Reset ball after delay
            setTimeout(() => this.resetBall(), 1000)
        }
    }

    createCollisionBodies() {
        if (!this.physics || !this.physics.world) {
            console.error("Physics system not available for Soccer Field collision")
            return
        }
        
        if (this.collisionMeshes.length === 0) {
            console.warn("No collision cubes found in the model")
            return
        }
        
        console.log(`Creating collision bodies from ${this.collisionMeshes.length} collision cubes`)
        
        // Clear existing collision bodies
        this.collisionBodies = []
        
        // Find goal post pairs based on their Y positions
        const leftSideMeshes = this.collisionMeshes.filter(mesh => mesh.worldPosition.y < this.position.y - 5)
        const rightSideMeshes = this.collisionMeshes.filter(mesh => mesh.worldPosition.y > this.position.y + 5)
        
        // Create a new collision body for each collision cube
        this.collisionMeshes.forEach((meshData, index) => {
            console.log(`Creating collision body for ${meshData.name}`)
            
            // Create a box shape based on the mesh's dimensions
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
                    meshData.worldPosition.x + this.position.x,
                    meshData.worldPosition.y + this.position.y,
                    meshData.worldPosition.z + this.position.z
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
            
            // Add to appropriate goal post array if it's a vertical post
            if(meshData.height > meshData.width && meshData.height > meshData.depth) {
                if(leftSideMeshes.includes(meshData)) {
                    this.goalPosts.left.push(body)
                    console.log('Added left goal post:', meshData.name)
                } else if(rightSideMeshes.includes(meshData)) {
                    this.goalPosts.right.push(body)
                    console.log('Added right goal post:', meshData.name)
                }
            }
            
            // Add debug visualization if debug mode is enabled
            if (this.debug) {
                this.debug.physics.addBody(body, `soccerFieldCollision_${index}`)
            }
        })
        
        console.log(`Created ${this.collisionBodies.length} collision bodies for Soccer Field`)
        console.log('Left goal posts:', this.goalPosts.left.length)
        console.log('Right goal posts:', this.goalPosts.right.length)
    }
    
    createDebugCollisionMeshes() {
        // Remove existing debug meshes
        this.removeDebugCollisionMeshes()
        
        // Create visualization meshes for each collision box
        this.debugMeshes = []
        this.collisionMeshes.forEach((meshData) => {
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
                meshData.worldPosition.x + this.position.x,
                meshData.worldPosition.y + this.position.y,
                meshData.worldPosition.z + this.position.z
            )
            
            mesh.quaternion.copy(meshData.worldQuaternion)
            
            this.container.add(mesh)
            this.debugMeshes.push(mesh)
        })
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
        if (this.container) {
            this.container.position.copy(this.position)
            
            // Update model rotation
            const firstChild = this.container.children[0]
            if (firstChild) {
                firstChild.rotation.set(this.rotateX, this.rotateY, this.rotateZ)
            }
            
            // Update collision bodies positions and rotations
            this.collisionBodies.forEach((body, index) => {
                const meshData = this.collisionMeshes[index]
                if (meshData) {
                    // Create a rotation matrix from our Euler rotation
                    const matrix = new THREE.Matrix4()
                    matrix.makeRotationFromEuler(new THREE.Euler(this.rotateX, this.rotateY, this.rotateZ))
                    
                    // Create a vector for the position
                    const pos = new THREE.Vector3(
                        meshData.worldPosition.x,
                        meshData.worldPosition.y,
                        meshData.worldPosition.z
                    )
                    
                    // Apply the rotation to the position
                    pos.applyMatrix4(matrix)
                    
                    // Update the body position
                    body.position.x = pos.x + this.position.x
                    body.position.y = pos.y + this.position.y
                    body.position.z = pos.z + this.position.z
                    
                    // Update the body rotation
                    const quaternion = new THREE.Quaternion()
                    quaternion.setFromEuler(new THREE.Euler(this.rotateX, this.rotateY, this.rotateZ))
                    body.quaternion.set(
                        quaternion.x,
                        quaternion.y,
                        quaternion.z,
                        quaternion.w
                    )
                }
            })
            
            // Update debug meshes if they exist
            if (this.debugMeshes && this.debugMeshes.length) {
                this.debugMeshes.forEach((mesh, index) => {
                    const meshData = this.collisionMeshes[index]
                    if (meshData) {
                        mesh.position.copy(this.collisionBodies[index].position)
                        mesh.quaternion.copy(this.collisionBodies[index].quaternion)
                    }
                })
            }
        }
    }
} 