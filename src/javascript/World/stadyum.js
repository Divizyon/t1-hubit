import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(38, -45, -2.5); // Varsayılan pozisyon
const DEFAULT_SCALE = new THREE.Vector3(1, 1, 1); // Varsayılan ölçek

export default class Stadyum {
  constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0, areas, position, scale }) {
    this.scene = scene;
    this.resources = resources;
    this.objects = objects;
    this.physics = physics;
    this.debug = debug;
    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.areas = areas;

    this.container = new THREE.Object3D();
    
    // Pozisyon ve ölçeği parametrelerden al veya varsayılanları kullan
    this.position = position ? position.clone() : DEFAULT_POSITION.clone();
    this.scale = scale ? scale.clone() : DEFAULT_SCALE.clone();

    this._buildModel();
    this.scene.add(this.container);

    // Çarpışma kutusunu ekle
    this.addCollisions();
    
    // Add interaction area if areas parameter exists
    if (this.areas) {
      this.setStadyumInteraction();
    }
  }

  _buildModel() {
    const gltf = this.resources.items.stadyumModel;
    if (!gltf || !gltf.scene) {
      console.error('Stadyum modeli bulunamadı');
      return;
    }

    const base = this.resources.items.baseModel;
    if (!base || !base.scene) {
      console.error('Stadyum modeli bulunamadı');
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
    model.scale.copy(this.scale);
    model.rotation.set(this.rotateX, this.rotateY, this.rotateZ);
    this.container.add(model);

    // Base modelini klonla ve container'a ekle
    const baseModel = base.scene.clone(true);
    // Base modelinin ana modele göre göreceli konumu
    const baseOffsetX = 0; // Ana model pozisyonuna göre X-offset
    const baseOffsetY = 0; // Ana model pozisyonuna göre Y-offset
    const baseOffsetZ = 2.5; // Ana model pozisyonuna göre Z-offset
    
    baseModel.position.set(
      this.position.x + baseOffsetX, 
      this.position.y + baseOffsetY, 
      this.position.z + baseOffsetZ
    );
    
    // Base modelinin ölçeğini, ana modelin ölçeğine uyarla
    const baseScaleX = 3 * this.scale.x;
    const baseScaleY = 2.3 * this.scale.y;
    const baseScaleZ = 0.5 * this.scale.z;
    
    baseModel.scale.set(baseScaleX, baseScaleY, baseScaleZ);
    this.container.add(baseModel);

    // Obje sistemine ekle
    if (this.objects) {
      const children = model.children.slice();
      const objectEntry = this.objects.add({
        base: { children },
        collision: { children },
        offset: this.position.clone(),
        mass: 0
      });
      if (objectEntry.container) {
        this.container.add(objectEntry.container);
      }
    }
  }
  
  addCollisions() {
    // Stadyuma göre konumlandırılmış çarpışma kutusu
    const position = new THREE.Vector3(this.position.x, this.position.y, this.position.z+5);
    const rotation = new THREE.Euler(0, 0, 0);
    const halfExtents = new CANNON.Vec3(8, 6, 2.5);
    
    this.addCollisionBox(position, rotation, halfExtents);
  }
    
  addCollisionBox(position, rotation, halfExtents) {
    // Fizik gövdesi oluştur
    const boxShape = new CANNON.Box(halfExtents);

    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: this.physics.materials.items.floor
    });

    // Dönüşü quaternion olarak ayarla
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');
    body.quaternion.copy(quat);

    body.addShape(boxShape);
    this.physics.world.addBody(body);

    console.log("Stadyum için collision eklendi:", body);
  }

  setStadyumInteraction() {
    try {
      if (!this.areas) {
        console.error("Stadyum etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
        return;
      }

      // Etkileşim alanının modele göre göreceli konumu
      const interactionOffsetX = 13; // Modelin 13 birim sağında
      const interactionOffsetY = 0;  // Modelle aynı Y

      // Etkileşim alanını modele göre konumlandır
      this.stadyumArea = this.areas.add({
        position: new THREE.Vector2(
          this.position.x + interactionOffsetX, 
          this.position.y + interactionOffsetY
        ),
        halfExtents: new THREE.Vector2(1.5, 1.5), // 3x3 birim alan
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
      
      // Position the label - etkileşim alanıyla aynı konumda
      labelMesh.position.set(
        this.position.x + interactionOffsetX,
        this.position.y + interactionOffsetY,
        0.1
      );
      labelMesh.matrixAutoUpdate = false;
      labelMesh.updateMatrix();
      labelMesh.renderOrder = 999;
      
      // Add label to scene
      this.scene.add(labelMesh);

      // Define interaction function
      this.stadyumArea.on("interact", () => {
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
        titleEl.textContent = "Konya Büyükşehir Stadyumu";

        // Link
        const linkEl = document.createElement("a");
        linkEl.href = "https://stadyum.konya.bel.tr/";
        linkEl.textContent = "Stadyum Hakkında";
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
        descriptionEl.textContent = "Konya Büyükşehir Stadyumu, Konya'nın merkezinde yer alan, modern bir spor kompleksidir. Futbol maçları ve diğer spor etkinlikleri için kullanılmaktadır.";
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
      
      console.log("Stadyum etkileşim alanı başarıyla eklendi");
    } catch (error) {
      console.error("Stadyum etkileşim alanı eklenirken hata oluştu:", error);
    }
  }
}
  
  
