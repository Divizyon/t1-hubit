import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-62.5, 35, -0.5); // Artık doğru yerde tanımlandı

export default class Basket {
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
    this._addBasketLight();
    this.addCollisions(this.model);
    this.scene.add(this.container);
  }

  _buildModel() {
    const gltf = this.resources.items.basketModel;
    if (!gltf || !gltf.scene) {
      console.error('Basket modeli bulunamadı');
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
    model.scale.set(0.5, 0.5, 0.5);
    model.rotation.set(this.rotateX, this.rotateY, this.rotateZ);
    this.container.add(model);
    this.model = model; // Model referansını sakla

    // Obje sistemine ekle (çarpışma olmadan)
    if (this.objects) {
      const children = model.children.slice();
      const objectEntry = this.objects.add({
        base: { children },
        offset: this.position.clone(),
        mass: 0
      });
      if (objectEntry.container) {
        this.container.add(objectEntry.container);
      }
    }
  }

  addCollisions(model) {
    // Bounding box hesapla
    if (!model) return;
    
    model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    
    // Ana çarpışma kutusu (zemin)
    const position1 = new THREE.Vector3(-62.5, 35, -0.5);
    const rotation1 = new THREE.Euler(0, 0, 0);
    const halfExtents1 = new CANNON.Vec3(8, 10, 0.6);
    
    this.addCollisionBox(position1, rotation1, halfExtents1);
    
    // İkinci çarpışma kutusu (sol kenar)
    const position2 = new THREE.Vector3(-62, 43, 0);
    const rotation2 = new THREE.Euler(0, 0, 0); 
    const halfExtents2 = new CANNON.Vec3(0.8, 0.8, 4);
    
    this.addCollisionBox(position2, rotation2, halfExtents2);
    
    // Üçüncü çarpışma kutusu (sağ kenar)
    const position3 = new THREE.Vector3(-62, 26, 0);
    const rotation3 = new THREE.Euler(0, 0, 0); 
    const halfExtents3 = new CANNON.Vec3(0.8, 0.8, 4);
    
    this.addCollisionBox(position3, rotation3, halfExtents3);
  }
  
  addCollisionBox(position, rotation, halfExtents) {
    // Fizik gövdesi oluştur
    const boxShape = new CANNON.Box(halfExtents);

    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      material: this.physics.materials.items.floor
    });

    // Dönüş quaternion olarak ayarla
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');
    body.quaternion.copy(quat);

    body.addShape(boxShape);
    this.physics.world.addBody(body);

    console.log("Basket sahası için collision eklendi:", body);
  }

  _addBasketLight() {
    // Basket sahasına özel bir spot ışık oluştur
    const basketLight = new THREE.SpotLight(0xffffff, 4);
    basketLight.position.copy(this.position.clone().add(new THREE.Vector3(0, 20, 10)));
    basketLight.target.position.copy(this.position);
    basketLight.angle = Math.PI / 3;
    basketLight.penumbra = 0.2;
    basketLight.distance = 50;
    basketLight.decay = 1;
    basketLight.castShadow = true;
    
    // Işığın sadece basket modeline etki etmesi için
    basketLight.target.updateMatrixWorld();
    
    // Gölge kalitesini artır
    basketLight.shadow.mapSize.width = 1024;
    basketLight.shadow.mapSize.height = 1024;
    basketLight.shadow.camera.near = 1;
    basketLight.shadow.camera.far = 60;
    basketLight.shadow.bias = -0.0001;
    
    // Işığı container'a ekle
    this.container.add(basketLight);
    this.container.add(basketLight.target);
    
    // Eğer debug modu açıksa, ışık için ayarlar ekle
    if (this.debug) {
      const lightFolder = this.debug.addFolder('Basket Işığı');
      lightFolder.add(basketLight, 'intensity', 0, 5, 0.1).name('Işık Gücü');
      lightFolder.add(basketLight, 'distance', 10, 100, 1).name('Işık Mesafesi');
      lightFolder.add(basketLight, 'angle', 0, Math.PI / 2, 0.1).name('Işık Açısı');
      lightFolder.add(basketLight, 'penumbra', 0, 1, 0.1).name('Yumuşaklık');
    }
  }
}

/* 

İndex.js dosyasında Divizyon'u oluşturmak için:
import Divizyon from './Divizyon';

this.setDivizyon()

  setDivizyon() {
  this.divizyon = new Divizyon({
    scene:     this.scene,
    resources: this.resources,
    physics:   this.physics,
    debug:     this.debugFolder,
    rotateX:   0,   // 
    rotateY:   0,
    rotateZ:   Math.PI / 2 // Y ekseninde 90 derece,
  });
}



*/