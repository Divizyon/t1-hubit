import * as THREE from 'three'

export default class Kapsul
{
    constructor(_options)
    {
        // Options
        this.debug = _options.debug
        this.resources = _options.resources
        this.objects = _options.objects
        this.shadows = _options.shadows
        this.materials = _options.materials
        this.sounds = _options.sounds
        this.time = _options.time
        this.areas = _options.areas
        
        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true
        
        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('kapsul')
            this.debugFolder.open()
        }
        
        this.setModel()
        this.setLights()
    }
    
    setModel()
    {
        // Kapsul modelinin varlığını kontrol et
        if(this.resources.items.kapsulModel) {
            this.model = {}
            this.model.container = new THREE.Object3D()
            this.model.container.matrixAutoUpdate = true
            
            // Model tanımlama
            this.model.resource = this.resources.items.kapsulModel
            
            try {
                // Model örneğini oluştur
                const kapsulModel = this.model.resource.scene.clone()
                this.model.kapsulModel = kapsulModel;
                
                // Kapsul için konumu ayarla
                kapsulModel.position.set(30, -25, 2);
                kapsulModel.scale.set(1, 1, 1); // Ölçeği ayarla
                
                // Tüm mesh'leri dolaşıp daha iyi görünüm için ayarlar yap
                kapsulModel.traverse((child) => {
                    if(child.isMesh) {
                        // Gölge ayarları
                        child.castShadow = true
                        child.receiveShadow = true
                        
                        // Eğer materyal varsa, texture'ların daha iyi görünmesi için ayarlar
                        if (child.material) {
                            // Materyal ayarlarını optimize et
                            child.material.needsUpdate = true
                            
                            // Texture'ları aktifleştir
                            if (child.material.map) {
                                child.material.map.needsUpdate = true
                            }
                            
                            // Eğer PBR materyal ise
                            if (child.material.metalness !== undefined) {
                                // Daha iyi görünüm için materyal değerlerini ayarla
                                child.material.metalness = 0.3
                                child.material.roughness = 0.7
                            }
                            
                            // Çift taraflı görünüm
                            child.material.side = THREE.DoubleSide
                        }
                        
                        // Eğer modelinizde materyal yoksa, varsayılan bir materyal atayabiliriz
                        if (!child.material) {
                            console.warn("Mesh üzerinde materyal bulunamadı, varsayılan materyal atanıyor");
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x3498db,
                                roughness: 0.3,
                                metalness: 0.5,
                                side: THREE.DoubleSide,
                                emissive: 0x111111,
                                wireframe: false
                            });
                        }
                    }
                });
                
                // Modeli container'a ekle
                this.model.container.add(kapsulModel)
                this.container.add(this.model.container)
                
                console.log("Kapsul modeli başarıyla eklendi");
                
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
                    
                    const rotationFolder = this.debugFolder.addFolder('rotation')
                    rotationFolder.add(this.model.container.rotation, 'x').step(0.1).name('rotationX')
                    rotationFolder.add(this.model.container.rotation, 'y').step(0.1).name('rotationY')
                    rotationFolder.add(this.model.container.rotation, 'z').step(0.1).name('rotationZ')
                }
            } catch (error) {
                console.error('HATA: Kapsul modeli eklenirken bir hata oluştu:', error)
            }
        } else {
            console.error('HATA: Kapsul modeli (kapsulModel) resources içinde bulunamadı!')
        }
    }
    
    setLights() {
        // Kapsul için ışıklar ekle
        this.lights = {}
        
        // Noktasal ışık
        this.lights.point = new THREE.PointLight(0xffffff, 2, 30)
        this.lights.point.position.set(30, -25, 10) // Model pozisyonunun üzerinde
        this.lights.point.castShadow = true
        this.container.add(this.lights.point)
        
        // Spot ışık - modelin önüne odaklı
        this.lights.spot = new THREE.SpotLight(0xffffff, 1.5, 40, Math.PI * 0.25, 0.5, 0.5)
        this.lights.spot.position.set(30, -20, 10) // Modelin önünden, yukarıdan
        this.lights.spot.target.position.set(30, -25, 2) // Modelin merkezine bakıyor
        this.lights.spot.castShadow = true
        this.container.add(this.lights.spot)
        this.container.add(this.lights.spot.target)
        
        // Ortam ışığı
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.5)
        this.container.add(this.lights.ambient)
        
        // Debug ışık kontrolleri
        if(this.debug) {
            const lightsFolder = this.debugFolder.addFolder('lights')
            
            const pointFolder = lightsFolder.addFolder('point')
            pointFolder.add(this.lights.point, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointFolder.add(this.lights.point.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointFolder.add(this.lights.point.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointFolder.add(this.lights.point.position, 'z').min(0).max(20).step(0.1).name('positionZ')
            
            const spotFolder = lightsFolder.addFolder('spot')
            spotFolder.add(this.lights.spot, 'intensity').min(0).max(10).step(0.1).name('intensity')
            spotFolder.add(this.lights.spot.position, 'x').min(20).max(40).step(0.1).name('positionX')
            spotFolder.add(this.lights.spot.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            spotFolder.add(this.lights.spot.position, 'z').min(0).max(20).step(0.1).name('positionZ')
            
            const ambientFolder = lightsFolder.addFolder('ambient')
            ambientFolder.add(this.lights.ambient, 'intensity').min(0).max(2).step(0.1).name('intensity')
        }
    }
    
    update()
    {
        // Eğer animasyon ya da periyodik işlemler gerekirse buraya eklenebilir
        if(this.time && this.model && this.model.container) {
            // Örnek: this.model.container.rotation.y += 0.001 * this.time.delta
            // Şu an boş bırakıldı
        }
    }
} 