import * as THREE from 'three'
import EventEmitter from '../Utils/EventEmitter.js'

/**
 * This class demonstrates how to access and manipulate individual models 
 * from the complete scene model registry
 */
export default class SceneModelTest extends EventEmitter {
    constructor(_options) {
        super()

        // Options
        this.completeScene = _options.completeScene
        this.debug = _options.debug
        this.time = _options.time

        // Set up
        this.isActive = false

        // Debug
        if(this.debug) {
            this.debugFolder = this.debug.addFolder('sceneModelTest')
            this.debugFolder.add(this, 'isActive').name('Enable tests').onChange(() => {
                if(this.isActive) this.activateTests()
                else this.deactivateTests()
            })
        }
    }

    /**
     * Print all available models in the registry to console
     */
    printAllAvailableModels() {
        console.log('Available models in the registry:')
        
        const models = Object.keys(this.completeScene.modelRegistry)
        models.sort().forEach(key => {
            console.log(`- ${key}`)
        })
        
        return models
    }

    /**
     * Example of accessing a specific model by its path
     * @param {string} path - The path to the model in the registry
     */
    highlightModel(path) {
        const model = this.completeScene.getModel(path)
        
        if(!model) {
            console.warn(`Model "${path}" not found in registry`)
            return
        }
        
        // Store original material to restore later
        if(!model.userData.originalMaterial && model.material) {
            model.userData.originalMaterial = model.material
        }
        
        // Create highlight material if it's a mesh
        if(model.isMesh && model.material) {
            const highlightMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                wireframe: true
            })
            model.material = highlightMaterial
        }
        
        console.log(`Highlighted model: ${path}`)
    }

    /**
     * Restore original material for a model
     * @param {string} path - The path to the model in the registry
     */
    restoreModel(path) {
        const model = this.completeScene.getModel(path)
        
        if(!model) {
            console.warn(`Model "${path}" not found in registry`)
            return
        }
        
        // Restore original material
        if(model.userData.originalMaterial) {
            model.material = model.userData.originalMaterial
        }
        
        console.log(`Restored model: ${path}`)
    }

    /**
     * Move a model to a new position
     * @param {string} path - The path to the model in the registry
     * @param {Object} position - The new position {x, y, z}
     */
    moveModel(path, position) {
        this.completeScene.manipulateModel(path, (model) => {
            model.position.set(position.x, position.y, position.z)
            console.log(`Moved model "${path}" to position:`, position)
        })
    }

    /**
     * Rotate a model
     * @param {string} path - The path to the model in the registry
     * @param {Object} rotation - The rotation in radians {x, y, z}
     */
    rotateModel(path, rotation) {
        this.completeScene.manipulateModel(path, (model) => {
            model.rotation.set(rotation.x, rotation.y, rotation.z)
            console.log(`Rotated model "${path}" to rotation:`, rotation)
        })
    }

    /**
     * Scale a model
     * @param {string} path - The path to the model in the registry
     * @param {Object|Number} scale - The scale {x, y, z} or a single number for uniform scale
     */
    scaleModel(path, scale) {
        this.completeScene.manipulateModel(path, (model) => {
            if(typeof scale === 'number') {
                model.scale.set(scale, scale, scale)
            } else {
                model.scale.set(scale.x, scale.y, scale.z)
            }
            console.log(`Scaled model "${path}" to scale:`, scale)
        })
    }

    /**
     * Example test routine to demonstrate accessing and manipulating models
     */
    activateTests() {
        this.isActive = true
        console.log('Starting scene model tests...')
        
        // Print all available models
        const availableModels = this.printAllAvailableModels()
        
        // If we have models, demo with the first one
        if(availableModels.length > 0) {
            const testModelPath = availableModels[0]
            
            // Highlight the model
            this.highlightModel(testModelPath)
            
            // Schedule animation demonstration
            let time = 0
            this.testTickHandler = () => {
                time += 0.016 // Approx 60fps
                
                // Move the model in a circular pattern
                this.completeScene.manipulateModel(testModelPath, (model) => {
                    const originalPosition = model.userData.originalPosition || {
                        x: model.position.x,
                        y: model.position.y,
                        z: model.position.z
                    }
                    
                    // Store original position if not already saved
                    if(!model.userData.originalPosition) {
                        model.userData.originalPosition = { ...originalPosition }
                    }
                    
                    // Apply circular motion
                    model.position.x = originalPosition.x + Math.sin(time) * 2
                    model.position.y = originalPosition.y + Math.cos(time) * 2
                    
                    // Apply pulsing scale
                    const scale = 1 + Math.sin(time * 2) * 0.2
                    model.scale.set(scale, scale, scale)
                })
            }
            
            // Add to tick handler
            this.time.on('tick', this.testTickHandler)
            
            console.log(`Animating model: ${testModelPath}`)
        }
    }

    deactivateTests() {
        this.isActive = false
        console.log('Stopping scene model tests...')
        
        // Remove tick handler
        if(this.testTickHandler) {
            this.time.off('tick', this.testTickHandler)
            this.testTickHandler = null
        }
        
        // Restore all models that might have been modified
        const availableModels = Object.keys(this.completeScene.modelRegistry)
        availableModels.forEach(path => {
            const model = this.completeScene.getModel(path)
            
            // Restore original material
            if(model.userData.originalMaterial) {
                model.material = model.userData.originalMaterial
                delete model.userData.originalMaterial
            }
            
            // Restore original position
            if(model.userData.originalPosition) {
                model.position.set(
                    model.userData.originalPosition.x,
                    model.userData.originalPosition.y,
                    model.userData.originalPosition.z
                )
                delete model.userData.originalPosition
            }
            
            // Restore original scale
            model.scale.set(1, 1, 1)
        })
        
        console.log('All models restored to original state')
    }
} 