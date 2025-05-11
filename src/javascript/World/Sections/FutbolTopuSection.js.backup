import * as THREE from "three";
import CANNON from 'cannon';

export default class FutbolTopuSection {
  constructor(_options) {
    // Options
    this.config = _options.config;
    this.time = _options.time;
    this.resources = _options.resources;
    this.objects = _options.objects;
    this.areas = _options.areas;
    this.debug = _options.debug;
    this.physics = _options.physics;

    // Set up
    this.container = new THREE.Object3D();
    this.container.matrixAutoUpdate = false;
    this.container.updateMatrix();

    // Kutuların varsayılan konumları
    this.boxPositions = {
      box1: new THREE.Vector3(-19, -41, 1), // Alt kutu
      box2: new THREE.Vector3(-19, -37, 1)  // Üst kutu
    };

    // Gol mesajı için flag
    this.goalScored = false;
    this.goalMessageTimeout = null;
    this.goalCheckInterval = null;
    this.lastGoalTime = 0;

    // Gol çizgisi pozisyonu
    this.goalLine = {
      x: -19.5, // Çizginin x pozisyonu
      yMin: -40.5, // Çizginin alt y pozisyonu
      yMax: -36.5, // Çizginin üst y pozisyonu
      tolerance: 0.5 // Çarpışma için tolerans
    };

    this.setFutbolTopu();
    this.setResetArea();
    this.setLine();
    this.setCollisionBoxes();
    this.setupGoalDetection();
    this.createGoalMessage();
  }

  setFutbolTopu() {
    // Futbol topu (bowling topu modeli kullanarak)
    this.futbolTopu = {};
    
    // İlk konumu kaydet (reset için)
    this.futbolTopu.initialPosition = new THREE.Vector3(-10, -38, 0);
    
    // Base ve collision modellerini düzenleme
    // Model ağaçlarını hazırla
    const baseScene = this.resources.items.bowlingBallBase.scene.clone();
    const collisionScene = this.resources.items.bowlingBallCollision.scene.clone();
    
    // Base ve collision modellerinin merkez noktalarını belirleme
    const baseCenter = new THREE.Vector3();
    const collisionCenter = new THREE.Vector3();
    
    // Base modeli için merkezleme
    if (baseScene.children.length > 0) {
      // Base modelinde center_* isimli bir nesne arayalım
      const baseCenterObj = baseScene.children.find(child => child.name.match(/^center_?[0-9]{0,3}?$/i));
      if (baseCenterObj) {
        baseCenter.copy(baseCenterObj.position);
      }
    }
    
    // Collision modeli için merkezleme
    if (collisionScene.children.length > 0) {
      // Collision modelinde center_* isimli bir nesne arayalım
      const collisionCenterObj = collisionScene.children.find(child => child.name.match(/^center_?[0-9]{0,3}?$/i));
      if (collisionCenterObj) {
        collisionCenter.copy(collisionCenterObj.position);
      }
    }
    
    // Merkezleri eşleştirmek için offset hesaplama
    const merkezFarki = new THREE.Vector3().subVectors(baseCenter, collisionCenter);
    
    // Collision modeline offset uygulama (collision modeli base modeline göre ayarla)
    collisionScene.children.forEach(child => {
      child.position.add(merkezFarki);
    });
    
    console.log("Base merkezi:", baseCenter);
    console.log("Collision merkezi (düzeltilmeden önce):", collisionCenter);
    console.log("Merkez farkı:", merkezFarki);
    
    // Bowling topu modelini yükle
    this.futbolTopu.top = this.objects.add({
      base: baseScene,
      collision: collisionScene,
      offset: this.futbolTopu.initialPosition.clone(), // İstenen konum
      rotation: new THREE.Euler(0, 0, 0), // Rotasyonu ayarla
      duplicated: true,
      shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.15, alpha: 0.35 },
      mass: 5, // Bowling topu kütlesi
      soundName: 'bowlingBall', // Ses efekti
      sleep: false // Fizik motorunun topu etkilemesine izin ver
    });

    // Debug kontrolü
    if (this.debug) {
      const topuFolder = this.debug.addFolder('Futbol Topu');
      
      topuFolder.add(this.futbolTopu.top.container.position, 'x')
        .name('X Pozisyonu')
        .min(-50)
        .max(50)
        .step(0.1)
        .onChange(() => {
          if (this.futbolTopu.top.collision && this.futbolTopu.top.collision.body) {
            this.futbolTopu.top.collision.body.position.x = this.futbolTopu.top.container.position.x;
          }
        });
        
      topuFolder.add(this.futbolTopu.top.container.position, 'y')
        .name('Y Pozisyonu')
        .min(-50)
        .max(50)
        .step(0.1)
        .onChange(() => {
          if (this.futbolTopu.top.collision && this.futbolTopu.top.collision.body) {
            this.futbolTopu.top.collision.body.position.y = this.futbolTopu.top.container.position.y;
          }
        });
        
      topuFolder.add(this.futbolTopu.top.container.position, 'z')
        .name('Z Pozisyonu')
        .min(0)
        .max(10)
        .step(0.1)
        .onChange(() => {
          if (this.futbolTopu.top.collision && this.futbolTopu.top.collision.body) {
            this.futbolTopu.top.collision.body.position.z = this.futbolTopu.top.container.position.z;
          }
        });
    }

    console.log("Futbol topu başarıyla eklendi");
  }

  setResetArea() {
    // Reset alanı oluştur
    this.resetArea = {};
    this.resetArea.position = new THREE.Vector2(-7, -38); // Reset alanı merkez konumu

    // Reset fonksiyonu
    this.resetArea.reset = () => {
      if (this.futbolTopu.top && this.futbolTopu.top.collision && this.futbolTopu.top.collision.body) {
        // Topu durdur
        this.futbolTopu.top.collision.body.velocity.set(0, 0, 0);
        this.futbolTopu.top.collision.body.angularVelocity.set(0, 0, 0);
        
        // Topu başlangıç konumuna taşı
        this.futbolTopu.top.collision.body.position.copy(this.futbolTopu.initialPosition);
        
        // Uyku modunu devre dışı bırak (uyanık olsun ki fizik motorundan etkilenebilsin)
        this.futbolTopu.top.collision.body.wakeUp();
        
        console.log("Futbol topu ilk konumuna sıfırlandı");
      }
    };

    // Etkileşim alanı
    this.resetArea.area = this.areas.add({
      position: this.resetArea.position,
      halfExtents: new THREE.Vector2(2, 2) // 2x2 birim boyutunda alan
    });

    // Etkileşim fonksiyonu
    this.resetArea.area.on('interact', () => {
      this.resetArea.reset();
      
      // Ses çal (varsa)
      if (this.objects.sounds) {
        this.objects.sounds.play('click');
      }
    });

    // Etkileşim etiketi (gör ürüş için)
    this.resetArea.areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        alphaMap: this.resources.items.areaResetTexture
      })
    );
    this.resetArea.areaLabelMesh.position.x = this.resetArea.position.x;
    this.resetArea.areaLabelMesh.position.y = this.resetArea.position.y;
    this.resetArea.areaLabelMesh.matrixAutoUpdate = false;
    this.resetArea.areaLabelMesh.updateMatrix();
    this.container.add(this.resetArea.areaLabelMesh);

    // Debug
    if (this.debug) {
      const resetFolder = this.debug.addFolder('Futbol Topu Reset');
      resetFolder.add(this.resetArea, 'reset').name('Topu Sıfırla');
    }

    console.log("Futbol topu reset alanı başarıyla eklendi");
  }

  setLine() {
    // 2D çizgi oluştur - (-10, -40) merkez olacak şekilde, y ekseninde 4 birim uzunluğunda
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff, // Beyaz çizgi
      linewidth: 2, // Çizgi kalınlığı (not: Three.js WebGL sınırlamaları nedeniyle birçok tarayıcıda sabit kalınlıkta gösterilir)
    });
    
    // Çizgi için noktaları tanımla
    const points = [];
    points.push(new THREE.Vector3(-19.5, -40.5, 0.01)); // Başlangıç noktası (alt)
    points.push(new THREE.Vector3(-19.5, -36.5, 0.01)); // Bitiş noktası (üst)
    
    // Bu noktaları kaydet (daha sonra collision kutuları için kullanacağız)
    this.lineStartPoint = new THREE.Vector3(-19.5, -40.5, 0.01);
    this.lineEndPoint = new THREE.Vector3(-19.5, -36.5, 0.01);
    
    // Çizgi geometrisi oluştur
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Çizgi mesh'i oluştur
    this.line = new THREE.Line(lineGeometry, lineMaterial);
    
    // Çizgiyi container'a ekle
    this.container.add(this.line);

    // Gol çizgisini temsil edecek görsel bir düzlem ekleyelim (gol anını algılamak için)
    const goalPlaneGeometry = new THREE.PlaneGeometry(0.1, 4);
    const goalPlaneMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0, // Görünmez olsun
      side: THREE.DoubleSide
    });

    this.goalPlane = new THREE.Mesh(goalPlaneGeometry, goalPlaneMaterial);
    this.goalPlane.position.set(-19.5, -38.5, 0.5); // Çizgi ile aynı pozisyonda
    this.container.add(this.goalPlane);
    
    console.log("4 birimlik çizgi başarıyla eklendi");
  }

  setCollisionBoxes() {
    if (!this.physics) {
      console.error("Collision kutular eklenemedi: physics nesnesi bulunamadı!");
      return;
    }

    // İki kutu oluştur (çizginin en alt ve en üst noktalarında)
    this.collisionBoxes = [];

    // Kutuların konumları
    const positions = [
      this.boxPositions.box1, // Alt kutu
      this.boxPositions.box2  // Üst kutu
    ];

    // Kutuların adları
    const boxNames = ['Alt Kutu', 'Üst Kutu'];

    // Her nokta için bir collision kutusu oluştur
    positions.forEach((position, index) => {
      // Görsel kutu (THREE.js)
      const boxGeometry = new THREE.BoxGeometry(0.2, 0.2, 2); // İnce ve uzun kutular
      const boxMaterial = new THREE.MeshBasicMaterial({
        color: index === 0 ? 0xff0000 : 0x00ff00, // Alt: kırmızı, Üst: yeşil
        wireframe: true,
        transparent: true,
        opacity: 0.0 // Tamamen şeffaf yaparak görünmez hale getir
      });
      
      // Görsel mesh oluştur
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
      boxMesh.position.copy(position);
      boxMesh.visible = false; // Görünürlüğü tamamen kapatarak çizimleri devre dışı bırak
      
      // Mesh'i container'a ekle
      this.container.add(boxMesh);
      
      // Fizik gövdesi için boyutları (yarı genişlikler)
      const halfExtents = new CANNON.Vec3(0.2, 0.2, 2); // İnce ve uzun kutular için yarı genişlikler
      
      // Fizik gövdesi oluştur
      const boxShape = new CANNON.Box(halfExtents);
      const boxBody = new CANNON.Body({
        mass: 0, // Statik nesne
        position: new CANNON.Vec3(position.x, position.y, position.z),
        shape: boxShape,
        material: this.physics.materials ? this.physics.materials.items.default : undefined
      });
      
      // Fizik motoruna ekle
      this.physics.world.addBody(boxBody);
      
      // Kolay erişim için kaydedelim
      this.collisionBoxes.push({
        mesh: boxMesh,
        body: boxBody,
        name: boxNames[index]
      });

      // Debug menüsü oluştur
      if (this.debug) {
        const boxFolder = this.debug.addFolder(`Kutu ${index + 1} - ${boxNames[index]}`);
        
        // X değeri
        boxFolder.add(position, 'x')
          .name('X Pozisyonu')
          .min(-50)
          .max(50)
          .step(0.1)
          .onChange(() => {
            // Görsel ve fizik nesnesini güncelle
            boxMesh.position.x = position.x;
            boxBody.position.x = position.x;
            
            // Pozisyonu güncelle
            this.updateBoxPosition(index, position);
          });
        
        // Y değeri
        boxFolder.add(position, 'y')
          .name('Y Pozisyonu')
          .min(-50)
          .max(50)
          .step(0.1)
          .onChange(() => {
            // Görsel ve fizik nesnesini güncelle
            boxMesh.position.y = position.y;
            boxBody.position.y = position.y;
            
            // Pozisyonu güncelle
            this.updateBoxPosition(index, position);
          });
        
        // Z değeri
        boxFolder.add(position, 'z')
          .name('Z Pozisyonu')
          .min(0)
          .max(10)
          .step(0.1)
          .onChange(() => {
            // Görsel ve fizik nesnesini güncelle
            boxMesh.position.z = position.z;
            boxBody.position.z = position.z;
            
            // Pozisyonu güncelle
            this.updateBoxPosition(index, position);
          });
          
        // Görünürlük kontrolü debug menüsüne ekle
        boxFolder.add(boxMesh, 'visible')
          .name('Görünür')
          .onChange((value) => {
            boxMesh.visible = value;
          });
      }
    });

    // Her tick'te kutuların pozisyonlarını güncelle
    this.time.on('tick', () => {
      this.collisionBoxes.forEach((box) => {
        box.mesh.position.copy(box.body.position);
        box.mesh.quaternion.set(
          box.body.quaternion.x,
          box.body.quaternion.y,
          box.body.quaternion.z,
          box.body.quaternion.w
        );
      });
    });

    console.log("2 adet ayarlanabilir collision kutusu eklendi (görünmez modda)");
  }

  // Kutuların pozisyonlarını güncelleme
  updateBoxPosition(index, newPosition) {
    // Kayıtlı pozisyonu güncelle
    if (index === 0) {
      this.boxPositions.box1.copy(newPosition);
    } else {
      this.boxPositions.box2.copy(newPosition);
    }
    
    // Fizik gövdesi uyku modunu devre dışı bırak
    if (this.collisionBoxes[index] && this.collisionBoxes[index].body) {
      this.collisionBoxes[index].body.wakeUp();
    }
  }

  // Gol için çarpışma kontrolü
  setupGoalDetection() {
    // Belli aralıklarla topun konumunu kontrol et ve gol çizgisini geçip geçmediğini belirle
    this.goalCheckInterval = setInterval(() => {
      if (!this.futbolTopu || !this.futbolTopu.top || !this.futbolTopu.top.collision || !this.futbolTopu.top.collision.body) {
        return;
      }

      const ballPosition = this.futbolTopu.top.collision.body.position;
      const currentTime = Date.now();
      
      // Top gol çizgisini geçti mi kontrol et (x koordinatı çizginin x koordinatına yakın mı)
      if (Math.abs(ballPosition.x - this.goalLine.x) < this.goalLine.tolerance) {
        // Y koordinatı çizginin alt ve üst noktaları arasında mı kontrol et
        if (ballPosition.y >= this.goalLine.yMin && ballPosition.y <= this.goalLine.yMax) {
          // Son golden bu yana yeterli zaman geçti mi (tekrar tekrar gol mesajı göstermeyi önle)
          if (currentTime - this.lastGoalTime > 2000) {
            this.showGoalMessage();
            this.lastGoalTime = currentTime;
            
            // Ses çal (varsa)
            if (this.objects.sounds) {
              this.objects.sounds.play('click');
            }
          }
        }
      }
    }, 100); // Her 100ms'de bir kontrol et
  }

  // Gol mesajı oluştur
  createGoalMessage() {
    // Gol mesajı için HTML element
    this.goalMessage = document.createElement('div');
    this.goalMessage.style.position = 'fixed';
    this.goalMessage.style.bottom = '20px';
    this.goalMessage.style.right = '20px';
    this.goalMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.goalMessage.style.color = '#ffcc00';
    this.goalMessage.style.padding = '15px 30px';
    this.goalMessage.style.borderRadius = '10px';
    this.goalMessage.style.fontSize = '36px';
    this.goalMessage.style.fontWeight = 'bold';
    this.goalMessage.style.fontFamily = 'Arial, sans-serif';
    this.goalMessage.style.zIndex = '1000';
    this.goalMessage.style.boxShadow = '0 0 20px rgba(255, 204, 0, 0.5)';
    this.goalMessage.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
    this.goalMessage.style.transform = 'scale(0)';
    this.goalMessage.style.transition = 'transform 0.3s ease-out';
    this.goalMessage.textContent = 'GOOOL!';
    
    // Başlangıçta gizli olsun
    this.goalMessage.style.display = 'none';
    
    // Sayfaya ekle
    document.body.appendChild(this.goalMessage);
  }

  // Gol mesajını göster
  showGoalMessage() {
    if (!this.goalMessage) return;
    
    // Önceki timeout'u temizle
    if (this.goalMessageTimeout) {
      clearTimeout(this.goalMessageTimeout);
    }
    
    // Mesajı göster
    this.goalMessage.style.display = 'block';
    
    // Animasyon için setTimeout kullan (mikro gecikme)
    setTimeout(() => {
      this.goalMessage.style.transform = 'scale(1)';
    }, 10);
    
    // 2 saniye sonra mesajı gizle
    this.goalMessageTimeout = setTimeout(() => {
      this.goalMessage.style.transform = 'scale(0)';
      
      // Animasyon bittikten sonra display'i none yap
      setTimeout(() => {
        this.goalMessage.style.display = 'none';
      }, 300);
    }, 2000);
  }
} 