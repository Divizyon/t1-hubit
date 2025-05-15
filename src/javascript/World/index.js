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
import AladdinTepesi from './alaadintepesi.js'
import Kapsul from "./Kapsul.js";
import DivizyonBina from "./DivizyonBina.js";
import Sosyalino from "./SosyalinoModule.js";
import AreaSection from "./Sections/AreaSection.js";
import kelebeklervadisi from "./kelebeklervadisi.js";
import Controls from "./Controls.js";
import Sounds from "./Sounds.js";
import gsap from "gsap";
import EasterEggs from "./EasterEggs.js";
import bilimmerkezi from "./bilimmerkezi.js";
import roketplatformu from "./roketplatformu.js";
import GreenBox from "./GreenBox.js";
import Render from "./Render.js";
import Stadyum from "./stadyum.js";
import Konseralani from "./konseralani.js";
import Japonparki from "./japonparki.js";
import Basket from "./basket.js";
import Cowork from "./cowork.js";
import CalisanGenclikMerkezi from "./calisanGenclikMerkezi.js";
import AtmosferAlani from "./AtmosferAlani.js";
import Newton from "./Newton.js";

import KonyaGencKart from "./KonyaGencKart.js";
import Cevre from './cevre.js';
import PopUpModule from "./PopUpModule.js"
import sesOdasi from './sesOdasi.js'
import rocket from './rocket.js'
import ProjectsSection from "./Sections/ProjectsSection.js";
import Kademe from "./Kademe.js";




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
    // Remove the hide call at the beginning since startingScreen might not be initialized yet
    // this.startingScreen && this.startingScreen.hide();

    // this.setAxes()
    this.setSounds();
    this.setControls();
    this.setFloor();
    this.setAreas();
    this.setStartingScreen();

    // Now we can hide the starting screen if it exists since it's been initialized
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
    this.setRender(); // Render modelini ekler
    this.setSesOdasi(); // Ses odası modelini ekler
    this.setGreenBox(); // Yeşil kutu modelini ekler
    this.setAladdinTepesi(); // Aladdin Tepesi modelini ekler
    this.setKapsul(); // Kapsul modelini ekler
    // Removing this line since we consolidated the functionality into Kapsul.js
    // this.setKapsulArea(); // Kapsul etkileşim alanını ekler
    this.setSosyalino(); // Sosyalino modelini ekler
    this.setCalisanGenclikMerkezi(); // CalisanGenclikMerkezi modelini ekler
    this.setKelebekler(); // Kelebekler Vadisi modelini ekler
    this.setbilimmerkezi(); // Bilim Merkezi modelini ekler
    this.setNewton(); // Newton modelini ekler
    this.setroketplatformu(); // Roket Platformu modelini ekler
    this.setDivizyonBina(); // Divizyon Bina modelini ekler

    this.setAtmosferAlani(); // Atmosfer Alanı modelini ekler

    this.setStadyum(); // Stadyum modelini ekler
    this.setKonseralani(); // Konseralani modelini ekler
    this.setJaponparki(); // Japonparki modelini ekler
    this.setBasket(); // Basket modelini ekler
    this.setCowork(); // Cowork modelini ekler

    this.setKonyaGencKart(); // Yeni eklenen model
    this.setPopUp();
    this.setCevre(); // Çevre modelleri (trafik lambası, yön tabelası, lego parçaları vb.)
    this.setKademe(); // Kademe modelini ekle
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

  setRender() {
    this.render = new Render({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: 0,   // 
      rotateY: 0,
      rotateZ: 2 // Hafif sağa çevirme
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

    // Projects
    this.sections.projects = new ProjectsSection({
      ...options,
      x: -7,
      y: 3.2

      // x: 0,
      // y: 0
    })
    this.container.add(this.sections.projects.container)

    // Projects
    this.sections.projects = new ProjectsSection({
      ...options,
      x: -7,
      y: 3.2

      // x: 0,
      // y: 0
    })
    this.container.add(this.sections.projects.container)
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
    this.sesOdasi = new sesOdasi({
      resources: this.resources,
      objects: this.objects,
      sounds: this.sounds,
      physics: this.physics,
      debug: this.debugFolder
    });
    this.container.add(this.sesOdasi.container);
  }

  setRocket() {
    this.rocket = new rocket({
      resources: this.resources,
      objects: this.objects,
      areas: this.areas,
      physics: this.physics,
      sounds: this.sounds,
      debug: this.debugFolder
    });
    this.container.add(this.rocket.container);
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
      camera: this.camera,
      areas: this.areas,
      car: this.car,
      sounds: this.sounds
    });

    // Greenbox container'ını World container'ına ekle
    this.container.add(this.greenBox.container);
  }

  setResetButton() {
    // Reset butonu kaldırıldı
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

  setAladdinTepesi() {
    this.alaadintepesi = new AladdinTepesi({
      scene: this.scene,
      time: this.time,
      physics: this.physics,
      areas: this.areas,  // Add areas parameter
      resources: this.resources  // Add resources parameter
    });
    this.container.add(this.alaadintepesi.model);
    console.log("Alaaddin Tepesi modeli başarıyla eklendi");
  }

  setKapsul() {
    this.kapsul = new Kapsul({
      time: this.time,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debugFolder,
      areas: this.areas,
      sounds: this.sounds
    });
    this.container.add(this.kapsul.container);
    console.log("Kapsül modeli başarıyla eklendi");
  }

  setSosyalino() {
    try {
      this.sosyalino = new Sosyalino({
        resources: this.resources,
        objects: this.objects,
        shadows: this.shadows,
        sounds: this.sounds,
        areas: this.areas,
        physics: this.physics,
        time: this.time
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
      this.calisanGenclikMerkezi = new CalisanGenclikMerkezi({
        scene: this.scene,
        resources: this.resources,
        objects: this.objects,
        physics: this.physics,
        debug: this.debugFolder,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        areas: this.areas
      });

      // Container'ı doğrudan sahnede eklenmiş olarak oluşturuyoruz, bu nedenle ekstra eklemeye gerek yok
      console.log("CalisanGenclikMerkezi modeli başarıyla eklendi");
    } catch (error) {
      console.error("CalisanGenclikMerkezi eklenirken hata oluştu:", error);
    }
  }

  setKelebekler() {
    // Check if we're not attaching Kelebekler Vadisi twice
    if (this.kelebekler) {
      console.warn("Kelebekler Vadisi already initialized, skipping duplicate initialization");
      return;
    }

    console.log("Initializing Kelebekler Vadisi model...");

    this.kelebekler = new kelebeklervadisi({
      time: this.time,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debugFolder,
      areas: this.areas, // Add areas for interaction
      sounds: this.sounds // Add sounds for interaction
    });

    this.container.add(this.kelebekler.container);
    console.log("Kelebekler Vadisi container added to world");
  }

  setKonseralani() {
    this.konseralani = new Konseralani({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: 0,
      rotateY: 0,
      rotateZ: Math.PI / 2// Y ekseninde 90 derece,
    });
  }

  setStadyum() {
    this.stadyum = new Stadyum({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: 0,
      rotateY: 0,
      rotateZ: Math.PI / 2,
      areas: this.areas  // Add areas parameter
    });
    this.container.add(this.stadyum.container);
  }

  setJaponparki() {
    this.japonparki = new Japonparki({
      scene: this.scene,
      time: this.time,
      physics: this.physics,
      areas: this.areas  // Add areas parameter
    });
  }

  setBasket() {
    this.basket = new Basket({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: Math.PI / 2,
      rotateY: 0,
      rotateZ: 0
    });
  }

  setCowork() {
    this.cowork = new Cowork({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 2
    });
  }

  setKonyaGencKart() {
    try {
      this.konyaGencKart = new KonyaGencKart({
        scene: this.scene,
        time: this.time,
        physics: this.physics,
        resources: this.resources,
        areas: this.areas,
        sounds: this.sounds
      });

      // Add the container to the world container
      if (this.konyaGencKart && this.konyaGencKart.container) {
        this.container.add(this.konyaGencKart.container);
      }

      console.log("Konya Genç Kart modeli başarıyla eklendi");
    } catch (error) {
      console.error("Konya Genç Kart eklenirken hata oluştu:", error);
    }
  }

  setPopUp() {
    try {
      this.popUp = new PopUpModule({
        scene: this.scene,
        time: this.time,
        physics: this.physics,
        resources: this.resources,
        areas: this.areas,
        sounds: this.sounds,
        objects: this.objects  // objects parametresini ekledim
      });

      this.container.add(this.popUp.container);
      console.log("Pop-up başarıyla eklendi");
    } catch (error) {
      console.error("Pop-up eklenirken hata oluştu:", error);
    }
  }

  setAtmosferAlani() {
    try {
      this.atmosferAlani = new AtmosferAlani({
        resources: this.resources,
        objects: this.objects,
        debug: this.debug,
        time: this.time,
        physics: this.physics,
        shadows: this.shadows,
        materials: this.materials,
        areas: this.areas,
        sounds: this.sounds
      });
      if (this.atmosferAlani && this.atmosferAlani.container) {
        this.container.add(this.atmosferAlani.container);
        console.log("Atmosfer Alanı başarıyla eklendi");
      } else {
        console.warn("Atmosfer Alanı container nesnesi bulunamadı!");
      }
    } catch (error) {
      console.error("Atmosfer Alanı eklenirken hata oluştu:", error);
    }
  }

  setroketplatformu() {
    this.roketplatformu = new roketplatformu({
      time: this.time,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debugFolder
    });
    this.container.add(this.roketplatformu.container);
  }

  setaStadyum() {
    this.stadyum = new Stadyum({
      time: this.time,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debugFolder
    });
    this.container.add(this.stadyum.container); // Küçük harfle yazılmalı
  }

  setKonseralani() {
    this.konseralani = new Konseralani({
      scene: this.scene,
      resources: this.resources,
      physics: this.physics,
      debug: this.debugFolder,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 6
    });
  }

  setbilimmerkezi() {
    this.bilimmerkezi = new bilimmerkezi({
      time: this.time,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debugFolder,
      areas: this.areas,
      sounds: this.sounds
    });
    this.container.add(this.bilimmerkezi.container);
  }

  setDivizyonBina() {
    try {
      this.divizyonBina = new DivizyonBina({
        scene: this.scene,
        resources: this.resources,
        physics: this.physics,
        debug: this.debugFolder,
        rotateX: 0,
        rotateY: 0,
        rotateZ: Math.PI / 2,
        areas: this.areas  // Add areas parameter
      });
      console.log("Divizyon Bina modeli başarıyla eklendi");
    } catch (error) {
      console.error("DivizyonBina eklenirken hata oluştu:", error);
    }
  }

  setCevre() {
    try {
      this.cevre = new Cevre({
        scene: this.scene,
        resources: this.resources,
        physics: this.physics,
        debug: this.debugFolder,
        time: this.time
      });

      if (this.cevre && this.cevre.container) {
        this.container.add(this.cevre.container);
        console.log("Çevre modelleri başarıyla eklendi");
      } else {
        console.warn("Çevre container nesnesi bulunamadı!");
      }
    } catch (error) {
      console.error("Çevre modelleri eklenirken hata oluştu:", error);
    }
  }

  setNewton() {
    this.newton = new Newton({
      scene: this.scene,
      time: this.time,
      physics: this.physics
    });
  }

  setKademe() {
    this.kademe = new Kademe({
      scene: this.scene,
      resources: this.resources,
      objects: this.objects,
      physics: this.physics,
      debug: this.debug
    });
    this.container.add(this.kademe.container);
  }
}
