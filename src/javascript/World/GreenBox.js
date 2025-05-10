import * as THREE from 'three'
import CANNON from 'cannon'

export default class GreenBox
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
        this.camera = _options.camera
        
        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = true

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('greenBox')
            this.debugFolder.open()
        }
        
        // Kullanıcı tarafından ayarlanabilecek görünür küp değerleri
        this.visibleCubeSettings = {
            // Konum değerleri - kolayca değiştirilebilir
            position: {
                x: 36, // GreenBox'un sağında
                y: 4, // Aynı yükseklikte
                z: 2   // Aynı z konumunda
            },
            // Boyut değerleri - kolayca değiştirilebilir
            size: {
                x: 1.5,
                y: 1.5,
                z: 4
            },
            // Renk değeri - kolayca değiştirilebilir
            color: '#ff0000', // Kırmızı renk
            // Görünürlük ayarı
            visible: false // Görünmez
        }
        
        this.setModel()
        this.setVisibleCube() // Görünür küp eklemesi
    }

    setModel()
    {
        // Model için konum ve boyut
        this.greenBox = {}
        this.greenBox.x = 30 // X konumu
        this.greenBox.y = 10 // Y konumu
        this.greenBox.z = 0  // Z konumu
        
        // Model için boyut (ölçek)
        this.modelSize = {
            x: 1.0, // Varsayılan model ölçeği X
            y: 1.0, // Varsayılan model ölçeği Y
            z: 1.0  // Varsayılan model ölçeği Z
        }

        // Çarpışma kutusu için ayrı konum ve boyut
        this.collision = {}
        this.collision.x = 30.1 // X konumu
        this.collision.y = 10.1 // Y konumu
        this.collision.z = 2.4  // Z konumu
        
        // Çarpışma kutusu boyutları
        this.collisionSize = {
            x: 4.8,  // Çarpışma kutusu genişliği
            y: 4.2,  // Çarpışma kutusu yüksekliği
            z: 3.4   // Çarpışma kutusu derinliği
        }
        
        // Ölçek faktörü - çarpışma kutusu için
        this.collisionScale = 1.4 // Çarpışma kutusu ölçek faktörü
        
        // Duvar kalınlıkları
        this.wallThickness = {
            left: 0.2,   // Sol duvar kalınlığı (-x yönü) - kalınlaştırıldı
            top: 0.2,    // Üst duvar kalınlığı (+y yönü) - kalınlaştırıldı
            front: 0.1,  // Ön duvar kalınlığı (-z yönü)
            back: 0.1    // Arka duvar kalınlığı (+z yönü)
        }
        
        // Pozisyon bilgileri - Asıl model pozisyonu
        const posizyonX = this.greenBox.x
        const posizyonY = this.greenBox.y
        const posizyonZ = this.greenBox.z
        
        // Çarpışma kutusu için pozisyon bilgileri
        const collisionX = this.collision.x
        const collisionY = this.collision.y
        const collisionZ = this.collision.z

        // Check if resources and greenBoxBase exist
        if (
            this.resources &&
            this.resources.items &&
            this.resources.items.greenBoxBase &&
            this.resources.items.greenBoxBase.scene
        ) {
            // Ana fizik gövdesi yerine, sadece belirli yüzeyler için şekiller oluşturacağız
            const body = new CANNON.Body({
                mass: 0,  // Statik nesne
                position: new CANNON.Vec3(collisionX, collisionY, collisionZ), // Çarpışma kutusu pozisyonu
                material: this.physics.materials.items.floor
            })
            
            // Boyutları hesapla
            const hx = Math.abs(this.collisionSize.x) * this.collisionScale / 2
            const hy = Math.abs(this.collisionSize.y) * this.collisionScale / 2
            const hz = Math.abs(this.collisionSize.z) * this.collisionScale / 2
            
            // -x yönündeki duvar (sol) - kalınlaştırıldı
            const leftWall = new CANNON.Box(new CANNON.Vec3(
                this.wallThickness.left, 
                hy, 
                hz
            ))
            body.addShape(leftWall, new CANNON.Vec3(-hx, 0, 0))
            
            // +z yönündeki duvar (arka)
            const backWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.back
            ))
            body.addShape(backWall, new CANNON.Vec3(0, 0, hz))
            
            // -z yönündeki duvar (ön)
            const frontWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.front
            ))
            body.addShape(frontWall, new CANNON.Vec3(0, 0, -hz))
            
            // +y yönündeki duvar (üst) - kalınlaştırıldı
            const topWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                this.wallThickness.top, 
                hz
            ))
            body.addShape(topWall, new CANNON.Vec3(0, hy, 0))
            
            // NOT: +x (sağ), -y (alt) ve taban duvarları eklemedik, böylece o yönlerden girebiliriz
            
            // Collision Eklemek İçin
            this.physics.world.addBody(body)

            // Add the greenBox - Model pozisyonunda
            this.greenBoxObject = this.objects.add({
                base: this.resources.items.greenBoxBase.scene,
                collision: null, // Fiziksel çarpışmayı kendimiz yönetiyoruz
                offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ), // Model pozisyonu
                rotation: new THREE.Euler(0, 0, 0),
                duplicated: true,
                shadow: { 
                    sizeX: this.collisionSize.x, 
                    sizeY: this.collisionSize.y, 
                    offsetZ: -0.15, 
                    alpha: 0.5 
                },
                mass: 0,
                soundName: "brick",
            })
            
            // Model ölçeğini ayarla
            if (this.greenBoxObject && this.greenBoxObject.container) {
                this.greenBoxObject.container.scale.set(
                    this.modelSize.x, 
                    this.modelSize.y, 
                    this.modelSize.z
                );
            }
            
            // Collision body'yi ayrı bir değişkende saklayalım, modele bağlamayalım
            this.collisionBody = body;
            
            // Debug kontrollerini ekle
            if (this.debug) {
                // GreenBox pozisyon kontrolü
                const modelFolder = this.debugFolder.addFolder('model position')
                modelFolder.add(this.greenBox, 'x').step(0.1).name('modelX').onChange(() => {
                    this.updatePositions()
                })
                modelFolder.add(this.greenBox, 'y').step(0.1).name('modelY').onChange(() => {
                    this.updatePositions()
                })
                modelFolder.add(this.greenBox, 'z').step(0.1).name('modelZ').onChange(() => {
                    this.updatePositions()
                })
                
                // Model boyut kontrolü
                const modelSizeFolder = this.debugFolder.addFolder('model size')
                modelSizeFolder.add(this.modelSize, 'x', 0.1, 5).step(0.1).name('scaleX').onChange(() => {
                    this.updateSizes()
                })
                modelSizeFolder.add(this.modelSize, 'y', 0.1, 5).step(0.1).name('scaleY').onChange(() => {
                    this.updateSizes()
                })
                modelSizeFolder.add(this.modelSize, 'z', 0.1, 5).step(0.1).name('scaleZ').onChange(() => {
                    this.updateSizes()
                })
                
                // Çarpışma kutusu pozisyon kontrolü
                const collisionFolder = this.debugFolder.addFolder('collision position')
                collisionFolder.add(this.collision, 'x').step(0.1).name('collisionX').onChange(() => {
                    this.updatePositions()
                })
                collisionFolder.add(this.collision, 'y').step(0.1).name('collisionY').onChange(() => {
                    this.updatePositions()
                })
                collisionFolder.add(this.collision, 'z').step(0.1).name('collisionZ').onChange(() => {
                    this.updatePositions()
                })
                
                // Çarpışma kutusu boyut kontrolü
                const collisionSizeFolder = this.debugFolder.addFolder('collision size')
                collisionSizeFolder.add(this.collisionSize, 'x', 0.1, 10).step(0.1).name('width').onChange(() => {
                    this.updateSizes()
                })
                collisionSizeFolder.add(this.collisionSize, 'y', 0.1, 10).step(0.1).name('height').onChange(() => {
                    this.updateSizes()
                })
                collisionSizeFolder.add(this.collisionSize, 'z', 0.1, 10).step(0.1).name('depth').onChange(() => {
                    this.updateSizes()
                })
                collisionSizeFolder.add(this, 'collisionScale', 0.5, 3).step(0.1).name('scaleFactor').onChange(() => {
                    this.updateSizes()
                })
                
                // Duvar kalınlık kontrolü
                const wallThicknessFolder = this.debugFolder.addFolder('wall thickness')
                wallThicknessFolder.add(this.wallThickness, 'left', 0.1, 1).step(0.1).name('sol duvar').onChange(() => {
                    this.updateSizes()
                })
                wallThicknessFolder.add(this.wallThickness, 'top', 0.1, 1).step(0.1).name('üst duvar').onChange(() => {
                    this.updateSizes()
                })
                wallThicknessFolder.add(this.wallThickness, 'front', 0.1, 1).step(0.1).name('ön duvar').onChange(() => {
                    this.updateSizes()
                })
                wallThicknessFolder.add(this.wallThickness, 'back', 0.1, 1).step(0.1).name('arka duvar').onChange(() => {
                    this.updateSizes()
                })
            }

            console.log("Green Box modeli ve görünmez çarpışma duvarları başarıyla eklendi (sol ve üst duvarlar kalınlaştırıldı)")
        } else {
            console.error("Green Box modeli yüklenemedi veya bulunamadı!")
        }
    }
    
    updatePositions()
    {
        // Model pozisyonunu güncelle
        if(this.greenBoxObject && this.greenBoxObject.container)
        {
            this.greenBoxObject.container.position.x = this.greenBox.x
            this.greenBoxObject.container.position.y = this.greenBox.y
            this.greenBoxObject.container.position.z = this.greenBox.z
        }
        
        // Çarpışma kutusunun pozisyonunu güncelle (fiziksel)
        if (this.collisionBody) {
            this.collisionBody.position.set(
                this.collision.x,
                this.collision.y,
                this.collision.z
            )
        }
    }
    
    updateSizes()
    {
        // Model ölçeğini güncelle
        if(this.greenBoxObject && this.greenBoxObject.container)
        {
            this.greenBoxObject.container.scale.set(
                this.modelSize.x, 
                this.modelSize.y, 
                this.modelSize.z
            )
        }
        
        // Fizik gövdesinin de boyutlarını güncelle
        if (this.collisionBody) {
            // Eski şekli temizle
            while (this.collisionBody.shapes.length > 0) {
                this.collisionBody.removeShape(this.collisionBody.shapes[0])
            }
            
            // Boyutları hesapla
            const hx = Math.abs(this.collisionSize.x) * this.collisionScale / 2
            const hy = Math.abs(this.collisionSize.y) * this.collisionScale / 2
            const hz = Math.abs(this.collisionSize.z) * this.collisionScale / 2
            
            // -x yönündeki duvar (sol) - kalınlaştırıldı
            const leftWall = new CANNON.Box(new CANNON.Vec3(
                this.wallThickness.left, 
                hy, 
                hz
            ))
            this.collisionBody.addShape(leftWall, new CANNON.Vec3(-hx, 0, 0))
            
            // +z yönündeki duvar (arka)
            const backWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.back
            ))
            this.collisionBody.addShape(backWall, new CANNON.Vec3(0, 0, hz))
            
            // -z yönündeki duvar (ön)
            const frontWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.front
            ))
            this.collisionBody.addShape(frontWall, new CANNON.Vec3(0, 0, -hz))
            
            // +y yönündeki duvar (üst) - kalınlaştırıldı
            const topWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                this.wallThickness.top, 
                hz
            ))
            this.collisionBody.addShape(topWall, new CANNON.Vec3(0, hy, 0))
            
            // NOT: +x (sağ), -y (alt) ve taban duvarları eklemiyoruz
        }
    }

    setVisibleCube()
    {
        // Görünür küp için THREE.js geometri ve materyal oluştur
        const geometry = new THREE.BoxGeometry(
            this.visibleCubeSettings.size.x,
            this.visibleCubeSettings.size.y,
            this.visibleCubeSettings.size.z
        )
        
        const material = new THREE.MeshStandardMaterial({
            color: this.visibleCubeSettings.color,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true, // Transparanlık özelliğini aktif et
            opacity: this.visibleCubeSettings.visible ? 1.0 : 0.0 // Görünür değilse tamamen şeffaf
        })
        
        // Mesh oluştur ve sahneye ekle
        this.visibleCubeMesh = new THREE.Mesh(geometry, material)
        this.visibleCubeMesh.position.set(
            this.visibleCubeSettings.position.x,
            this.visibleCubeSettings.position.y,
            this.visibleCubeSettings.position.z
        )
        
        // Görünürlük ayarı
        this.visibleCubeMesh.visible = this.visibleCubeSettings.visible
        
        // Gölge özellikleri (görünmez ise gölge de görünmez)
        this.visibleCubeMesh.castShadow = this.visibleCubeSettings.visible
        this.visibleCubeMesh.receiveShadow = this.visibleCubeSettings.visible
        
        // Container'a ekle
        this.container.add(this.visibleCubeMesh)
        
        // Küp için fizik gövdesi oluştur (Çarpışma özellikleri korunuyor)
        this.visibleCubeBody = new CANNON.Body({
            mass: 0, // Statik nesne
            position: new CANNON.Vec3(
                this.visibleCubeSettings.position.x,
                this.visibleCubeSettings.position.y,
                this.visibleCubeSettings.position.z
            ),
            material: this.physics.materials.items.floor
        })
        
        // Küp için çarpışma şekli ekle
        const shape = new CANNON.Box(new CANNON.Vec3(
            this.visibleCubeSettings.size.x / 2,
            this.visibleCubeSettings.size.y / 2,
            this.visibleCubeSettings.size.z / 2
        ))
        
        this.visibleCubeBody.addShape(shape)
        
        // Fizik motoruna ekle
        this.physics.world.addBody(this.visibleCubeBody)
        
        // Debug kontrollerini ekle
        if(this.debug)
        {
            const cubeFolder = this.debugFolder.addFolder('görünmez küp')
            
            // Pozisyon kontrolleri
            cubeFolder.add(this.visibleCubeSettings.position, 'x').step(0.1).name('küpX').onChange(() => {
                this.updateCubePosition()
            })
            cubeFolder.add(this.visibleCubeSettings.position, 'y').step(0.1).name('küpY').onChange(() => {
                this.updateCubePosition()
            })
            cubeFolder.add(this.visibleCubeSettings.position, 'z').step(0.1).name('küpZ').onChange(() => {
                this.updateCubePosition()
            })
            
            // Boyut kontrolleri
            cubeFolder.add(this.visibleCubeSettings.size, 'x', 0.1, 10).step(0.1).name('genişlik').onChange(() => {
                this.updateCubeSize()
            })
            cubeFolder.add(this.visibleCubeSettings.size, 'y', 0.1, 10).step(0.1).name('yükseklik').onChange(() => {
                this.updateCubeSize()
            })
            cubeFolder.add(this.visibleCubeSettings.size, 'z', 0.1, 10).step(0.1).name('derinlik').onChange(() => {
                this.updateCubeSize()
            })
            
            // Renk kontrolü
            cubeFolder.addColor(this.visibleCubeSettings, 'color').name('renk').onChange(() => {
                if(this.visibleCubeMesh && this.visibleCubeMesh.material) {
                    this.visibleCubeMesh.material.color.set(this.visibleCubeSettings.color)
                }
            })
            
            // Görünürlük kontrolü
            cubeFolder.add(this.visibleCubeSettings, 'visible').name('görünür').onChange(() => {
                this.updateCubeVisibility()
            })
        }
        
        console.log("Görünmez küp ve çarpışma kutusu başarıyla eklendi")
    }
    
    updateCubePosition()
    {
        // Mesh pozisyonunu güncelle
        if(this.visibleCubeMesh)
        {
            this.visibleCubeMesh.position.x = this.visibleCubeSettings.position.x
            this.visibleCubeMesh.position.y = this.visibleCubeSettings.position.y
            this.visibleCubeMesh.position.z = this.visibleCubeSettings.position.z
        }
        
        // Fizik gövdesini güncelle
        if(this.visibleCubeBody)
        {
            this.visibleCubeBody.position.set(
                this.visibleCubeSettings.position.x,
                this.visibleCubeSettings.position.y,
                this.visibleCubeSettings.position.z
            )
        }
    }
    
    updateCubeSize()
    {
        // Mesh'i kaldır ve yeniden oluştur
        if(this.visibleCubeMesh)
        {
            this.container.remove(this.visibleCubeMesh)
            
            const geometry = new THREE.BoxGeometry(
                this.visibleCubeSettings.size.x,
                this.visibleCubeSettings.size.y,
                this.visibleCubeSettings.size.z
            )
            
            const material = new THREE.MeshStandardMaterial({
                color: this.visibleCubeSettings.color,
                metalness: 0.3,
                roughness: 0.4,
                transparent: true,
                opacity: this.visibleCubeSettings.visible ? 1.0 : 0.0
            })
            
            this.visibleCubeMesh = new THREE.Mesh(geometry, material)
            this.visibleCubeMesh.position.set(
                this.visibleCubeSettings.position.x,
                this.visibleCubeSettings.position.y,
                this.visibleCubeSettings.position.z
            )
            
            // Görünürlük ayarı
            this.visibleCubeMesh.visible = this.visibleCubeSettings.visible
            
            // Gölge özellikleri
            this.visibleCubeMesh.castShadow = this.visibleCubeSettings.visible
            this.visibleCubeMesh.receiveShadow = this.visibleCubeSettings.visible
            
            this.container.add(this.visibleCubeMesh)
        }
        
        // Fizik gövdesini güncelle
        if(this.visibleCubeBody)
        {
            // Eski şekli temizle
            while(this.visibleCubeBody.shapes.length > 0)
            {
                this.visibleCubeBody.removeShape(this.visibleCubeBody.shapes[0])
            }
            
            // Yeni şekil ekle
            const shape = new CANNON.Box(new CANNON.Vec3(
                this.visibleCubeSettings.size.x / 2,
                this.visibleCubeSettings.size.y / 2,
                this.visibleCubeSettings.size.z / 2
            ))
            
            this.visibleCubeBody.addShape(shape)
        }
    }
    
    updateCubeVisibility()
    {
        // Görünürlük durumunu güncelle
        if(this.visibleCubeMesh)
        {
            this.visibleCubeMesh.visible = this.visibleCubeSettings.visible
            
            // Malzeme opasitesini güncelle
            if(this.visibleCubeMesh.material) {
                this.visibleCubeMesh.material.opacity = this.visibleCubeSettings.visible ? 1.0 : 0.0
            }
            
            // Gölge özelliklerini güncelle
            this.visibleCubeMesh.castShadow = this.visibleCubeSettings.visible
            this.visibleCubeMesh.receiveShadow = this.visibleCubeSettings.visible
        }
    }
} 