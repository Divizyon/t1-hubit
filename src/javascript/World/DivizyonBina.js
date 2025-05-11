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
    }

    // DivizyonBina için etkileşim alanı oluştur
    setInteractionArea() {
        try {
            if (!this.areas) {
                console.error("DivizyonBina etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

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
            areaLabelMesh.position.set(-40, 25, 10); // Binanın tamamen önüne taşıdım (X'i -42'den -40'a, Z'yi 5'ten 10'a çıkardım)
            areaLabelMesh.matrixAutoUpdate = false;
            areaLabelMesh.updateMatrix();
            this.container.add(areaLabelMesh);

            // Etkileşim alanı oluştur
            this.divizyonArea = this.areas.add({
                position: new THREE.Vector2(-40, 25), // Butonun X koordinatını burada da güncelliyoruz
                halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
            });

            // Etkileşim fonksiyonunu tanımla
            this.divizyonArea.on("interact", () => {
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
                titleEl.textContent = "Divizyon Web Sitesi";

                // Link oluştur
                const linkEl = document.createElement("a");
                linkEl.href = "https://www.divizyon.org/";
                linkEl.textContent = "www.divizyon.org";
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