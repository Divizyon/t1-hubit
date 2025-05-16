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
    
    // Track if the world has been started
    this.started = false;

    // Debug
    if (this.debug) {
      this.debugFolder = this.debug.addFolder("world");
      this.debugFolder.open();
    }

    // Set up
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;

    // Initialize reveal early
    this.setReveal();

    // this.setAxes()
    this.setSounds();
    this.setControls();
    this.setFloor();
    this.setAreas();
    this.setStartingScreen();
  }

  start() {
    // Only run once
    if (this.started) return;
    this.started = true;
    
    // this.setAxes()
    this.setSounds();
    this.setControls();
    this.setFloor();
    this.setAreas();
    
    window.setTimeout(() => {
      this.camera.pan.enable();
    }, 2000);

    // We already set reveal in constructor to ensure it's available
    this.setMaterials();
    this.setShadows();
    // Remove Road component - causing warnings
    // this.setRoad();
    this.setPhysics();
    this.setZones();
    this.setObjects();
    this.setCar();
    
    // Initialize with car hidden - will be shown when "Gezmeye Başla" button is clicked
    if (this.car && this.car.chassis && this.car.chassis.object) {
      this.car.chassis.object.visible = false;
    }
    
    // Set car to sleep initially
    if (this.physics && this.physics.car && this.physics.car.chassis && this.physics.car.chassis.body) {
      this.physics.car.chassis.body.sleep();
    }
    
    this.areas.car = this.car;
    this.setTiles();
    this.setWalls();
    this.setSections();
    this.setEasterEggs();

    this.setRocket();
    this.setRender();
    this.setSesOdasi();
    this.setGreenBox();
    this.setAladdinTepesi();
    this.setKapsul();
    this.setSosyalino();
    this.setCalisanGenclikMerkezi();
    this.setKelebekler();
    this.setbilimmerkezi();
    this.setNewton();
    this.setroketplatformu();
    this.setDivizyonBina();
    this.setAtmosferAlani();
    this.setStadyum();
    this.setKonseralani();
    this.setJaponparki();
    this.setBasket();
    this.setCowork();
    this.setKonyaGencKart();
    this.setPopUp();
    // Remove Cevre component - causing warnings  
    // this.setCevre();
    this.setKademe();
  }

  setReveal() {
    this.reveal = {};
    // Start with everything dark/hidden (0) when world is first loaded
    this.reveal.matcapsProgress = 0;
    this.reveal.floorShadowsProgress = 0;
    this.reveal.previousMatcapsProgress = null;
    this.reveal.previousFloorShadowsProgress = null;

    // Go method - called when the user clicks "Gezmeye Başla"
    this.reveal.go = () => {
      // Make sure we start from 0 (dark) when animating
      this.reveal.matcapsProgress = 0;
      this.reveal.floorShadowsProgress = 0;
      
      // Animate matcaps to show everything
      gsap.fromTo(
        this.reveal,
        { matcapsProgress: 0 },
        { matcapsProgress: 1, duration: 3 }
      );
      
      // Animate floor shadows to appear
      gsap.fromTo(
        this.reveal,
        { floorShadowsProgress: 0 },
        { floorShadowsProgress: 1, duration: 3, delay: 0.5 }
      );
      
      // Animate shadows if they exist
      if (this.shadows) {
        gsap.fromTo(
          this.shadows,
          { alpha: 0 },
          { alpha: 0.5, duration: 3, delay: 0.5 }
        );
      }

      // Car animation - car should already be positioned high in the sky by Application.js
      if (this.physics && this.physics.car && this.physics.car.chassis) {
        // Reset car position if needed before animation
        this.physics.car.chassis.body.position.set(0, 0, 12);
        
        // Car will be woken up after a short delay
        window.setTimeout(() => {
          this.physics.car.chassis.body.wakeUp();
        }, 300);
      }

      // Sound effects
      if (this.sounds) {
        if (this.sounds.engine && this.sounds.engine.volume) {
          gsap.fromTo(
            this.sounds.engine.volume,
            { master: 0 },
            { master: 0.7, duration: 0.5, delay: 0.3, ease: "power2.in" }
          );
        }
        
        window.setTimeout(() => {
          if (typeof this.sounds.play === 'function') {
            this.sounds.play("reveal");
          }
        }, 400);
      }

      // Controls
      if (this.controls && this.controls.touch) {
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
        if (this.materials && this.materials.shades && this.materials.shades.items) {
          for (const _materialKey in this.materials.shades.items) {
            const material = this.materials.shades.items[_materialKey];
            material.uniforms.uRevealProgress.value = this.reveal.matcapsProgress;
          }
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
        if (this.objects && this.objects.floorShadows) {
          for (const _mesh of this.objects.floorShadows) {
            _mesh.material.uniforms.uAlpha.value =
              this.reveal.floorShadowsProgress;
          }
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
    // This implementation is now empty since we're handling loading screen in Application.js
    this.startingScreen = {};
    this.startingScreen.hide = () => {}; // Empty function for compatibility
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
      // Ensure physics is initialized before creating Road
      if (!this.physics || !this.physics.world) {
        console.warn("Road: Physics or physics.world not available yet, deferring Road creation");
        return;
      }

      // Ensure resources are loaded
      if (!this.resources || !this.resources.items || !this.resources.items.roadModel) {
        console.warn("Road: Required resources not available yet, deferring Road creation");
        return;
      }

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
        console.log("Road başarıyla eklendi");
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
      // Check if necessary components are available
      if (!this.physics || !this.physics.world) {
        console.warn("Cevre: Physics or physics.world not available, deferring Cevre creation");
        return;
      }

      // Check if scene is available
      if (!this.scene) {
        console.warn("Cevre: Scene not available, deferring Cevre creation");
        return;
      }

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
