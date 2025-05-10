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
        this.container.position.set(-20, -20, 0)
        
        // Add lights to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.container.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.container.add(directionalLight);

        const pointLight1 = new THREE.PointLight(0xff0000, 1, 100);
        pointLight1.position.set(-5, 5, 5);
        this.container.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x00ff00, 1, 100);
        pointLight2.position.set(5, -5, 5);
        this.container.add(pointLight2);

        const pointLight3 = new THREE.PointLight(0x0000ff, 1, 100);
        pointLight3.position.set(0, 0, -5);
        this.container.add(pointLight3);
        
        // Enhance the model's materials to make colors more vibrant
        this.model.traverse((child) => {
            if (child.isMesh && child.material) {
                // Convert to MeshStandardMaterial for better lighting
                const standardMaterial = new THREE.MeshStandardMaterial();
                
                // Copy properties from original material
                if (child.material.color) {
                    standardMaterial.color = child.material.color;
                    // Increase color saturation
                    const color = standardMaterial.color;
                    const hsl = {};
                    color.getHSL(hsl);
                    hsl.s = Math.min(hsl.s * 1.3, 1); // Increase saturation by 30%
                    hsl.l = Math.min(hsl.l * 1.1, 1); // Increase lightness by 10%
                    color.setHSL(hsl.h, hsl.s, hsl.l);
                }
                
                // Set material properties for better appearance
                standardMaterial.metalness = 0.2;
                standardMaterial.roughness = 0.5;
                standardMaterial.envMapIntensity = 1.0;
                
                // Apply the new material
                child.material = standardMaterial;
            }
        });
        
        // Add the model to the container
        this.container.add(this.model)
        this.container.updateMatrix()
    }
} 