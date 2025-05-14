import * as THREE from "three";
import Materials from "./Materials.js";
import Floor from "./Floor.js";
import Shadows from "./Shadows.js";
import Physics from "./Physics.js";
import Zones from "./Zones.js";
import Objects from "./Objects.js";
import Car from "./Car.js";
import Areas from "./Areas.js";
import Tiles from "./Tiles.js";
import Walls from "./Walls.js";
import Road from "./Road.js";
import AreaSection from "./Sections/AreaSection.js";
import Controls from "./Controls.js";
import Sounds from "./Sounds.js";
import CoordinateShower from "./CoordinateShower.js";
import CompleteScene from "./CompleteScene.js";
import SceneModelTest from "./SceneModelTest.js";
import gsap from "gsap";
import EasterEggs from "./EasterEggs.js";
import Render from "./Render.js";
import PopUpModule from "./PopUpModule.js"
import rocket from './rocket.js'




export default class World {
  constructor(_options) {
    // Options
    this.config = _options.config;
    this.debug = _options.debug;
    this.resources = _options.resources;
    this.time = _options.time;
    this.sizes = _options.sizes;
    this.camera = _options.camera;
    this.scene = _options.scene;
    this.renderer = _options.renderer;
    this.passes = _options.passes;
    this.customPopup = _options.customPopup;

    // Debug
    if (this.debug) {
      this.debugFolder = this.debug.addFolder("world");
      this.debugFolder.open();
    }

    // Set up
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    // this.setAxes()
    this.setSounds();
    this.setControls();
    this.setFloor();
    this.setAreas();
    this.setStartingScreen();
    this.setCoordinateShower();

    // Wait for resources
    this.resources.on("ready", () => {
      // Setup
      this.setupWorld();
    });
  }

  // Renamed from 'start' to 'setupWorld' to avoid confusion and prevent accidental restarts
  setupWorld() {
    // Hide the starting screen if it exists
    if (this.startingScreen && this.startingScreen.hide) {
      this.startingScreen.hide();
    }

    window.setTimeout(() => {
      this.camera.pan.enable();
    }, 2000);

    this.setReveal();
    this.setMaterials();
    this.setShadows();
    this.setRoad();
    
    // Set physics first to ensure car is ready
    this.setPhysics();
    
    // Set zones and objects before car
    this.setZones();
    this.setObjects();
    
    // Set car AFTER physics and objects are ready
    this.setCar();
    
    // Then add the complete scene
    this.setCompleteScene();
    
    // Make sure the car is properly referenced and active
    if (this.car && this.physics && this.physics.car) {
      // Make sure the car is awake
      if (this.physics.car.chassis && this.physics.car.chassis.body) {
        this.physics.car.chassis.body.wakeUp();
        console.log('Car physics activated during initialization');
      }
      
      // Link car to areas
      this.areas.car = this.car;
    }
    
    this.setTiles();
    this.setWalls();
    this.setSections();
    this.setEasterEggs();
    
    try {
      this.setRocket();
    } catch(e) {
      console.warn('Failed to initialize rocket:', e);
    }
    
    // Feature initialization using our helper method
    // Buttons are currently disabled but can be enabled later
    // by uncommenting these lines
    
    // // Initialize reset button if dependencies are available
    // if (this.canInitializeFeature('resetButton')) {
    //   try {
    //     this.setResetButton();
    //   } catch(e) {
    //     console.warn('Failed to initialize reset button:', e);
    //   }
    // }
    
    // // Initialize popup if dependencies are available
    // if (this.canInitializeFeature('popUp')) {
    //   try {
    //     this.setPopUp();
    //   } catch(e) {
    //     console.warn('Failed to initialize popup:', e);
    //   }
    // }
  }

  setReveal() {
    this.reveal = {};
    this.reveal.matcapsProgress = 0;
    this.reveal.floorShadowsProgress = 0;
    this.reveal.previousMatcapsProgress = null;
    this.reveal.previousFloorShadowsProgress = null;

    // Go method
    this.reveal.go = () => {
      gsap.fromTo(
        this.reveal,
        { matcapsProgress: 0 },
        { matcapsProgress: 1, duration: 3 }
      );
      gsap.fromTo(
        this.reveal,
        { floorShadowsProgress: 0 },
        { floorShadowsProgress: 1, duration: 3, delay: 0.5 }
      );
      gsap.fromTo(
        this.shadows,
        { alpha: 0 },
        { alpha: 0.5, duration: 3, delay: 0.5 }
      );

      // Car - Force wake up and reset position
      if (this.physics && this.physics.car && this.physics.car.chassis) {
        console.log('Setting up car position and physics state...');
        
        // Force wake up the chassis
        this.physics.car.chassis.body.wakeUp();
        
        // Reset position and velocity
        this.physics.car.chassis.body.position.set(0, 0, 12);
        this.physics.car.chassis.body.velocity.set(0, 0, 0);
        this.physics.car.chassis.body.angularVelocity.set(0, 0, 0);
        
        // Set a new timeout to ensure the car wakes up properly after reveal
        window.setTimeout(() => {
          console.log('Forcing car physics to wake up...');
          this.physics.car.chassis.body.wakeUp();
          
          // Apply a tiny impulse to ensure it's active
          this.physics.car.chassis.body.applyImpulse(
            new CANNON.Vec3(0, 0, 0.1),
            this.physics.car.chassis.body.position
          );
        }, 1000);
      } else {
        console.warn('Car physics not initialized properly');
      }

      // Sound
      gsap.fromTo(
        this.sounds.engine.volume,
        { master: 0 },
        { master: 0.7, duration: 0.5, delay: 0.3, ease: "power2.in" }
      );
      window.setTimeout(() => {
        this.sounds.play("reveal");
      }, 400);

      // Controls
      if (this.controls.touch) {
        window.setTimeout(() => {
          this.controls.touch.reveal();
        }, 400);
      }
    };

    // Time tick
    this.time.on("tick", () => {
      // Matcap progress changed
      if (this.reveal.matcapsProgress !== this.reveal.previousMatcapsProgress) {
        // Update each material
        for (const _materialKey in this.materials.shades.items) {
          const material = this.materials.shades.items[_materialKey];
          material.uniforms.uRevealProgress.value = this.reveal.matcapsProgress;
        }

        // Save
        this.reveal.previousMatcapsProgress = this.reveal.matcapsProgress;
      }

      // Matcap progress changed
      if (
        this.reveal.floorShadowsProgress !==
        this.reveal.previousFloorShadowsProgress
      ) {
        // Update each floor shadow
        for (const _mesh of this.objects.floorShadows) {
          _mesh.material.uniforms.uAlpha.value =
            this.reveal.floorShadowsProgress;
        }

        // Save
        this.reveal.previousFloorShadowsProgress =
          this.reveal.floorShadowsProgress;
      }
    });

    // Debug
    if (this.debug) {
      this.debugFolder
        .add(this.reveal, "matcapsProgress")
        .step(0.0001)
        .min(0)
        .max(1)
        .name("matcapsProgress");
      this.debugFolder
        .add(this.reveal, "floorShadowsProgress")
        .step(0.0001)
        .min(0)
        .max(1)
        .name("floorShadowsProgress");
      this.debugFolder.add(this.reveal, "go").name("reveal");
    }
  }

  setStartingScreen() {
    this.startingScreen = {};

    // Add hide method
    this.startingScreen.hide = () => {
      if (this.startingScreen.loadingLabel && this.startingScreen.loadingLabel.material) {
        this.startingScreen.loadingLabel.material.opacity = 0;
      }
      if (this.startingScreen.startLabel && this.startingScreen.startLabel.material) {
        this.startingScreen.startLabel.material.opacity = 0;
      }
      if (this.startingScreen.area) {
        this.startingScreen.area.deactivate();
      }
    };

    // Area
    this.startingScreen.area = this.areas.add({
      position: new THREE.Vector2(0, 0),
      halfExtents: new THREE.Vector2(2.35, 1.5),
      hasKey: false,
      testCar: false,
      active: false,
    });

    // Loading label
    this.startingScreen.loadingLabel = {};
    this.startingScreen.loadingLabel.geometry = new THREE.PlaneGeometry(
      2.5,
      2.5 / 4
    );
    this.startingScreen.loadingLabel.image = new Image();
    this.startingScreen.loadingLabel.image.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///9ra2ucnJzR0dH09PQmJiaNjY24uLjp6end3d1CQkLFxcVYWFiqqqp9fX3nQ5qrAAAEVUlEQVRo3u3YT08TQRQA8JEtW6CATGnDdvljaTwYE2IBI/HGRrwSetGTsZh4MPFQYiQe229gE++WePFY9Oqh1cRzieEDYIgXLxjPJu5M33vbZQszW+fgoS+B7ewO836znRl2lg1jGMP4P2Okw0yFvaKsklr3I99Tvl3iPPelGbQhKqxB4eN6N/7gVcsvbEAz1F4RLn67zzl/v6/oLvejGBQ9LsNphio4UFjmEAsVJuOK/zkDtc6w+gyTcZ3LyP6IAzjBDA+pj6LkEgAjW4kANsMAC6vmOvqAMU5RgVOTskQACicCmCcA9AXjkT5gj1MswqlxWcoTgKJ6HuAQAD5guNoAu8QpMnBul1ONMGD2PCBbRgDAKYq6AEtmXvtdj3S6GhRyW1t1DvkAgM0ggG7mu1t3xWFHFzAqv3wYCi0mY1UCGgiQPU+1oWIY8LoXcAA3qeYfr+kClvHW14PJ5OfCAgHYNAoDAORBQIrDvHjqH5c0ANTbORzBacbAQgUC2IAKAzI9gCSHlWEMLmgBPJxMvyARpIICALDm4nkAbwIA71EZx5UOgO48JnLoOhQIAN9sOgKoBoAE5r0aB8ARcNhtFzrg0VQmwCp8CAMeAADGc44S5GMBsF1aCEU2LcAcAPDCvwFytBDehCaUgJxRAKeF8BNUUQJ43iiAUlqwFKoBrTCAHjiagwEgU0YM5IYWYD4KoIgPwIXQwUbVgCXzgLpIBJNeDciWTQNskVsq1ADX/6kYBdCTjse5owbMiX+IpgGWOCPSuWpA2vN/TAMm5QTYg5IC4FdbMA0YF5Nb5s2rAaLyhzBgektGZWDArrgqi0U1QHxf38OABDwUDgTAjGfyPlTVgJT/67FBACbqyGYaaoBctQwD2vI4DecVAPkgZRhQlxPQks2rAePGAbZsRlaa1QBYEQBUHRCAmaXD0QDYxgFWdye05R9cDQCrmQYkeBA6gGXTgNEeQF4DMG4S4MLjOUZRA5A0CcjADgmjqgGwSwSg9wK1GIBS74KTgTxv/EHoiaVQsTOS5RoCJuiZyosB8EIrHpyowFiYofO0i4wCjhCQwL0hq2sCaFNM22S4JXloLk0AuLDTBzCBAAt3xykeA7CHe/mDbgdTvQ9GswSAwdbqA0giYASHjQUJnhQKhQ6z/d8rDA4hAG2Dsk042ejubHMM2nV6AMf93pCkaRjhh0WsWuz+6aasl2FwiAImReEts1/CSaFfwFouAJxC4RW+I4oCThBQE1X2WbKkBFDkqYDtJ0SHaYKq3pJJwCECjjiFPoC1w+2P0gumurgeBjT6AhIIGKOelGIAngWlFnRnMZjMIYBb7gtIIsAuYU+8GICpEhYyZVgIZ2g9rYYAX1lfAKvjnxzjnWrHALDn9K1h2k2aoI1ewGd2AWAVAVMHcKdW4wDYje739pNufJXhkJohgLu9zy4CHCKAJYUge4ddCojGyPrp9kaHmYjUi9N7+2wYwxjGZfEXMKxGE0GkkfIAAAAASUVORK5CYII=";
    this.startingScreen.loadingLabel.texture = new THREE.Texture(
      this.startingScreen.loadingLabel.image
    );
    this.startingScreen.loadingLabel.texture.magFilter = THREE.NearestFilter;
    this.startingScreen.loadingLabel.texture.minFilter = THREE.LinearFilter;
    this.startingScreen.loadingLabel.texture.needsUpdate = true;
    this.startingScreen.loadingLabel.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      color: 0xffffff,
      alphaMap: this.startingScreen.loadingLabel.texture,
    });
    this.startingScreen.loadingLabel.mesh = new THREE.Mesh(
      this.startingScreen.loadingLabel.geometry,
      this.startingScreen.loadingLabel.material
    );
    this.startingScreen.loadingLabel.mesh.matrixAutoUpdate = false;
    this.container.add(this.startingScreen.loadingLabel.mesh);

    // Start label
    this.startingScreen.startLabel = {};
    this.startingScreen.startLabel.geometry = new THREE.PlaneGeometry(
      2.5,
      2.5 / 4
    );
    this.startingScreen.startLabel.image = new Image();
    this.startingScreen.startLabel.image.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAABABAMAAAAHc7SNAAAAMFBMVEUAAAD///+cnJxra2vR0dHd3d0mJib09PRYWFjp6em4uLhCQkKqqqqNjY19fX3FxcV3XeRgAAADsklEQVRo3u3YsU9TQRwH8KNgLSDQg9ZCAak1IdE4PKPu1NTEsSzOMDl3I3GpcXAxBhLjXFxNjJgQJ2ON0Rnj4uAAEyv8B/L7tV++5/VN+CM69Ldwfa+534d7d793VzeIQQzi/49c4v5lPF/1vvhFm++rjIpcyErrmrSCuz+cxng1iL/If8drPJD2Lc/Iy4VhaZWlFd4tLPfuMc6e/5LvRilJA2SkVSQA8c0OsI0uNtIAU9rsB8y1rAAZjyimAUa1mQDAeGwF+MA+9lIA69qs9AMKVoDP8vhf35A+NiMAc7YJKFSrX7tcI8BW9+k/O/kz6zSunjSnncMHiQYBcmdXrh3xCVbc2WO8N/YZZI0AxxwMArKivmwAwFKSPmV0UwBbCpj5E+C+yzUbQAaJVwUSA9SFjwFgHQ0jAMrBWgzAPCtHgFFbQAlpEwKC2zWUQgJGbAH+naSdu/fTxQAthPL5/ADD6OCpQwCAsb6LsbEGcBluOAYBmG2fkMIawHVWXEsDIGUGpZCAIRsAS93DPgDbhUmUQgKe2NUB90hfhK0YwEJYHkYpJGDbqBKiB86CGLAlzd6/S8CEvh8sACiBvrSXCshKblWEgNy2vkAMAHwGfjECcJHOu5qUQgDm6vXulshZAXJNL9GJAeg+LxeKPQBj1gzgdlnuCWAhbOi7LwaU9u0A2VWPpUgAC+GR5k0iwBtnB3Bj3qMaRYB17X0IOQhYcjYA7guxxyIAGfd1HNqchPfly7aACQUshAA2W1r5G1yG415YpgB3qIIkAHBH2D075QnQ10fHDsCl+CoGSKpiN8kMAVqIN00BsitnVgKyPIBMB4ADKU92AA5BKQIgszjKBGBLagpwB5xZBGS6pbcuizQAXMA6NAK86OCQ3okAI55BQPe7VoDxXzU/iwPASgS4GAASAiYxWgYAzvAa1loA2AkAFQIU2zEELCJtDDgIAG0CFLvp7LblC2kAtF6eTEJJ2CBAr88bAXKY4WkASbzXmwt5AvTvohHA4WSUBmj2Jt+IThQChrAOLQC13vPFMAOAQwuyTAeAKVQto3OBDOdESh2YxNZPbpYBQNbEAoBfod7e1i1BiwB0voSZWgwAOWgtAGPhD18E8ASIiRIAXNPwXJBtcqMbAFAIr5weIJMAcIx1aAAIqk0lAuycompyFwBMHAsAZlj/lgw0rsy2AkhbsgK4Q+70CUBjxeFXsUb0G1HJDJC9rketZRcCWCJwHM8DgJm7b7ch+XizXm25QQxiEOcXvwGCWOhbCZC0qAAAAABJRU5ErkJggg==";
    this.startingScreen.startLabel.texture = new THREE.Texture(
      this.startingScreen.startLabel.image
    );
    this.startingScreen.startLabel.texture.magFilter = THREE.NearestFilter;
    this.startingScreen.startLabel.texture.minFilter = THREE.LinearFilter;
    this.startingScreen.startLabel.texture.needsUpdate = true;
    this.startingScreen.startLabel.material = new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      color: 0xffffff,
      alphaMap: this.startingScreen.startLabel.texture,
    });
    this.startingScreen.startLabel.material.opacity = 0;
    this.startingScreen.startLabel.mesh = new THREE.Mesh(
      this.startingScreen.startLabel.geometry,
      this.startingScreen.startLabel.material
    );
    this.startingScreen.startLabel.mesh.matrixAutoUpdate = false;
    this.container.add(this.startingScreen.startLabel.mesh);

    // Progress
    this.resources.on("progress", (_progress) => {
      // Update area
      this.startingScreen.area.floorBorder.material.uniforms.uAlpha.value = 1;
      this.startingScreen.area.floorBorder.material.uniforms.uLoadProgress.value =
        _progress;
    });

    // Ready
    this.resources.on("ready", () => {
      window.requestAnimationFrame(() => {
        this.startingScreen.area.activate();

        gsap.to(this.startingScreen.area.floorBorder.material.uniforms.uAlpha, {
          value: 0.3,
          duration: 0.3,
        });
        gsap.to(this.startingScreen.loadingLabel.material, {
          opacity: 0,
          duration: 0.3,
        });
        gsap.to(this.startingScreen.startLabel.material, {
          opacity: 1,
          duration: 0.3,
          delay: 0.3,
        });
      });
    });

    // On interact, reveal
    this.startingScreen.area.on("interact", () => {
      this.startingScreen.area.deactivate();
      gsap.to(
        this.startingScreen.area.floorBorder.material.uniforms.uProgress,
        { value: 0, duration: 0.3, delay: 0.4 }
      );

      gsap.to(this.startingScreen.startLabel.material, {
        opacity: 0,
        duration: 0.3,
        delay: 0.4,
      });

      this.setupWorld();

      window.setTimeout(() => {
        this.reveal.go();
      }, 600);
    });
  }

  setSounds() {
    this.sounds = new Sounds({
      debug: this.debugFolder,
      time: this.time,
    });
  }

  setAxes() {
    this.axis = new THREE.AxesHelper();
    this.container.add(this.axis);
  }

  setControls() {
    this.controls = new Controls({
      config: this.config,
      sizes: this.sizes,
      time: this.time,
      camera: this.camera,
      sounds: this.sounds,
    });
  }

  setMaterials() {
    this.materials = new Materials({
      resources: this.resources,
      debug: this.debugFolder,
    });
  }

  setFloor() {
    this.floor = new Floor({
      debug: this.debugFolder,
    });

    this.container.add(this.floor.container);
  }

  setShadows() {
    this.shadows = new Shadows({
      time: this.time,
      debug: this.debugFolder,
      renderer: this.renderer,
      camera: this.camera,
    });
    this.container.add(this.shadows.container);
  }

  setPhysics() {
    // Don't recreate physics if already exists
    if (this.physics) {
      console.log('Physics already initialized, skipping');
      return;
    }
    
    this.physics = new Physics({
      config: this.config,
      debug: this.debug,
      scene: this.scene,
      time: this.time,
      sizes: this.sizes,
      controls: this.controls,
      sounds: this.sounds,
    });

    this.container.add(this.physics.models.container);
  }

  setZones() {
    this.zones = new Zones({
      time: this.time,
      physics: this.physics,
      debug: this.debugFolder,
    });
    this.container.add(this.zones.container);
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
      time: this.time,
    });

    this.container.add(this.areas.container);
  }

  setTiles() {
    this.tiles = new Tiles({
      resources: this.resources,
      objects: this.objects,
      debug: this.debug,
    });
  }

  setWalls() {
    this.walls = new Walls({
      resources: this.resources,
      objects: this.objects,
    });
  }

  setObjects() {
    this.objects = new Objects({
      time: this.time,
      resources: this.resources,
      materials: this.materials,
      physics: this.physics,
      shadows: this.shadows,
      sounds: this.sounds,
      debug: this.debugFolder,
    });
    this.container.add(this.objects.container);

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
      controlNormal: this.controls.normal,
      controlTouch: this.controls.touch,
      sounds: this.sounds,
      renderer: this.renderer,
      camera: this.camera,
      debug: this.debugFolder,
      config: this.config,
    });

    this.container.add(this.car.container);



  

    // Sounds.js'ye araç referansını set ediyoruz (uzamsal ses için önemli)
    if (this.sounds) {
      this.sounds.setCar(this.car);
      console.log("Araç referansı ses sistemine iletildi");
    } else {
      console.error("Ses sistemi başlatılmamış!");
    }
  }

  setRender() {
    this.render = new Render({
      scene:     this.scene,
      resources: this.resources,
      physics:   this.physics,
      debug:     this.debugFolder,
      rotateX:   0,   // 
      rotateY:   0,
      rotateZ:   Math.PI / 2 // Y ekseninde 90 derece,
    });
  }

  setSections() {
    this.sections = {};

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
      debug: this.debugFolder,
    };

    // Area
    this.sections.area = new AreaSection({
      ...options,
      x: 0,
      y: 0,
    });
    this.container.add(this.sections.area.container);
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
      physics: this.physics,
    });
    this.container.add(this.easterEggs.container);
  }



  setRocket() {
    this.rocket = new rocket({
      resources: this.resources,
      objects: this.objects,
      areas: this.areas,
      physics: this.physics,
      debug: this.debugFolder
    });
    this.container.add(this.rocket.container);
  }

 

  setPopUp() {
    try {
      // Verify all required dependencies exist before creating PopUpModule
      if (!this.scene) throw new Error("Scene is not initialized");
      if (!this.time) throw new Error("Time is not initialized");
      if (!this.physics) throw new Error("Physics is not initialized");
      if (!this.resources) throw new Error("Resources are not initialized");
      if (!this.areas) throw new Error("Areas are not initialized");
      if (!this.sounds) throw new Error("Sounds are not initialized");
      if (!this.objects) throw new Error("Objects are not initialized");
      
      this.popUp = new PopUpModule({
        scene: this.scene,
        time: this.time,
        physics: this.physics,
        resources: this.resources,
        areas: this.areas,
        sounds: this.sounds,
        objects: this.objects
      });
      
      this.container.add(this.popUp.container);
      console.log("Pop-up successfully initialized");
    } catch (error) {
      console.error("Pop-up initialization error:", error.message);
    }
  }

  


 

 




  setCoordinateShower() {
    this.coordinateShower = new CoordinateShower({
      debug: this.debug,
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
      renderer: this.renderer,
      container: this.container,
      scene: this.scene
    });
  }

  setCompleteScene() {
    this.completeScene = new CompleteScene({
      debug: this.debug,
      resources: this.resources,
      time: this.time,
      sizes: this.sizes,
      camera: this.camera,
      renderer: this.renderer,
      container: this.container,
      physics: this.physics,
      areas: this.areas,
      objects: this.objects,
      scene: this.scene
    });
    
    // Add to scene
    this.scene.add(this.completeScene.container);
    
    // Set position for testing - placed slightly away from the origin
    this.completeScene.model.container.position.set(0, 0, 0);
    
    // Initialize the model test utility
    this.sceneModelTest = new SceneModelTest({
      completeScene: this.completeScene,
      debug: this.debug,
      time: this.time
    });
    
    // Debug
    if(this.debug) {
      const completeSceneFolder = this.debugFolder.addFolder('completeScene');
      completeSceneFolder.add(this.completeScene.model.container.position, 'x').name('position x').min(-100).max(100).step(0.1);
      completeSceneFolder.add(this.completeScene.model.container.position, 'y').name('position y').min(-100).max(100).step(0.1);
      completeSceneFolder.add(this.completeScene.model.container.position, 'z').name('position z').min(-100).max(100).step(0.1);
    }
  }

  setResetButton() {
    try {
      // Verify required dependencies
      if (!this.areas) throw new Error("Areas system is not initialized");
      if (!this.container) throw new Error("Container is not initialized");
      if (!this.resources || !this.resources.items || !this.resources.items.areaResetTexture) {
        throw new Error("Required texture resource 'areaResetTexture' is missing");
      }
      
      // Set up
      this.resetButton = {};
      this.resetButton.x = 0.735;
      this.resetButton.y = 0.145;

      // Create popup elements
      this.resetButton.createCenteredPopup = (message) => {
        // Create popup container
        const popupContainer = document.createElement("div");
        popupContainer.style.position = "fixed";
        popupContainer.style.top = "0";
        popupContainer.style.left = "0";
        popupContainer.style.width = "100%";
        popupContainer.style.height = "100%";
        popupContainer.style.display = "flex";
        popupContainer.style.justifyContent = "center";
        popupContainer.style.alignItems = "center";
        popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        popupContainer.style.zIndex = "9999";

        // Create popup box
        const popupBox = document.createElement("div");
        popupBox.style.backgroundColor = "white";
        popupBox.style.color = "black";
        popupBox.style.padding = "30px 40px";
        popupBox.style.borderRadius = "8px";
        popupBox.style.minWidth = "300px";
        popupBox.style.maxWidth = "90%";
        popupBox.style.textAlign = "center";
        popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";

        // Create title element
        const titleEl = document.createElement("h2");
        titleEl.style.margin = "0 0 25px 0";
        titleEl.style.fontSize = "24px";
        titleEl.style.fontWeight = "bold";
        titleEl.textContent = message || "Information";

        // Create content
        const contentDiv = document.createElement("div");
        contentDiv.innerHTML = `
          <p>Visit our website for more information:</p>
          <a href="https://your-website.com" target="_blank" style="color: blue; text-decoration: underline;">Visit Website</a>
        `;

        // Create close button
        const closeButton = document.createElement("button");
        closeButton.textContent = "Close";
        closeButton.style.padding = "10px 25px";
        closeButton.style.border = "none";
        closeButton.style.backgroundColor = "#e0e0e0";
        closeButton.style.color = "#333";
        closeButton.style.cursor = "pointer";
        closeButton.style.borderRadius = "5px";
        closeButton.style.fontSize = "16px";
        closeButton.style.marginTop = "20px";

        // Add close functionality
        closeButton.addEventListener("click", () => {
          document.body.removeChild(popupContainer);
        });

        // Also close on backdrop click
        popupContainer.addEventListener("click", (event) => {
          if (event.target === popupContainer) {
            document.body.removeChild(popupContainer);
          }
        });

        // Add elements to DOM
        popupBox.appendChild(titleEl);
        popupBox.appendChild(contentDiv);
        popupBox.appendChild(closeButton);
        popupContainer.appendChild(popupBox);
        document.body.appendChild(popupContainer);
      };

      // Button action function
      this.resetButton.reset = () => {
        // Play sound effect
        if (this.sounds) {
          this.sounds.play("click");
        }

        // Show info popup
        this.resetButton.createCenteredPopup("Project Information");
      };

      // Reset area
      this.resetButton.resetArea = this.areas.add({
        position: new THREE.Vector2(this.resetButton.x, this.resetButton.y),
        halfExtents: new THREE.Vector2(0.5, 0.5),
      });

      // Add interaction
      this.resetButton.resetArea.on("interact", () => {
        this.resetButton.reset();
      });

      // Reset label
      this.resetButton.areaLabelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 0.25),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          color: 0xffffff,
          alphaMap: this.resources.items.areaResetTexture,
        })
      );
      this.resetButton.areaLabelMesh.position.x = this.resetButton.x;
      this.resetButton.areaLabelMesh.position.y = this.resetButton.y;
      this.resetButton.areaLabelMesh.matrixAutoUpdate = false;
      this.resetButton.areaLabelMesh.updateMatrix();
      this.container.add(this.resetButton.areaLabelMesh);

      // Add keyboard listener for 'R' key
      window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'r') {
          console.log('Reset triggered by R key');
          this.resetButton.reset();
        }
      });
      
      console.log("Reset button successfully initialized");
    } catch (error) {
      console.error("Reset button initialization error:", error.message);
    }
  }

  canInitializeFeature(featureName) {
    // Check common dependencies for features
    const commonDeps = {
      'resetButton': ['areas', 'container', 'resources'],
      'popUp': ['scene', 'time', 'physics', 'resources', 'areas', 'sounds', 'objects'],
      'rocket': ['resources', 'objects', 'areas', 'physics']
    };
    
    // If feature not defined, assume it needs basic dependencies
    const dependencies = commonDeps[featureName] || ['resources', 'container'];
    
    // Check each dependency
    const missing = dependencies.filter(dep => !this[dep]);
    
    if (missing.length > 0) {
      console.warn(`Cannot initialize ${featureName}: Missing dependencies: ${missing.join(', ')}`);
      return false;
    }
    
    // Check specific resource requirements
    if (featureName === 'resetButton' && 
        (!this.resources.items || !this.resources.items.areaResetTexture)) {
      console.warn(`Cannot initialize ${featureName}: Missing required texture 'areaResetTexture'`);
      return false;
    }
    
    return true;
  }

  setRoad() {
    try {
      // Verify required dependencies
      if (!this.resources) throw new Error("Resources are not initialized");
      
      this.road = new Road({
        debug: this.debugFolder,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        time: this.time,
      });

      // Add to scene if valid
      if (this.road && this.road.container) {
        this.container.add(this.road.container);
        console.log("Road successfully initialized");
      }
    } catch (error) {
      console.error("Error initializing Road:", error.message);
    }
  }

}
