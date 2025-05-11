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
            // Göreceli konum (GreenBox'a bağlı olarak hesaplanacak)
            relativePosition: {
                x: 6,   // GreenBox'un 6 birim sağında
                y: -6,  // GreenBox'un 6 birim altında
                z: 2    // GreenBox'un 2 birim önünde
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
        
        // Görünmez küp koleksiyonu - GreenBox'a bağlı küpler
        this.connectedCubes = [];
        
        // Küp oluşturma ayarları
        this.cubeSettings = [
            {
                relativePosition: { x: 6, y: -6, z: 2 }, // GreenBox'un sağ alt köşesinde
                size: { x: 1.5, y: 1.5, z: 4 },
                color: '#ff0000',
                visible: false
            }
        ];
        
        this.setModel()
        this.setConnectedCubes() // Birden fazla bağlı küp eklemesi
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
        // Orijinal konumu kaydet
        this.collisionOffset = {
            x: 0.05, // GreenBox'a göre göreceli X konumu - küçültüldü
            y: 0.05, // GreenBox'a göre göreceli Y konumu - küçültüldü
            z: 1.2   // GreenBox'a göre göreceli Z konumu - küçültüldü
        }
        
        // Başlangıç konumunu ayarla
        this.collision.x = this.greenBox.x + this.collisionOffset.x
        this.collision.y = this.greenBox.y + this.collisionOffset.y
        this.collision.z = this.greenBox.z + this.collisionOffset.z
        
        // Çarpışma kutusu boyutları
        this.collisionSize = {
            x: 2.4,  // Çarpışma kutusu genişliği - küçültüldü
            y: 2.1,  // Çarpışma kutusu yüksekliği - küçültüldü
            z: 1.7   // Çarpışma kutusu derinliği - küçültüldü
        }
        
        // Ölçek faktörü - çarpışma kutusu için
        this.collisionScale = 1.2 // Çarpışma kutusu ölçek faktörü - küçültüldü
        
        // Duvar kalınlıkları
        this.wallThickness = {
            left: 0.1,   // Sol duvar kalınlığı (-x yönü) - küçültüldü
            top: 0.1,    // Üst duvar kalınlığı (+y yönü) - küçültüldü
            front: 0.05, // Ön duvar kalınlığı (-z yönü) - küçültüldü
            back: 0.05   // Arka duvar kalınlığı (+z yönü) - küçültüldü
        }
        
        // Çarpışma kutusunun görselliği için özellikler
        this.collisionVisuals = {
            visible: false,            // Çarpışma kutusunu görünmez yap
            opacity: 0.3,             // Yarı saydam yap
            color: '#ffff00',         // Sarı renk
            wireframe: true           // Tel kafes görünümü
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
            leftWall.name = "greenBox_leftWall"
            body.addShape(leftWall, new CANNON.Vec3(-hx, 0, 0))
            
            // +z yönündeki duvar (arka)
            const backWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.back
            ))
            backWall.name = "greenBox_backWall"
            body.addShape(backWall, new CANNON.Vec3(0, 0, hz))
            
            // -z yönündeki duvar (ön)
            const frontWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                hy, 
                this.wallThickness.front
            ))
            frontWall.name = "greenBox_frontWall"
            body.addShape(frontWall, new CANNON.Vec3(0, 0, -hz))
            
            // +y yönündeki duvar (üst) - kalınlaştırıldı
            const topWall = new CANNON.Box(new CANNON.Vec3(
                hx, 
                this.wallThickness.top, 
                hz
            ))
            topWall.name = "greenBox_topWall"
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
            }
            
            // Collision body'yi ayrı bir değişkende saklayalım, modele bağlamayalım
            this.collisionBody = body;
            
            // Çarpışma kutusu için görsel oluştur
            if (this.collisionVisuals.visible) {
                this.createCollisionVisuals(hx, hy, hz);
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
                
                // Çarpışma kutusu pozisyon kontrolü
                const collisionFolder = this.debugFolder.addFolder('collision position')
                collisionFolder.add(this.collisionOffset, 'x').step(0.1).name('collisionOffsetX').onChange(() => {
                    this.updatePositions()
                })
                collisionFolder.add(this.collisionOffset, 'y').step(0.1).name('collisionOffsetY').onChange(() => {
                    this.updatePositions()
                })
                collisionFolder.add(this.collisionOffset, 'z').step(0.1).name('collisionOffsetZ').onChange(() => {
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

                // Çarpışma kutusu görsellik kontrolleri
                const visualsFolder = this.debugFolder.addFolder('collision visuals')
                visualsFolder.add(this.collisionVisuals, 'visible').name('görünür').onChange(() => {
                    this.updateCollisionVisuals();
                })
                visualsFolder.addColor(this.collisionVisuals, 'color').name('renk').onChange(() => {
                    this.updateCollisionVisuals();
                })
                visualsFolder.add(this.collisionVisuals, 'opacity', 0, 1).step(0.1).name('saydamlık').onChange(() => {
                    this.updateCollisionVisuals();
                })
                visualsFolder.add(this.collisionVisuals, 'wireframe').name('tel kafes').onChange(() => {
                    this.updateCollisionVisuals();
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
        
        // Çarpışma kutusunun pozisyonunu GreenBox'a göre güncelle
        if (this.collisionBody) {
            // GreenBox'a göre göreceli konumu hesapla
            this.collision.x = this.greenBox.x + this.collisionOffset.x
            this.collision.y = this.greenBox.y + this.collisionOffset.y
            this.collision.z = this.greenBox.z + this.collisionOffset.z
            
            // Fizik nesnesinin pozisyonunu ayarla
            this.collisionBody.position.set(
                this.collision.x,
                this.collision.y,
                this.collision.z
            )
            
            // Görsel duvarların pozisyonunu da güncelle
            if (this.collisionMeshes && this.collisionMeshes.length > 0) {
                const hx = Math.abs(this.collisionSize.x) * this.collisionScale / 2;
                const hy = Math.abs(this.collisionSize.y) * this.collisionScale / 2;
                const hz = Math.abs(this.collisionSize.z) * this.collisionScale / 2;
                
                // Sol duvar
                this.collisionMeshes[0].position.set(
                    this.collision.x - hx, 
                    this.collision.y, 
                    this.collision.z
                );
                
                // Üst duvar
                this.collisionMeshes[1].position.set(
                    this.collision.x, 
                    this.collision.y + hy, 
                    this.collision.z
                );
                
                // Ön duvar
                this.collisionMeshes[2].position.set(
                    this.collision.x, 
                    this.collision.y, 
                    this.collision.z - hz
                );
                
                // Arka duvar
                this.collisionMeshes[3].position.set(
                    this.collision.x, 
                    this.collision.y, 
                    this.collision.z + hz
                );
            }
        }
        
        // Bağlı küplerin pozisyonlarını da güncelle
        this.updateAllCubePositions();
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
            
            // Görsel duvarların da boyutlarını güncelle
            if (this.collisionMeshes && this.collisionMeshes.length > 0) {
                // Eski mesh'leri kaldır
                this.collisionMeshes.forEach(mesh => {
                    this.container.remove(mesh);
                });
                
                // Yeni mesh'leri oluştur
                this.collisionMeshes = [];
                this.createCollisionVisuals(hx, hy, hz);
            }
        }
    }

    setConnectedCubes()
    {
        // Her küp ayarı için bir küp oluştur
        this.cubeSettings.forEach((settings, index) => {
            this.createConnectedCube(settings, index);
        });
        
        // Debug kontrollerini ekle
        if(this.debug)
        {
            const connectedCubesFolder = this.debugFolder.addFolder('Bağlantılı Küpler')
            
            this.cubeSettings.forEach((settings, index) => {
                const cubeFolder = connectedCubesFolder.addFolder(`Küp ${index + 1}`);
                
                // Göreceli pozisyon kontrolleri
                cubeFolder.add(settings.relativePosition, 'x', -20, 20).step(0.1).name('göreceli X').onChange(() => {
                    this.updateAllCubePositions();
                });
                cubeFolder.add(settings.relativePosition, 'y', -20, 20).step(0.1).name('göreceli Y').onChange(() => {
                    this.updateAllCubePositions();
                });
                cubeFolder.add(settings.relativePosition, 'z', -20, 20).step(0.1).name('göreceli Z').onChange(() => {
                    this.updateAllCubePositions();
                });
                
                // Boyut kontrolleri
                cubeFolder.add(settings.size, 'x', 0.1, 10).step(0.1).name('genişlik').onChange(() => {
                    this.updateCubeSize(index);
                });
                cubeFolder.add(settings.size, 'y', 0.1, 10).step(0.1).name('yükseklik').onChange(() => {
                    this.updateCubeSize(index);
                });
                cubeFolder.add(settings.size, 'z', 0.1, 10).step(0.1).name('derinlik').onChange(() => {
                    this.updateCubeSize(index);
                });
                
                // Renk kontrolü
                cubeFolder.addColor(settings, 'color').name('renk').onChange(() => {
                    if(this.connectedCubes[index] && this.connectedCubes[index].mesh && this.connectedCubes[index].mesh.material) {
                        this.connectedCubes[index].mesh.material.color.set(settings.color);
                    }
                });
                
                // Görünürlük kontrolü
                cubeFolder.add(settings, 'visible').name('görünür').onChange(() => {
                    this.updateCubeVisibility(index);
                });
            });
        }
        
        console.log("GreenBox'a bağlı küpler başarıyla eklendi");
    }
    
    createConnectedCube(settings, index)
    {
        // Küp için mesh oluştur
        const geometry = new THREE.BoxGeometry(
            settings.size.x,
            settings.size.y,
            settings.size.z
        );
        
        const material = new THREE.MeshStandardMaterial({
            color: settings.color,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: settings.visible ? 1.0 : 0.0
        });
        
        // Gerçek pozisyonu GreenBox'a göreceli olarak hesapla
        const absolutePosition = this.calculateAbsolutePosition(settings.relativePosition);
        
        // Mesh oluştur
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            absolutePosition.x,
            absolutePosition.y,
            absolutePosition.z
        );
        
        // Görünürlük ve gölge özelliklerini ayarla
        mesh.visible = settings.visible;
        mesh.castShadow = settings.visible;
        mesh.receiveShadow = settings.visible;
        
        // Container'a ekle
        this.container.add(mesh);
        
        // Küp için fizik gövdesi oluştur
        const body = new CANNON.Body({
            mass: 0, // Statik nesne
            position: new CANNON.Vec3(
                absolutePosition.x,
                absolutePosition.y,
                absolutePosition.z
            ),
            material: this.physics.materials.items.floor
        });
        
        // Küp için çarpışma şekli ekle
        const shape = new CANNON.Box(new CANNON.Vec3(
            settings.size.x / 2,
            settings.size.y / 2,
            settings.size.z / 2
        ));
        
        body.addShape(shape);
        
        // Fizik motoruna ekle
        this.physics.world.addBody(body);
        
        // Küpü koleksiyona ekle
        this.connectedCubes.push({
            settings: settings,
            mesh: mesh,
            body: body
        });
    }
    
    calculateAbsolutePosition(relativePosition)
    {
        // GreenBox'ın mevcut pozisyonuna göre mutlak pozisyonu hesapla
        return {
            x: this.greenBox.x + relativePosition.x,
            y: this.greenBox.y + relativePosition.y,
            z: this.greenBox.z + relativePosition.z
        };
    }
    
    updateAllCubePositions()
    {
        // Tüm küplerin pozisyonlarını güncelle
        this.connectedCubes.forEach((cube, index) => {
            const absolutePosition = this.calculateAbsolutePosition(this.cubeSettings[index].relativePosition);
            
            // Mesh pozisyonunu güncelle
            if(cube.mesh) {
                cube.mesh.position.set(
                    absolutePosition.x,
                    absolutePosition.y,
                    absolutePosition.z
                );
            }
            
            // Fizik gövdesini güncelle
            if(cube.body) {
                cube.body.position.set(
                    absolutePosition.x,
                    absolutePosition.y,
                    absolutePosition.z
                );
            }
        });
    }
    
    updateCubeSize(index)
    {
        const cube = this.connectedCubes[index];
        const settings = this.cubeSettings[index];
        
        if(!cube || !settings) return;
        
        // Mesh'i kaldır ve yeniden oluştur
        if(cube.mesh) {
            this.container.remove(cube.mesh);
            
            const geometry = new THREE.BoxGeometry(
                settings.size.x,
                settings.size.y,
                settings.size.z
            );
            
            const material = new THREE.MeshStandardMaterial({
                color: settings.color,
                metalness: 0.3,
                roughness: 0.4,
                transparent: true,
                opacity: settings.visible ? 1.0 : 0.0
            });
            
            const absolutePosition = this.calculateAbsolutePosition(settings.relativePosition);
            
            cube.mesh = new THREE.Mesh(geometry, material);
            cube.mesh.position.set(
                absolutePosition.x,
                absolutePosition.y,
                absolutePosition.z
            );
            
            // Görünürlük ayarı
            cube.mesh.visible = settings.visible;
            
            // Gölge özellikleri
            cube.mesh.castShadow = settings.visible;
            cube.mesh.receiveShadow = settings.visible;
            
            this.container.add(cube.mesh);
        }
        
        // Fizik gövdesini güncelle
        if(cube.body) {
            // Eski şekli temizle
            while(cube.body.shapes.length > 0) {
                cube.body.removeShape(cube.body.shapes[0]);
            }
            
            // Yeni şekil ekle
            const shape = new CANNON.Box(new CANNON.Vec3(
                settings.size.x / 2,
                settings.size.y / 2,
                settings.size.z / 2
            ));
            
            cube.body.addShape(shape);
        }
    }
    
    updateCubeVisibility(index)
    {
        const cube = this.connectedCubes[index];
        const settings = this.cubeSettings[index];
        
        if(!cube || !settings) return;
        
        // Görünürlük durumunu güncelle
        if(cube.mesh) {
            cube.mesh.visible = settings.visible;
            
            // Malzeme opasitesini güncelle
            if(cube.mesh.material) {
                cube.mesh.material.opacity = settings.visible ? 1.0 : 0.0;
            }
            
            // Gölge özelliklerini güncelle
            cube.mesh.castShadow = settings.visible;
            cube.mesh.receiveShadow = settings.visible;
        }
    }

    // Çarpışma kutusu görsellerini oluştur
    createCollisionVisuals(hx, hy, hz) {
        // Sol duvar
        this.createWallMesh(
            new THREE.Vector3(this.wallThickness.left, hy*2, hz*2),
            new THREE.Vector3(this.collision.x - hx, this.collision.y, this.collision.z),
            this.collisionVisuals.color
        );
        
        // Üst duvar
        this.createWallMesh(
            new THREE.Vector3(hx*2, this.wallThickness.top, hz*2),
            new THREE.Vector3(this.collision.x, this.collision.y + hy, this.collision.z),
            this.collisionVisuals.color
        );
        
        // Ön duvar
        this.createWallMesh(
            new THREE.Vector3(hx*2, hy*2, this.wallThickness.front),
            new THREE.Vector3(this.collision.x, this.collision.y, this.collision.z - hz),
            this.collisionVisuals.color
        );
        
        // Arka duvar
        this.createWallMesh(
            new THREE.Vector3(hx*2, hy*2, this.wallThickness.back),
            new THREE.Vector3(this.collision.x, this.collision.y, this.collision.z + hz),
            this.collisionVisuals.color
        );
    }
    
    // Duvar görsellerini oluşturmak için yardımcı fonksiyon
    createWallMesh(size, position, color) {
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: this.collisionVisuals.opacity,
            wireframe: this.collisionVisuals.wireframe,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        
        // Görünürlük ve gölge ayarları
        mesh.visible = this.collisionVisuals.visible;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        
        // Çarpışma görsellerini saklayalım
        if (!this.collisionMeshes) {
            this.collisionMeshes = [];
        }
        
        this.collisionMeshes.push(mesh);
        this.container.add(mesh);
        
        return mesh;
    }
    
    // Çarpışma kutusu görsellerini güncelle
    updateCollisionVisuals() {
        if (!this.collisionMeshes) return;
        
        this.collisionMeshes.forEach(mesh => {
            // Görünürlük ayarı
            mesh.visible = this.collisionVisuals.visible;
            
            // Materyal özellikleri
            if (mesh.material) {
                mesh.material.color.set(this.collisionVisuals.color);
                mesh.material.opacity = this.collisionVisuals.opacity;
                mesh.material.wireframe = this.collisionVisuals.wireframe;
            }
        });
    }
} 