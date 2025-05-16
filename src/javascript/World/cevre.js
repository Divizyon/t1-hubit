import * as THREE from 'three';
import CANNON from 'cannon';

export default class Cevre {
    constructor(options) {
        // Store options with null checks
        this.scene = options && options.scene ? options.scene : null;
        this.resources = options && options.resources ? options.resources : null;
        this.physics = options && options.physics ? options.physics : null;
        this.debug = options && options.debug ? options.debug : null;
        this.time = options && options.time ? options.time : null;

        // Container
        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        // Check if essential resources are available before initializing
        if (!this.resources) {
            console.warn('Cevre: Resources not available, component may not initialize properly');
            return;
        }

        //  lambası ve yön tabelalarını ekle
        this.setLambasi();
        this.setYonTabelalari();
        this.setLegoParcasi();
        this.setLegoParcasi2();
        this.setLegoParcasi3();
        this.setLegoParcasi4();

        // Lego modellerini ve fiziği güncellemek için time olayını dinle
        if (this.time) {
            this.time.on('tick', () => this.update());
        }
    }

    setLambasi() {
        // Check if resources and LambasiModel are available
        if (!this.resources || !this.resources.items || !this.resources.items.LambasiModel) {
            console.warn('Cevre: Resources or LambasiModel not available');
            return;
        }
        
        //  lambası modelini ekle
        this.Lambasi = this.resources.items.LambasiModel.scene;
        
        // Pozisyon ve rotasyon ayarları
        this.Lambasi.position.set(19, -5, 0); // X: 10 birim sağda
        this.Lambasi.rotation.set(0, 0, Math.PI / 2); // 45 derece döndür
        
        // Ölçeklendirme
        this.Lambasi.scale.set(1, 1, 1);
        
        // Sahneye ekle
        this.container.add(this.Lambasi);
    }

    setYonTabelalari() {  //7.17, 12.20, 0.00
        // Check if resources and models are available
        if (!this.resources || !this.resources.items) {
            console.warn('Cevre: Resources not available for setYonTabelalari');
            return;
        }
        
        // Yön tabelası 1
        if (this.resources.items.yonTabelasi1Model) {
            this.yonTabelasi1 = this.resources.items.yonTabelasi1Model.scene;
            this.yonTabelasi1.position.set(13, -4, 0); // X: -10 birim solda
            this.yonTabelasi1.rotation.set(0,0, 0); // -45 derece döndür
            this.yonTabelasi1.scale.set(1, 1, 1);
            this.container.add(this.yonTabelasi1);
        } else {
            console.warn('Cevre: yonTabelasi1Model not available');
        }

        // Yön tabelası 2
        if (this.resources.items.yonTabelasi2Model) {
            this.yonTabelasi2 = this.resources.items.yonTabelasi2Model.scene;
            this.yonTabelasi2.position.set(-13, -7, 0); // Z: 10 birim ileride
            this.yonTabelasi2.rotation.set(0, 0, 0); // 90 derece döndür
            this.yonTabelasi2.scale.set(1, 1, 1);
            this.container.add(this.yonTabelasi2);
        } else {
            console.warn('Cevre: yonTabelasi2Model not available');
        }
    }

    setLegoParcasi() {
        const posX = 21;
        const posY = 14;
        const posZ = -0.09; // Yerde durması için değeri düşürdük
        const rotation = new THREE.Euler(0, 0, Math.PI/2);
        
        this.legoParcasi = this.addLegoWithPhysics({
            x: posX,
            y: posY,
            z: posZ,
            rotation: rotation,
            mass: 5.0, 
            restitution: 0.1,
            friction: 0.8
        });
    }

    setLegoParcasi2() {
        const posX = 21;
        const posY = 15;
        const posZ = -0.09; // Yerde durması için değeri düşürdük
        const rotation = new THREE.Euler(0, 0, Math.PI/2);
        
        this.legoParcasi2 = this.addLegoWithPhysics({
            x: posX,
            y: posY,
            z: posZ,
            rotation: rotation,
            mass: 5.0,
            restitution: 0.1,
            friction: 0.8
        });
    }

    setLegoParcasi3() {
        const posX = 2;
        const posY = -44;
        const posZ = -0.09; // Yerde durması için değeri düşürdük
        const rotation = new THREE.Euler(0, 0, Math.PI/2);
        
        this.legoParcasi3 = this.addLegoWithPhysics({
            x: posX,
            y: posY, 
            z: posZ,
            rotation: rotation,
            mass: 5.0,
            restitution: 0.1,
            friction: 0.8
        });
    }

    setLegoParcasi4() {
        const posX = 3;
        const posY = -44;
        const posZ = -0.09; // Yerde durması için değeri düşürdük
        const rotation = new THREE.Euler(0, 0, Math.PI/2);
        
        this.legoParcasi4 = this.addLegoWithPhysics({
            x: posX,
            y: posY,
            z: posZ,
            rotation: rotation,
            mass: 5.0,
            restitution: 0.1,
            friction: 0.8
        });
    }

    // Fizikli lego ekleme yardımcı metodu - eksik kısımları tamamladık
    addLegoWithPhysics(options) {
        // Check if physics is available
        if (!this.physics || !this.physics.world) {
            console.warn('Cevre: Physics or physics.world not available, skipping lego physics');
            return null;
        }
        
        // Check if the lego model is available
        if (!this.resources || !this.resources.items || !this.resources.items.legoParcaModel) {
            console.warn('Cevre: Resources or legoParcaModel not available');
            return null;
        }

        // Varsayılan değerleri ayarla
        const {
            x = 0,
            y = 0, 
            z = 0,
            rotation = new THREE.Euler(0, 0, 0),
            mass = 5.0,
            restitution = 0.1,
            friction = 0.8,
            linearDamping = 0.4,
            angularDamping = 0.6
        } = options;

        // Lego modelini al ve kopyala
        const model = this.resources.items.legoParcaModel.scene.clone();
        
        // Modeli pozisyonlandır
        model.position.set(x, y, z);
        model.rotation.copy(rotation);
        model.scale.set(1, 1, 1);
        
        // Modeli containera ekle
        this.container.add(model);

        // Lego modelinin boundingbox'ını hesapla
        model.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());

        // Fizik gövdesi oluştur
        const halfExtents = new CANNON.Vec3(
            size.x / 2,
            size.y / 2,
            size.z / 2
        );
        
        // Dikdörtgen şekil oluştur
        const boxShape = new CANNON.Box(halfExtents);
        
        // Fizik gövdesi oluştur
        const body = new CANNON.Body({
            mass: mass,
            position: new CANNON.Vec3(x, y, z),
            material: this.physics.materials && this.physics.materials.items ? 
                (this.physics.materials.items.brick || this.physics.materials.items.default) : null,
            linearDamping: linearDamping,
            angularDamping: angularDamping
        });
        
        // Sıçrama katsayısını ayarla
        if (body.material) {
            body.material.restitution = restitution;
            body.material.friction = friction;
        }
        
        // Euler açılarını quaternion'a çevir ve gövdeye uygula
        const quaternion = new CANNON.Quaternion();
        quaternion.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');
        body.quaternion.copy(quaternion);
        
        // Şekli gövdeye ekle
        body.addShape(boxShape);
        
        // Fizik motoruna ekle
        this.physics.world.addBody(body);
        
        // Model ile fizik gövdesi arasında bağlantı kur
        model.userData.body = body;
        body.userData = { model: model };
        
        return { model, body };
    }

    update() {
        // Lego parçalarının pozisyonlarını güncelle
        if (this.legoParcasi) this.updateLegoPhysics(this.legoParcasi);
        if (this.legoParcasi2) this.updateLegoPhysics(this.legoParcasi2);
        if (this.legoParcasi3) this.updateLegoPhysics(this.legoParcasi3);
        if (this.legoParcasi4) this.updateLegoPhysics(this.legoParcasi4);
    }
    
    // Lego parçalarının fizik pozisyonlarını güncelleme metodu - eklendi
    updateLegoPhysics(legoModel) {
        // Skip if legoModel is null or doesn't have the expected structure
        if (!legoModel) return;
        
        // Handle both potential object structures
        let model, body;
        
        // Check if legoModel is an object with model and body properties (new structure)
        if (legoModel.model && legoModel.body) {
            model = legoModel.model;
            body = legoModel.body;
        } 
        // Check if legoModel is a direct model reference with userData.body (old structure)
        else if (legoModel.userData && legoModel.userData.body) {
            model = legoModel;
            body = legoModel.userData.body;
        }
        // If neither structure matches, exit
        else {
            return;
        }
        
        // Model pozisyonunu ve rotasyonunu fizik gövdesi ile senkronize et
        model.position.copy(body.position);
        model.quaternion.copy(body.quaternion);
        
        // Debug mesh varsa onu da güncelle
        if (model.userData && model.userData.debugMesh) {
            model.userData.debugMesh.position.copy(body.position);
            model.userData.debugMesh.quaternion.copy(body.quaternion);
        }
    }
}
