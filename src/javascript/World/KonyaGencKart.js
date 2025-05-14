import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-10, 25, 0);

export default class KonyaGenckart {
  constructor(_options) {
    this.time = _options.time;
    this.scene = _options.scene;
    this.physics = _options.physics;
    this.resources = _options.resources;
    this.areas = _options.areas;
    this.sounds = _options.sounds;
    this.mixer = null;
    this.model = null;
    this.collisionBody = null;
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;
    
    this.setModel();
    this.setInteraction();
    
    if (this.time) {
      this.time.on('tick', () => {
        this.tick(this.time.delta * 0.001);
      });
    } else {
      console.warn('KonyaGenckart: time parametresi verilmedi, animasyonlar çalışmayacak.');
    }
  }

  setModel() {
    if (!this.scene) {
      console.warn('KonyaGenckart: scene parametresi verilmedi, model sahneye eklenmeyecek.');
      return;
    }

    const loader = new GLTFLoader();
    loader.load('./models/konyaGencKart/3D_Ekran_Bina.glb', (gltf) => {
      console.log('Konya Genç Kart modeli yüklendi:', gltf);
      console.log('Animasyonlar:', gltf.animations);
      
      this.model = gltf.scene;
      this.model.position.set(23.87, -22.04, 1.47);
      this.model.scale.set(1, 1, 1);
      
      // Modeli döndür
      this.model.rotation.set(0, 0, 15);
      
      this.scene.add(this.model);

      if (this.physics) {
        this.collisionBody = new CANNON.Body({
          mass: 0,
          position: new CANNON.Vec3(-10, 25, 0),
          material: this.physics.materials.items.floor
        });

        // Bounding box hesapla
        const bbox = new THREE.Box3().setFromObject(this.model);
        const size = bbox.getSize(new THREE.Vector3());
        // Collision alanını büyüt
        const halfExtents = new CANNON.Vec3(
            size.x * 0.5, // Genişliği 
            size.y * 0.5, // Yüksekliği
            size.z * 0.8  // Derinliği
        );
        const boxShape = new CANNON.Box(halfExtents);
        this.collisionBody.addShape(boxShape);

        this.physics.world.addBody(this.collisionBody);
      }

      // Işık ekle (sadece bir kez)
      /*if (!this.scene.__konyaGenckartLightAdded) {
        this.scene.add(new THREE.AmbientLight(0xffffff, 2));
        const dirLight = new THREE.DirectionalLight(0xffffff, 2);
        dirLight.position.set(5, 10, 7.5);
        this.scene.add(dirLight);
        this.scene.__konyaGenckartLightAdded = true;
      }*/

      // Materyal ve mesh kontrolü
      this.model.traverse((child) => {
        if (child.isMesh) {
          console.log('Mesh bulundu:', child.name);
          if (child.isSkinnedMesh) {
            console.log('SkinnedMesh bulundu:', child.name);
          }
          child.castShadow = true;
          child.receiveShadow = true;
          if (!child.material) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
          }
          if (child.material && child.material.type === 'MeshBasicMaterial') {
            child.material = new THREE.MeshStandardMaterial({ color: child.material.color || 0xffffff });
          }
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      });

      // Animasyonları başlat
      if (gltf.animations && gltf.animations.length > 0) {
        console.log('Animasyonlar yükleniyor...');
        this.mixer = new THREE.AnimationMixer(this.model);
        gltf.animations.forEach((clip, index) => {
          console.log(`Animasyon ${index} yükleniyor:`, clip.name);
          const action = this.mixer.clipAction(clip);
          action.reset().play();
        });
        console.log('Mixer oluşturuldu:', this.mixer);
      } else {
        console.warn('Hiç animasyon bulunamadı!');
      }
    });
  }

  setInteraction() {
    try {
      if (!this.areas) {
        console.error("Konya Genç Kart etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
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
      areaLabelMesh.position.set(-5, 25, 5); // Modelin yanına konumlandır
      areaLabelMesh.matrixAutoUpdate = false;
      areaLabelMesh.updateMatrix();
      this.container.add(areaLabelMesh);

      // Etkileşim alanı oluştur
      this.konyaGenckartArea = this.areas.add({
        position: new THREE.Vector2(-5, 25), // Aynı koordinatlar
        halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
      });

      // Etkileşim fonksiyonunu tanımla
      this.konyaGenckartArea.on("interact", () => {
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
        titleEl.textContent = "Konya Genç Kart";

        // Link oluştur
        const linkEl = document.createElement("a");
        linkEl.href = "https://genckultur.com/";
        linkEl.textContent = "www.genckultur.com";
        linkEl.target = "_blank";
        linkEl.rel = "noopener noreferrer";
        linkEl.style.display = "inline-block";
        linkEl.style.padding = "12px 25px";
        linkEl.style.backgroundColor = "#3498db";
        linkEl.style.color = "white";
        linkEl.style.textDecoration = "none";
        linkEl.style.borderRadius = "5px";
        linkEl.style.fontWeight = "bold";
        linkEl.style.margin = "15px 0";
        linkEl.style.transition = "background-color 0.3s";
        linkEl.style.cursor = "pointer";

        // Link tıklama olayı
        linkEl.addEventListener("click", (event) => {
          event.preventDefault();
          window.open("https://genckultur.com/", "_blank");
        });

        // Link hover efekti
        linkEl.addEventListener("mouseover", () => {
          linkEl.style.backgroundColor = "#2980b9";
        });
        linkEl.addEventListener("mouseout", () => {
          linkEl.style.backgroundColor = "#3498db";
        });

        // Açıklama metni
        const descriptionEl = document.createElement("p");
        descriptionEl.textContent = "Konya Genç Kart hakkında daha fazla bilgi almak için tıklayın.";
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
      
      console.log("Konya Genç Kart etkileşim alanı başarıyla eklendi");
    } catch (error) {
      console.error("Konya Genç Kart etkileşim alanı eklenirken hata oluştu:", error);
    }
  }

  tick(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
} 