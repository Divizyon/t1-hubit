import * as THREE from 'three'
import * as dat from 'dat.gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import World from './World/index.js'
import Resources from './Resources.js'
import Camera from './Camera.js'
import ThreejsJourney from './ThreejsJourney.js'
import CoordinatesTracker from './Utils/CoordinatesTracker.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import BlurPass from './Passes/Blur.js'
import GlowsPass from './Passes/Glows.js'

export default class Application {
    /**
     * Constructor
     */
    constructor(_options) {
        // Options
        this.$canvas = _options.$canvas

        // Set up
        this.time = new Time()
        this.sizes = new Sizes()
        this.resources = new Resources()

        // Create the loading screen
        this.createLoadingScreen()

        this.setConfig()
        this.setDebug()
        this.setRenderer()
        this.setCamera()
        this.setPasses()
        this.setWorld()
        this.setTitle()
        this.setThreejsJourney()
        this.setCoordinatesTracker()
    }

    /**
     * Create Hubit Konya loading screen
     */
    createLoadingScreen() {
        // Get references to existing loading screen elements
        const loadingScreen = document.getElementById('hubit-loading-screen');
        const progressBar = document.getElementById('hubit-progress');
        const loadingText = document.getElementById('hubit-loading-text');
        const startButton = document.getElementById('hubit-start-button');
        const title = document.getElementById('hubit-title');
        const subtitle = document.getElementById('hubit-subtitle');
        const slideshowImages = document.querySelectorAll('.slideshow-image');
        const locationBadge = document.getElementById('location-badge');
        
        // Make sure all necessary elements exist
        if (!loadingScreen || !progressBar || !loadingText || !startButton || !title) {
            console.error('Missing loading screen elements in HTML!');
            return;
        }
        
        // Initially hide the start button
        startButton.style.display = 'none';
        startButton.style.opacity = '0';
        
        // Slideshow functionality
        let currentSlide = 0;
        
        // Show the first slide
        slideshowImages[currentSlide].style.opacity = '1';
        locationBadge.textContent = slideshowImages[currentSlide].getAttribute('data-location');
        locationBadge.style.opacity = '1';
        
        // Position the location badge based on screen size
        const positionLocationBadge = () => {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            if (windowWidth > 768) {
                locationBadge.style.bottom = '30px';
                locationBadge.style.right = '30px';
            } else {
                locationBadge.style.bottom = '20px';
                locationBadge.style.right = '20px';
            }
        };
        
        positionLocationBadge();
        window.addEventListener('resize', positionLocationBadge);
        
        // Start slideshow
        const slideshowInterval = setInterval(() => {
            // Fade out current slide
            slideshowImages[currentSlide].style.opacity = '0';
            locationBadge.style.opacity = '0';
            
            // Move to next slide
            currentSlide = (currentSlide + 1) % slideshowImages.length;
            
            // Delay showing next slide to allow for fade-out
            setTimeout(() => {
                slideshowImages[currentSlide].style.opacity = '1';
                locationBadge.textContent = slideshowImages[currentSlide].getAttribute('data-location');
                locationBadge.style.opacity = '1';
            }, 1000);
        }, 6000); // Change slide every 6 seconds
        
        // Handle progress updates
        this.resources.on('progress', (progress) => {
            progressBar.style.width = `${Math.floor(progress * 100)}%`;
            
            // Change loading text based on progress
            if (progress < 0.3) {
                loadingText.textContent = 'Konya modelleri yükleniyor...';
            } else if (progress < 0.6) {
                loadingText.textContent = '3D dünya hazırlanıyor...';
            } else if (progress < 0.9) {
                loadingText.textContent = 'Neredeyse hazır...';
            } else {
                loadingText.textContent = 'Tamamlandı!';
            }
        });
        
        // Handle loading complete
        this.resources.on('ready', () => {
            loadingText.style.opacity = '0';
            
            // Initialize world as soon as resources are ready
            if (!this.world) {
                this.setWorld();
            }
            
            if (this.world) {
                // Start the world immediately
                if (!this.world.started) {
                    this.world.start();
                }
                
                // Prepare everything but keep car hidden
                try {
                    // Set car position high in the sky but keep it hidden
                    if (this.world.physics && this.world.physics.car && this.world.physics.car.chassis) {
                        this.world.physics.car.chassis.body.position.set(0, 0, 50);
                        this.world.physics.car.chassis.body.velocity.set(0, 0, 0);
                        this.world.physics.car.chassis.body.angularVelocity.set(0, 0, 0);
                        this.world.physics.car.chassis.body.sleep(); // Keep it sleeping until user starts
                    }
                    
                    // Make sure car is initially hidden
                    if (this.world.car && this.world.car.chassis && this.world.car.chassis.object) {
                        this.world.car.chassis.object.visible = false;
                    }
                } catch(e) {
                    console.warn('Error accessing car properties during initialization:', e);
                }
            }
            
            // Show the start button with animation
            setTimeout(() => {
                startButton.style.display = 'block';
                
                setTimeout(() => {
                    startButton.style.opacity = '1';
                    startButton.style.transform = 'translateY(0)';
                }, 50);
            }, 500);
        });
        
        // Fallback in case the ready event doesn't fire
        setTimeout(() => {
            if (startButton.style.display !== 'block') {
                console.log('Loading timeout reached, showing start button anyway');
                progressBar.style.width = '100%';
                loadingText.textContent = 'Tamamlandı!';
                loadingText.style.opacity = '0';
                
                // Initialize world in case it hasn't been done yet
                if (!this.world || !this.world.started) {
                    if (!this.world) {
                        this.setWorld();
                    }
                    if (this.world && !this.world.started) {
                        this.world.start();
                    }
                }
                
                setTimeout(() => {
                    startButton.style.display = 'block';
                    setTimeout(() => {
                        startButton.style.opacity = '1';
                        startButton.style.transform = 'translateY(0)';
                    }, 50);
                }, 500);
            }
        }, 8000);
        
        // Handle start button click - now it just triggers the animation
        startButton.addEventListener('click', () => {
            // Stop the slideshow
            clearInterval(slideshowInterval);
            
            // Hide loading screen with animation
            title.style.transform = 'translateY(-100px)';
            title.style.opacity = '0';
            subtitle.style.opacity = '0';
            startButton.style.opacity = '0';
            locationBadge.style.opacity = '0';
            
            // Fade out loading screen
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
            }, 300);
            
            // World should already be initialized, just make sure
            if (!this.world) {
                this.setWorld();
            }
            
            if (!this.world.started) {
                this.world.start();
            }
            
            try {
                // Make car visible and wake it up
                if (this.world.physics && this.world.physics.car && this.world.physics.car.chassis) {
                    this.world.physics.car.chassis.body.wakeUp();
                }
                
                if (this.world.car && this.world.car.chassis && this.world.car.chassis.object) {
                    this.world.car.chassis.object.visible = true;
                }
            } catch(e) {
                console.warn('Error accessing car properties:', e);
            }
            
            // Reveal the world - start the animation
            if (this.world.reveal && typeof this.world.reveal.go === 'function') {
                this.world.reveal.go();
            } else {
                console.warn('World reveal not properly initialized');
            }
            
            // Remove loading screen after transition
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        });
    }

    /**
     * Set config
     */
    setConfig() {
        this.config = {}
        this.config.debug = window.location.hash === '#debug'
        this.config.cyberTruck = true
        this.config.touch = false

        window.addEventListener('touchstart', () => {
            this.config.touch = true
            this.world.controls.setTouch()

            this.passes.horizontalBlurPass.strength = 1
            this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(this.passes.horizontalBlurPass.strength, 0)
            this.passes.verticalBlurPass.strength = 1
            this.passes.verticalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(0, this.passes.verticalBlurPass.strength)
        }, { once: true })
    }

    /**
     * Set debug
     */
    setDebug() {
        if (this.config.debug) {
            this.debug = new dat.GUI({ width: 420 })
        }
    }

    /**
     * Set renderer
     */
    setRenderer() {
        // Scene
        this.scene = new THREE.Scene()

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.$canvas,
            alpha: true,
            powerPreference: 'high-performance'
        })
        // this.renderer.setClearColor(0x414141, 1)
        this.renderer.setClearColor(0x000000, 1)
        // this.renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio, 1.5), 2))
        this.renderer.setPixelRatio(2)
        this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
        this.renderer.autoClear = false

        // Resize event
        this.sizes.on('resize', () => {
            this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
        })
    }

    /**
     * Set camera
     */
    setCamera() {
        this.camera = new Camera({
            time: this.time,
            sizes: this.sizes,
            renderer: this.renderer,
            debug: this.debug,
            config: this.config
        })

        this.scene.add(this.camera.container)

        this.time.on('tick', () => {
            if (this.world && this.world.car) {
                this.camera.target.x = this.world.car.chassis.object.position.x
                this.camera.target.y = this.world.car.chassis.object.position.y
                this.camera.carX = this.world.car.chassis.object.position.x
                this.camera.carY = this.world.car.chassis.object.position.y

                // Update camera angle based on car position
                this.camera.updateCameraAngle(this.world.car.chassis.object.position)
            }
        })
    }

    setPasses() {
        this.passes = {}

        // Debug
        if (this.debug) {
            this.passes.debugFolder = this.debug.addFolder('postprocess')
            // this.passes.debugFolder.open()
        }

        this.passes.composer = new EffectComposer(this.renderer)

        // Create passes
        this.passes.renderPass = new RenderPass(this.scene, this.camera.instance)

        this.passes.horizontalBlurPass = new ShaderPass(BlurPass)
        this.passes.horizontalBlurPass.strength = this.config.touch ? 0 : 1
        this.passes.horizontalBlurPass.material.uniforms.uResolution.value = new THREE.Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
        this.passes.horizontalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(this.passes.horizontalBlurPass.strength, 0)

        this.passes.verticalBlurPass = new ShaderPass(BlurPass)
        this.passes.verticalBlurPass.strength = this.config.touch ? 0 : 1
        this.passes.verticalBlurPass.material.uniforms.uResolution.value = new THREE.Vector2(this.sizes.viewport.width, this.sizes.viewport.height)
        this.passes.verticalBlurPass.material.uniforms.uStrength.value = new THREE.Vector2(0, this.passes.verticalBlurPass.strength)

        // Debug
        if (this.debug) {
            const folder = this.passes.debugFolder.addFolder('blur')
            folder.open()

            folder.add(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, 'x').step(0.001).min(0).max(10)
            folder.add(this.passes.verticalBlurPass.material.uniforms.uStrength.value, 'y').step(0.001).min(0).max(10)
        }

        this.passes.glowsPass = new ShaderPass(GlowsPass)
        this.passes.glowsPass.color = '#ffcfe0'
        this.passes.glowsPass.material.uniforms.uPosition.value = new THREE.Vector2(0, 0.25)
        this.passes.glowsPass.material.uniforms.uRadius.value = 0.7
        this.passes.glowsPass.material.uniforms.uColor.value = new THREE.Color(this.passes.glowsPass.color)
        this.passes.glowsPass.material.uniforms.uColor.value.convertLinearToSRGB()
        this.passes.glowsPass.material.uniforms.uAlpha.value = 0.55

        // Debug
        if (this.debug) {
            const folder = this.passes.debugFolder.addFolder('glows')
            folder.open()

            folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'x').step(0.001).min(- 1).max(2).name('positionX')
            folder.add(this.passes.glowsPass.material.uniforms.uPosition.value, 'y').step(0.001).min(- 1).max(2).name('positionY')
            folder.add(this.passes.glowsPass.material.uniforms.uRadius, 'value').step(0.001).min(0).max(2).name('radius')
            folder.addColor(this.passes.glowsPass, 'color').name('color').onChange(() => {
                this.passes.glowsPass.material.uniforms.uColor.value = new THREE.Color(this.passes.glowsPass.color)
            })
            folder.add(this.passes.glowsPass.material.uniforms.uAlpha, 'value').step(0.001).min(0).max(1).name('alpha')
        }

        // Add passes
        this.passes.composer.addPass(this.passes.renderPass)
        this.passes.composer.addPass(this.passes.horizontalBlurPass)
        this.passes.composer.addPass(this.passes.verticalBlurPass)
        this.passes.composer.addPass(this.passes.glowsPass)

        // Time tick
        this.time.on('tick', () => {
            this.passes.horizontalBlurPass.enabled = this.passes.horizontalBlurPass.material.uniforms.uStrength.value.x > 0
            this.passes.verticalBlurPass.enabled = this.passes.verticalBlurPass.material.uniforms.uStrength.value.y > 0

            // Renderer
            this.passes.composer.render()
            // this.renderer.domElement.style.background = 'black'
            // this.renderer.render(this.scene, this.camera.instance)
        })

        // Resize event
        this.sizes.on('resize', () => {
            this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
            this.passes.composer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
            this.passes.horizontalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
            this.passes.horizontalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
            this.passes.verticalBlurPass.material.uniforms.uResolution.value.x = this.sizes.viewport.width
            this.passes.verticalBlurPass.material.uniforms.uResolution.value.y = this.sizes.viewport.height
        })
    }

    /**
     * Set world
     */
    setWorld() {
        this.world = new World({
            config: this.config,
            debug: this.debug,
            resources: this.resources,
            time: this.time,
            sizes: this.sizes,
            camera: this.camera,
            scene: this.scene,
            renderer: this.renderer,
            passes: this.passes
        })
        this.scene.add(this.world.container)
    }

    /**
     * Set title
     */
    setTitle() {
        this.title = {}
        this.title.frequency = 120 // Ne kadar hızlı kayacak, ms cinsinden
        this.title.width = 20
        this.title.position = 0
        this.title.$element = document.querySelector('title')
    
        // Her intervalde pozisyonu sabit hızla ilerlet
        window.setInterval(() => {
            this.title.position = (this.title.position + 1) % this.title.width
    
            const left = '_'.repeat(this.title.width - this.title.position)
            const right = '_'.repeat(this.title.position)
    
            document.title = `${left}🚃🚃${right}`
        }, this.title.frequency)
    }
    

    /**
     * Set Three.js Journey
     */
    setThreejsJourney() {
        this.threejsJourney = new ThreejsJourney({
            config: this.config,
            time: this.time,
            world: this.world
        })
    }

    /**
     * Set coordinates tracker
     */
    setCoordinatesTracker() {
        // Only initialize if the world and physics are set up
        if (this.world && this.scene) {
            this.coordinatesTracker = new CoordinatesTracker({
                camera: this.camera,
                renderer: this.renderer,
                scene: this.scene,
                physics: this.world.physics,
                time: this.time,
                debug: this.debug
            })
        } else {
            // If world or physics aren't ready yet, wait for world to be initialized
            this.time.on('tick', () => {
                if (this.world && this.world.physics && !this.coordinatesTracker) {
                    this.coordinatesTracker = new CoordinatesTracker({
                        camera: this.camera,
                        renderer: this.renderer,
                        scene: this.scene,
                        physics: this.world.physics,
                        time: this.time,
                        debug: this.debug
                    })
                }
            })
        }
    }

    /**
     * Destructor
     */
    destructor() {
        this.time.off('tick')
        this.sizes.off('resize')

        this.camera.orbitControls.dispose()
        this.renderer.dispose()

        if (this.debug) {
            this.debug.destroy()
        }
    }
}
