import * as THREE from 'three';
import CANNON from 'cannon';

const DEFAULT_POSITION = new THREE.Vector3(40, -42, -2.5); // Varsayılan pozisyon
const DEFAULT_SCALE = new THREE.Vector3(1.06, 1.06, 1.06); // Varsayılan ölçek

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

    // Bounding box hesapla
    model.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());

    // Fizik gövdesi oluştur
    // Çarpışma kutusunun boyutunu model ölçeğine göre ayarla
    const baseHalfExtentX = size.x / 3;
    const baseHalfExtentY = size.y / 3;
    const baseHalfExtentZ = size.z / 2;
    
    const scaleFactor = Math.max(this.scale.x, this.scale.y, this.scale.z);
    
    const halfExtents = new CANNON.Vec3(
      baseHalfExtentX * scaleFactor, 
      baseHalfExtentY * scaleFactor, 
      baseHalfExtentZ * scaleFactor
    );
    
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
  
  
