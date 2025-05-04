import * as THREE from 'three'
import Materials from './Materials.js'
import Floor from './Floor.js'
import Shadows from './Shadows.js'
import Physics from './Physics.js'
import Zones from './Zones.js'
import Objects from './Objects.js'
import Car from './Car.js'
import Areas from './Areas.js'
import Tiles from './Tiles.js'
import Walls from './Walls.js'
import IntroSection from './Sections/IntroSection.js'
import AreaSection from './Sections/AreaSection.js'
import ProjectsSection from './Sections/ProjectsSection.js'
import CrossroadsSection from './Sections/CrossroadsSection.js'
import InformationSection from './Sections/InformationSection.js'
import PlaygroundSection from './Sections/PlaygroundSection.js'
// import DistinctionASection from './Sections/DistinctionASection.js'
// import DistinctionBSection from './Sections/DistinctionBSection.js'
// import DistinctionCSection from './Sections/DistinctionCSection.js'
// import DistinctionDSection from './Sections/DistinctionDSection.js'
import Controls from './Controls.js'
import Sounds from './Sounds.js'
import gsap from 'gsap'
import EasterEggs from './EasterEggs.js'

export default class World {
    constructor(_options) {
        // Options
        this.config = _options.config
        this.debug = _options.debug
        this.resources = _options.resources
        this.time = _options.time
        this.sizes = _options.sizes
        this.camera = _options.camera
        this.scene = _options.scene
        this.renderer = _options.renderer
        this.passes = _options.passes

        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('world')
            this.debugFolder.open()
        }

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        // this.setAxes()
        this.setSounds()
        this.setControls()
        this.setFloor()
        this.setAreas()
        this.setStartingScreen()
    }

    start() {
        window.setTimeout(() => {
            this.camera.pan.enable()
        }, 2000)

        this.setReveal()
        this.setMaterials()
        this.setShadows()
        this.setPhysics()
        this.setZones()
        this.setObjects()
        this.setCar()
        this.areas.car = this.car
        this.setTiles()
        this.setWalls()
        this.setSections()
        this.setEasterEggs()
        this.setPositionIndicator()
        this.setBrick()
    }

    setReveal() {
        this.reveal = {}
        this.reveal.matcapsProgress = 0
        this.reveal.floorShadowsProgress = 0
        this.reveal.previousMatcapsProgress = null
        this.reveal.previousFloorShadowsProgress = null

        // Go method
        this.reveal.go = () => {
            gsap.fromTo(this.reveal, { matcapsProgress: 0 }, { matcapsProgress: 1, duration: 3 })
            gsap.fromTo(this.reveal, { floorShadowsProgress: 0 }, { floorShadowsProgress: 1, duration: 3, delay: 0.5 })
            gsap.fromTo(this.shadows, { alpha: 0 }, { alpha: 0.5, duration: 3, delay: 0.5 })

            if (this.sections.intro) {
                gsap.fromTo(this.sections.intro.instructions.arrows.label.material, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.5 })
                if (this.sections.intro.otherInstructions) {
                    gsap.fromTo(this.sections.intro.otherInstructions.label.material, { opacity: 0 }, { opacity: 1, duration: 0.3, delay: 0.75 })
                }
            }

            // Car
            this.physics.car.chassis.body.sleep()
            this.physics.car.chassis.body.position.set(0, 0, 12)

            window.setTimeout(() => {
                this.physics.car.chassis.body.wakeUp()
            }, 300)

            // Sound
            gsap.fromTo(this.sounds.engine.volume, { master: 0 }, { master: 0.7, duration: 0.5, delay: 0.3, ease: 'power2.in' })
            window.setTimeout(() => {
                this.sounds.play('reveal')
            }, 400)

            // Controls
            if (this.controls.touch) {
                window.setTimeout(() => {
                    this.controls.touch.reveal()
                }, 400)
            }
        }

        // Time tick
        this.time.on('tick', () => {
            // Matcap progress changed
            if (this.reveal.matcapsProgress !== this.reveal.previousMatcapsProgress) {
                // Update each material
                for (const _materialKey in this.materials.shades.items) {
                    const material = this.materials.shades.items[_materialKey]
                    material.uniforms.uRevealProgress.value = this.reveal.matcapsProgress
                }

                // Save
                this.reveal.previousMatcapsProgress = this.reveal.matcapsProgress
            }

            // Matcap progress changed
            if (this.reveal.floorShadowsProgress !== this.reveal.previousFloorShadowsProgress) {
                // Update each floor shadow
                for (const _mesh of this.objects.floorShadows) {
                    _mesh.material.uniforms.uAlpha.value = this.reveal.floorShadowsProgress
                }

                // Save
                this.reveal.previousFloorShadowsProgress = this.reveal.floorShadowsProgress
            }
        })

        // Debug
        if (this.debug) {
            this.debugFolder.add(this.reveal, 'matcapsProgress').step(0.0001).min(0).max(1).name('matcapsProgress')
            this.debugFolder.add(this.reveal, 'floorShadowsProgress').step(0.0001).min(0).max(1).name('floorShadowsProgress')
            this.debugFolder.add(this.reveal, 'go').name('reveal')
        }
    }

    setStartingScreen() {
        this.startingScreen = {}

        // Area
        this.startingScreen.area = this.areas.add({
            position: new THREE.Vector2(0, 0),
            halfExtents: new THREE.Vector2(2.35, 1.5),
            hasKey: false,
            testCar: false,
            active: false
        })

        // Loading label
        this.startingScreen.loadingLabel = {}
        this.startingScreen.loadingLabel.geometry = new THREE.PlaneGeometry(2.5, 2.5 / 4)
        this.startingScreen.loadingLabel.image = new Image()
        this.startingScreen.loadingLabel.image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///9ra2ucnJzR0dH09PQmJiaNjY24uLjp6end3d1CQkLFxcVYWFiqqqp9fX3nQ5qrAAAEVUlEQVRo3u3YT08TQRQA8JEtW6CATGnDdvljaTwYE2IBI/HGRrwSetGTsZh4MPFQYiQe229gE++WePFY9Oqh1cRzieEDYIgXLxjPJu5M33vbZQszW+fgoS+B7ewO836znRl2lg1jGMP4P2Okw0yFvaKsklr3I99Tvl3iPPelGbQhKqxB4eN6N/7gVcsvbEAz1F4RLn67zzl/v6/oLvejGBQ9LsNphio4UFjmEAsVJuOK/zkDtc6w+gyTcZ3LyP6IAzjBDA+pj6LkEgAjW4kANsMAC6vmOvqAMU5RgVOTskQACicCmCcA9AXjkT5gj1MswqlxWcoTgKJ6HuAQAD5guNoAu8QpMnBul1ONMGD2PCBbRgDAKYq6AEtmXvtdj3S6GhRyW1t1DvkAgM0ggG7mu1t3xWFHFzAqv3wYCi0mY1UCGgiQPU+1oWIY8LoXcAA3qeYfr+kClvHW14PJ5OfCAgHYNAoDAORBQIrDvHjqH5c0ANTbORzBacbAQgUC2IAKAzI9gCSHlWEMLmgBPJxMvyARpIICALDm4nkAbwIA71EZx5UOgO48JnLoOhQIAN9sOgKoBoAE5r0aB8ARcNhtFzrg0VQmwCp8CAMeAADGc44S5GMBsF1aCEU2LcAcAPDCvwFytBDehCaUgJxRAKeF8BNUUQJ43iiAUlqwFKoBrTCAHjiagwEgU0YM5IYWYD4KoIgPwIXQwUbVgCXzgLpIBJNeDciWTQNskVsq1ADX/6kYBdCTjse5owbMiX+IpgGWOCPSuWpA2vN/TAMm5QTYg5IC4FdbMA0YF5Nb5s2rAaLyhzBgektGZWDArrgqi0U1QHxf38OABDwUDgTAjGfyPlTVgJT/67FBACbqyGYaaoBctQwD2vI4DecVAPkgZRhQlxPQks2rAePGAbZsRlaa1QBYEQBUHRCAmaXD0QDYxgFWdye05R9cDQCrmQYkeBA6gGXTgNEeQF4DMG4S4MLjOUZRA5A0CcjADgmjqgGwSwSg9wK1GIBS74KTgTxv/EHoiaVQsTOS5RoCJuiZyosB8EIrHpyowFiYofO0i4wCjhCQwL0hq2sCaFNM22S4JXloLk0AuLDTBzCBAAt3xykeA7CHe/mDbgdTvQ9GswSAwdbqA0giYASHjQUJnhQKhQ6z/d8rDA4hAG2Dsk042ejubHMM2nV6AMf93pCkaRjhh0WsWuz+6aasl2FwiAImReEts1/CSaFfwFouAJxC4RW+I4oCThBQE1X2WbKkBFDkqYDtJ0SHaYKq3pJJwCECjjiFPoC1w+2P0gumurgeBjT6AhIIGKOelGIAngWlFnRnMZjMIYBb7gtIIsAuYU+8GICpEhYyZVgIZ2g9rYYAX1lfAKvjnxzjnWrHALDn9K1h2k2aoI1ewGd2AWAVAVMHcKdW4wDYje739pNufJXhkJohgLu9zy4CHCKAJYUge4ddCojGyPrp9kaHmYjUi9N7+2wYwxjGZfEXMKxGE0GkkfIAAAAASUVORK5CYII='
        this.startingScreen.loadingLabel.texture = new THREE.Texture(this.startingScreen.loadingLabel.image)
        this.startingScreen.loadingLabel.texture.magFilter = THREE.NearestFilter
        this.startingScreen.loadingLabel.texture.minFilter = THREE.LinearFilter
        this.startingScreen.loadingLabel.texture.needsUpdate = true
        this.startingScreen.loadingLabel.material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.startingScreen.loadingLabel.texture })
        this.startingScreen.loadingLabel.mesh = new THREE.Mesh(this.startingScreen.loadingLabel.geometry, this.startingScreen.loadingLabel.material)
        this.startingScreen.loadingLabel.mesh.matrixAutoUpdate = false
        this.container.add(this.startingScreen.loadingLabel.mesh)

        // Start label
        this.startingScreen.startLabel = {}
        this.startingScreen.startLabel.geometry = new THREE.PlaneGeometry(2.5, 2.5 / 4)
        this.startingScreen.startLabel.image = new Image()
        this.startingScreen.startLabel.image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///+cnJxra2vR0dHd3d0mJib09PRYWFjp6em4uLhCQkKqqqqNjY19fX3FxcV3XeRgAAADsklEQVRo3u3YsU9TQRwH8KNgLSDQg9ZCAak1IdE4PKPu1NTEsSzOMDl3I3GpcXAxBhLjXFxNjJgQJ2ON0Rnj4uAAEyv8B/L7tV++5/VN+CM69Ldwfa+534d7d793VzeIQQzi/49c4v5lPF/1vvhFm++rjIpcyErrmrSCuz+cxng1iL/If8drPJD2Lc/Iy4VhaZWlFd4tLPfuMc6e/5LvRilJA2SkVSQA8c0OsI0uNtIAU9rsB8y1rAAZjyimAUa1mQDAeGwF+MA+9lIA69qs9AMKVoDP8vhf35A+NiMAc7YJKFSrX7tcI8BW9+k/O/kz6zSunjSnncMHiQYBcmdXrh3xCVbc2WO8N/YZZI0AxxwMArKivmwAwFKSPmV0UwBbCpj5E+C+yzUbQAaJVwUSA9SFjwFgHQ0jAMrBWgzAPCtHgFFbQAlpEwKC2zWUQgJGbAH+naSdu/fTxQAthPL5/ADD6OCpQwCAsb6LsbEGcBluOAYBmG2fkMIawHVWXEsDIGUGpZCAIRsAS93DPgDbhUmUQgKe2NUB90hfhK0YwEJYHkYpJGDbqBKiB86CGLAlzd6/S8CEvh8sACiBvrSXCshKblWEgNy2vkAMAHwGfjECcJHOu5qUQgDm6vXulshZAXJNL9GJAeg+LxeKPQBj1gzgdlnuCWAhbOi7LwaU9u0A2VWPpUgAC+GR5k0iwBtnB3Bj3qMaRYB17X0IOQhYcjYA7guxxyIAGfd1HNqchPfly7aACQUshAA2W1r5G1yG415YpgB3qIIkAHBH2D075QnQ10fHDsCl+CoGSKpiN8kMAVqIN00BsitnVgKyPIBMB4ADKU92AA5BKQIgszjKBGBLagpwB5xZBGS6pbcuizQAXMA6NAK86OCQ3okAI55BQPe7VoDxXzU/iwPASgS4GAASAiYxWgYAzvAa1loA2AkAFQIU2zEELCJtDDgIAG0CFLvp7LblC2kAtF6eTEJJ2CBAr88bAXKY4WkASbzXmwt5AvTvohHA4WSUBmj2Jt+IThQChrAOLQC13vPFMAOAQwuyTAeAKVQto3OBDOdESh2YxNZPbpYBQNbEAoBfod7e1i1BiwB0voSZWgwAOWgtAGPhD18E8ASIiRIAXNPwXJBtcqMbAFAIr5weIJMAcIx1aAAIqk0lAuycompyFwBMHAsAZlj/lgw0rsy2AkhbsgK4Q+70CUBjxeFXsUb0G1HJDJC9rketZRcCWCJwHM8DgJm7b7ch+XizXm25QQxiEOcXvwGCWOhbCZC0qAAAAABJRU5ErkJggg=='
        this.startingScreen.startLabel.texture = new THREE.Texture(this.startingScreen.startLabel.image)
        this.startingScreen.startLabel.texture.magFilter = THREE.NearestFilter
        this.startingScreen.startLabel.texture.minFilter = THREE.LinearFilter
        this.startingScreen.startLabel.texture.needsUpdate = true
        this.startingScreen.startLabel.material = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.startingScreen.startLabel.texture })
        this.startingScreen.startLabel.material.opacity = 0
        this.startingScreen.startLabel.mesh = new THREE.Mesh(this.startingScreen.startLabel.geometry, this.startingScreen.startLabel.material)
        this.startingScreen.startLabel.mesh.matrixAutoUpdate = false
        this.container.add(this.startingScreen.startLabel.mesh)

        // Progress
        this.resources.on('progress', (_progress) => {
            // Update area
            this.startingScreen.area.floorBorder.material.uniforms.uAlpha.value = 1
            this.startingScreen.area.floorBorder.material.uniforms.uLoadProgress.value = _progress
        })

        // Ready
        this.resources.on('ready', () => {
            window.requestAnimationFrame(() => {
                this.startingScreen.area.activate()

                gsap.to(this.startingScreen.area.floorBorder.material.uniforms.uAlpha, { value: 0.3, duration: 0.3 })
                gsap.to(this.startingScreen.loadingLabel.material, { opacity: 0, duration: 0.3 })
                gsap.to(this.startingScreen.startLabel.material, { opacity: 1, duration: 0.3, delay: 0.3 })
            })
        })

        // On interact, reveal
        this.startingScreen.area.on('interact', () => {
            this.startingScreen.area.deactivate()
            gsap.to(this.startingScreen.area.floorBorder.material.uniforms.uProgress, { value: 0, duration: 0.3, delay: 0.4 })

            gsap.to(this.startingScreen.startLabel.material, { opacity: 0, duration: 0.3, delay: 0.4 })

            this.start()

            window.setTimeout(() => {
                this.reveal.go()
            }, 600)
        })
    }

    setSounds() {
        this.sounds = new Sounds({
            debug: this.debugFolder,
            time: this.time
        })
    }

    setAxes() {
        this.axis = new THREE.AxesHelper()
        this.container.add(this.axis)
    }

    setControls() {
        this.controls = new Controls({
            config: this.config,
            sizes: this.sizes,
            time: this.time,
            camera: this.camera,
            sounds: this.sounds
        })
    }

    setMaterials() {
        this.materials = new Materials({
            resources: this.resources,
            debug: this.debugFolder
        })
    }

    setFloor() {
        this.floor = new Floor({
            debug: this.debugFolder
        })

        this.container.add(this.floor.container)
    }

    setShadows() {
        this.shadows = new Shadows({
            time: this.time,
            debug: this.debugFolder,
            renderer: this.renderer,
            camera: this.camera
        })
        this.container.add(this.shadows.container)
    }

    setPhysics() {
        this.physics = new Physics({
            config: this.config,
            debug: this.debug,
            scene: this.scene,
            time: this.time,
            sizes: this.sizes,
            controls: this.controls,
            sounds: this.sounds
        })

        this.container.add(this.physics.models.container)
    }

    setZones() {
        this.zones = new Zones({
            time: this.time,
            physics: this.physics,
            debug: this.debugFolder
        })
        this.container.add(this.zones.container)
    }

    setAreas() {
        this.areas = new Areas({
            config: this.config,
            resources: this.resources,
            debug: this.debug,
            renderer: this.renderer,
            camera: this.camera,
            car: this.car,
            sounds: this.sounds,
            time: this.time
        })

        this.container.add(this.areas.container)
    }

    setTiles() {
        this.tiles = new Tiles({
            resources: this.resources,
            objects: this.objects,
            debug: this.debug
        })
    }

    setWalls() {
        this.walls = new Walls({
            resources: this.resources,
            objects: this.objects
        })
    }

    setObjects() {
        this.objects = new Objects({
            time: this.time,
            resources: this.resources,
            materials: this.materials,
            physics: this.physics,
            shadows: this.shadows,
            sounds: this.sounds,
            debug: this.debugFolder
        })
        this.container.add(this.objects.container)

        // window.requestAnimationFrame(() =>
        // {
        //     this.objects.merge.update()
        // })
    }

    setCar() {
        this.car = new Car({
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            physics: this.physics,
            shadows: this.shadows,
            materials: this.materials,
            controls: this.controls,
            sounds: this.sounds,
            renderer: this.renderer,
            camera: this.camera,
            debug: this.debugFolder,
            config: this.config
        })
        this.container.add(this.car.container)
    }

    setSections() {
        this.sections = {}

        // Generic options
        const options = {
            config: this.config,
            time: this.time,
            resources: this.resources,
            camera: this.camera,
            passes: this.passes,
            objects: this.objects,
            areas: this.areas,
            zones: this.zones,
            walls: this.walls,
            tiles: this.tiles,
            debug: this.debugFolder
        }

        // // Distinction A
        // this.sections.distinctionA = new DistinctionASection({
        //     ...options,
        //     x: 0,
        //     y: - 15
        // })
        // this.container.add(this.sections.distinctionA.container)

        // // Distinction B
        // this.sections.distinctionB = new DistinctionBSection({
        //     ...options,
        //     x: 0,
        //     y: - 15
        // })
        // this.container.add(this.sections.distinctionB.container)

        // // Distinction C
        // this.sections.distinctionC = new DistinctionCSection({
        //     ...options,
        //     x: 0,
        //     y: 0
        // })
        // this.container.add(this.sections.distinctionC.container)

        // // Distinction D
        // this.sections.distinctionD = new DistinctionDSection({
        //     ...options,
        //     x: 0,
        //     y: 0
        // })
        // this.container.add(this.sections.distinctionD.container)

        // Intro
        // this.sections.intro = new IntroSection({
        //     ...options,
        //     x: 0,
        //     y: 0
        // })
        // this.container.add(this.sections.intro.container)

        // Area
        this.sections.area = new AreaSection({
            ...options,
            x: 0,
            y: 0
        })
        this.container.add(this.sections.area.container)


        // // Crossroads
        // this.sections.crossroads = new CrossroadsSection({
        //     ...options,
        //     x: 0,
        //     y: - 30
        // })
        // this.container.add(this.sections.crossroads.container)

        // // Projects
        // this.sections.projects = new ProjectsSection({
        //     ...options,
        //     x: 30,
        //     y: - 30
        //     // x: 0,
        //     // y: 0
        // })
        // this.container.add(this.sections.projects.container)

        // // Information
        // this.sections.information = new InformationSection({
        //     ...options,
        //     x: 1.2,
        //     y: - 55
        //     // x: 0,
        //     // y: - 10
        // })
        // this.container.add(this.sections.information.container)

        // Playground
        this.sections.playground = new PlaygroundSection({
            ...options,
            x: 0,
            y: 0,
            physics: this.physics,
            scene: this.scene
            // x: - 15,
            // y: - 4
        })
        this.container.add(this.sections.playground.container)
    }

    setEasterEggs() {
        this.easterEggs = new EasterEggs({
            resources: this.resources,
            car: this.car,
            walls: this.walls,
            objects: this.objects,
            materials: this.materials,
            areas: this.areas,
            config: this.config,
            physics: this.physics
        })
        this.container.add(this.easterEggs.container)
    }

    setPositionIndicator() {
        this.positionIndicator = {}
        
        // Container
        this.positionIndicator.container = document.createElement('div')
        this.positionIndicator.container.style.position = 'absolute'
        this.positionIndicator.container.style.top = '10px'
        this.positionIndicator.container.style.left = '10px'
        this.positionIndicator.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        this.positionIndicator.container.style.color = 'white'
        this.positionIndicator.container.style.padding = '8px 12px'
        this.positionIndicator.container.style.borderRadius = '4px'
        this.positionIndicator.container.style.fontFamily = 'monospace'
        this.positionIndicator.container.style.fontSize = '14px'
        this.positionIndicator.container.style.zIndex = '1000'
        this.positionIndicator.container.style.lineHeight = '1.5'
        this.positionIndicator.container.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)'
        
        // Create header with title and close button
        const header = document.createElement('div')
        header.style.display = 'flex'
        header.style.justifyContent = 'space-between'
        header.style.alignItems = 'center'
        header.style.marginBottom = '5px'
        header.style.borderBottom = '1px solid rgba(255,255,255,0.3)'
        header.style.paddingBottom = '3px'
        
        // Title
        const title = document.createElement('div')
        title.textContent = 'Araç Bilgileri'
        title.style.fontWeight = 'bold'
        
        // Close button
        const closeButton = document.createElement('button')
        closeButton.textContent = 'X'
        closeButton.style.background = 'none'
        closeButton.style.border = 'none'
        closeButton.style.color = 'white'
        closeButton.style.cursor = 'pointer'
        closeButton.style.fontSize = '14px'
        closeButton.style.padding = '0 5px'
        closeButton.title = 'Kapat'
        
        // Toggle button (appears when panel is closed)
        this.positionIndicator.toggleButton = document.createElement('button')
        this.positionIndicator.toggleButton.textContent = '📍'
        this.positionIndicator.toggleButton.style.position = 'absolute'
        this.positionIndicator.toggleButton.style.top = '10px'
        this.positionIndicator.toggleButton.style.left = '10px'
        this.positionIndicator.toggleButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        this.positionIndicator.toggleButton.style.color = 'white'
        this.positionIndicator.toggleButton.style.border = 'none'
        this.positionIndicator.toggleButton.style.borderRadius = '4px'
        this.positionIndicator.toggleButton.style.padding = '5px 10px'
        this.positionIndicator.toggleButton.style.cursor = 'pointer'
        this.positionIndicator.toggleButton.style.zIndex = '1000'
        this.positionIndicator.toggleButton.style.display = 'none'
        this.positionIndicator.toggleButton.title = 'Konum göstergesini aç'
        
        // Add event listeners for close/open
        closeButton.addEventListener('click', () => {
            this.positionIndicator.container.style.display = 'none'
            this.positionIndicator.toggleButton.style.display = 'block'
        })
        
        this.positionIndicator.toggleButton.addEventListener('click', () => {
            this.positionIndicator.container.style.display = 'block'
            this.positionIndicator.toggleButton.style.display = 'none'
        })
        
        // Add elements to header
        header.appendChild(title)
        header.appendChild(closeButton)
        
        // Create elements for displaying information
        this.positionIndicator.positionText = document.createElement('div')
        this.positionIndicator.speedText = document.createElement('div')
        this.positionIndicator.directionText = document.createElement('div')
        
        // Create mini-map
        this.positionIndicator.miniMap = document.createElement('div')
        this.positionIndicator.miniMap.style.width = '150px'
        this.positionIndicator.miniMap.style.height = '150px'
        this.positionIndicator.miniMap.style.backgroundColor = 'rgba(0, 30, 60, 0.5)'
        this.positionIndicator.miniMap.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        this.positionIndicator.miniMap.style.borderRadius = '2px'
        this.positionIndicator.miniMap.style.position = 'relative'
        this.positionIndicator.miniMap.style.overflow = 'hidden'
        this.positionIndicator.miniMap.style.marginTop = '10px'
        
        // Create car indicator for mini-map
        this.positionIndicator.carMarker = document.createElement('div')
        this.positionIndicator.carMarker.style.width = '8px'
        this.positionIndicator.carMarker.style.height = '12px'
        this.positionIndicator.carMarker.style.backgroundColor = 'red'
        this.positionIndicator.carMarker.style.borderRadius = '50% 50% 2px 2px'
        this.positionIndicator.carMarker.style.position = 'absolute'
        this.positionIndicator.carMarker.style.transform = 'translate(-50%, -50%)'
        this.positionIndicator.carMarker.style.transition = 'transform 0.1s ease'
        this.positionIndicator.miniMap.appendChild(this.positionIndicator.carMarker)
        
        // Add sections markers to mini-map
        // These are approximate locations of sections in the game
        const sections = [
            { name: 'Intro', x: 0, y: 0, color: 'rgba(255, 255, 255, 0.4)' },
            { name: 'Playground', x: 15, y: 9, color: 'rgba(50, 200, 100, 0.4)' },
            { name: 'Projects', x: 0, y: -15, color: 'rgba(200, 100, 50, 0.4)' },
            { name: 'Info', x: -15, y: 0, color: 'rgba(50, 100, 200, 0.4)' }
        ]
        
        sections.forEach(section => {
            const marker = document.createElement('div')
            marker.style.width = '20px'
            marker.style.height = '20px'
            marker.style.backgroundColor = section.color
            marker.style.borderRadius = '50%'
            marker.style.position = 'absolute'
            marker.style.transform = 'translate(-50%, -50%)'
            marker.style.opacity = '0.7'
            marker.title = section.name
            
            // Position within mini-map, scale down coordinates
            const mapScale = 3 // Scale factor to fit map
            const centerX = 75 // Center of mini-map
            const centerY = 75
            
            marker.style.left = `${centerX + section.x / mapScale}px`
            marker.style.top = `${centerY - section.y / mapScale}px`
            
            this.positionIndicator.miniMap.appendChild(marker)
        })
        
        // Add coordinate lines
        const horizLine = document.createElement('div')
        horizLine.style.width = '100%'
        horizLine.style.height = '1px'
        horizLine.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
        horizLine.style.position = 'absolute'
        horizLine.style.top = '50%'
        horizLine.style.left = '0'
        
        const vertLine = document.createElement('div')
        vertLine.style.width = '1px'
        vertLine.style.height = '100%'
        vertLine.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
        vertLine.style.position = 'absolute'
        vertLine.style.top = '0'
        vertLine.style.left = '50%'
        
        this.positionIndicator.miniMap.appendChild(horizLine)
        this.positionIndicator.miniMap.appendChild(vertLine)
        
        // Add elements to container
        this.positionIndicator.container.appendChild(header)
        this.positionIndicator.container.appendChild(this.positionIndicator.positionText)
        this.positionIndicator.container.appendChild(this.positionIndicator.speedText)
        this.positionIndicator.container.appendChild(this.positionIndicator.directionText)
        this.positionIndicator.container.appendChild(this.positionIndicator.miniMap)
        
        // Add to DOM
        document.body.appendChild(this.positionIndicator.container)
        document.body.appendChild(this.positionIndicator.toggleButton)
        
        // Helper function to get direction name
        const getDirection = (angle) => {
            // Convert angle to degrees (0-360)
            let degrees = (angle * 180 / Math.PI) % 360
            if (degrees < 0) degrees += 360
            
            // Map degrees to direction
            if (degrees >= 337.5 || degrees < 22.5) return 'Kuzey'
            if (degrees >= 22.5 && degrees < 67.5) return 'Kuzey Doğu'
            if (degrees >= 67.5 && degrees < 112.5) return 'Doğu'
            if (degrees >= 112.5 && degrees < 157.5) return 'Güney Doğu'
            if (degrees >= 157.5 && degrees < 202.5) return 'Güney'
            if (degrees >= 202.5 && degrees < 247.5) return 'Güney Batı'
            if (degrees >= 247.5 && degrees < 292.5) return 'Batı'
            if (degrees >= 292.5 && degrees < 337.5) return 'Kuzey Batı'
            return 'Bilinmiyor'
        }
        
        // Update on tick
        this.time.on('tick', () => {
            if(this.car && this.car.chassis) {
                const position = this.car.chassis.object.position
                const speed = this.car.movement ? this.car.movement.localSpeed.length() : 0
                const angle = this.car.chassis.object.rotation.z
                const direction = getDirection(angle)
                
                // Update text information
                this.positionIndicator.positionText.textContent = `Konum: X: ${position.x.toFixed(1)} | Y: ${position.y.toFixed(1)}`
                this.positionIndicator.speedText.textContent = `Hız: ${speed.toFixed(1)} birim/sn`
                this.positionIndicator.directionText.textContent = `Yön: ${direction} (${(angle * 180 / Math.PI).toFixed(0)}°)`
                
                // Update mini-map car position 
                const mapScale = 3 // Same scale factor as for section markers
                const centerX = 75 // Center of mini-map
                const centerY = 75
                
                this.positionIndicator.carMarker.style.left = `${centerX + position.x / mapScale}px`
                this.positionIndicator.carMarker.style.top = `${centerY - position.y / mapScale}px`
                
                // Rotate car indicator to match car direction
                this.positionIndicator.carMarker.style.transform = `translate(-50%, -50%) rotate(${-angle}rad)`
            }
        })
    }

    setBrick() {
        this.brick = this.objects.add({
            base: this.resources.items.brickBase.scene,
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(0, -10, 0),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
            mass: 1.5,
            soundName: 'brick',
            sleep: false
        });

        // areaLabelMesh'i oluştur ve sahneye ekle
        const areaLabelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                color: 0xffffff,
                alphaMap: this.resources.items.areaResetTexture
            })
        );
        areaLabelMesh.position.set(-5, -10, 0); // brick ile aynı konumda, biraz yukarıda
        areaLabelMesh.matrixAutoUpdate = false;
        areaLabelMesh.updateMatrix();
        this.container.add(areaLabelMesh);

        // Enter etkileşimi için area ekle
        this.brickArea = this.areas.add({
            position: new THREE.Vector2(-5, -10),
            halfExtents: new THREE.Vector2(3, 3)
        });
        this.brickArea.on('interact', () => {
            const body = this.brick && this.brick.collision && this.brick.collision.body;
            if (body) {
                if (body.wakeUp) body.wakeUp();
                body.velocity.set(0, 0, 0); // Başlangıçta durgun
                body.angularVelocity.set(0, 0, 10);

                let elapsed = 0;
                let interval = setInterval(() => {
                    // Her 50ms'de bir hız artışı uygula
                    if (elapsed < 2000) { // 2 saniye boyunca hız artışı
                        // Her seferinde biraz daha fazla kuvvet uygula
                        const force = 5 + (elapsed / 2000) * 40; // 5'ten 45'e kadar artan kuvvet
                        body.velocity.z += force * 0.05; // Z ekseni yukarı
                        elapsed += 50;
                    } else {
                        clearInterval(interval);
                    }
                }, 50);
            }
        });
    }
}
