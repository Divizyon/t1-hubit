import * as THREE from 'three'

export default class IntroSection {
    constructor(_options) {
        // Options
        this.config = _options.config
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.walls = _options.walls
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        this.container.updateMatrix()

        // this.setStatic()

        this.setFloor()
        this.setBoundaries()
    }

    setFloor() {
        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(32, 32),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                transparent: true,
                opacity: 0.5,
                depthWrite: false
            })
        )
        this.floor.frustumCulled = false
        this.floor.matrixAutoUpdate = false
        this.floor.updateMatrix()
        this.container.add(this.floor)
    }
    
    setBoundaries() {
        // Sınır küplerinin boyutları
        const width = 128 // Zeminin genişliği kadar
        const height = 10 // Yükseklik
        const thickness = 2 // Kalınlık
        
        // Sınır küplerinin materyal özellikleri
        const boundaryMaterial = new THREE.MeshStandardMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.5,
            roughness: 0.5,
            metalness: 0.3
        })
        
        // Sınır küplerini oluştur
        this.boundaries = {
            north: new THREE.Mesh(
                new THREE.BoxGeometry(width, height, thickness),
                boundaryMaterial
            ),
            south: new THREE.Mesh(
                new THREE.BoxGeometry(width, height, thickness),
                boundaryMaterial
            ),
            east: new THREE.Mesh(
                new THREE.BoxGeometry(thickness, height, width),
                boundaryMaterial
            ),
            west: new THREE.Mesh(
                new THREE.BoxGeometry(thickness, height, width),
                boundaryMaterial
            )
        }
        
        // Sınır küplerinin konumlarını ayarla
        const halfWidth = width / 2
        const halfHeight = height / 2
        
        // Kuzey sınırı (üst)
        this.boundaries.north.position.set(0, halfHeight, -halfWidth)
        this.boundaries.north.frustumCulled = false
        this.boundaries.north.matrixAutoUpdate = false
        
        // Güney sınırı (alt)
        this.boundaries.south.position.set(0, halfHeight, halfWidth)
        this.boundaries.south.frustumCulled = false
        this.boundaries.south.matrixAutoUpdate = false
        
        // Doğu sınırı (sağ)
        this.boundaries.east.position.set(halfWidth, halfHeight, 0)
        this.boundaries.east.frustumCulled = false
        this.boundaries.east.matrixAutoUpdate = false
        
        // Batı sınırı (sol)
        this.boundaries.west.position.set(-halfWidth, halfHeight, 0)
        this.boundaries.west.frustumCulled = false
        this.boundaries.west.matrixAutoUpdate = false
        
        // Sınır küplerini container'a ekle
        for (const boundary of Object.values(this.boundaries)) {
            boundary.updateMatrix()
            this.container.add(boundary)
        }
        
        // Fizik özelliklerini ekle
        this.addPhysics()
    }
    
    addPhysics() {
        // Eğer walls nesnesi mevcutsa ve createStatic metodu varsa kullan
        if (this.walls && typeof this.walls.createStatic === 'function') {
            // Her bir sınır için fizik özelliklerini tanımla
            for (const [direction, mesh] of Object.entries(this.boundaries)) {
                const size = new THREE.Vector3()
                mesh.geometry.computeBoundingBox()
                mesh.geometry.boundingBox.getSize(size)
                
                // Walls/physics sistemine sınırları ekle
                this.walls.createStatic({
                    object: mesh,
                    width: size.x,
                    height: size.y,
                    depth: size.z,
                    position: mesh.position,
                    rotation: mesh.rotation,
                    autoUpdate: false
                })
            }
        } else {
            console.warn('Walls objesi bulunamadı veya createStatic metodu mevcut değil!')
        }
    }
}