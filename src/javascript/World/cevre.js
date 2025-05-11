import * as THREE from 'three';

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
    }

    setTrafikLambasi() {
        // Trafik lambası modelini ekle
        this.trafikLambasi = this.resources.items.trafikLambasiModel.scene;
        
        // Pozisyon ve rotasyon ayarları
        this.trafikLambasi.position.set(10, 0, 0); // X: 10 birim sağda
        this.trafikLambasi.rotation.set(0, 0, Math.PI / 2); // 45 derece döndür
        
        // Ölçeklendirme
        this.trafikLambasi.scale.set(1, 1, 1);
        
        // Sahneye ekle
        this.container.add(this.trafikLambasi);
    }

    setYonTabelalari() {
        // Yön tabelası 1
        this.yonTabelasi1 = this.resources.items.yonTabelasi1Model.scene;
        this.yonTabelasi1.position.set(-10, 0, 0); // X: -10 birim solda
        this.yonTabelasi1.rotation.set(0,0, 0); // -45 derece döndür
        this.yonTabelasi1.scale.set(1, 1, 1);
        this.container.add(this.yonTabelasi1);

        // Yön tabelası 2
        this.yonTabelasi2 = this.resources.items.yonTabelasi2Model.scene;
        this.yonTabelasi2.position.set(-15, 0, 0); // Z: 10 birim ileride
        this.yonTabelasi2.rotation.set(0, 0, 0); // 90 derece döndür
        this.yonTabelasi2.scale.set(1, 1, 1);
        this.container.add(this.yonTabelasi2);
    }

    setLegoParcasi() {
        this.legoParcasi = this.resources.items.legoParcaModel.scene;
        this.legoParcasi.position.set(5, 5, .32);
        this.legoParcasi.rotation.set(0, Math.PI , 0);
        this.legoParcasi.scale.set(1, 1, 1);
        this.container.add(this.legoParcasi);
    }

    setLegoParcasi2() {
        this.legoParcasi2 = this.resources.items.legoParcaModel.scene.clone();
        this.legoParcasi2.position.set(6, 5, .32);
        this.legoParcasi2.rotation.set(0, Math.PI, 0);
        this.legoParcasi2.scale.set(1, 1, 1);
        this.container.add(this.legoParcasi2);
    }

    setLegoParcasi3() {
        this.legoParcasi3 = this.resources.items.legoParcaModel.scene.clone();
        this.legoParcasi3.position.set(7, 5, .32);
        this.legoParcasi3.rotation.set(0, Math.PI, 0);
        this.legoParcasi3.scale.set(1, 1, 1);
        this.container.add(this.legoParcasi3);
    }

    setLegoParcasi4() {
        this.legoParcasi4 = this.resources.items.legoParcaModel.scene.clone();
        this.legoParcasi4.position.set(8, 5, .32);
        this.legoParcasi4.rotation.set(0, Math.PI, 0);
        this.legoParcasi4.scale.set(1, 1, 1);
        this.container.add(this.legoParcasi4);
    }

    update() {
        // Animasyon veya güncelleme gerektiren işlemler buraya eklenebilir
    }
}
