import * as THREE from 'three'

export default class DivizyonBina
{
    constructor(_options)
    {
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
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('divizyonBina')
            this.debugFolder.open()
        }
        
        // DivizyonBina modelinin varlığını kontrol et
        if(this.resources.items.divizyonBinaModel) {
            this.setModel()
            this.setInteractionArea() // Etkileşim alanını ekle
        } else {
            console.error('HATA: DivizyonBina modeli (divizyonBinaModel) resources içinde bulunamadı!')
        }
    }

    setModel()
    {
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
                
                // DivizyonBina için konumu ayarla - Ses odasından biraz daha uzağa yerleştir
                divizyonBinaModel.position.set(-45, 25, 0); // Y ekseninde yukarı taşındı (20'den 25'e)
                
                // Rotasyonu düzelt - Dik durması için rotasyonu sıfırla
                divizyonBinaModel.rotation.set(0, 0, 0);
                
                // Görünürlük ayarını açık olarak belirt
                divizyonBinaModel.visible = true;
                
                // Modelin ölçeğini ayarla
                divizyonBinaModel.scale.set(0.8, 0.8, 0.8); // Modelimizi biraz küçültelim
                
                // Tüm mesh'lerin materyallerini düzenle
                divizyonBinaModel.traverse((child) => {
                    if (child.isMesh) {
                        // Görünürlüğü açık olarak ayarla
                        child.visible = true;
                        
                        // Gölge ayarlarını yapıyoruz
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Eğer modelinizde materyal yoksa, varsayılan bir materyal atayabiliriz
                        if (!child.material) {
                            console.warn("Mesh üzerinde materyal bulunamadı, varsayılan materyal atanıyor");
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0xcccccc,      // Gri renk
                                roughness: 0.5,       
                                metalness: 0.2,       
                                side: THREE.DoubleSide,
                                emissive: 0x111111,
                                wireframe: false
                            });
                        } else {
                            // Varolan materyalin çift taraflı olmasını sağlıyoruz
                            child.material.side = THREE.DoubleSide;
                            // Opaklığı tam ayarla
                            child.material.transparent = false;
                            child.material.opacity = 1.0;
                            // Materyalin güncellenmesini sağla
                            child.material.needsUpdate = true;
                        }
                    }
                })
                
                // Modeli ekle
                this.model.container.add(divizyonBinaModel)
                
                // Fizik özelliklerini ekle
                const centerPosition = new THREE.Vector3(-45, 25, 0); // Yeni konumla eşleştirildi
                
                // Ana DivizyonBina nesnesini ekle
                this.divizyonBinaObject = this.objects.add({
                    base: this.model.resource.scene,
                    collision: this.resources.items.brickCollision.scene,
                    offset: centerPosition,
                    rotation: new THREE.Euler(0, 0, 0), // Rotasyonu düzelttik
                    shadow: { sizeX: 5, sizeY: 5, offsetZ: -0.6, alpha: 0.4 },
                    mass: 0, // Statik bir model olduğu için kütle 0
                    sleep: true, // Fizik hesaplamaları yapılmasın
                    name: "DivizyonBina" // İsim ekledim
                });
                
                // Modelin görünürlüğünü kontrol et
                if (this.divizyonBinaObject && this.divizyonBinaObject.container) {
                    this.divizyonBinaObject.container.visible = true;
                    console.log("DivizyonBina görünürlük ayarları yapıldı");
                }
                
                console.log("DivizyonBina başarıyla eklendi");
            } else {
                // Scene özelliği yoksa, direkt modeli kullanma
                console.warn("DivizyonBina modeli için scene özelliği bulunamadı, doğrudan modeli kullanmayı deniyoruz");
                
                // Direkt modeli kullan
                const divizyonBinaModel = this.model.resource;
                this.model.divizyonBinaModel = divizyonBinaModel;
                
                // DivizyonBina'yı objects üzerinden ekle
                this.divizyonBinaObject = this.objects.add({
                    base: this.model.resource,
                    collision: this.resources.items.brickCollision.scene,
                    offset: new THREE.Vector3(-45, 25, 0), // Yeni konum
                    rotation: new THREE.Euler(0, 0, 0), // Rotasyonu düzelttik
                    shadow: { sizeX: 5, sizeY: 5, offsetZ: -0.6, alpha: 0.4 },
                    mass: 0,
                    sleep: true,
                    name: "DivizyonBina"
                });
                
                // Görünürlüğü açık olarak ayarla
                if (this.divizyonBinaObject && this.divizyonBinaObject.container) {
                    this.divizyonBinaObject.container.visible = true;
                }
                
                console.log("DivizyonBina doğrudan model olarak başarıyla eklendi");
            }
        } catch (error) {
            console.error('HATA: DivizyonBina modeli eklenirken bir hata oluştu:', error)
        }
        
        // Debug paneli
        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('position')
            folder.add(this.model.container.position, 'x').step(0.1).name('positionX')
            folder.add(this.model.container.position, 'y').step(0.1).name('positionY')
            folder.add(this.model.container.position, 'z').step(0.1).name('positionZ')
            
            const rotationFolder = this.debugFolder.addFolder('rotation')
            rotationFolder.add(this.model.container.rotation, 'x').step(0.01).name('rotationX')
            rotationFolder.add(this.model.container.rotation, 'y').step(0.01).name('rotationY')
            rotationFolder.add(this.model.container.rotation, 'z').step(0.01).name('rotationZ')
            
            const scaleFolder = this.debugFolder.addFolder('scale')
            scaleFolder.add(this.model.container.scale, 'x').min(0.1).max(5).step(0.1).name('scaleX')
            scaleFolder.add(this.model.container.scale, 'y').min(0.1).max(5).step(0.1).name('scaleY')
            scaleFolder.add(this.model.container.scale, 'z').min(0.1).max(5).step(0.1).name('scaleZ')
            
            // Materyal kontrolleri
            if (this.model.divizyonBinaModel) {
                const materialFolder = this.debugFolder.addFolder('material')
                const materialData = {
                    color: '#cccccc',
                    wireframe: false,
                    metalness: 0.2,
                    roughness: 0.5
                };
                
                // Materyal değişim fonksiyonu
                const updateMaterial = () => {
                    this.model.divizyonBinaModel.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.color.set(materialData.color);
                            child.material.wireframe = materialData.wireframe;
                            child.material.metalness = materialData.metalness;
                            child.material.roughness = materialData.roughness;
                            child.material.needsUpdate = true;
                        }
                    });
                };
                
                materialFolder.addColor(materialData, 'color').onChange(updateMaterial);
                materialFolder.add(materialData, 'wireframe').onChange(updateMaterial);
                materialFolder.add(materialData, 'metalness', 0, 1).step(0.05).onChange(updateMaterial);
                materialFolder.add(materialData, 'roughness', 0, 1).step(0.05).onChange(updateMaterial);
                
                // Görünürlük kontrolü ekle
                materialFolder.add(this.model.container, 'visible').name('visible');
            }
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