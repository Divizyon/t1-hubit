import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import CANNON from 'cannon';

export default class KonyaGencKart {
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
    
    // Görüntülenen pozisyona daha yakın bir konum ayarlayalım
    this.container.position.set(-5, 35, 0);
    this.container.updateMatrix();
    
    console.log('KonyaGencKart başlatıldı, container pozisyonu:', this.container.position);
    
    this.setModel();
    
    if (this.time) {
      this.time.on('tick', () => {
        this.tick(this.time.delta * 0.001);
      });
    } else {
      console.warn('KonyaGencKart: time parametresi verilmedi, animasyonlar çalışmayacak.');
    }
  }

  setModel() {
    if (!this.scene) {
      console.warn('KonyaGencKart: scene parametresi verilmedi, model sahneye eklenmeyecek.');
      return;
    }

    // İlk olarak basit bir küp oluşturarak pozisyonun doğru olduğunu kontrol edelim
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    
    this.container.add(cube);
    this.container.updateMatrix();
    console.log('Kırmızı küp eklendi, kontrol için');

    const loader = new GLTFLoader();
    console.log('Model yükleniyor: ./models/konyaGencKart/3D_Ekran_Bina.glb');
    
    loader.load('./models/konyaGencKart/3D_Ekran_Bina.glb', 
      // Başarılı yükleme
      (gltf) => {
        console.log('Konya Genç Kart modeli yüklendi:', gltf);
        
        // Küpü kaldır, asıl modeli göster
        this.container.remove(cube);
        
        this.model = gltf.scene;
        
        // Model ölçeğini artır - görünürlük sorunu ölçekle ilgili olabilir
        this.model.scale.set(2, 2, 2);
        
        // Modelin pozisyonunu sıfırla, container zaten doğru pozisyonda
        this.model.position.set(0, 0, 0);
        
        // Modeli döndür - Değeri düzelttim, makul bir açı
        this.model.rotation.set(0, 0, Math.PI ); // Yaklaşık 45 derece
        
        // Modeli görünür yap
        this.model.visible = true;
        
        // Modeli container'a ekle ve container'ı güncelle
        this.container.add(this.model);
        this.container.updateMatrix();
        
        console.log('Model container\'a eklendi, pozisyon:', this.container.position);

        if (this.physics) {
          this.collisionBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(this.container.position.x, this.container.position.y, this.container.position.z),
            material: this.physics.materials.items.floor
          });

          // Bounding box hesapla
          const bbox = new THREE.Box3().setFromObject(this.model);
          const size = bbox.getSize(new THREE.Vector3());
          console.log('Model bounding box boyutu:', size);
          
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

        // Materyal ve mesh kontrolü
        this.model.traverse((child) => {
          if (child.isMesh) {
            console.log('Mesh bulundu:', child.name);
            
            // Görünürlüğü kontrol et
            if (!child.visible) {
              console.log('Görünmez mesh bulundu, görünür yapılıyor:', child.name);
              child.visible = true;
            }
            
            if (child.isSkinnedMesh) {
              console.log('SkinnedMesh bulundu:', child.name);
            }
            
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (!child.material) {
              console.log('Materyal yok, standart materyal atanıyor:', child.name);
              child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            }
            
            if (child.material && child.material.type === 'MeshBasicMaterial') {
              console.log('MeshBasicMaterial bulundu, standart materyal ile değiştiriliyor:', child.name);
              const color = child.material.color ? child.material.color.clone() : new THREE.Color(0xffffff);
              child.material = new THREE.MeshStandardMaterial({ color: color });
            }
            
            // Materialin görünürlüğünü kontrol et
            child.material.transparent = false;
            child.material.opacity = 1;
            
            console.log('Material tipi:', child.material.type);
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
      },
      // Yükleme ilerlemesi
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% yüklendi');
      },
      // Hata durumu
      (error) => {
        console.error('Model yüklenirken hata oluştu:', error);
      }
    );
  }

  tick(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
} 