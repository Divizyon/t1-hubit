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