import * as THREE from 'three';
import CANNON from 'cannon'

export default class AtmosferAlani {
    constructor(_options) {
        this.resources = _options.resources;
        this.objects = _options.objects;
        this.debug = _options.debug;
        this.time = _options.time;
        this.physics = _options.physics;
        this.shadows = _options.shadows;
        this.materials = _options.materials;
        this.areas = _options.areas;
        this.sounds = _options.sounds;

        this.container = new THREE.Object3D();
        this.container.matrixAutoUpdate = false;
        this.container.scale.set(1.5, 1.5, 1.5);

        this.setAtmosferAlani();
        this.addCollisions(this.model.container);
    }

    setAtmosferAlani() {
        this.model = this.objects.add({
            base: this.resources.items.atmosferAlaniModel.scene,
            // collision: null, // Gerekirse collision ekleyebilirsin
            offset: new THREE.Vector3(-25, 0, 0.03), // Eski koordinatlara geri alındı
            rotation: new THREE.Euler(Math.PI / 2, 0, 0), // X ekseninde +90 derece döndürdüm
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true,
            name: "Atmosfer Alanı",
            preserveMaterials: true // Materyalleri korumak için yeni parametre
        });

        if (this.model && this.model.container) {
            this.container.add(this.model.container);
            this.model.container.scale.set(1.5, 1.5, 1.5);
            this.applyMaterialsAndScale();
            console.log("Atmosfer Alanı başarıyla eklendi");
        } else {
            console.warn("Atmosfer Alanı modeli yüklenemedi veya bulunamadı!");
        }
    }

    applyMaterialsAndScale() {
        this.model.container.traverse(child => {
            if (child.isMesh) {
                // Ölçeklendirme uygula
                child.scale.set(1.5, 1.5, 1.5);

                // Materyal işleme
                if (child.material) {
                    // Eğer materyal array ise her birini işle
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(mat => this.processMaterial(mat));
                    } else {
                        child.material = this.processMaterial(child.material);
                    }
                }
            }
        });
    }

    processMaterial(material) {
        // Mevcut materyali koru ve özelliklerini güncelle
        const newMaterial = material.clone();

        // Materyal özelliklerini ayarla
        newMaterial.needsUpdate = true;
        newMaterial.side = THREE.DoubleSide;

        // Eğer materyal transparent ise alpha değerini koru
        if (material.transparent) {
            newMaterial.transparent = true;
            newMaterial.opacity = material.opacity;
        }

        // Eğer debug modu aktifse materyal bilgilerini logla
        if (this.debug) {
            console.log(`Materyal işlendi: ${material.name || 'Adsız Materyal'}`, newMaterial);
        }

        return newMaterial;
    }

    addCollisions(model) {
        // Bounding box hesapla
        model.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        
        // Ana çarpışma kutusu
        this.addCollisionBox(
            new THREE.Vector3(-16, -2.8, 2),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.8, 0.5, 2),
        );
        
        // İkinci çarpışma kutusu (gerekirse)
        this.addCollisionBox(
            new THREE.Vector3(-16, 2.4, 2),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.8, 0.5, 2),
        );
        //soldan ilk direk
        this.addCollisionBox(
            new THREE.Vector3(-16.5, -9.2, 2),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.3, 0.3, 2),
        );
        this.addCollisionBox(
            new THREE.Vector3(-25, -33, 2),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.3, 0.3, 2),
        );
       
    }
    
    addCollisionBox(position, rotation, halfExtents, color) {
        // Fizik gövdesi oluştur
        const boxShape = new CANNON.Box(halfExtents);

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            material: this.physics.materials.items.floor
        });

        // Dönüşü quaternion olarak ayarla
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ');
        body.quaternion.copy(quat);

        body.addShape(boxShape);
        this.physics.world.addBody(body);

        console.log("Atmosfer alanı için collision eklendi:", body);
        
        // Çarpışma kutusunu görselleştir
        this.visualizeCollisionBox(position, rotation, halfExtents, color);
    }
    
    visualizeCollisionBox(position, rotation, halfExtents, color) {
        // Çarpışma kutusunun görsel temsilini oluştur
        const geometry = new THREE.BoxGeometry(
            halfExtents.x * 2, 
            halfExtents.y * 2, 
            halfExtents.z * 2
        );
        
        // Yarı saydam malzeme 
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true, 
            opacity: 0.5,    
            wireframe: true,
            wireframeLinewidth: 2
        });
        
        const collisionMesh = new THREE.Mesh(geometry, material);
        
        // Pozisyonu ve rotasyonu ayarla
        collisionMesh.position.copy(position);
        collisionMesh.rotation.copy(rotation);
        
        // Sahneye ekle
        this.container.add(collisionMesh);
        
        console.log("Atmosfer alanı çarpışma kutusu görselleştirildi:", collisionMesh);
    }
} 