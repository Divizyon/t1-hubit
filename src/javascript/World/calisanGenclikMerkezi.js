import * as THREE from 'three'

export default class CalisanGenclikMerkezi {
    constructor(_options) {
        this.resources = _options.resources
        this.objects = _options.objects
        this.shadows = _options.shadows
        this.debug = _options.debug
        this.areas = _options.areas // Alanlar için erişim ekle
        this.scene = _options.scene // Sahne referansı ekle
        
        // Debug
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('calisanGenclikMerkezi')
        }

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
        
        // Etkileşim alanını ekle
        if (this.areas) {
            this.setCalisanGenclikInteraction()
        }
    }

    setModel() {
        console.log('Loading CalisanGenclikMerkezi model...')

        if (!this.resources.items) {
            console.error('Resources items not initialized')
            return
        }

        if (!this.resources.items.calisanGenclikMerkezi) {
            console.error('CalisanGenclikMerkezi model not found in resources')
            console.log('Available resources:', Object.keys(this.resources.items))
            return
        }
       
        // Create the model using objects.add() which returns a structured object
        // with container, collision and other properties
        this.model = this.objects.add({
            base: this.resources.items.calisanGenclikMerkezi.scene,
            collision: { children: [] }, // Empty collision object, can be passed through
            offset: new THREE.Vector3(63, -32, 0),
            rotation: new THREE.Euler(0, 0, 0),
            shadow: { sizeX: 3, sizeY: 3, offsetZ: -0.6, alpha: 0.4 },
            mass: 0,
            sleep: true
        })

        this.container.add(this.model.container)
        console.log('CalisanGenclikMerkezi model created')
 
        // Debug
        if (this.debug && this.model && this.model.container) {
            this.debugFolder
                .add(this.model.container.position, 'x')
                .name('positionX')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'y')
                .name('positionY')
                .min(-50)
                .max(50)
                .step(0.1)

            this.debugFolder
                .add(this.model.container.position, 'z')
                .name('positionZ')
                .min(-50)
                .max(50)
                .step(0.1)
        }
    }
    
    // Etkileşim alanı oluşturma
    setCalisanGenclikInteraction() {
        try {
            if (!this.areas) {
                console.error("Çalışan Gençlik Merkezi etkileşim alanı eklenirken hata: areas objesi bulunamadı!")
                return
            }

            // Etkileşim alanı oluştur
            this.calisanGenclikArea = this.areas.add({
                position: new THREE.Vector2(68, -32), // Model pozisyonunun yakınında
                halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
            })

            // Etkileşim fonksiyonunu tanımla
            this.calisanGenclikArea.on("interact", () => {
                // PopUpModule tarafından yönetileceği için sadece log mesajı
                console.log("Çalışan Gençlik Merkezi etkileşimi: PopUpModule tarafından yönetilecek")
            })
            
            console.log("Çalışan Gençlik Merkezi etkileşim alanı başarıyla eklendi")
        } catch (error) {
            console.error("Çalışan Gençlik Merkezi etkileşim alanı eklenirken hata oluştu:", error)
        }
    }
} 
