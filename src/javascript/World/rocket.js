import * as THREE from 'three'

export default class rocket {
    constructor(_options) {
        // Options
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.physics = _options.physics
        this.container = _options.container
        this.debug = _options.debug
        this.sounds = _options.sounds // Ses sistemini ekle

        // Properties
        this.rocketLaunchClickCount = 0
        this.rocketIsFlying = false
        this.rocketLandingInterval = null
        this.rocketDescentInterval = null
        this.rocketLastMaxVelocity = 0 // Fırlatmada ulaşılan maksimum hız
        this.isInteractionEnabled = true // Etkileşimin etkin olup olmadığını kontrol eden yeni değişken
        this.initialPosition = null // Roketin başlangıç pozisyonunu saklamak için
        this.isLandingComplete = true // İniş tamamlandı mı
        this.landingDelayTimeout = null // İniş sonrası bekleme süresi için timeout

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        this.setModel()
    }

    createButtonTexture(text) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = 256
        canvas.height = 64
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = 'white'
        context.font = 'bold 60px Arial'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(text, canvas.width / 2, canvas.height / 2)
        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }

    freezeRocketInAir(body) {
        if (this.rocketLandingInterval) clearInterval(this.rocketLandingInterval)
        this.rocketLandingInterval = setInterval(() => {
            if (this.rocketIsFlying) {
                // Sadece z eksenindeki hareketi sıfırla, x ve y'yi başlangıç konumuna sabitle
                body.velocity.set(0, 0, 0)
                if (this.initialPosition) {
                    body.position.x = this.initialPosition.x
                    body.position.y = this.initialPosition.y
                }
                body.position.z = Math.max(body.position.z, 10) // 10 birim yukarıda sabitleniyor
            }
        }, 50)
        
        // Roket yukarıda durduktan sonra etkileşimi tekrar etkinleştir
        setTimeout(() => {
            this.isInteractionEnabled = true
            this.rocketAreaLabelMesh.material.opacity = 1.0 // Buton görünürlüğünü geri getir
        }, 2100) // Roketin yukarı çıkış süresi 2000 ms, biraz fazla bekliyoruz
    }

    landRocket(body) {
        this.isLandingComplete = false // İniş başladı, henüz tamamlanmadı
        
        if (this.rocketLandingInterval) {
            clearInterval(this.rocketLandingInterval)
            this.rocketLandingInterval = null
        }
        if (this.rocketDescentInterval) {
            clearInterval(this.rocketDescentInterval)
            this.rocketDescentInterval = null
        }
        // İniş sonrası bekleme timeout'u iptal et (eğer varsa)
        if (this.landingDelayTimeout) {
            clearTimeout(this.landingDelayTimeout)
            this.landingDelayTimeout = null
        }
        
        body.angularVelocity.set(0, 0, 0)
        // Düz iniş animasyonu
        const targetZ = this.initialPosition ? this.initialPosition.z : 0.5
        const descentSpeed = -Math.abs(this.rocketLastMaxVelocity) * 0.6 || -2 // Maksimum çıkış hızının %60'ı, yoksa -2
        
        // İniş tamamlandığında etkileşimi tekrar etkinleştir
        const estimatedDescentTime = (body.position.z - targetZ) / Math.abs(descentSpeed) * 1000
        
        this.rocketDescentInterval = setInterval(() => {
            const currentZ = body.position.z
            
            // Sadece z ekseninde hareket et, x ve y'yi başlangıç konumuna sabitle
            if (this.initialPosition) {
                body.position.x = this.initialPosition.x
                body.position.y = this.initialPosition.y
            }
            
            if (currentZ <= targetZ + 0.05) {
                // İniş tamamlandı, başlangıç konumuna ayarla
                if (this.initialPosition) {
                    body.position.copy(this.initialPosition)
                } else {
                    body.position.set(body.position.x, body.position.y, targetZ)
                }
                
                body.velocity.set(0, 0, 0)
                clearInterval(this.rocketDescentInterval)
                this.rocketDescentInterval = null
                
                // İniş tamamlandı, ama etkileşimi hemen değil 1 saniye sonra etkinleştir
                this.isLandingComplete = true
                this.rocketAreaLabelMesh.material.opacity = 0.5 // Buton yarı saydam
                
                // 1 saniye sonra etkileşimi etkinleştir
                this.landingDelayTimeout = setTimeout(() => {
                    this.isInteractionEnabled = true
                    this.rocketAreaLabelMesh.material.opacity = 1.0 // Buton görünürlüğünü geri getir
                }, 1000) // 1 saniye beklet
            } else {
                // Sadece z ekseninde hareket et
                body.velocity.set(0, 0, descentSpeed)
            }
        }, 50)
    }

    setModel() {
        // Platform ve roket için ortak koordinatlar ve yükseklikler
        const platformX = 43
        const platformY = 19
        const platformZ = 0
        const platformHeight = 1 // Platformun yüksekliği (gerekirse ayarlanabilir)

        // Roket modelini ekle (otomatik bounding box ortalama kaldırıldı, sabit offset kullanılıyor)
        const rocketOffsetX = platformX - 0.8 // 1 birim sola kaydır
        const rocketOffsetY = platformY - 0.5 // 1 birim sana doğru yaklaştır

        this.model = this.objects.add({
            base: this.resources.items.roketModel.scene,
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(rocketOffsetX, rocketOffsetY, platformZ + platformHeight),
            rotation: new THREE.Euler(0, 0, 5),
            shadow: { sizeX: 1.5, sizeY: 1.5, offsetZ: -0.6, alpha: 0.4 },
            mass: 1.5,
            soundName: "brick",
            sleep: false,
        })

        // Roketin başlangıç konumunu kaydet
        if (this.model && this.model.collision && this.model.collision.body) {
            this.initialPosition = this.model.collision.body.position.clone()
        }

        // Add to container
        this.container.add(this.model.container)

        // areaLabelMesh'i oluştur ve sahneye ekle
        this.rocketAreaLabelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                color: 0xffffff,
                alphaMap: this.createButtonTexture('LAUNCH'),
            })
        )
        this.rocketAreaLabelMesh.position.set(40, 19, 0)
        this.rocketAreaLabelMesh.matrixAutoUpdate = false
        this.rocketAreaLabelMesh.updateMatrix()
        this.container.add(this.rocketAreaLabelMesh)

        // Enter etkileşimi için area ekle
        this.rocketArea = this.areas.add({
            position: new THREE.Vector2(39.6, 19),
            halfExtents: new THREE.Vector2(2, 2),
        })

        // Duman efekti için sprite oluştur
        this.rocketSmokeSprite = null
        if (this.resources.items.smokeTexture) {
            const smokeMaterial = new THREE.SpriteMaterial({
                map: this.resources.items.smokeTexture,
                transparent: true,
                opacity: 0.7,
                depthWrite: false
            })
            this.rocketSmokeSprite = new THREE.Sprite(smokeMaterial)
            this.rocketSmokeSprite.scale.set(1.5, 1.5, 1.5)
            this.rocketSmokeSprite.position.set(0, 0, -1.2) // Roketin altına hizala
            this.model.container.add(this.rocketSmokeSprite)
            this.rocketSmokeSprite.visible = false
        }

        this.rocketArea.on("interact", () => {
            // Etkileşim devre dışı bırakıldıysa hiçbir şey yapma
            if (!this.isInteractionEnabled) return;
            
            // İniş tamamlanmadıysa etkileşim yapma
            if (!this.isLandingComplete) return;
            
            const body = this.model && this.model.collision && this.model.collision.body
            if (!body) return;

            this.rocketLaunchClickCount++
            
            // Etkileşimi devre dışı bırak ve buton görünürlüğünü azalt
            this.isInteractionEnabled = false
            this.rocketAreaLabelMesh.material.opacity = 0.3;

            if (this.rocketLaunchClickCount % 2 === 1) {
                // LAUNCH: Fırlat, LAND yazısını göster
                this.rocketAreaLabelMesh.material.alphaMap = this.createButtonTexture('LAND')
                this.rocketAreaLabelMesh.material.needsUpdate = true
                
                // Roket fırlatma sesini çal
                if (this.sounds) {
                    this.sounds.play('rocketSound')
                }
                
                // Duman efektini başlat
                if (this.rocketSmokeSprite) {
                    this.rocketSmokeSprite.visible = true
                    this.rocketSmokeSprite.material.opacity = 0.7
                    this.rocketSmokeSprite.scale.set(1.5, 1.5, 1.5)
                    let smokeElapsed = 0
                    let smokeInterval = setInterval(() => {
                        smokeElapsed += 50
                        this.rocketSmokeSprite.scale.multiplyScalar(1.03)
                        this.rocketSmokeSprite.material.opacity *= 0.97
                        if (this.rocketSmokeSprite.material.opacity < 0.05 || smokeElapsed > 2000) {
                            this.rocketSmokeSprite.visible = false
                            clearInterval(smokeInterval)
                        }
                    }, 50)
                }
                
                if (body.wakeUp) body.wakeUp()
                if (this.rocketLandingInterval) {
                    clearInterval(this.rocketLandingInterval)
                    this.rocketLandingInterval = null
                }
                if (this.rocketDescentInterval) {
                    clearInterval(this.rocketDescentInterval)
                    this.rocketDescentInterval = null
                }
                
                // İniş sonrası bekleme timeout'u iptal et (eğer varsa)
                if (this.landingDelayTimeout) {
                    clearTimeout(this.landingDelayTimeout)
                    this.landingDelayTimeout = null
                }
                
                // Roketin X ve Y pozisyonlarını başlangıç konumuna sabitle
                if (this.initialPosition) {
                    body.position.x = this.initialPosition.x
                    body.position.y = this.initialPosition.y
                }
                
                // Sadece Z ekseninde hareketi başlat
                body.velocity.set(0, 0, 0)
                body.angularVelocity.set(0, 0, 10)
                this.rocketIsFlying = true
                let elapsed = 0
                let maxVelocity = 0
                let interval = setInterval(() => {
                    if (elapsed < 2000) {
                        // Sadece z ekseninde kuvvet uygula
                        const force = 5 + (elapsed / 2000) * 40
                        body.velocity.z += force * 0.05
                        
                        // X ve Y pozisyonlarını sabit tut
                        if (this.initialPosition) {
                            body.position.x = this.initialPosition.x
                            body.position.y = this.initialPosition.y
                        }
                        
                        if (body.velocity.z > maxVelocity) maxVelocity = body.velocity.z
                        elapsed += 50
                    } else {
                        clearInterval(interval)
                        body.velocity.set(0, 0, 0)
                        body.angularVelocity.set(0, 0, 0)
                        this.rocketLastMaxVelocity = maxVelocity // Maksimum çıkış hızını kaydet
                        this.freezeRocketInAir(body)
                    }
                }, 50)
            } else {
                // LAND: LAUNCH yazısını göster, inişi başlat
                this.rocketAreaLabelMesh.material.alphaMap = this.createButtonTexture('LAUNCH')
                this.rocketAreaLabelMesh.material.needsUpdate = true
                
                if (body.wakeUp) body.wakeUp()
                this.rocketIsFlying = false
                this.landRocket(body)
            }
        })
    }
} 