import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-69, -3, 2); // Artık doğru yerde tanımlandı

export default class DivizyonBina {
    constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0, areas }) {
        this.scene = scene;
        this.resources = resources;
        this.objects = objects;
        this.physics = physics;
        this.debug = debug;
        this.areas = areas;

        this.rotateX = rotateX;
        this.rotateY = rotateY;
        this.rotateZ = rotateZ;

        this.container = new THREE.Object3D();
        this.position = DEFAULT_POSITION.clone();

        this._buildModel();
        this.scene.add(this.container);

        // Add interaction area if areas parameter exists
        if (this.areas) {
            this.setDivizyonInteraction();
        }
    }

    setDivizyonInteraction() {
        try {
            if (!this.areas) {
                console.error("Divizyon etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

            // Bina pozisyonuna göreceli olarak etkileşim alanını yerleştir
            // Modelin sağ tarafından 2.5 birim uzağa yerleştir
            const interactionPosition = new THREE.Vector2(
                this.position.x +7, // X pozisyonu (model sağında)
                this.position.z  -5      // Z pozisyonu (model ile aynı)
            );

            // Create interaction area relative to model position
            this.divizyonArea = this.areas.add({
                position: interactionPosition,
                halfExtents: new THREE.Vector2(2, 2), // 2x2 unit area
            });

            // Create ENTER label using canvas
            const labelCanvas = document.createElement('canvas');
            const context = labelCanvas.getContext('2d');
            
            // Canvas size
            labelCanvas.width = 256;
            labelCanvas.height = 128;
            
            // Configure text style
            context.font = 'bold 64px Arial';
            context.textAlign = 'center';
            context.fillStyle = 'white';
            context.shadowColor = 'rgba(0, 0, 0, 0.5)';
            context.shadowBlur = 5;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
            
            // Draw text
            context.fillText("ENTER", labelCanvas.width / 2, labelCanvas.height / 2 + 20);
            
            // Create texture from canvas
            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            labelTexture.minFilter = THREE.LinearFilter;
            labelTexture.wrapS = THREE.ClampToEdgeWrapping;
            labelTexture.wrapT = THREE.ClampToEdgeWrapping;
            
            // Create material for the label
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                opacity: 1.0,
                depthWrite: false,
                depthTest: false,
                side: THREE.DoubleSide,
                toneMapped: false,
                blending: THREE.AdditiveBlending
            });
            
            // Create label mesh
            const labelMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.8),
                labelMaterial
            );
            
            // Position the label relative to model position
            labelMesh.position.set(
                interactionPosition.x, // Etkileşim alanı ile aynı X
                0,                     // Y pozisyonu (yükseklik)
                interactionPosition.y + 0.1  // Z pozisyonu (etkileşim alanı ile aynı, hafif öne)
            );
            
            labelMesh.matrixAutoUpdate = false;
            labelMesh.updateMatrix();
            labelMesh.renderOrder = 999;
            
            // Add label to scene
            this.container.add(labelMesh);

            // Define interaction function
            this.divizyonArea.on("interact", () => {
                // Create popup
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

                // Popup content
                const popupBox = document.createElement("div");
                popupBox.style.backgroundColor = "white";
                popupBox.style.color = "black";
                popupBox.style.padding = "30px 40px";
                popupBox.style.borderRadius = "8px";
                popupBox.style.minWidth = "350px";
                popupBox.style.maxWidth = "90%";
                popupBox.style.textAlign = "center";
                popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";

                // Title
                const titleEl = document.createElement("h2");
                titleEl.style.margin = "0 0 25px 0";
                titleEl.style.fontSize = "24px";
                titleEl.style.fontWeight = "bold";
                titleEl.textContent = "Divizyon Bina";

                // Link
                const linkEl = document.createElement("a");
                linkEl.href = "https://www.divizyon.org/";
                linkEl.textContent = "Divizyon Hakkında";
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

                // Link hover effect
                linkEl.addEventListener("mouseover", () => {
                    linkEl.style.backgroundColor = "#2980b9";
                });
                linkEl.addEventListener("mouseout", () => {
                    linkEl.style.backgroundColor = "#3498db";
                });

                // Description text
                const descriptionEl = document.createElement("p");
                descriptionEl.textContent = "Birlikte Neler Yapabliriz?";
                descriptionEl.style.margin = "0 0 20px 0";

                // Close button
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

                // Close function
                closeButton.addEventListener("click", () => {
                    document.body.removeChild(popupContainer);
                });

                // Close on outside click
                popupContainer.addEventListener("click", (event) => {
                    if (event.target === popupContainer) {
                        document.body.removeChild(popupContainer);
                    }
                });

                // Add elements to popup
                popupBox.appendChild(titleEl);
                popupBox.appendChild(descriptionEl);
                popupBox.appendChild(linkEl);
                popupBox.appendChild(closeButton);
                popupContainer.appendChild(popupBox);
                document.body.appendChild(popupContainer);
            });
            
            console.log("Divizyon etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Divizyon etkileşim alanı eklenirken hata oluştu:", error);
        }
    }

    _buildModel() {
        // Model dosyasını al
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

        // Base modelini al
        const base = this.resources.items.baseModel;
        if (!base || !base.scene) {
            console.error('Base modeli bulunamadı');
            // Base modeli olmadan da devam edelim, kritik değil
        } else {
            // Base modelini klonla ve Divizyon modeline ekle
            const baseModel = base.scene.clone(true);
            baseModel.position.set(-69, -3, 0); // Base modelinin Divizyon altına yerleştirilmesi için pozisyon ayarı
            baseModel.scale.set(1.5, 1.5, 1.5); // Base modelinin ölçeği
            this.container.add(baseModel);
        }

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
*/
