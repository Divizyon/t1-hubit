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
import AlaaddinTepesi from "./alaadintepesi.js";
import Kapsul from "./Kapsul.js";
import DivizyonBina from "./DivizyonBina.js";
import Sosyalino from "./SosyalinoModule.js";
import IntroSection from "./Sections/IntroSection.js";
import AreaSection from "./Sections/AreaSection.js";
import ProjectsSection from "./Sections/ProjectsSection.js";
import CrossroadsSection from "./Sections/CrossroadsSection.js";
import InformationSection from "./Sections/InformationSection.js";
import PlaygroundSection from "./Sections/PlaygroundSection.js";
import KelebeklerSection from "./Sections/KelebeklerSection.js";
import Controls from "./Controls.js";
import Sounds from "./Sounds.js";
import gsap from "gsap";
import EasterEggs from "./EasterEggs.js";
import bilimmerkezi from "./bilimmerkezi.js";
import roketplatformu from "./roketplatformu.js";
import GreenBox from "./GreenBox.js";

import CalisanGenclikMerkezi from "./calisanGenclikMerkezi.js";


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
  }

  start() {
    window.setTimeout(() => {
      this.camera.pan.enable();
    }, 2000);

    this.setReveal();
    this.setMaterials();
    this.setShadows();
    this.setRoad();
    this.setPhysics();
    this.setZones();
    this.setObjects();
    this.setCar();
    this.areas.car = this.car;
    this.setTiles();
    this.setWalls();
    this.setSections();
    this.setEasterEggs();

    this.setRocket(); // Roket modelini ve fırlatma etkileşimini ekler
    this.setSesOdasi(); // Ses odası modelini ekler
    this.setGreenBox(); // Yeşil kutu modelini ekler
    this.setAlaaddinTepesi(); // Aladdin Tepesi modelini ekler
    this.setKapsul(); // Kapsul modelini ekler
    this.setKapsulArea(); // Kapsul etkileşim alanını ekler
    this.setSosyalino(); // Sosyalino modelini ekler
    this.setCalisanGenclikMerkezi(); // CalisanGenclikMerkezi modelini ekler
    this.setKelebekler(); // Kelebekler Vadisi modelini ekler
    this.setbilimmerkezi(); // Bilim Merkezi modelini ekler
    this.setroketplatformu(); // Roket Platformu modelini ekler
    this.setDivizyonBina(); // Divizyon Bina modelini ekler

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

      if (this.sections.intro) {
        gsap.fromTo(
          this.sections.intro.instructions.arrows.label.material,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, delay: 0.5 }
        );
        if (this.sections.intro.otherInstructions) {
          gsap.fromTo(
            this.sections.intro.otherInstructions.label.material,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, delay: 0.75 }
          );
        }
      }

      // Car
      this.physics.car.chassis.body.sleep();
      this.physics.car.chassis.body.position.set(0, 0, 12);

      window.setTimeout(() => {
        this.physics.car.chassis.body.wakeUp();
      }, 300);

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

      this.start();

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
    this.sections.intro = new IntroSection({
      ...options,
      x: 0,
      y: 0,
    });
    this.container.add(this.sections.intro.container);

    // Area
    this.sections.area = new AreaSection({
      ...options,
      x: 0,
      y: 0,
    });
    this.container.add(this.sections.area.container);

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
      // x: - 38,
      // y: - 34
    });
    this.container.add(this.sections.playground.container);
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

  setSesOdasi() {
    this.sesOdasi = this.objects.add({
      base: this.resources.items.sesOdasiModel.scene,
      collision: this.resources.items.brickCollision.scene, // Basit çarpışma modeli kullanıyoruz
      offset: new THREE.Vector3(-62, 30, 0), // Z=0 yaparak modeli zemin seviyesine yerleştiriyorum
      rotation: new THREE.Euler(0, 0, 0), // Düz duracak şekilde rotasyonu sıfırlıyorum
      shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
      mass: 0, // Statik bir bina olduğu için kütle 0
      sleep: true, // Fizik hesaplamaları yapılmasın
    });

    // Ses odası yanına uzamsal ses ekle
    console.log("Ses odası için uzamsal ses ekleniyor...");
    const sesOdasiSes = this.sounds.setSpatialSoundAtLocation({
      x: -62, // Ses odasının X konumu ile eşleştirdim
      y: 30, // Ses odasının Y konumu ile eşleştirdim
      z: 1.5, // Biraz yukarıda olsun ki yere çok yakın olmasın
      sound: "sesOdasi",
      customSoundPath: "./sounds/car-horns/duman.mp3", // Kullanılacak ses dosyası
      maxDistance: 30, // Mesafeyi artırdık
      refDistance: 8, // Referans mesafeyi artırdık - daha yakın olunca ses daha net
      rolloffFactor: 1.2, // Ses azalma faktörünü hafifçe düzenledik
      volume: 1.0, // Ses seviyesini maksimum
      autoplay: true, // Otomatik başlat
      loop: true, // Sürekli çal
    });

    console.log("Ses odası başarıyla eklendi:", this.sesOdasi);
  }

  setRocket() {
    // Platform ve roket için ortak koordinatlar ve yükseklikler
    const platformX = 19;
    const platformY = 15;
    const platformZ = 0;
    const platformHeight = 1; // Platformun yüksekliği (gerekirse ayarlanabilir)

    // Roket modelini ekle (otomatik bounding box ortalama kaldırıldı, sabit offset kullanılıyor)
    const rocketOffsetX = platformX - 0.8; // 1 birim sola kaydır
    const rocketOffsetY = platformY - 0.5; // 1 birim sana doğru yaklaştır

    this.rocket = this.objects.add({
      base: this.resources.items.roketModel.scene,
      collision: this.resources.items.brickCollision.scene,
      offset: new THREE.Vector3(rocketOffsetX, rocketOffsetY, platformZ + platformHeight),
      rotation: new THREE.Euler(0, 0, 5),
      shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
      mass: 1.5,
      soundName: "brick",
      sleep: false,
    });

    // Basış sayısını tutacak değişken
    this.rocketLaunchClickCount = 0;
    // LAUNCH/LAND yazısı için dinamik texture oluşturucu
    const createButtonTexture = (text) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = 'bold 60px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    };

    // areaLabelMesh'i oluştur ve sahneye ekle
    const areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        alphaMap: createButtonTexture('LAUNCH'),
      })
    );
    areaLabelMesh.position.set(10, 15, 0);
    areaLabelMesh.matrixAutoUpdate = false;
    areaLabelMesh.updateMatrix();
    this.container.add(areaLabelMesh);
    this.rocketAreaLabelMesh = areaLabelMesh; // referans kaydet

    // Enter etkileşimi için area ekle
    this.rocketArea = this.areas.add({
      position: new THREE.Vector2(10, 15),
      halfExtents: new THREE.Vector2(3, 3),
    });
    // Roket uçuş ve iniş kontrolü için flag ve interval
    this.rocketIsFlying = false;
    this.rocketLandingInterval = null;
    this.rocketDescentInterval = null;
    this.rocketLastMaxVelocity = 0; // Fırlatmada ulaşılan maksimum hız

    // Roketi havada sabitleyen fonksiyon
    const freezeRocketInAir = (body) => {
      if (this.rocketLandingInterval) clearInterval(this.rocketLandingInterval);
      this.rocketLandingInterval = setInterval(() => {
        if (this.rocketIsFlying) {
          body.velocity.set(0, 0, 0);
          body.position.z = Math.max(body.position.z, 10); // 10 birim yukarıda sabitleniyor
        }
      }, 50);
    };

    // Roket iniş animasyonu fonksiyonu
    const landRocket = (body) => {
      if (this.rocketLandingInterval) {
        clearInterval(this.rocketLandingInterval);
        this.rocketLandingInterval = null;
      }
      if (this.rocketDescentInterval) {
        clearInterval(this.rocketDescentInterval);
        this.rocketDescentInterval = null;
      }
      body.angularVelocity.set(0, 0, 0);
      // Düz iniş animasyonu
      const targetZ = 0.5;
      const descentSpeed = -Math.abs(this.rocketLastMaxVelocity) * 0.6 || -2; // Maksimum çıkış hızının %60'ı, yoksa -2
      this.rocketDescentInterval = setInterval(() => {
        const currentZ = body.position.z;
        if (currentZ <= targetZ + 0.05) {
          body.position.z = targetZ;
          body.velocity.set(0, 0, 0);
          clearInterval(this.rocketDescentInterval);
          this.rocketDescentInterval = null;
        } else {
          body.velocity.set(0, 0, descentSpeed);
        }
      }, 50);
    };

    // Duman efekti için sprite oluştur (sadece setRocket fonksiyonu içinde)
    let rocketSmokeSprite = null;
    if (this.resources.items.smokeTexture) {
      const smokeMaterial = new THREE.SpriteMaterial({
        map: this.resources.items.smokeTexture,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
      });
      rocketSmokeSprite = new THREE.Sprite(smokeMaterial);
      rocketSmokeSprite.scale.set(1.5, 1.5, 1.5);
      rocketSmokeSprite.position.set(0, 0, -1.2); // Roketin altına hizala
      this.rocket.container.add(rocketSmokeSprite);
      rocketSmokeSprite.visible = false;
    }

    this.rocketArea.on("interact", () => {
      this.rocketLaunchClickCount++;
      const body =
        this.rocket && this.rocket.collision && this.rocket.collision.body;

      if (this.rocketLaunchClickCount % 2 === 1) {
        // LAUNCH: Fırlat, LAND yazısını göster
        this.rocketAreaLabelMesh.material.alphaMap = createButtonTexture('LAND');
        this.rocketAreaLabelMesh.material.needsUpdate = true;
        // Duman efektini başlat
        if (rocketSmokeSprite) {
          rocketSmokeSprite.visible = true;
          rocketSmokeSprite.material.opacity = 0.7;
          rocketSmokeSprite.scale.set(1.5, 1.5, 1.5);
          let smokeElapsed = 0;
          let smokeInterval = setInterval(() => {
            smokeElapsed += 50;
            rocketSmokeSprite.scale.multiplyScalar(1.03);
            rocketSmokeSprite.material.opacity *= 0.97;
            if (rocketSmokeSprite.material.opacity < 0.05 || smokeElapsed > 2000) {
              rocketSmokeSprite.visible = false;
              clearInterval(smokeInterval);
            }
          }, 50);
        }
        if (body) {
          if (body.wakeUp) body.wakeUp();
          if (this.rocketLandingInterval) {
            clearInterval(this.rocketLandingInterval);
            this.rocketLandingInterval = null;
          }
          if (this.rocketDescentInterval) {
            clearInterval(this.rocketDescentInterval);
            this.rocketDescentInterval = null;
          }
          body.velocity.set(0, 0, 0);
          body.angularVelocity.set(0, 0, 10);
          this.rocketIsFlying = true;
          let elapsed = 0;
          let maxVelocity = 0;
          let interval = setInterval(() => {
            if (elapsed < 2000) {
              const force = 5 + (elapsed / 2000) * 40;
              body.velocity.z += force * 0.05;
              if (body.velocity.z > maxVelocity) maxVelocity = body.velocity.z;
              elapsed += 50;
            } else {
              clearInterval(interval);
              body.velocity.set(0, 0, 0);
              body.angularVelocity.set(0, 0, 0);
              this.rocketLastMaxVelocity = maxVelocity; // Maksimum çıkış hızını kaydet
              freezeRocketInAir(body);
            }
          }, 50);
        }
      } else {
        // LAND: LAUNCH yazısını göster, inişi başlat
        this.rocketAreaLabelMesh.material.alphaMap = createButtonTexture('LAUNCH');
        this.rocketAreaLabelMesh.material.needsUpdate = true;
        if (body) {
          if (body.wakeUp) body.wakeUp();
          this.rocketIsFlying = false;
          landRocket(body);
        }
      }
    });
  }

  setGreenBox() {
    this.greenBox = new GreenBox({
      resources: this.resources,
      objects: this.objects,
      debug: this.debug,
      time: this.time,
      physics: this.physics,
      shadows: this.shadows,
      materials: this.materials,
      camera: this.camera
    });

    // Greenbox container'ını World container'ına ekle
    this.container.add(this.greenBox.container);
  }

  setResetButton() {
    // Set up
    this.resetButton = {};
    this.resetButton.x = 0;
    this.resetButton.y = 7;

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

      // Create popup box (now bigger)
      const popupBox = document.createElement("div");
      popupBox.style.backgroundColor = "white";
      popupBox.style.color = "black";
      popupBox.style.padding = "30px 40px";
      popupBox.style.borderRadius = "8px";
      popupBox.style.minWidth = "500px";
      popupBox.style.maxWidth = "90%";
      popupBox.style.textAlign = "center";
      popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";

      // Create title element
      const titleEl = document.createElement("h2");
      titleEl.style.margin = "0 0 25px 0";
      titleEl.style.fontSize = "24px";
      titleEl.style.fontWeight = "bold";
      titleEl.textContent = message || "Image Gallery";

      // Sample image URLs (replace with your actual image URLs)
      const imageUrls = [
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9g_a2vS8t0DgWozGqk2RMSWwnieY8xuv1hQ&s",
        "https://img.piri.net/mnresize/900/-/resim/imagecrop/2022/12/02/02/01/resized_9d157-6812551fkapak.jpeg",
        "data:image/jpeg;base64,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",
        ];

      // Create image container grid
      const imageContainer = document.createElement("div");
      imageContainer.style.display = "grid";
      imageContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
      imageContainer.style.gap = "20px";
      imageContainer.style.marginBottom = "25px";

      // Create 4 divs for images
      for (let i = 0; i < 4; i++) {
        const imageDiv = document.createElement("div");
        imageDiv.style.height = "150px";
        imageDiv.style.backgroundColor = "#f0f0f0";
        imageDiv.style.borderRadius = "5px";
        imageDiv.style.display = "flex";
        imageDiv.style.alignItems = "center";
        imageDiv.style.justifyContent = "center";
        imageDiv.style.cursor = "pointer";
        imageDiv.style.backgroundImage = `url(${imageUrls[i]})`;
        imageDiv.style.backgroundSize = "cover";
        imageDiv.style.backgroundPosition = "center";
        imageDiv.style.position = "relative";
        imageDiv.style.overflow = "hidden";

        // Add overlay effect on hover
        const overlay = document.createElement("div");
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.opacity = "0";
        overlay.style.transition = "opacity 0.3s";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.color = "white";
        overlay.textContent = `Image ${i + 1}`;

        imageDiv.addEventListener("mouseover", () => {
          overlay.style.opacity = "1";
        });

        imageDiv.addEventListener("mouseout", () => {
          overlay.style.opacity = "0";
        });

        // Add click event to open image in full view
        imageDiv.addEventListener("click", () => {
          // Create full screen image viewer
          const fullView = document.createElement("div");
          fullView.style.position = "fixed";
          fullView.style.top = "0";
          fullView.style.left = "0";
          fullView.style.width = "100%";
          fullView.style.height = "100%";
          fullView.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
          fullView.style.zIndex = "10000";
          fullView.style.display = "flex";
          fullView.style.alignItems = "center";
          fullView.style.justifyContent = "center";

          const img = document.createElement("img");
          img.src = imageUrls[i];
          img.style.maxWidth = "80%";
          img.style.maxHeight = "80%";
          img.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.5)";

          fullView.appendChild(img);

          // Close on click
          fullView.addEventListener("click", () => {
            document.body.removeChild(fullView);
          });

          document.body.appendChild(fullView);
        });

        imageDiv.appendChild(overlay);
        imageContainer.appendChild(imageDiv);
      }

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
      closeButton.style.marginTop = "10px";

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
      popupBox.appendChild(imageContainer);
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

      // Show centered popup
      this.resetButton.createCenteredPopup("İstediğiniz fotoğrafı seçiniz.");

      // Also show notification if available
      if (this.customPopup) {
        this.customPopup.show("Gallery opened!");
      }
    };

    // Reset area
    this.resetButton.resetArea = this.areas.add({
      position: new THREE.Vector2(this.resetButton.x, this.resetButton.y),
      halfExtents: new THREE.Vector2(2, 2),
    });

    // Add interaction
    this.resetButton.resetArea.on("interact", () => {
      this.resetButton.reset();
    });

    // Reset label
    this.resetButton.areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
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

    // Debug
    if (this.debug) {
      const resetFolder = this.debugFolder.addFolder("Reset Button");
      resetFolder.add(this.resetButton, "reset").name("show popup");
      resetFolder
        .add(this.resetButton.areaLabelMesh.position, "x")
        .name("X position")
        .onChange(() => {
          this.resetButton.resetArea.position.x =
            this.resetButton.areaLabelMesh.position.x;
          this.resetButton.resetArea.update();
          this.resetButton.areaLabelMesh.updateMatrix();
        });
      resetFolder
        .add(this.resetButton.areaLabelMesh.position, "y")
        .name("Y position")
        .onChange(() => {
          this.resetButton.resetArea.position.y =
            this.resetButton.areaLabelMesh.position.y;
          this.resetButton.resetArea.update();
          this.resetButton.areaLabelMesh.updateMatrix();
        });
    }
  }

  setRoad() {
    try {
      this.road = new Road({
        debug: this.debugFolder,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        shadows: this.shadows,
        materials: this.materials,
        time: this.time,
      });

      // Sahneye ekle
      if (this.road && this.road.container) {
        this.container.add(this.road.container);
      }
    } catch (error) {
      console.error("HATA: Road oluşturulurken bir hata oluştu:", error);
    }
  }

  setAlaaddinTepesi() {
    this.aladdinTepesi = new AlaaddinTepesi({
      scene: this.scene,
      time: this.time,
      physics: this.physics
    });
  }

  setKapsul() {
    this.kapsul = new Kapsul({
        time: this.time,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        debug: this.debugFolder,
        scene: this.scene
    });
    this.container.add(this.kapsul.container);
    console.log("Kapsül modeli başarıyla eklendi");
  }

  setKapsulArea() {
    try {
      // Etkileşim etiketi oluştur
      const areaLabelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 0.5),
        new THREE.MeshBasicMaterial({
          transparent: true,
          depthWrite: false,
          color: 0xffffff,
          alphaMap: this.resources.items.areaResetTexture,
        })
      );
      areaLabelMesh.position.set(25, -25, 0.5); // Kapsul merkez konumu yakınında
      areaLabelMesh.matrixAutoUpdate = false;
      areaLabelMesh.updateMatrix();
      this.container.add(areaLabelMesh);

      // Etkileşim alanı oluştur
      this.kapsulArea = this.areas.add({
        position: new THREE.Vector2(25, -25), // Kapsul merkez konumu
        halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
      });

      // Etkileşim fonksiyonunu tanımla
      this.kapsulArea.on("interact", () => {
        // Popup oluştur
        const popupContainer = document.createElement("div");
        popupContainer.style.position = "fixed";
        popupContainer.style.top = "0";
        popupContainer.style.left = "0";
        popupContainer.style.width = "100%";
        popupContainer.style.height = "100%";
        popupContainer.style.display = "flex";
        popupContainer.style.justifyContent = "center";
        popupContainer.style.alignItems = "center";
        popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        popupContainer.style.zIndex = "9999";

        // Popup içeriği
        const popupBox = document.createElement("div");
        popupBox.style.backgroundColor = "white";
        popupBox.style.color = "black";
        popupBox.style.padding = "30px 40px";
        popupBox.style.borderRadius = "8px";
        popupBox.style.minWidth = "350px";
        popupBox.style.maxWidth = "90%";
        popupBox.style.textAlign = "center";
        popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";

        // Başlık
        const titleEl = document.createElement("h2");
        titleEl.style.margin = "0 0 25px 0";
        titleEl.style.fontSize = "24px";
        titleEl.style.fontWeight = "bold";
        titleEl.textContent = "Kapsül Web Sitesi";

        // Link oluştur
        const linkEl = document.createElement("a");
        linkEl.href = "https://www.kapsul.org.tr/";
        linkEl.textContent = "www.kapsul.org.tr";
        linkEl.target = "_blank";
        linkEl.style.display = "inline-block";
        linkEl.style.padding = "12px 25px";
        linkEl.style.backgroundColor = "#3498db";
        linkEl.style.color = "white";
        linkEl.style.textDecoration = "none";
        linkEl.style.borderRadius = "5px";
        linkEl.style.fontWeight = "bold";
        linkEl.style.margin = "15px 0";
        linkEl.style.transition = "background-color 0.3s";

        // Link hover efekti
        linkEl.addEventListener("mouseover", () => {
          linkEl.style.backgroundColor = "#2980b9";
        });
        linkEl.addEventListener("mouseout", () => {
          linkEl.style.backgroundColor = "#3498db";
        });

        // Açıklama metni
        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = "Kapsül hakkında daha fazla bilgi almak için tıklayın.";
        descriptionEl.style.margin = "0 0 20px 0";

        // Kapatma butonu
        const closeButton = document.createElement("button");
        closeButton.textContent = "Kapat";
        closeButton.style.padding = "10px 20px";
        closeButton.style.border = "none";
        closeButton.style.backgroundColor = "#e0e0e0";
        closeButton.style.color = "#333";
        closeButton.style.cursor = "pointer";
        closeButton.style.borderRadius = "5px";
        closeButton.style.fontSize = "14px";
        closeButton.style.marginTop = "20px";

        // Kapatma fonksiyonu
        closeButton.addEventListener("click", () => {
          document.body.removeChild(popupContainer);
        });

        // Popup dışına tıklamayla kapatma
        popupContainer.addEventListener("click", (event) => {
          if (event.target === popupContainer) {
            document.body.removeChild(popupContainer);
          }
        });

        // Elementleri popupa ekle
        popupBox.appendChild(titleEl);
        popupBox.appendChild(descriptionEl);
        popupBox.appendChild(linkEl);
        popupBox.appendChild(closeButton);
        popupContainer.appendChild(popupBox);
        document.body.appendChild(popupContainer);

        // Ses efekti çal
        if (this.sounds) {
          this.sounds.play("click");
        }
      });

      console.log("Kapsül etkileşim alanı başarıyla eklendi");
    } catch (error) {
      console.error("Kapsül etkileşim alanı eklenirken hata oluştu:", error);
    }
  }

  setSosyalino() {
    try {
      this.sosyalino = new Sosyalino({
        resources: this.resources,
        objects: this.objects,
        shadows: this.shadows,
        sounds: this.sounds,
        areas: this.areas  // Etkileşim için areas parametresini ekledim
      });

      if (this.sosyalino && this.sosyalino.container) {
        this.container.add(this.sosyalino.container);
        console.log("Sosyalino modeli başarıyla eklendi");
      } else {
        console.warn("Sosyalino container nesnesi bulunamadı!");
      }
    } catch (error) {
      console.error("Sosyalino eklenirken hata oluştu:", error);
    }
  }

  setCalisanGenclikMerkezi() {
    try {
      this.calisanGenclikMerkezi = new CalisanGenclikMerkezi(
        this.resources,
        this.objects,
        this.shadows,
        this.debug,
        this.scene
      )

      if (this.calisanGenclikMerkezi && this.calisanGenclikMerkezi.model) {
        this.container.add(this.calisanGenclikMerkezi.model)
        console.log("CalisanGenclikMerkezi modeli başarıyla eklendi")
      } else {
        console.warn("CalisanGenclikMerkezi modeli bulunamadı veya yüklenemedi!")
      }
    } catch (error) {
      console.error("CalisanGenclikMerkezi eklenirken hata oluştu:", error)
    }
  }


  setbilimmerkezi() { //küpü değiştir
    this.bilimmerkezi = new bilimmerkezi({ // Burada ödemli olan birinin küçük harf ile diğerinin ise büyük harf ile yazılması gerekiyor farklı şeyler
        time: this.time,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        debug: this.debugFolder,
        areas: this.areas
    })
    this.container.add(this.bilimmerkezi.container) // Küçük harfle yazılmalı
}

setroketplatformu() {
  try {
    this.roketplatformu = new roketplatformu({
      resources: this.resources,
      objects: this.objects,
      shadows: this.shadows,
      sounds: this.sounds,
      areas: this.areas // Eğer etkileşim alanı ekleyeceksen
    });
    
    if (this.roketplatformu && this.roketplatformu.container) {
      this.container.add(this.roketplatformu.container);
      console.log("Roket platformu modeli başarıyla eklendi");
    } else {
      console.warn("Roket platformu container nesnesi bulunamadı!");
    }
  } catch (error) {
    console.error("Roket platformu eklenirken hata oluştu:", error);
  }
}

  setDivizyonBina() {
    try {
      this.divizyonBina = new DivizyonBina({
        resources: this.resources,
        objects: this.objects,
        debug: this.debug,
        time: this.time,
        physics: this.physics,
        shadows: this.shadows,
        materials: this.materials,
        areas: this.areas,    // Etkileşim alanları için
        sounds: this.sounds   // Ses efektleri için
      });

      if (this.divizyonBina && this.divizyonBina.container) {
        this.container.add(this.divizyonBina.container);
        console.log("DivizyonBina modeli başarıyla eklendi");
      } else {
        console.warn("DivizyonBina container nesnesi bulunamadı!");
      }
    } catch (error) {
      console.error("DivizyonBina eklenirken hata oluştu:", error);
    }
  }

  

  setKelebekler() {
    this.kelebekler = new KelebeklerSection({
        time: this.time,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        debug: this.debugFolder
    })
    this.container.add(this.kelebekler.container) // Doğru nesne!
}

}
