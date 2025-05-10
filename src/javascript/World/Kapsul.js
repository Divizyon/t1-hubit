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
        
        // Ana noktasal ışık - üstten
        this.lights.pointTop = new THREE.PointLight(0xffffff, 2, 30)
        this.lights.pointTop.position.set(30, -15, 15)
        this.lights.pointTop.castShadow = true
        this.container.add(this.lights.pointTop)

        // Ön noktasal ışık
        this.lights.pointFront = new THREE.PointLight(0xffffff, 1.5, 25)
        this.lights.pointFront.position.set(45, -25, 2)
        this.lights.pointFront.castShadow = true
        this.container.add(this.lights.pointFront)

        // Arka noktasal ışık
        this.lights.pointBack = new THREE.PointLight(0xffffff, 1.5, 25)
        this.lights.pointBack.position.set(15, -25, 2)
        this.lights.pointBack.castShadow = true
        this.container.add(this.lights.pointBack)

        // Sağ noktasal ışık
        this.lights.pointRight = new THREE.PointLight(0xffffff, 1.5, 25)
        this.lights.pointRight.position.set(30, -15, 15)
        this.lights.pointRight.castShadow = true
        this.container.add(this.lights.pointRight)

        // Sol noktasal ışık
        this.lights.pointLeft = new THREE.PointLight(0xffffff, 1.5, 25)
        this.lights.pointLeft.position.set(30, -35, 15)
        this.lights.pointLeft.castShadow = true
        this.container.add(this.lights.pointLeft)
        
        // Spot ışıklar - farklı açılardan
        this.lights.spot1 = new THREE.SpotLight(0xffffff, 1, 40, Math.PI * 0.25, 0.5, 0.5)
        this.lights.spot1.position.set(30, -20, 15)
        this.lights.spot1.target.position.set(30, -25, 2)
        this.lights.spot1.castShadow = true
        this.container.add(this.lights.spot1)
        this.container.add(this.lights.spot1.target)

        this.lights.spot2 = new THREE.SpotLight(0xffffff, 1, 40, Math.PI * 0.25, 0.5, 0.5)
        this.lights.spot2.position.set(40, -25, 5)
        this.lights.spot2.target.position.set(30, -25, 2)
        this.lights.spot2.castShadow = true
        this.container.add(this.lights.spot2)
        this.container.add(this.lights.spot2.target)
        
        // Ortam ışığı - daha güçlü
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.8)
        this.container.add(this.lights.ambient)
        
        // Debug ışık kontrolleri
        if(this.debug) {
            const lightsFolder = this.debugFolder.addFolder('lights')
            
            const pointTopFolder = lightsFolder.addFolder('pointTop')
            pointTopFolder.add(this.lights.pointTop, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointTopFolder.add(this.lights.pointTop.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointTopFolder.add(this.lights.pointTop.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointTopFolder.add(this.lights.pointTop.position, 'z').min(0).max(20).step(0.1).name('positionZ')

            const pointFrontFolder = lightsFolder.addFolder('pointFront')
            pointFrontFolder.add(this.lights.pointFront, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointFrontFolder.add(this.lights.pointFront.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointFrontFolder.add(this.lights.pointFront.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointFrontFolder.add(this.lights.pointFront.position, 'z').min(0).max(20).step(0.1).name('positionZ')

            const pointBackFolder = lightsFolder.addFolder('pointBack')
            pointBackFolder.add(this.lights.pointBack, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointBackFolder.add(this.lights.pointBack.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointBackFolder.add(this.lights.pointBack.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointBackFolder.add(this.lights.pointBack.position, 'z').min(0).max(20).step(0.1).name('positionZ')

            const pointRightFolder = lightsFolder.addFolder('pointRight')
            pointRightFolder.add(this.lights.pointRight, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointRightFolder.add(this.lights.pointRight.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointRightFolder.add(this.lights.pointRight.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointRightFolder.add(this.lights.pointRight.position, 'z').min(0).max(20).step(0.1).name('positionZ')

            const pointLeftFolder = lightsFolder.addFolder('pointLeft')
            pointLeftFolder.add(this.lights.pointLeft, 'intensity').min(0).max(10).step(0.1).name('intensity')
            pointLeftFolder.add(this.lights.pointLeft.position, 'x').min(20).max(40).step(0.1).name('positionX')
            pointLeftFolder.add(this.lights.pointLeft.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            pointLeftFolder.add(this.lights.pointLeft.position, 'z').min(0).max(20).step(0.1).name('positionZ')
            
            const spot1Folder = lightsFolder.addFolder('spot1')
            spot1Folder.add(this.lights.spot1, 'intensity').min(0).max(10).step(0.1).name('intensity')
            spot1Folder.add(this.lights.spot1.position, 'x').min(20).max(40).step(0.1).name('positionX')
            spot1Folder.add(this.lights.spot1.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            spot1Folder.add(this.lights.spot1.position, 'z').min(0).max(20).step(0.1).name('positionZ')
            
            const spot2Folder = lightsFolder.addFolder('spot2')
            spot2Folder.add(this.lights.spot2, 'intensity').min(0).max(10).step(0.1).name('intensity')
            spot2Folder.add(this.lights.spot2.position, 'x').min(20).max(40).step(0.1).name('positionX')
            spot2Folder.add(this.lights.spot2.position, 'y').min(-35).max(-15).step(0.1).name('positionY')
            spot2Folder.add(this.lights.spot2.position, 'z').min(0).max(20).step(0.1).name('positionZ')
            
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