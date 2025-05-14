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
        
        this.setModel()
    }

    setModel()
    {
        // Model için konum ve boyut
        this.greenBox = {}
        this.greenBox.x = -60 // X konumu
        this.greenBox.y = 6 // Y konumu
        this.greenBox.z = 0  // Z konumu
        
        // Model için boyut (ölçek)
        this.modelSize = {
            x: 1.0, // Varsayılan model ölçeği X
            y: 1.0, // Varsayılan model ölçeği Y
            z: 1.0  // Varsayılan model ölçeği Z
        }
        
        // Pozisyon bilgileri - Asıl model pozisyonu
        const posizyonX = this.greenBox.x
        const posizyonY = this.greenBox.y
        const posizyonZ = this.greenBox.z

        // Check if resources and greenBoxBase exist
        if (
            this.resources &&
            this.resources.items &&
            this.resources.items.greenBoxBase &&
            this.resources.items.greenBoxBase.scene
        ) {
            // Add the greenBox - Model pozisyonunda
            this.greenBoxObject = this.objects.add({
                base: this.resources.items.greenBoxBase.scene,
                collision: null,
                offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ), // Model pozisyonu
                rotation: new THREE.Euler(0, 0, 0.5),
                duplicated: true,
                shadow: { 
                    sizeX: 0, 
                    sizeY: 0, 
                    offsetZ: -0.15, 
                    alpha: 0.5 
                },
                mass: 0,
                soundName: "brick",
            })
            
            // Model ölçeğini ayarla ve mesh'lere isim ver
            if (this.greenBoxObject && this.greenBoxObject.container) {
                this.greenBoxObject.container.scale.set(
                    this.modelSize.x, 
                    this.modelSize.y, 
                    this.modelSize.z
                );
                
                // Ana model mesh'ine isim ver
                this.greenBoxObject.container.name = "greenBox_mainModel"
                
                // Alt mesh'lere isim ver
                this.greenBoxObject.container.traverse((child) => {
                    if (child.isMesh) {
                        child.name = `greenBox_${child.name || 'mesh'}`
                    }
                })
                
                // Çarpışma kutularını ekle
                this.addCollisions(this.greenBoxObject.container)
            }
            
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
            }

            console.log("Green Box modeli başarıyla eklendi")
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
    }
    
    addCollisions(model) {
        // Bounding box hesapla
        model.updateMatrixWorld(true)
        const bbox = new THREE.Box3().setFromObject(model)
        const size = bbox.getSize(new THREE.Vector3())
        
        // GreenBox'un pozisyonuna göre çarpışma kutuları
        // İlk çarpışma kutusu
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-3, this.greenBox.y+1.9, this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.5, 2.5, 2),
           
        )
        
        // İkinci çarpışma kutusu
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-0.7 , this.greenBox.y+5 , this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(3, 0.5, 1.5),
           
        )
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x-1.2 , this.greenBox.y-2.5 , this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.8, 0.6, 1.5),
              
        )
        this.addCollisionBox(
            new THREE.Vector3(this.greenBox.x+3.2 , this.greenBox.y-1.6 , this.greenBox.z),
            new THREE.Euler(0, 0, 0),
            new CANNON.Vec3(0.7, 0.7, 1.5),
        )
    }
    
    addCollisionBox(position, rotation, halfExtents, color) {
        // Fizik gövdesi oluştur
        const boxShape = new CANNON.Box(halfExtents)

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y-1, position.z),
            material: this.physics.materials.items.floor
        })

        // Dönüşü quaternion olarak ayarla
        const quat = new CANNON.Quaternion()
        quat.setFromEuler(rotation.x, rotation.y, rotation.z, 'XYZ')
        body.quaternion.copy(quat)

        body.addShape(boxShape)
        this.physics.world.addBody(body)

        console.log("GreenBox için collision eklendi:", body)
       
    }
    
    visualizeCollisionBox(position, rotation, halfExtents, color) {
        // Çarpışma kutusunun görsel temsilini oluştur
        const geometry = new THREE.BoxGeometry(
            halfExtents.x * 2, 
            halfExtents.y * 2, 
            halfExtents.z * 2
        )
        
        // Yarı saydam malzeme 
        const material = new THREE.MeshBasicMaterial({ 
            color: color,  // Parametre olarak gelen renk
            transparent: true, 
            opacity: 0.3,    
            wireframe: true,  // Tel kafes görünümü
            wireframeLinewidth: 2
        })
        
        const collisionMesh = new THREE.Mesh(geometry, material)
        
        // Pozisyonu ve rotasyonu ayarla
        collisionMesh.position.copy(position)
        collisionMesh.rotation.copy(rotation)
        
        // Sahneye ekle
        this.container.add(collisionMesh)
    }
} 