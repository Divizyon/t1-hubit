import * as THREE from 'three'
import EventEmitter from './EventEmitter'

export default class CoordinatesTracker extends EventEmitter
{
    constructor(_options)
    {
        super()

        this.camera = _options.camera
        this.renderer = _options.renderer
        this.scene = _options.scene
        this.physics = _options.physics
        this.time = _options.time
        this.debug = _options.debug
        
        this.active = true
        this.mousePosition = new THREE.Vector2()
        this.raycaster = new THREE.Raycaster()
        this.currentPosition = new THREE.Vector3()
        
        this.setUI()
        this.setEvents()
        
        // Debug folder
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('coordinates tracker')
            this.debugFolder.add(this, 'active').name('active')
            this.debugFolder.add(this, 'copyCoordinates').name('copy coordinates')
        }
    }
    
    setUI()
    {
        // Create UI Container
        this.$container = document.createElement('div')
        this.$container.style.position = 'fixed'
        this.$container.style.top = '10px'
        this.$container.style.right = '10px'
        this.$container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        this.$container.style.color = 'white'
        this.$container.style.padding = '10px'
        this.$container.style.borderRadius = '4px'
        this.$container.style.fontFamily = 'monospace'
        this.$container.style.fontSize = '12px'
        this.$container.style.pointerEvents = 'none'
        this.$container.style.userSelect = 'none'
        this.$container.style.zIndex = '1000'
        this.$container.style.transition = 'opacity 0.3s ease'
        document.body.appendChild(this.$container)
        
        // Create coordinates display
        this.$coordinates = document.createElement('div')
        this.$coordinates.innerHTML = 'X: 0 | Y: 0 | Z: 0'
        this.$container.appendChild(this.$coordinates)
        
        // Create copy hint
        this.$hint = document.createElement('div')
        this.$hint.innerHTML = 'Press C to copy'
        this.$hint.style.marginTop = '5px'
        this.$hint.style.fontSize = '10px'
        this.$hint.style.opacity = '0.7'
        this.$container.appendChild(this.$hint)
        
        // Create copy feedback
        this.$feedback = document.createElement('div')
        this.$feedback.innerHTML = 'Copied!'
        this.$feedback.style.position = 'fixed'
        this.$feedback.style.top = '50%'
        this.$feedback.style.left = '50%'
        this.$feedback.style.transform = 'translate(-50%, -50%)'
        this.$feedback.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
        this.$feedback.style.color = 'white'
        this.$feedback.style.padding = '10px 20px'
        this.$feedback.style.borderRadius = '4px'
        this.$feedback.style.fontFamily = 'monospace'
        this.$feedback.style.fontSize = '14px'
        this.$feedback.style.pointerEvents = 'none'
        this.$feedback.style.userSelect = 'none'
        this.$feedback.style.zIndex = '2000'
        this.$feedback.style.opacity = '0'
        this.$feedback.style.transition = 'opacity 0.3s ease'
        document.body.appendChild(this.$feedback)
    }
    
    setEvents()
    {
        // Mouse move event
        window.addEventListener('mousemove', (event) => 
        {
            this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1
            this.mousePosition.y = - (event.clientY / window.innerHeight) * 2 + 1
        })
        
        // Keyboard event for copying coordinates
        window.addEventListener('keydown', (event) => 
        {
            if(event.code === 'KeyC' && this.active)
            {
                this.copyCoordinates()
            }
        })
        
        // Update on tick
        this.time.on('tick', () => 
        {
            if(this.active)
            {
                this.updateCoordinates()
            }
            
            // Update visibility based on active state
            this.$container.style.opacity = this.active ? '1' : '0'
        })
    }
    
    updateCoordinates()
    {
        // Update raycaster
        this.raycaster.setFromCamera(this.mousePosition, this.camera.instance)
        
        // Create a plane at z=0 to get coordinates
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        const targetPoint = new THREE.Vector3()
        
        // Find intersection with z=0 plane
        this.raycaster.ray.intersectPlane(plane, targetPoint)
        
        // Update current position
        this.currentPosition.copy(targetPoint)
        
        // Format coordinates
        const x = this.currentPosition.x.toFixed(2)
        const y = this.currentPosition.y.toFixed(2)
        const z = this.currentPosition.z.toFixed(2)
        
        // Update UI
        this.$coordinates.innerHTML = `X: ${x} | Y: ${y} | Z: ${z}`
    }
    
    copyCoordinates()
    {
        // Format the text to copy
        const text = `${this.currentPosition.x.toFixed(2)}, ${this.currentPosition.y.toFixed(2)}, ${this.currentPosition.z.toFixed(2)}`
        
        // Copy to clipboard using the Clipboard API
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            this.$feedback.style.opacity = '1'
            
            // Hide feedback after a delay
            setTimeout(() => {
                this.$feedback.style.opacity = '0'
            }, 1500)
        })
        
        // Trigger event for other components
        this.trigger('copy', [this.currentPosition.clone()])
    }
} 