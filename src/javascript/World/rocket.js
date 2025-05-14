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

        // Properties
        this.rocketLaunchClickCount = 0
        this.rocketIsFlying = false
        this.rocketLandingInterval = null
        this.rocketDescentInterval = null
        this.rocketLastMaxVelocity = 0 // Fırlatmada ulaşılan maksimum hız

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
                body.velocity.set(0, 0, 0)
                body.position.z = Math.max(body.position.z, 10) // 10 birim yukarıda sabitleniyor
            }
        }, 50)
    }

    landRocket(body) {
        if (this.rocketLandingInterval) {
            clearInterval(this.rocketLandingInterval)
            this.rocketLandingInterval = null
        }
        if (this.rocketDescentInterval) {
            clearInterval(this.rocketDescentInterval)
            this.rocketDescentInterval = null
        }
        body.angularVelocity.set(0, 0, 0)
        // Düz iniş animasyonu
        const targetZ = 0.5
        const descentSpeed = -Math.abs(this.rocketLastMaxVelocity) * 0.6 || -2 // Maksimum çıkış hızının %60'ı, yoksa -2
        this.rocketDescentInterval = setInterval(() => {
            const currentZ = body.position.z
            if (currentZ <= targetZ + 0.05) {
                body.position.z = targetZ
                body.velocity.set(0, 0, 0)
                clearInterval(this.rocketDescentInterval)
                this.rocketDescentInterval = null
            } else {
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
            this.rocketLaunchClickCount++
            const body = this.model && this.model.collision && this.model.collision.body

            if (this.rocketLaunchClickCount % 2 === 1) {
                // LAUNCH: Fırlat, LAND yazısını göster
                this.rocketAreaLabelMesh.material.alphaMap = this.createButtonTexture('LAND')
                this.rocketAreaLabelMesh.material.needsUpdate = true
                
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
                
                if (body) {
                    if (body.wakeUp) body.wakeUp()
                    if (this.rocketLandingInterval) {
                        clearInterval(this.rocketLandingInterval)
                        this.rocketLandingInterval = null
                    }
                    if (this.rocketDescentInterval) {
                        clearInterval(this.rocketDescentInterval)
                        this.rocketDescentInterval = null
                    }
                    body.velocity.set(0, 0, 0)
                    body.angularVelocity.set(0, 0, 10)
                    this.rocketIsFlying = true
                    let elapsed = 0
                    let maxVelocity = 0
                    let interval = setInterval(() => {
                        if (elapsed < 2000) {
                            const force = 5 + (elapsed / 2000) * 40
                            body.velocity.z += force * 0.05
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
                }
            } else {
                // LAND: LAUNCH yazısını göster, inişi başlat
                this.rocketAreaLabelMesh.material.alphaMap = this.createButtonTexture('LAUNCH')
                this.rocketAreaLabelMesh.material.needsUpdate = true
                if (body) {
                    if (body.wakeUp) body.wakeUp()
                    this.rocketIsFlying = false
                    this.landRocket(body)
                }
            }
        })
    }
} 