import * as THREE from 'three';
import CANNON from 'cannon';

export default class Cevre {
    constructor(options) {
        this.scene = options.scene;
        this.resources = options.resources;
        this.physics = options.physics;
        this.debug = options.debug;
        this.time = options.time;

        // Container
        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;

        // Trafik lambası ve yön tabelalarını ekle
        this.setTrafikLambasi();
        this.setYonTabelalari();
        this.setLegoParcasi();
        this.setLegoParcasi2();
        this.setLegoParcasi3();
        this.setLegoParcasi4();

        // Lego modellerini ve fiziği güncellemek için time olayını dinle
        this.time.on('tick', () => this.update());
    }

    setTrafikLambasi() {
        // Trafik lambası modelini ekle
        this.trafikLambasi = this.resources.items.trafikLambasiModel.scene;
        
        // Pozisyon ve rotasyon ayarları
        this.trafikLambasi.position.set(19, -5, 0); // X: 10 birim sağda
        this.trafikLambasi.rotation.set(0, 0, Math.PI / 2); // 45 derece döndür
        
        // Ölçeklendirme
        this.trafikLambasi.scale.set(1, 1, 1);
        
        // Sahneye ekle
        this.container.add(this.trafikLambasi);
    }

    setYonTabelalari() {  //7.17, 12.20, 0.00
        // Yön tabelası 1
        this.yonTabelasi1 = this.resources.items.yonTabelasi1Model.scene;
        this.yonTabelasi1.position.set(13, -4, 0); // X: -10 birim solda
        this.yonTabelasi1.rotation.set(0,0, 0); // -45 derece döndür
        this.yonTabelasi1.scale.set(1, 1, 1);
        this.container.add(this.yonTabelasi1);

        // Yön tabelası 2
        this.yonTabelasi2 = this.resources.items.yonTabelasi2Model.scene;
        this.yonTabelasi2.position.set(-13, -7, 0); // Z: 10 birim ileride
        this.yonTabelasi2.rotation.set(0, 0, 0); // 90 derece döndür
        this.yonTabelasi2.scale.set(1, 1, 1);
        this.container.add(this.yonTabelasi2);
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
            material: this.physics.materials.items.brick || this.physics.materials.items.default,
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
        
        // Debug görünümü için kutu ekle
        if (this.debug) {
            const collisionBoxGeom = new THREE.BoxGeometry(
                halfExtents.x * 2,
                halfExtents.y * 2,
                halfExtents.z * 2
            );
            const wireMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const collisionMesh = new THREE.Mesh(collisionBoxGeom, wireMaterial);
            collisionMesh.position.copy(model.position);
            collisionMesh.quaternion.copy(model.quaternion);
            this.container.add(collisionMesh);
            model.userData.debugMesh = collisionMesh;
        }
        
        return model;
    }

    update() {
        // Lego parçalarının pozisyonlarını güncelle
        this.updateLegoPhysics(this.legoParcasi);
        this.updateLegoPhysics(this.legoParcasi2);
        this.updateLegoPhysics(this.legoParcasi3);
        this.updateLegoPhysics(this.legoParcasi4);
    }
    
    // Lego parçalarının fizik pozisyonlarını güncelleme metodu - eklendi
    updateLegoPhysics(legoModel) {
        if (legoModel && legoModel.userData && legoModel.userData.body) {
            const body = legoModel.userData.body;
            
            // Model pozisyonunu ve rotasyonunu fizik gövdesi ile senkronize et
            legoModel.position.copy(body.position);
            legoModel.quaternion.copy(body.quaternion);
            
            // Debug mesh varsa onu da güncelle
            if (legoModel.userData.debugMesh) {
                legoModel.userData.debugMesh.position.copy(body.position);
                legoModel.userData.debugMesh.quaternion.copy(body.quaternion);
            }
        }
    }
}
