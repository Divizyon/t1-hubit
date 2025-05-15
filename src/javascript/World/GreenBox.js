import * as THREE from 'three'
import CANNON from 'cannon'

export default class GreenBox
{
    constructor(_options)
    {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.time = _options.time
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.camera = _options.camera
        this.areas = _options.areas
        this.car = _options.car
        this.sounds = _options.sounds
            
        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true
        this.container.updateMatrix()

        // Image paths for the greenscreen
        this.greenscreenImagePaths = [
            './images/greenscreen_resimler/desert_greenscreen_.webp',
            './images/greenscreen_resimler/iceland_greenscreen.webp',
            './images/greenscreen_resimler/lake_greenscreen.webp'
        ]
        
        this.currentImageIndex = -1 // No image selected initially
        
        // Initialize components
        this.setModel()
        
        // Set up interaction
        if (this.greenBoxObject && this.areas) {
            this.createImageButtons()
        }
    }

    setModel()
    {
        // Model position and size
        this.greenBox = {
            x: -60,
            y: 6,
            z: 0
        }
        
        // Model scale
        this.modelSize = {
            x: 1.0,
            y: 1.0,
            z: 1.0
        }

        // Add the greenBox model
        this.greenBoxObject = this.objects.add({
            base: this.resources.items.greenBoxBase.scene,
            collision: null,
            offset: new THREE.Vector3(this.greenBox.x, this.greenBox.y, this.greenBox.z),
            rotation: new THREE.Euler(0, 0, 0.5),
            duplicated: true,
            shadow: { 
                sizeX: 0, 
                sizeY: 0, 
                offsetZ: -0.15, 
                alpha: 0.5 
            },
            mass: 0,
            soundName: "brick",
        })
        
        // Set up model
        if (this.greenBoxObject && this.greenBoxObject.container) {
            this.greenBoxObject.container.scale.set(
                this.modelSize.x, 
                this.modelSize.y, 
                this.modelSize.z
            );
            
            this.greenBoxObject.container.name = "greenBox_mainModel"
            
            // Find the pureUc mesh for the greenscreen
            this.pureUcMesh = null;
            this.greenscreenMesh = null;
            
            // Traverse the model to find the pureUc mesh
            this.greenBoxObject.container.traverse((child) => {
                if (child.isMesh) {
                    const originalName = child.name;
                    child.name = `greenBox_${originalName || 'mesh'}`;
                    
                    // Check if this is the pureUc mesh (primary target)
                    if (originalName && originalName.toLowerCase() === 'pureuc') {
                        this.greenscreenMesh = child;
                        this.pureUcMesh = child;
                        
                        // Store original material
                        if (!child.userData) child.userData = {};
                        child.userData.originalMaterial = child.material.clone();
                        
                        // Apply initial green material for visibility
                        child.material = new THREE.MeshBasicMaterial({ 
                            color: 0x00ff00,
                            side: THREE.DoubleSide
                        });
                        child.material.needsUpdate = true;
                    }
                }
            });
            
            // Add collision boxes
            this.addCollisions(this.greenBoxObject.container)
        }
    }
    
    updatePositions()
    {
        // Update model position
        if(this.greenBoxObject && this.greenBoxObject.container)
        {
            this.greenBoxObject.container.position.x = this.greenBox.x
            this.greenBoxObject.container.position.y = this.greenBox.y
            this.greenBoxObject.container.position.z = this.greenBox.z
        }
    }
    
    updateSizes()
    {
        // Update model scale
        if(this.greenBoxObject && this.greenBoxObject.container)
        {
            this.greenBoxObject.container.scale.set(
                this.modelSize.x, 
                this.modelSize.y, 
                this.modelSize.z
            )
        }
    }
    
    addCollisions(model) {
        // Add collision boxes around the greenbox
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-3, this.greenBox.y+1.9, this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.5, 2.5, 2)
        )
        
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-0.7, this.greenBox.y+5, this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(3, 0.5, 1.5)
        )
        
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-1.2, this.greenBox.y-2.5, this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.8, 0.6, 1.5)
        )
        
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x+3.2, this.greenBox.y-1.6, this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.7, 0.7, 1.5)
        )
    }
    
    addCollisionBox(position, rotation, halfExtents) {
        // Create physics body
        const boxShape = new CANNON.Box(halfExtents)

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y-1, position.z),
            material: this.physics.materials.items.floor
        })

        // Set rotation as quaternion
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ')
        body.quaternion.copy(quat)

        body.addShape(boxShape)
        this.physics.world.addBody(body)
    }
    
    createImageButtons() {
        if (!this.areas) {
            return;
        }
        
        // Button positions with more spacing between them
        this.buttonPositions = [
            new THREE.Vector2(-54.06, 6.0),   // First button
            new THREE.Vector2(-54.06, 3.0),   // Second button - tightened spacing
            new THREE.Vector2(-54.06, 0.0)    // Third button
        ]
        
        this.buttons = []
        
        // Create buttons for each image
        for (let i = 0; i < this.greenscreenImagePaths.length; i++) {
            try {
                // Create canvas for preview image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 256;
                
                // Fill with placeholder color and text
                ctx.fillStyle = '#333333';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#00aa00';
                ctx.fillRect(10, 10, canvas.width-20, canvas.height-20);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`Image ${i+1}`, canvas.width/2, canvas.height/2);
                
                // Create texture from canvas
                const buttonTexture = new THREE.CanvasTexture(canvas);
                buttonTexture.needsUpdate = true;
                
                // Make buttons fit better in the interaction area
                const buttonGeometry = new THREE.PlaneGeometry(2.5, 1.5);
                const buttonMaterial = new THREE.MeshBasicMaterial({ 
                    map: buttonTexture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                
                const buttonMesh = new THREE.Mesh(buttonGeometry, buttonMaterial);
                buttonMesh.position.set(
                    this.buttonPositions[i].x,
                    this.buttonPositions[i].y,
                    0.1 // Positioned very close to the ground
                );
                
                // Add a frame around the button
                const frameGeometry = new THREE.EdgesGeometry(buttonGeometry);
                const frameMaterial = new THREE.LineBasicMaterial({ 
                    color: 0xffff00, // Bright yellow for better visibility
                    linewidth: 3
                });
                const frame = new THREE.LineSegments(frameGeometry, frameMaterial);
                buttonMesh.add(frame);
                
                // Add label below the button
                const labelCanvas = document.createElement('canvas');
                const context = labelCanvas.getContext('2d');
                labelCanvas.width = 256;
                labelCanvas.height = 64;
                context.fillStyle = 'white';
                context.font = 'bold 32px Arial';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(`Image ${i+1}`, labelCanvas.width/2, labelCanvas.height/2);
                
                const labelTexture = new THREE.CanvasTexture(labelCanvas);
                const labelMaterial = new THREE.MeshBasicMaterial({
                    map: labelTexture,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });
                
                const labelGeometry = new THREE.PlaneGeometry(2.5, 0.5);
                const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
                labelMesh.position.set(0, -1.0, 0.1); // Position below the button
                buttonMesh.add(labelMesh);
                
                // Create a visible base for the button
                const baseGeometry = new THREE.PlaneGeometry(2.7, 1.7);
                const baseMaterial = new THREE.MeshBasicMaterial({ 
                    color: 0x222222,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide
                });
                const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
                baseMesh.position.z = -0.01; // Slightly behind the button
                buttonMesh.add(baseMesh);
                
                this.container.add(buttonMesh);
                this.buttons.push(buttonMesh);
                
                // Load the preview image
                this.loadPreviewImage(i, buttonMaterial);
                
                // Add interaction area - make it match the button size
                const buttonArea = this.areas.add({
                    position: this.buttonPositions[i],
                    halfExtents: new THREE.Vector2(1.5, 1.2), // Adjusted to match button size
                    testCar: true
                });
                
                if (!buttonArea) {
                    continue;
                }
                
                // Button interaction
                buttonArea.on('interact', () => {
                    this.changeGreenscreenTexture(i);
                });
                
                // Add a highlighter to show when car is over button
                buttonArea.on('in', () => {
                    baseMesh.material.color.set(0x444444);
                    frame.material.color.set(0xff0000); // Red when active
                    
                    // Store the active button index
                    this.activeButtonIndex = i;
                    
                    // Show a message to press Enter
                    if (this.car && this.car.message) {
                        this.car.message.set('Press Enter to select image');
                    }
                });
                
                buttonArea.on('out', () => {
                    baseMesh.material.color.set(0x222222);
                    frame.material.color.set(0xffff00);
                    
                    // Clear active button index if this was the active one
                    if (this.activeButtonIndex === i) {
                        this.activeButtonIndex = -1;
                    }
                    
                    // Clear message
                    if (this.car && this.car.message) {
                        this.car.message.clear();
                    }
                });
                
                // Add event listener for Enter key
                const keyListener = (event) => {
                    if ((event.key === 'Enter' || event.key === 'e' || event.key === 'E') && buttonArea.isIn) {
                        this.changeGreenscreenTexture(i);
                        event.preventDefault();
                    }
                };
                
                window.addEventListener('keydown', keyListener);
                
                // Store listener for potential cleanup
                buttonMesh.userData = { keyListener };
            } catch (error) {
                console.error(`Error creating button ${i}:`, error);
            }
        }
    }
    
    loadPreviewImage(index, buttonMaterial) {
        try {
            // Use TextureLoader for more reliable texture loading
            const textureLoader = new THREE.TextureLoader();
            const imagePath = this.greenscreenImagePaths[index];
            
            textureLoader.load(
                imagePath,
                (texture) => {
                    // Create a canvas to draw the texture
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 256;
                    
                    // Draw background
                    ctx.fillStyle = '#333333';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Create a temporary image to ensure dimensions are available
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        // Calculate aspect ratio to fit image properly
                        const imgAspect = tempImg.width / tempImg.height;
                        
                        // Leave space for label at bottom (30px) and margins (10px each side)
                        const availWidth = canvas.width - 20;
                        const availHeight = canvas.height - 40;
                        
                        let drawWidth, drawHeight;
                        
                        if (imgAspect > 1) {
                            // Wider image
                            drawWidth = availWidth;
                            drawHeight = drawWidth / imgAspect;
                        } else {
                            // Taller image
                            drawHeight = availHeight;
                            drawWidth = drawHeight * imgAspect;
                        }
                        
                        // Center the image
                        const xPos = (canvas.width - drawWidth) / 2;
                        const yPos = (availHeight - drawHeight) / 2;
                        
                        // Draw image centered with margin
                        ctx.drawImage(tempImg, xPos, yPos, drawWidth, drawHeight);
                        
                        // Add a nice border around the image
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(xPos, yPos, drawWidth, drawHeight);
                        
                        // Add a label at the bottom
                        ctx.fillStyle = 'rgba(0,0,0,0.7)';
                        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 18px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(`Image ${index+1}`, canvas.width/2, canvas.height - 15);
                        
                        // Create texture from canvas
                        const buttonTexture = new THREE.CanvasTexture(canvas);
                        buttonTexture.needsUpdate = true;
                        
                        // Update button material
                        buttonMaterial.map = buttonTexture;
                        buttonMaterial.needsUpdate = true;
                    };
                    
                    // Use the texture's image as source
                    if (texture.image) {
                        tempImg.src = texture.image.src;
                    }
                }
            );
        } catch (error) {
            console.error(`Error setting up preview image ${index}:`, error);
        }
    }
    
    changeGreenscreenTexture(imageIndex) {
        try {
            // Always use the pureUc mesh
            if (this.pureUcMesh) {
                this.greenscreenMesh = this.pureUcMesh;
            }
            
            if (!this.greenscreenMesh) {
                return;
            }
            
            // If the same image is selected, do nothing
            if (this.currentImageIndex === imageIndex) {
                return;
            }
            
            this.currentImageIndex = imageIndex;
            
            // Show loading state
            this.greenscreenMesh.material = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff, // Bright cyan for better visibility
                side: THREE.DoubleSide
            });
            this.greenscreenMesh.material.needsUpdate = true;
            
            // Get the image path
            const imagePath = this.greenscreenImagePaths[imageIndex];
            
            // Use TextureLoader for texture loading
            const textureLoader = new THREE.TextureLoader();
            
            textureLoader.load(
                imagePath,
                (texture) => {
                    // Configure texture for optimal visibility
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.minFilter = THREE.LinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    
                    let finalTexture = texture;
                    finalTexture.needsUpdate = true;
                    
                    // Get mesh dimensions
                    const box = new THREE.Box3().setFromObject(this.greenscreenMesh);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    
                    // TEXTURE MAPPING SETTINGS
                    const orientation = 'yz';
                    const textureScale = 1;
                    const offsetX = 0.0;
                    const offsetY = 0.0;
                    const flipX = false;
                    const flipY = false;
                    const rotationDegrees = 180;
                    
                    // Reset texture mapping
                    finalTexture.rotation = 0;
                    finalTexture.center.set(0.5, 0.5);
                    finalTexture.repeat.set(1, 1);
                    finalTexture.offset.set(0, 0);
                    
                    // Get texture aspect ratio
                    const textureAspect = finalTexture.image.width / finalTexture.image.height;
                    
                    // Apply mapping based on selected orientation
                    if (orientation === 'xy') {
                        const meshAspect = size.x / size.y;
                        
                        // Scale to fill the mesh
                        if (textureAspect > meshAspect) {
                            // Texture is wider - fit to height
                            finalTexture.repeat.set(meshAspect / textureAspect, 1);
                            finalTexture.offset.x = (1 - finalTexture.repeat.x) / 2;
                        } else {
                            // Texture is taller - fit to width
                            finalTexture.repeat.set(1, textureAspect / meshAspect);
                            finalTexture.offset.y = (1 - finalTexture.repeat.y) / 2;
                        }
                    } 
                    else if (orientation === 'xz') {
                        const meshAspect = size.x / size.z;
                        
                        // Scale to fill the mesh
                        if (textureAspect > meshAspect) {
                            // Texture is wider - fit to depth
                            finalTexture.repeat.set(meshAspect / textureAspect, 1);
                            finalTexture.offset.x = (1 - finalTexture.repeat.x) / 2;
                        } else {
                            // Texture is taller - fit to width
                            finalTexture.repeat.set(1, textureAspect / meshAspect);
                            finalTexture.offset.y = (1 - finalTexture.repeat.y) / 2;
                        }
                    }
                    else if (orientation === 'yz') {
                        const meshAspect = size.y / size.z;
                        
                        // Scale to fill the mesh
                        if (textureAspect > meshAspect) {
                            // Texture is wider - fit to depth
                            finalTexture.repeat.set(meshAspect / textureAspect, 1);
                            finalTexture.offset.x = (1 - finalTexture.repeat.x) / 2;
                        } else {
                            // Texture is taller - fit to height
                            finalTexture.repeat.set(1, textureAspect / meshAspect);
                            finalTexture.offset.y = (1 - finalTexture.repeat.y) / 2;
                        }
                    }
                    
                    // Apply texture scale
                    finalTexture.repeat.multiplyScalar(textureScale);
                    
                    // Apply flipping if enabled
                    if (flipX) {
                        finalTexture.repeat.x = -finalTexture.repeat.x;
                        finalTexture.offset.x = 1 - finalTexture.offset.x;
                    }
                    
                    if (flipY) {
                        finalTexture.repeat.y = -finalTexture.repeat.y;
                        finalTexture.offset.y = 1 - finalTexture.offset.y;
                    }
                    
                    // Apply custom offsets for fine-tuning texture position
                    finalTexture.offset.x += offsetX;
                    finalTexture.offset.y += offsetY;
                    
                    // Apply rotation to the texture (in radians)
                    finalTexture.rotation = (rotationDegrees * Math.PI) / 180;
                    finalTexture.center.set(0.5, 0.5); // Rotate around center
                    
                    // Create material with enhanced settings for visibility
                    const material = new THREE.MeshBasicMaterial({
                        map: finalTexture,
                        side: THREE.DoubleSide,
                        color: 0xffffff // Full white to show texture without tint
                    });
                    
                    // Apply material
                    this.greenscreenMesh.material = material;
                    this.greenscreenMesh.material.needsUpdate = true;
                    
                    // Ensure the mesh is visible
                    this.greenscreenMesh.visible = true;
                    
                    // Bring the mesh to the front of the rendering queue
                    this.greenscreenMesh.renderOrder = 1000;
                    
                    // Play sound
                    if (this.sounds) {
                        this.sounds.play('click');
                    }
                },
                undefined,
                (error) => {
                    console.error(`Error loading texture:`, error);
                    
                    // Set error state
                    this.greenscreenMesh.material = new THREE.MeshBasicMaterial({ 
                        color: 0xff0000,
                        side: THREE.DoubleSide
                    });
                    this.greenscreenMesh.material.needsUpdate = true;
                }
            );
        } catch (error) {
            console.error("Error changing greenscreen texture:", error);
        }
    }
}