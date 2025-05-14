import * as THREE from 'three'
import EventEmitter from '../Utils/EventEmitter.js'
import Area from './Area.js'

export default class Areas extends EventEmitter
{
    constructor(_options)
    {
        super()

        // Options
        this.config = _options.config
        this.resources = _options.resources
        this.renderer = _options.renderer
        this.car = _options.car
        this.sounds = _options.sounds
        this.time = _options.time
        this.camera = _options.camera
        
        if(_options.debug)
        {
            this.debug = _options.debug.addFolder('areas')
            this.debugFolder = this.debug
            // this.debug.open()
        }

        // Set up
        this.items = []
        this.interactionDistance = 1.5
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setTesting()
        this.setInteraction()
    }

    setMouse()
    {
        // Set up
        this.mouse = {}
        this.mouse.raycaster = new THREE.Raycaster()
        this.mouse.coordinates = new THREE.Vector2()
        this.mouse.currentArea = null
        this.mouse.needsUpdate = false

        // Mouse move event
        window.addEventListener('mousemove', (_event) =>
        {
            this.mouse.coordinates.x = (_event.clientX / window.innerWidth) * 2 - 1
            this.mouse.coordinates.y = - (_event.clientY / window.innerHeight) * 2 + 1

            this.mouse.needsUpdate = true
        })

        // Mouse click event
        window.addEventListener('mousedown', () =>
        {
            if(this.mouse.currentArea)
            {
                this.mouse.currentArea.interact(false)
            }
        })

        // Touch
        this.renderer.domElement.addEventListener('touchstart', (_event) =>
        {
            this.mouse.coordinates.x = (_event.changedTouches[0].clientX / window.innerWidth) * 2 - 1
            this.mouse.coordinates.y = - (_event.changedTouches[0].clientY / window.innerHeight) * 2 + 1

            this.mouse.needsUpdate = true
        })

        // Time tick event
        this.time.on('tick', () =>
        {
            // Only update if needed
            if(this.mouse.needsUpdate)
            {
                this.mouse.needsUpdate = false

                // Set up
                this.mouse.raycaster.setFromCamera(this.mouse.coordinates, this.camera.instance)
                const objects = this.items.map((_area) => _area.mouseMesh)
                const intersects = this.mouse.raycaster.intersectObjects(objects)

                // Intersections found
                if(intersects.length)
                {
                    // Find the area
                    const area = this.items.find((_area) => _area.mouseMesh === intersects[0].object)

                    // Area did change
                    if(area !== this.mouse.currentArea)
                    {
                        // Was previously over an area
                        if(this.mouse.currentArea !== null)
                        {
                            // Play out
                            this.mouse.currentArea.out()
                            this.mouse.currentArea.testCar = this.mouse.currentArea.initialTestCar
                        }

                        // Play in
                        this.mouse.currentArea = area
                        this.mouse.currentArea.in(false)
                        this.mouse.currentArea.testCar = false
                    }
                }
                // No intersections found but was previously over an area
                else if(this.mouse.currentArea !== null)
                {
                    // Play out
                    this.mouse.currentArea.out()
                    this.mouse.currentArea.testCar = this.mouse.currentArea.initialTestCar
                    this.mouse.currentArea = null
                }
            }
        })
    }

    add(_options)
    {
        const area = new Area({
            ..._options,
            config: this.config,
            resources: this.resources,
            renderer: this.renderer,
            debug: this.debugFolder,
            time: this.time
        })
        
        this.container.add(area.container)
        this.items.push(area)
        
        return area
    }

    setTesting()
    {
        if(this.debug)
        {
            this.testing = {}

            this.testing.active = true
            this.testing.position = {}
            this.testing.position.x = 0
            this.testing.position.y = 0
            this.testing.position.z = 0
            
            // this.testing.helper = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
            this.testing.helper = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
            this.testing.helper.position.x = this.testing.position.x
            this.testing.helper.position.y = this.testing.position.y
            this.testing.helper.position.z = this.testing.position.z
            this.testing.helper.visible = this.testing.active
            this.container.add(this.testing.helper)

            this.debug.add(this.testing, 'active').name('testing active').onChange(() =>
            {
                this.testing.helper.visible = this.testing.active
            })

            this.debug.add(this.testing.position, 'x').step(0.1).min(- 20).max(20).name('testing x').onChange(() =>
            {
                this.testing.helper.position.x = this.testing.position.x
            })

            this.debug.add(this.testing.position, 'y').step(0.1).min(- 20).max(20).name('testing y').onChange(() =>
            {
                this.testing.helper.position.y = this.testing.position.y
            })

            this.debug.add(this.testing.position, 'z').step(0.1).min(- 20).max(20).name('testing z').onChange(() =>
            {
                this.testing.helper.position.z = this.testing.position.z
            })
        }
    }

    setInteraction()
    {
        this.time.on('tick', () =>
        {
            if(!this.car)
                return
                
            // Test each area
            for(const _area of this.items)
            {
                if(!_area.interactable)
                    continue

                if(!_area.active)
                    continue
                
                const distance = Math.hypot(_area.position.x - this.car.chassis.object.position.x, _area.position.y - this.car.chassis.object.position.y)
                
                // In
                if(distance < this.interactionDistance)
                {
                    // If wasn't in before
                    if(!_area.isIn)
                    {
                        // console.log('in')
                        _area.isIn = true
                        _area.trigger('in')
                        this.sounds && this.sounds.play('areaIn')
                        this.trigger('in', [_area])
                    }

                    // Didn't interact before and has key
                    if(!_area.didInteract && (this.car.controls.actions.up || this.car.controls.actions.down || this.car.controls.actions.interact))
                    {
                        // console.log('interact')
                        _area.didInteract = true
                        _area.trigger('interact')
                        this.sounds && this.sounds.play('areaInteract')
                        this.trigger('interact', [_area])
                    }
                }
                
                // Out
                else if(distance >= this.interactionDistance)
                {
                    // If was in before
                    if(_area.isIn)
                    {
                        // console.log('out')
                        _area.isIn = false
                        _area.didInteract = false
                        _area.trigger('out')
                        this.trigger('out', [_area])
                    }
                }
            }
        })
    }
}
