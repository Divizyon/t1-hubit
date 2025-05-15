import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(-41, 35, 2); // Artık doğru yerde tanımlandı

export default class Konseralani {
  constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0.5, scale = 1.5 }) {
    this.scene = scene;
    this.resources = resources;
    this.objects = objects;
    this.physics = physics;
    this.debug = debug;

    this.rotateX = rotateX;
    this.rotateY = rotateY;
    this.rotateZ = rotateZ;
    this.scale = scale; // Ölçek parametresi

    this.container = new THREE.Object3D();
    this.position = DEFAULT_POSITION.clone();

    this._buildModel();
    this._setupDebug();
    this.scene.add(this.container);
  }

  _buildModel() {
    const gltf = this.resources.items.konseralaniModel;
    if (!gltf || !gltf.scene) {
      console.error('Konseralani modeli bulunamadı');
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

    // Model pozisyonu, dönüşü ve ölçeği
    model.position.copy(this.position);
    model.rotation.set(this.rotateX, this.rotateY, this.rotateZ);
    model.scale.set(this.scale, this.scale, this.scale); // Modeli ölçeklendir
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

  // Modelin ölçeğini değiştirme metodu
  setScale(newScale) {
    this.scale = newScale;
    
    if (this.model) {
      this.model.scale.set(newScale, newScale, newScale);
    }
  }

  _setupDebug() {
    if (this.debug) {
      const debugFolder = this.debug.addFolder('Konser Alanı');
      
      // Ölçek kontrolü ekle
      debugFolder.add(this, 'scale', 0.1, 2.0, 0.1)
        .name('Ölçek')
        .onChange((value) => {
          this.setScale(value);
        });
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