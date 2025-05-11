import * as THREE from 'three'

export default class Road {
    constructor(_options) {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.time = _options.time
        this.physics = _options.physics
        this.materials = _options.materials

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true

        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('road')
            this.debugFolder.open()
        }

        // Yol modelinin varlığını kontrol et
        if (this.resources.items.roadModel) {
            this.setModel()
        } else {
            console.error('HATA: Road modeli (roadModel) resources içinde bulunamadı!')
        }
    }

    setModel() {
        this.model = {}

        // Resource
        this.model.resource = this.resources.items.roadModel

        // Model container
        this.model.container = new THREE.Object3D()
        this.model.container.matrixAutoUpdate = true
        this.container.add(this.model.container)

        // Ana modeli ekle
        try {
            if (this.model.resource && this.model.resource.scene) {
                // Model referansını küresel olarak kaydet
                const roadModel = this.model.resource.scene.clone()
                this.model.roadModel = roadModel;

                // Modelin konumunu sağ-sol dengesi için ayarla
                // Saman balyalarının alanı: 192x128
                const areaWidth = 192;  // Alanın tam genişliği
                const areaHeight = 128; // Alanın tam yüksekliği

                // Model normalde nasıl boyutlandırılıyor diye inceleyip ölçeklendirme yapıyoruz
                // Bu model için özel olarak hesaplanmış değerler - birkaç deneme yanılma ile bulundu
                roadModel.scale.set(1.6, 1.2, 2.1); // X (sağ-sol) doğrultusunda genişlettim

                // X ekseni etrafında 90 derece (Math.PI/2) döndür
                roadModel.rotation.set(Math.PI / 2, 0, 0);

                // Ana yol modeli konumunu koruyalım
                roadModel.position.set(30, 5, 0.002);

                // Tüm mesh'lerin materyallerini düzenle
                roadModel.traverse((child) => {
                    if (child.isMesh) {
                        // Koyu renkli materyali kaldır, varsayılan materyali kullan
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff, // Beyaz veya açık renk (veya istenirse şeffaf)
                            roughness: 0.5,
                            metalness: 0.0,
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.0 // Tamamen şeffaf, yolu görünmez yapar
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                })

                // Modeli ekle
                this.model.container.add(roadModel)

                // Işık ekle - daha net bir görünüm için
                const light = new THREE.DirectionalLight(0xffffff, 1.5)
                light.position.set(5, 8, 5)
                light.lookAt(0, 0, 0)
                light.castShadow = true

                // Gölge ayarları
                light.shadow.mapSize.width = 1024
                light.shadow.mapSize.height = 1024

                this.model.container.add(light)

                // Ambient ışık ekle - daha yumuşak aydınlatma
                const ambientLight = new THREE.AmbientLight(0x404040, 0.8)
                this.model.container.add(ambientLight)
            }
        } catch (error) {
            console.error('HATA: Road modeli eklenirken bir hata oluştu:', error)
        }

        // Debug paneli
        if (this.debug) {
            const folder = this.debugFolder.addFolder('position')
            folder.add(this.model.container.position, 'x').step(0.1).name('positionX')
            folder.add(this.model.container.position, 'y').step(0.1).name('positionY')
            folder.add(this.model.container.position, 'z').step(0.1).name('positionZ')

            const scaleFolder = this.debugFolder.addFolder('scale')
            scaleFolder.add(this.model.container.scale, 'x').min(0.1).max(20).step(0.1).name('scaleX')
            scaleFolder.add(this.model.container.scale, 'y').min(0.1).max(20).step(0.1).name('scaleY')
            scaleFolder.add(this.model.container.scale, 'z').min(0.1).max(20).step(0.1).name('scaleZ')

            // Rotasyon değiştiğinde güncelleme fonksiyonu
            const updateRotation = () => {
                this.model.roadModel.rotation.x = rotationData.rotX * Math.PI / 180;
                this.model.roadModel.rotation.y = rotationData.rotY * Math.PI / 180;
                this.model.roadModel.rotation.z = rotationData.rotZ * Math.PI / 180;
                this.model.roadModel.updateMatrix();
            };

            // Derece cinsinden rotasyon değerleri (kullanıcı dostu)
            const rotationData = {
                rotX: 90,  // Başlangıç değeri: X ekseni etrafında 90 derece
                rotY: 0,   // Başlangıç değeri: Y ekseni 0 derece
                rotZ: 0
            };

            // Rotasyon kontrolleri
            const rotFolder = this.debugFolder.addFolder('rotation')
            rotFolder.add(rotationData, 'rotX', -180, 180).step(5).name('X rotasyon').onChange(updateRotation);
            rotFolder.add(rotationData, 'rotY', -180, 180).step(5).name('Y rotasyon').onChange(updateRotation);
            rotFolder.add(rotationData, 'rotZ', -180, 180).step(5).name('Z rotasyon').onChange(updateRotation);

            // Yol doğrudan kontrolleri
            const roadFolder = this.debugFolder.addFolder('road_direct')

            // Yol pozisyon kontrolleri
            roadFolder.add(this.model.roadModel.position, 'x').min(-10).max(60).step(0.1).name('Yol pozisyon X')
            roadFolder.add(this.model.roadModel.position, 'y').min(-10).max(40).step(0.1).name('Yol pozisyon Y')
            roadFolder.add(this.model.roadModel.position, 'z').min(-1).max(1).step(0.001).name('Yol pozisyon Z')

            // Yol ölçek kontrolleri
            roadFolder.add(this.model.roadModel.scale, 'x').min(0.1).max(5).step(0.01).name('Yol ölçek X')
            roadFolder.add(this.model.roadModel.scale, 'y').min(0.1).max(5).step(0.01).name('Yol ölçek Y')
            roadFolder.add(this.model.roadModel.scale, 'z').min(0.1).max(5).step(0.05).name('Yol ölçek Z')

            // Materyal kontrolleri
            const materialFolder = this.debugFolder.addFolder('material')
            const materialData = {
                color: '#ffffff', // Koyu renk yerine açık renk
                wireframe: false,
                metalness: 0.0,
                roughness: 0.5,
                opacity: 0.0 // Şeffaflık
            };

            // Materyal değişim fonksiyonu
            const updateMaterial = () => {
                this.model.roadModel.traverse((child) => {
                    if (child.isMesh) {
                        child.material.color.set(materialData.color);
                        child.material.wireframe = materialData.wireframe;
                        child.material.metalness = materialData.metalness;
                        child.material.roughness = materialData.roughness;
                        child.material.opacity = materialData.opacity;
                        child.material.transparent = true;
                        child.material.needsUpdate = true;
                    }
                });
            };

            materialFolder.addColor(materialData, 'color').onChange(updateMaterial);
            materialFolder.add(materialData, 'wireframe').onChange(updateMaterial);
            materialFolder.add(materialData, 'metalness', 0, 1).step(0.05).onChange(updateMaterial);
            materialFolder.add(materialData, 'roughness', 0, 1).step(0.05).onChange(updateMaterial);
            materialFolder.add(materialData, 'opacity', 0, 1).step(0.05).onChange(updateMaterial);
        }
    }
} 