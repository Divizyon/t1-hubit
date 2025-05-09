import * as THREE from 'three'

export default class Kapsul
{
    constructor(_options)
    {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.debug = _options.debug
        this.time = _options.time
        this.physics = _options.physics
        this.shadows = _options.shadows
        this.materials = _options.materials

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('kapsul')
            this.debugFolder.open()
        }
        
        // Kapsul modelinin varlığını kontrol et
        if(this.resources.items.kapsulModel) {
            this.setModel()
        } else {
            console.error('HATA: Kapsul modeli (kapsulModel) resources içinde bulunamadı!')
        }
    }

    setModel()
    {
        this.model = {}
        
        // Resource
        this.model.resource = this.resources.items.kapsulModel
        
        // Model container
        this.model.container = new THREE.Object3D()
        this.model.container.matrixAutoUpdate = true
        this.container.add(this.model.container)

        // Ana modeli ekle
        try {
            if(this.model.resource && this.model.resource.scene) {
                // Model referansını küresel olarak kaydet
                const kapsulModel = this.model.resource.scene.clone()
                this.model.kapsulModel = kapsulModel;
                
                // Kapsul için konumu ayarla
                kapsulModel.position.set(30, -25, 2);
                
                // Tüm mesh'lerin materyallerini düzenle
                kapsulModel.traverse((child) => {
                    if (child.isMesh) {
                        // Orijinal materyali koruyoruz, yeni materyal ataması yapmıyoruz
                        // Sadece gölge ayarlarını yapıyoruz
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Eğer modelinizde materyal yoksa, varsayılan bir materyal atayabiliriz
                        if (!child.material) {
                            console.warn("Mesh üzerinde materyal bulunamadı, varsayılan materyal atanıyor");
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x3498db,      // Mavi renk
                                roughness: 0.3,       
                                metalness: 0.5,       
                                side: THREE.DoubleSide,
                                emissive: 0x111111,
                                wireframe: false
                            });
                        }
                    }
                })
                
                // Modeli ekle
                this.model.container.add(kapsulModel)
                
                // Fizik özelliklerini ekle
                const centerPosition = new THREE.Vector3(30, -25, 0);
                
                // Ana kapsul nesnesini ekle
                this.kapsulObject = this.objects.add({
                    base: this.model.resource.scene,
                    collision: this.resources.items.brickCollision.scene,
                    offset: centerPosition,
                    rotation: new THREE.Euler(0, 0, 0),
                    shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
                    mass: 0,
                    sleep: true
                });
                
                // Ek çarpışma nesnelerini ekle (merkez etrafında 2x2 grid)
                // Brick alanının yaklaşık 2x2 birim olduğunu varsayarak
                const offsets = [
                    // Mevcut çarpışma nesneleri - merkeze daha yakın
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y, centerPosition.z),   // Sağ
                    new THREE.Vector3(centerPosition.x - 2.0, centerPosition.y, centerPosition.z),   // Sol (1 birim uzaklaştırıldı)
                    new THREE.Vector3(centerPosition.x, centerPosition.y + 1.0, centerPosition.z),   // Yukarı
                    new THREE.Vector3(centerPosition.x, centerPosition.y - 1.0, centerPosition.z),   // Aşağı
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y + 1.0, centerPosition.z), // Sağ üst
                    new THREE.Vector3(centerPosition.x - 2.0, centerPosition.y + 2.0, centerPosition.z), // Sol üst (1 birim uzaklaştırıldı)
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y - 1.0, centerPosition.z), // Sağ alt
                    new THREE.Vector3(centerPosition.x - 2.0, centerPosition.y - 2.0, centerPosition.z),  // Sol alt (1 birim uzaklaştırıldı)
                    
                    // Daha uzak bölgeler - merkeze daha yakın
                    // +X yönünde daha fazla alan
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y, centerPosition.z),     // Daha sağ
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y + 1.0, centerPosition.z), // Daha sağ üst
                    new THREE.Vector3(centerPosition.x + 4.0, centerPosition.y, centerPosition.z),     // En sağ
                    new THREE.Vector3(centerPosition.x + 4.0, centerPosition.y + 1.0, centerPosition.z), // En sağ üst
                    
                    // +Y yönünde daha fazla alan
                    new THREE.Vector3(centerPosition.x, centerPosition.y + 2.5, centerPosition.z),     // Daha yukarı
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y + 2.5, centerPosition.z), // Sağ daha yukarı
                    new THREE.Vector3(centerPosition.x, centerPosition.y + 4.0, centerPosition.z),     // En yukarı
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y + 4.0, centerPosition.z), // Sağ en yukarı
                    
                    // Yeni eklenen batı-kuzey brick'leri (-x, +y)
                    new THREE.Vector3(centerPosition.x - 1.5, centerPosition.y + 4.0, centerPosition.z), // En batı kuzey (ilk brick)
                    new THREE.Vector3(centerPosition.x - 2.5, centerPosition.y + 4.0, centerPosition.z), // İlkinin doğusu (ikinci brick)
                    
                    // Yeni eklenen batı-güney brick'leri (-x, -y)
                    new THREE.Vector3(centerPosition.x - 1.5, centerPosition.y - 2.5, centerPosition.z), // En batı güney (ilk brick)
                    new THREE.Vector3(centerPosition.x - 0.5, centerPosition.y - 2.5, centerPosition.z), // İlkinin doğusu (ikinci brick)
                    
                    // Kuzey doğu köşesi (+x, +y)
                    new THREE.Vector3(centerPosition.x + 3.5, centerPosition.y + 3.5, centerPosition.z), // En kuzey doğu köşesi
                    
                    // +X ve +Y yönlerini birlikte kapsayan köşe alanları
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y + 2.5, centerPosition.z), // Köşe
                    new THREE.Vector3(centerPosition.x + 4.0, centerPosition.y + 2.5, centerPosition.z), // Daha sağ köşe
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y + 4.0, centerPosition.z), // Daha yukarı köşe

                    // Merkez üstü için ekstra dolgu
                    new THREE.Vector3(centerPosition.x, centerPosition.y, centerPosition.z + 1.0),     // Merkezin üstünde
                    
                    // Güney doğu (sağ alt) köşesi
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y - 1.0, centerPosition.z), // Daha sağ alt
                    new THREE.Vector3(centerPosition.x + 4.0, centerPosition.y - 1.0, centerPosition.z), // En sağ alt
                    new THREE.Vector3(centerPosition.x + 2.5, centerPosition.y - 2.5, centerPosition.z), // Daha sağ daha alt
                    new THREE.Vector3(centerPosition.x + 4.0, centerPosition.y - 2.5, centerPosition.z), // En sağ daha alt
                    new THREE.Vector3(centerPosition.x + 1.0, centerPosition.y - 2.5, centerPosition.z), // Sağ daha alt
                    new THREE.Vector3(centerPosition.x, centerPosition.y - 2.5, centerPosition.z), // Merkez daha alt
                ];
                
                // İlave çarpışma nesnelerini ekleyelim
                this.additionalCollisions = [];
                for (let i = 0; i < offsets.length; i++) {
                    // Görünmez çarpışma nesnesi ekle (sadece fizik, görsel yok)
                    const collisionObject = this.objects.add({
                        base: this.resources.items.brickCollision.scene, // Görünmez, sadece çarpışma
                        collision: this.resources.items.brickCollision.scene,
                        offset: offsets[i],
                        rotation: new THREE.Euler(0, 0, 0),
                        mass: 0,
                        sleep: true,
                        // Gölge yok, görünür değil
                    });
                    
                    // Çarpışma nesnesini gizle (sadece fizik için kullanıyoruz)
                    if (collisionObject && collisionObject.container) {
                        collisionObject.container.visible = false;
                    }
                    
                    this.additionalCollisions.push(collisionObject);
                }
                
                console.log("Kapsul ve ek çarpışma nesneleri başarıyla eklendi");
            }
        } catch (error) {
            console.error('HATA: Kapsul modeli eklenirken bir hata oluştu:', error)
        }
        
        // Debug paneli
        if(this.debug)
        {
            const folder = this.debugFolder.addFolder('position')
            folder.add(this.model.container.position, 'x').step(0.1).name('positionX')
            folder.add(this.model.container.position, 'y').step(0.1).name('positionY')
            folder.add(this.model.container.position, 'z').step(0.1).name('positionZ')
            
            const scaleFolder = this.debugFolder.addFolder('scale')
            scaleFolder.add(this.model.container.scale, 'x').min(0.1).max(5).step(0.1).name('scaleX')
            scaleFolder.add(this.model.container.scale, 'y').min(0.1).max(5).step(0.1).name('scaleY')
            scaleFolder.add(this.model.container.scale, 'z').min(0.1).max(5).step(0.1).name('scaleZ')
            
            // Materyal kontrolleri
            const materialFolder = this.debugFolder.addFolder('material')
            const materialData = {
                color: '#666666',
                wireframe: false,
                metalness: 0.7,
                roughness: 0.5
            };
            
            // Materyal değişim fonksiyonu
            const updateMaterial = () => {
                this.model.kapsulModel.traverse((child) => {
                    if (child.isMesh) {
                        child.material.color.set(materialData.color);
                        child.material.wireframe = materialData.wireframe;
                        child.material.metalness = materialData.metalness;
                        child.material.roughness = materialData.roughness;
                        child.material.needsUpdate = true;
                    }
                });
            };
            
            materialFolder.addColor(materialData, 'color').onChange(updateMaterial);
            materialFolder.add(materialData, 'wireframe').onChange(updateMaterial);
            materialFolder.add(materialData, 'metalness', 0, 1).step(0.05).onChange(updateMaterial);
            materialFolder.add(materialData, 'roughness', 0, 1).step(0.05).onChange(updateMaterial);
        }
    }
} 