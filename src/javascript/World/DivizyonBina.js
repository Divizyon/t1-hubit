
import * as THREE from 'three'
import CANNON from 'cannon'

export default class DivizyonBina {
    constructor(_options) {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.time = _options.time
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.areas = _options.areas // Etkileşim alanları için gereken areas objesini ekle
        this.sounds = _options.sounds // Ses efektleri için gereken sounds objesini ekle

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true

        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('divizyonBina')
            this.debugFolder.open()
        }

        // DivizyonBina modelinin varlığını kontrol et
        if (this.resources.items.divizyonBinaModel) {
            this.setModel()
            this.setInteractionArea() // Etkileşim alanını ekle
        } else {
            console.error('HATA: DivizyonBina modeli (divizyonBinaModel) resources içinde bulunamadı!')
        }
    }

    setModel() {
        this.model = {}

        // Resource
        this.model.resource = this.resources.items.divizyonBinaModel

        // Model container
        this.model.container = new THREE.Object3D()
        this.model.container.matrixAutoUpdate = true
        this.container.add(this.model.container)

        // Ana modeli ekle
        try {
            // GLB modeli doğrudan kullanabilir miyiz kontrol edelim
            if (this.model.resource && this.model.resource.scene) {
                // Model referansını küresel olarak kaydet
                const divizyonBinaModel = this.model.resource.scene.clone()
                this.model.divizyonBinaModel = divizyonBinaModel;

                // DivizyonBina konumu - ORİJİNAL KONUM KULLAN
                const centerPosition = new THREE.Vector3(-75, 10, 0);

                // Model boyutlarını tanımla
                const size = {
                    x: 4.5,  // Binanın genişliği
                    y: 4.5,  // Binanın yüksekliği
                    z: 4.5   // Binanın derinliği
                };

                // Ölçek faktörü - biraz daha geniş bir çarpışma kutusu için
                const scaleFactor = 1.3;

                // Pozisyon bilgileri
                const posizyonX = centerPosition.x;
                const posizyonY = centerPosition.y;
                const posizyonZ = centerPosition.z;

                // Fizik gövdesi oluştur
                const body = new CANNON.Body({
                    mass: 0,  // Statik nesne
                    position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ),
                    material: this.physics.materials.items.floor
                });

                // Tek bir box collision (modelin tamamı için)
                const mainShape = new CANNON.Box(new CANNON.Vec3(
                    Math.abs(size.x) * scaleFactor / 2,
                    Math.abs(size.y) * scaleFactor / 2,
                    Math.abs(size.z) * scaleFactor / 2
                ));
                body.addShape(mainShape);

                // Collision Eklemek İçin
                this.physics.world.addBody(body);

                // DivizyonBina'yı objects üzerinden ekle
                this.divizyonBinaObject = this.objects.add({
                    base: this.model.resource.scene,
                    offset: centerPosition,
                    rotation: new THREE.Euler(0, 0, 0),
                    shadow: { sizeX: 5, sizeY: 5, offsetZ: -0.6, alpha: 0.4 },
                    mass: 0, // Statik bir model olduğu için kütle 0 
                    sleep: false, // Fizik hesaplamaları yapılsın
                    name: "DivizyonBina" // İsim
                });

                // Modelin görünürlüğünü kontrol et
                if (this.divizyonBinaObject && this.divizyonBinaObject.container) {
                    this.divizyonBinaObject.container.position.copy(centerPosition);
                    this.divizyonBinaObject.container.scale.set(0.8, 0.8, 0.8);
                    this.divizyonBinaObject.container.visible = true;

                    // Fizik gövdesini modele bağla
                    this.divizyonBinaObject.collision = { body };

                    // Debug için görsel bir çarpışma kutusu oluştur (sadece debug modunda)
                    if (this.debug) {
                        const debugBox = new THREE.BoxHelper(
                            new THREE.Mesh(
                                new THREE.BoxGeometry(
                                    size.x * scaleFactor,
                                    size.y * scaleFactor,
                                    size.z * scaleFactor
                                ),
                                new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
                            ),
                            0xff0000
                        );
                        debugBox.position.copy(centerPosition);
                        this.container.add(debugBox);

                        // Debug kontrollerini ekle
                        const collisionFolder = this.debugFolder.addFolder('collision');
                        collisionFolder.add(debugBox, 'visible').name('showCollisionBox');
                    }

                    console.log("DivizyonBina başarıyla eklendi - basit çarpışma kutusu ile");
                }
            } else {
                console.error("DivizyonBina modeli yüklenemedi");
            }
        } catch (error) {
            console.error('HATA: DivizyonBina modeli eklenirken bir hata oluştu:', error)
        }

        // Debug paneli
        if (this.debug) {
            const folder = this.debugFolder.addFolder('position')
            folder.add(this.model.container.position, 'x').step(0.1).name('positionX')
            folder.add(this.model.container.position, 'y').step(0.1).name('positionY')
            folder.add(this.model.container.position, 'z').step(0.1).name('positionZ')

            const rotationFolder = this.debugFolder.addFolder('rotation')
            rotationFolder.add(this.model.container.rotation, 'x').step(0.01).name('rotationX')
            rotationFolder.add(this.model.container.rotation, 'y').step(0.01).name('rotationY')
            rotationFolder.add(this.model.container.rotation, 'z').step(0.01).name('rotationZ')
        }

import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-60, 0, 0); // Artık doğru yerde tanımlandı

export default class DivizyonBina {
  constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0 }) {
    this.scene = scene;
    this.resources = resources;
    this.objects = objects;
    this.physics = physics;
    this.debug = debug;

    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;

    this.container = new THREE.Object3D();
    this.position = DEFAULT_POSITION.clone();

    this._buildModel();
    this.scene.add(this.container);
  }

  _buildModel() {
    const gltf = this.resources.items.divizyonBinaModel;
    if (!gltf || !gltf.scene) {
      console.error('Divizyon bina modeli bulunamadı');
      return;
    }

    // Modeli klonla ve malzemeleri kopyala
    const model = gltf.scene.clone(true);
    model.traverse(child => {
      if (child.isMesh) {
        const origMat = child.material;
        const mat = origMat.clone();
        if (origMat.map) mat.map = origMat.map;
        if (origMat.normalMap) mat.normalMap = origMat.normalMap;
        if (origMat.roughnessMap) mat.roughnessMap = origMat.roughnessMap;
        if (origMat.metalnessMap) mat.metalnessMap = origMat.metalnessMap;
        mat.needsUpdate = true;
        child.material = mat;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Model pozisyonu ve dönüşü
    model.position.copy(this.position);
    model.rotation.set(this.rotateX, this.rotateY, this.rotateZ);
    this.container.add(model);

    // Bounding box hesapla
    model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());

    // Fizik gövdesi oluştur
    const halfExtents = new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2);
    const boxShape = new CANNON.Box(halfExtents);

    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(...this.position.toArray()),
      material: this.physics.materials.items.floor
    });

    // Dönüşü quaternion olarak ayarla
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(this.rotateX, this.rotateY, this.rotateZ, 'XYZ');
    body.quaternion.copy(quat);

    body.addShape(boxShape);
    this.physics.world.addBody(body);

    // Obje sistemine ekle
    if (this.objects) {
      const children = model.children.slice();
      const objectEntry = this.objects.add({
        base: { children },
        collision: { children },
        offset: this.position.clone(),
        mass: 0
      });
      objectEntry.collision = { body };
      if (objectEntry.container) {
        this.container.add(objectEntry.container);
      }

    }
  }
}

/* 

İndex.js dosyasında DivizyonBina'yı oluşturmak için:
import DivizyonBina from './DivizyonBina';

this.setDivizyonBina()

  setDivizyonBina() {
  this.divizyonBina = new DivizyonBina({
    scene:     this.scene,
    resources: this.resources,
    physics:   this.physics,
    debug:     this.debugFolder,
    rotateX:   0,   // X ekseninde döndürme yok
    rotateY:   0,   // Y ekseninde döndürme yok
    rotateZ:   Math.PI / 2 // Z ekseninde 90 derece döndürme
  });
}


                // Link hover efekti
                linkEl.addEventListener("mouseover", () => {
                    linkEl.style.backgroundColor = "#2980b9";
                });
                linkEl.addEventListener("mouseout", () => {
                    linkEl.style.backgroundColor = "#3498db";
                });

                // Açıklama metni
                const descriptionEl = document.createElement("p");
                descriptionEl.textContent = "Divizyon hakkında daha fazla bilgi almak için tıklayın.";
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

            console.log("DivizyonBina etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("DivizyonBina etkileşim alanı eklenirken hata oluştu:", error);
        }
    }
} 

