import * as THREE from 'three';

export default class AtmosferAlani {
    constructor(_options) {
        this.resources = _options.resources;
        this.objects = _options.objects;
        this.debug = _options.debug;
        this.time = _options.time;
        this.physics = _options.physics;
        this.shadows = _options.shadows;
        this.materials = _options.materials;
        this.areas = _options.areas;
        this.sounds = _options.sounds;

        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;
        this.container.scale.set(1.5, 1.5, 1.5);

        this.setAtmosferAlani();
    }

    setAtmosferAlani() {
        this.model = this.objects.add({
            base: this.resources.items.atmosferAlaniModel.scene,
            // collision: null, // Gerekirse collision ekleyebilirsin
            offset: new THREE.Vector3(-25, 0, 0.03), // Eski koordinatlara geri alındı
            rotation: new THREE.Euler(Math.PI / 2, 0, 0), // X ekseninde +90 derece döndürdüm
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true,
            name: "Atmosfer Alanı"
        });

        if (this.model && this.model.container) {
            this.container.add(this.model.container);
            this.model.container.scale.set(1.5, 1.5, 1.5);
            this.model.container.traverse(child => {
                if (child.isMesh) {
                    child.scale.set(1.5, 1.5, 1.5);
                }
            });
            console.log("Atmosfer Alanı başarıyla eklendi");
        } else {
            console.warn("Atmosfer Alanı modeli yüklenemedi veya bulunamadı!");
        }
    }
} 