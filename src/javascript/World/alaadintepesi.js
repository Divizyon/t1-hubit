import * as THREE from 'three'

export default class AlaadinTepesi
{
    constructor(_options)
    {
        // Options
        this.resources = _options.resources
        this.debug = _options.debug
        this.scene = _options.scene
        this.world = _options.world

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.scene.add(this.container)

        this.setModel()

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('alaadinTepesi')
            this.debugFolder.add(this.container.position, 'x').name('positionX').min(-50).max(50).step(0.1)
            this.debugFolder.add(this.container.position, 'y').name('positionY').min(-50).max(50).step(0.1)
            this.debugFolder.add(this.container.position, 'z').name('positionZ').min(-50).max(50).step(0.1)
        }
    }

    setModel()
    {
        // Load the model from resources
        this.model = this.resources.items.alaadinTepesiModel.scene

        // Set the position as requested
        this.container.position.set(-20, 30, 0)
        
        // Enhance the model's materials to make colors more vibrant
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Check if it's a material with color property
                if (child.material.color) {
                    // Increase color saturation slightly
                    const color = child.material.color;
                    const hsl = {};
                    color.getHSL(hsl);
                    
                    // Increase saturation by 15% but cap at 1
                    hsl.s = Math.min(hsl.s * 1.15, 1);
                    
                    // Slightly increase the lightness to make colors pop, but not too much
                    hsl.l = Math.min(hsl.l * 1.05, 1);
                    
                    color.setHSL(hsl.h, hsl.s, hsl.l);
                    
                    // Add a small amount of emissive to make it glow slightly
                    if (!child.material.emissive) {
                        child.material.emissive = new THREE.Color(0x000000);
                    }
                    
                    // Set emissive to a very subtle version of the base color
                    child.material.emissive.copy(color).multiplyScalar(0.05);
                    
                    // Slightly increase the material's reflectivity if it exists
                    if (child.material.shininess !== undefined) {
                        child.material.shininess *= 1.2;
                    }
                }
            }
        });
        
        // Add the model to the container
        this.container.add(this.model)
        this.container.updateMatrix()
    }
} 