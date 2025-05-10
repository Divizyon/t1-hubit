
import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 30  // Model konumları
let posizyonY = -25
let posizyonZ = 2

export default class Kapsul  { // Kup modelini temsil eden sınıf
    constructor(_options) {
        // Dosya Ayarları
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setModel()
    }

    setModel() {

        const baseScene = this.resources.items.kapsulModel?.scene; // kup yerine materialjs den gelen sahnenin ismi konulacak   
        if (!baseScene) {
            console.error('kup ajansı modeli yüklenemedi!'); //debug için isterseniz ismini değiştirebilirsiniz
            return;
        }
        let baseChildren = [];
        if (baseScene.children && baseScene.children.length > 0) {
            baseChildren = baseScene.children;
        } else {
            baseChildren = [baseScene];
        }
        // Calculate precise model bounds
        const bbox = new THREE.Box3().setFromObject(baseScene)
        const size = bbox.getSize(new THREE.Vector3())
        
        // Scale factor to match model size
        const scaleFactor = 1;

        // Create CANNON body (tek collision)
        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ-2),
            material: this.physics.materials.items.floor
        })

        // Tek bir box collision (modelin tamamı için)
        const mainShape = new CANNON.Box(new CANNON.Vec3(
            Math.abs(size.x) * scaleFactor / 2,
            Math.abs(size.y) * scaleFactor / 2,
            Math.abs(size.z) * scaleFactor / 2
        ))
        body.addShape(mainShape)

        // Collision Eklemek İçin
        this.physics.world.addBody(body)

        // Modeli Ekliyoruz
        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ),
            mass: 0
        })

        this.model.base.collision = { body }

        this.container.add(this.model.base.container)

    }
}


/* 

Resources.js de  { name: 'kup', source: './models/hubit/kup/base.glb' }, şeklinde eklenmeli

Index.js de this.setKup() şeklinde çağırılacak setKup yerine setAbc şeklinde de isimlendirebilirsiniz
Ayrıca
setKup() { //küpü değiştir
        this.kup = new Kup({ // Burada ödemli olan birinin küçük harf ile diğerinin ise büyük harf ile yazılması gerekiyor farklı şeyler
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            physics: this.physics,
            debug: this.debugFolder
        })
        this.container.add(this.kup.container) // Küçük harfle yazılmalı
    }
Bu şekilde index.js de çağırılmalı en son kısımda yazılabilir süslü parantezden önce
*/