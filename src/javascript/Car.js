constructor(_options)
{
    // Options
    this.time = _options.time
    this.resources = _options.resources
    this.objects = _options.objects
    this.physics = _options.physics
    this.shadows = _options.shadows
    this.materials = _options.materials
    this.controls = _options.controls
    this.sounds = _options.sounds
    this.renderer = _options.renderer
    this.camera = _options.camera
    this.debug = _options.debug
    this.config = _options.config

    // Set up
    this.container = new THREE.Object3D()
    this.position = new THREE.Vector3()

    // Greenbox reference
    this.greenboxPosition = null
    this.distanceThreshold = 5 // Mesafe eşiği 5 birime ayarlandı

    // Update position in tick event
    this.time.on('tick', () => {
        if (this.chassis && this.chassis.object) {
            // Update car position
            this.position.copy(this.chassis.object.position)
        }
    })
} 