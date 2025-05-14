import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(30.7, -45, -1.5); // Artık doğru yerde tanımlandı

export default class Stadyum {
  constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0, areas }) {
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
    this.position = DEFAULT_POSITION.clone();

    this._buildModel();
    this.scene.add(this.container);

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
    model.rotation.set(this.rotateX, this.rotateY, this.rotateZ);
    this.container.add(model);

    // Base modelini klonla ve Kapsül modeline ekle
    const baseModel = base.scene.clone(true);
    baseModel.position.set(30, -45, 0); // Base modelinin Kapsül altına yerleştirilmesi için pozisyon ayarı
    baseModel.scale.set(3, 2.3, 1.5); // Base modelinin ölçeği
    this.container.add(baseModel);

    // Bounding box hesapla
    model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());

    // Fizik gövdesi oluştur
    const halfExtents = new CANNON.Vec3(size.x / 3, size.y / 3, size.z / 2);
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

  setStadyumInteraction() {
    try {
      if (!this.areas) {
        console.error("Stadyum etkileşim alanı eklenirken hata: areas objesi bulunamadı!");
        return;
      }

      // Create interaction area 5 units to the right of the model
      this.stadyumArea = this.areas.add({
        position: new THREE.Vector2(42, -45), // 
        halfExtents: new THREE.Vector2(2, 2), // 2x2 unit area
      });

      // Define interaction function
      this.stadyumArea.on("interact", () => {
        // PopupModule tarafından yönetileceği için buradaki popup kodu kaldırıldı
        console.log("Stadyum etkileşimi: PopUpModule tarafından yönetilecek");
      });
      
      console.log("Stadyum etkileşim alanı başarıyla eklendi");
    } catch (error) {
      console.error("Stadyum etkileşim alanı eklenirken hata oluştu:", error);
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