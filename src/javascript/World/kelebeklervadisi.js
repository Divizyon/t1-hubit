import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 52
let posizyonY = 3
let posizyonZ = 0

export default class kelebeklervadisi {
    constructor(_options) {
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.areas = _options.areas
        this.sounds = _options.sounds

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
        
        if (this.areas) {
            this.setKelebeklerVadisiArea()
        }
    }

    setModel() {
        console.log("Loading Kelebekler Vadisi model...")
        const baseScene = this.resources.items.kelebeklerVadisiModel?.scene
        if (!baseScene) {
            console.error('Kelebekler Vadisi modeli yüklenemedi!')
            return
        }

        const clonedScene = baseScene.clone()
        
        console.log("Kelebekler Vadisi model structure:", clonedScene)
        
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                console.log("Found mesh in Kelebekler model:", child.name)
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => mat.clone())
                    } else {
                        child.material = child.material.clone()
                    }
                    child.castShadow = true
                    child.receiveShadow = true
                } else {
                    console.warn("Mesh has no material:", child.name)
                }
            }
        })
        
        let baseChildren = []
        if (clonedScene.children && clonedScene.children.length > 0) {
            baseChildren = clonedScene.children
        } else {
            baseChildren = [clonedScene]
        }

        const bbox = new THREE.Box3().setFromObject(clonedScene)
        const size = bbox.getSize(new THREE.Vector3())
        console.log("Kelebekler Vadisi model size:", size)
        
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ),
            material: this.physics.materials.items.floor
        })

        const mainShape = new CANNON.Box(new CANNON.Vec3(
            Math.abs(size.x) * 0.5,
            Math.abs(size.y) * 0.5,
            Math.abs(size.z) * 0.5
        ))
        body.addShape(mainShape)
        this.physics.world.addBody(body)

        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ + 0.5),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 4, sizeY: 4, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            preserveMaterials: true
        })

        this.model.base.collision = { body }
        this.container.add(this.model.base.container)
        console.log("Kelebekler Vadisi modeli başarıyla eklendi")
    }

    setKelebeklerVadisiArea() {
        try {
            if (!this.areas) {
                console.error("Kelebekler Vadisi etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
                return;
            }

            // Create interaction area 5 units to the right of the model
            this.kelebeklerVadisiArea = this.areas.add({
                position: new THREE.Vector2(posizyonX + 5, posizyonY),
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
            
            // Position the label
            labelMesh.position.set(posizyonX + 5, posizyonY, 0.1);
            labelMesh.matrixAutoUpdate = false;
            labelMesh.updateMatrix();
            labelMesh.renderOrder = 999;
            
            // Add label to scene
            this.container.add(labelMesh);

            // Define interaction function
            this.kelebeklerVadisiArea.on("interact", () => {
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
                titleEl.textContent = "Kelebekler Vadisi";

                // Link
                const linkEl = document.createElement("a");
                linkEl.href = "https://konyatropikalkelebekbahcesi.com/tr";
                linkEl.textContent = "Kelebekler Vadisi Hakkında";
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
                descriptionEl.textContent = "Kelebekler Vadisi, Konya'nın doğal güzelliklerinden biridir. Çeşitli kelebek türlerine ev sahipliği yapmaktadır.";
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

                // Play sound if available
                if (this.sounds) {
                    this.sounds.play("click");
                }
            });
            
            console.log("Kelebekler Vadisi etkileşim alanı başarıyla eklendi");
        } catch (error) {
            console.error("Kelebekler Vadisi etkileşim alanı eklenirken hata oluştu:", error);

            const areaLabelMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 0.5),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    depthWrite: false,
                    color: 0xffffff,
                    alphaMap: this.resources.items.areaEnterTexture,
                })
            )
            areaLabelMesh.position.set(posizyonX + 6, posizyonY, 0.5)
            areaLabelMesh.matrixAutoUpdate = false
            areaLabelMesh.updateMatrix()
            this.container.add(areaLabelMesh)

            this.kelebeklerVadisiArea = this.areas.add({
                position: new THREE.Vector2(posizyonX + 6, posizyonY),
                halfExtents: new THREE.Vector2(2, 2),
            })

            this.kelebeklerVadisiArea.on("interact", () => {
                const popupContainer = document.createElement("div")
                popupContainer.style.position = "fixed"
                popupContainer.style.top = "0"
                popupContainer.style.left = "0"
                popupContainer.style.width = "100%"
                popupContainer.style.height = "100%"
                popupContainer.style.display = "flex"
                popupContainer.style.justifyContent = "center"
                popupContainer.style.alignItems = "center"
                popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
                popupContainer.style.zIndex = "9999"

                const popupBox = document.createElement("div")
                popupBox.style.backgroundColor = "white"
                popupBox.style.color = "black"
                popupBox.style.padding = "30px 40px"
                popupBox.style.borderRadius = "8px"
                popupBox.style.minWidth = "350px"
                popupBox.style.maxWidth = "90%"
                popupBox.style.textAlign = "center"
                popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)"

                const titleEl = document.createElement("h2")
                titleEl.style.margin = "0 0 25px 0"
                titleEl.style.fontSize = "24px"
                titleEl.style.fontWeight = "bold"
                titleEl.textContent = "Kelebekler Vadisi"

                const descriptionEl = document.createElement("p")
                descriptionEl.textContent = "Kelebekler Vadisi, doğanın ve vahşi yaşamın korunduğu, onlarca kelebek türüne ev sahipliği yapan eşsiz bir doğa harikasıdır."
                descriptionEl.style.margin = "0 0 20px 0"

                const linkEl = document.createElement("a")
                linkEl.href = "https://konyatropikalkelebekbahcesi.com/tr"
                linkEl.textContent = "Kelebekler Vadisi'ni Ziyaret Et"
                linkEl.target = "_blank"
                linkEl.style.display = "inline-block"
                linkEl.style.padding = "12px 25px"
                linkEl.style.backgroundColor = "#3498db"
                linkEl.style.color = "white"
                linkEl.style.textDecoration = "none"
                linkEl.style.borderRadius = "5px"
                linkEl.style.fontWeight = "bold"
                linkEl.style.margin = "15px 0"
                linkEl.style.transition = "background-color 0.3s"
                linkEl.addEventListener("mouseover", () => {
                    linkEl.style.backgroundColor = "#2980b9"
                })
                linkEl.addEventListener("mouseout", () => {
                    linkEl.style.backgroundColor = "#3498db"
                })

                const closeButton = document.createElement("button")
                closeButton.textContent = "Kapat"
                closeButton.style.padding = "10px 20px"
                closeButton.style.border = "none"
                closeButton.style.backgroundColor = "#e0e0e0"
                closeButton.style.color = "#333"
                closeButton.style.cursor = "pointer"
                closeButton.style.borderRadius = "5px"
                closeButton.style.fontSize = "14px"
                closeButton.style.marginTop = "20px"
                closeButton.addEventListener("click", () => {
                    document.body.removeChild(popupContainer)
                })
                popupContainer.addEventListener("click", (event) => {
                    if (event.target === popupContainer) {
                        document.body.removeChild(popupContainer)
                    }
                })

                popupBox.appendChild(titleEl)
                popupBox.appendChild(descriptionEl)
                popupBox.appendChild(linkEl)
                popupBox.appendChild(closeButton)
                popupContainer.appendChild(popupBox)
                document.body.appendChild(popupContainer)

                if (this.sounds) {
                    this.sounds.play("click")
                }
            })
            
            console.log("Kelebekler Vadisi interaction area created successfully")
        
        }
    }
} 