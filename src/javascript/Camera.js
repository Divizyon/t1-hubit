import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'

// Camera sınıfı - 3D sahne için kamera kontrolü sağlar
export default class Camera {
    constructor(_options) {
        // Gerekli seçenekleri al
        this.time = _options.time // Zaman yönetimi için
        this.sizes = _options.sizes // Ekran boyutları için
        this.renderer = _options.renderer // Three.js renderer'ı
        this.debug = _options.debug // Debug modu için
        this.config = _options.config // Yapılandırma ayarları
        

        // Kamera container'ı oluştur
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false // Matrix otomatik güncellemeyi kapat

        // Hedef noktası ve yumuşatılmış hedef noktası
        this.target = new THREE.Vector3(0, 0, 0)
        this.targetEased = new THREE.Vector3(0, 0, 0)
        this.easing = 0.15 // Yumuşatma değeri

        // Debug modu aktifse debug klasörü oluştur
        if (this.debug) {
            this.debugFolder = this.debug.addFolder('camera')
        }

        // Kamera özelliklerini ayarla
        this.setAngle() // Kamera açısını ayarla
        this.setInstance() // Kamera örneğini oluştur
        this.setZoom() // Zoom özelliklerini ayarla
        this.setPan() // Pan (kaydırma) özelliklerini ayarla
        this.setOrbitControls() // Orbit kontrollerini ayarla
    }

    setAngle() {
        // Açı ayarları için nesne oluştur
        this.angle = {}

        // Farklı kamera açıları için vektörler tanımla
        this.angle.items = {
            default: new THREE.Vector3(1.135, - 1.45, 1.15), // Varsayılan kamera açısı
            projects: new THREE.Vector3(0.38, - 1.4, 1.63), // Projeler için kamera açısı
            greenbox: new THREE.Vector3(1.0195, -0.9555, 0.569) // Greenbox için ortalama kamera açısı
        }

        // Mevcut açı değeri için vektör oluştur
        this.angle.value = new THREE.Vector3()
        this.angle.value.copy(this.angle.items.default) // Varsayılan açıyı kopyala

        // Greenbox pozisyonu ve mesafe eşiği
        this.greenboxPosition = new THREE.Vector3(-61, 9, 0) // Greenbox'ın konumu
        this.distanceThreshold = 6.5 // Mesafe eşiği
        this.isNearGreenbox = false // Greenbox'a yakınlık durumu

        // Açı değiştirme metodu
        this.angle.set = (_name) => {
            const angle = this.angle.items[_name] // İstenen açıyı al
            if (typeof angle !== 'undefined') {
                // GSAP ile yumuşak geçiş yap
                gsap.to(this.angle.value, { ...angle, duration: 3, ease: 'power3.inOut' })
            }
        }

        // Araç pozisyonuna göre kamera açısını güncelle
        this.updateCameraAngle = (carPosition) => {
            // Araç ile greenbox arasındaki mesafeyi hesapla
            const distance = carPosition.distanceTo(this.greenboxPosition)

            // Eğer mesafe eşik değerinden küçükse ve henüz yakın değilse
            if (distance < this.distanceThreshold && !this.isNearGreenbox) {
                this.isNearGreenbox = true // Yakın durumu aktif et
                this.angle.set('greenbox') // Greenbox için ortalama açıyı kullan
            }
            // Eğer mesafe eşik değerinden büyükse ve yakın durumdaysa
            else if (distance >= this.distanceThreshold && this.isNearGreenbox) {
                this.isNearGreenbox = false // Yakın durumu deaktif et
                this.angle.set('default') // Varsayılan açıya dön
            }
        }

        // Debug modu için kontroller ekle
        if (this.debug) {
            this.debugFolder.add(this, 'easing').step(0.0001).min(0).max(1).name('easing')
            this.debugFolder.add(this.angle.value, 'x').step(0.001).min(- 2).max(2).name('invertDirectionX').listen()
            this.debugFolder.add(this.angle.value, 'y').step(0.001).min(- 2).max(2).name('invertDirectionY').listen()
            this.debugFolder.add(this.angle.value, 'z').step(0.001).min(- 2).max(2).name('invertDirectionZ').listen()
        }
    }

    setInstance() {
        // Perspektif kamera oluştur
        this.instance = new THREE.PerspectiveCamera(40, this.sizes.viewport.width / this.sizes.viewport.height, 1, 80)
        this.instance.up.set(0, 0, 1) // Kamera yukarı yönünü ayarla
        this.instance.position.copy(this.angle.value) // Kamera pozisyonunu ayarla
        this.instance.lookAt(new THREE.Vector3()) // Kamerayı merkeze baktır
        this.container.add(this.instance) // Kamerayı container'a ekle

        // Ekran boyutu değiştiğinde
        this.sizes.on('resize', () => {
            this.instance.aspect = this.sizes.viewport.width / this.sizes.viewport.height // En-boy oranını güncelle
            this.instance.updateProjectionMatrix() // Projeksiyon matrisini güncelle
        })

        // Her kare için
        this.time.on('tick', () => {
            if (!this.orbitControls.enabled) {
                // Hedef noktasını yumuşat
                this.targetEased.x += (this.target.x - this.targetEased.x) * this.easing
                this.targetEased.y += (this.target.y - this.targetEased.y) * this.easing
                this.targetEased.z += (this.target.z - this.targetEased.z) * this.easing

                // Zoom değerini uygula
                this.instance.position.copy(this.targetEased).add(this.angle.value.clone().normalize().multiplyScalar(this.zoom.distance))

                // Kamerayı hedefe baktır
                this.instance.lookAt(this.targetEased)

                // Pan değerlerini uygula
                this.instance.position.x += this.pan.value.x
                this.instance.position.y += this.pan.value.y
            }
        })
    }

    setZoom() {
        // Zoom ayarları için nesne oluştur
        this.zoom = {}
        this.zoom.easing = 0.1 // Yumuşatma değeri
        this.zoom.minDistance = 14 // Minimum zoom mesafesi
        this.zoom.amplitude = 15 // Zoom genliği
        this.zoom.value = this.config.cyberTruck ? 0.3 : 0.5 // Başlangıç zoom değeri
        this.zoom.targetValue = this.zoom.value // Hedef zoom değeri
        this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value // Zoom mesafesi

        // Fare tekerleği olayını dinle
        document.addEventListener('wheel', (_event) => {
            this.zoom.targetValue += _event.deltaY * 0.001
            this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
        }, { passive: true })

        // Eski tarayıcılar için mousewheel olayını dinle
        document.addEventListener('mousewheel', (_event) => {
            this.zoom.targetValue += _event.deltaY * 0.001
            this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
        }, { passive: true })

        // Dokunmatik zoom için ayarlar
        this.zoom.touch = {}
        this.zoom.touch.startDistance = 0
        this.zoom.touch.startValue = 0

        // Dokunmatik başlangıç olayı
        this.renderer.domElement.addEventListener('touchstart', (_event) => {
            if (_event.touches.length === 2) {
                this.zoom.touch.startDistance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientX - _event.touches[1].clientX)
                this.zoom.touch.startValue = this.zoom.targetValue
            }
        })

        // Dokunmatik hareket olayı
        this.renderer.domElement.addEventListener('touchmove', (_event) => {
            if (_event.touches.length === 2) {
                _event.preventDefault()

                const distance = Math.hypot(_event.touches[0].clientX - _event.touches[1].clientX, _event.touches[0].clientX - _event.touches[1].clientX)
                const ratio = distance / this.zoom.touch.startDistance

                this.zoom.targetValue = this.zoom.touch.startValue - (ratio - 1)
                this.zoom.targetValue = Math.min(Math.max(this.zoom.targetValue, 0), 1)
            }
        })

        // Her kare için zoom değerini güncelle
        this.time.on('tick', () => {
            this.zoom.value += (this.zoom.targetValue - this.zoom.value) * this.zoom.easing
            this.zoom.distance = this.zoom.minDistance + this.zoom.amplitude * this.zoom.value
        })
    }

    setPan() {
        // Pan ayarları için nesne oluştur
        this.pan = {}
        this.pan.enabled = false // Pan özelliği başlangıçta kapalı
        this.pan.active = false // Pan aktif değil
        this.pan.easing = 0.1 // Yumuşatma değeri
        this.pan.start = {} // Başlangıç noktası
        this.pan.start.x = 0
        this.pan.start.y = 0
        this.pan.value = {} // Mevcut değer
        this.pan.value.x = 0
        this.pan.value.y = 0
        this.pan.targetValue = {} // Hedef değer
        this.pan.targetValue.x = this.pan.value.x
        this.pan.targetValue.y = this.pan.value.y
        this.pan.raycaster = new THREE.Raycaster() // Işın yayıcı
        this.pan.mouse = new THREE.Vector2() // Fare pozisyonu
        this.pan.needsUpdate = false // Güncelleme gerekli mi
        this.pan.hitMesh = new THREE.Mesh( // Çarpışma düzlemi
            new THREE.PlaneGeometry(500, 500, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, visible: false })
        )
        this.container.add(this.pan.hitMesh)

        // Pan değerlerini sıfırla
        this.pan.reset = () => {
            this.pan.targetValue.x = 0
            this.pan.targetValue.y = 0
        }

        // Pan özelliğini aktifleştir
        this.pan.enable = () => {
            this.pan.enabled = true
            this.renderer.domElement.classList.add('has-cursor-grab')
        }

        // Pan özelliğini deaktifleştir
        this.pan.disable = () => {
            this.pan.enabled = false
            this.renderer.domElement.classList.remove('has-cursor-grab')
        }

        // Fare tıklama olayı
        this.pan.down = (_x, _y) => {
            if (!this.pan.enabled) return

            this.renderer.domElement.classList.add('has-cursor-grabbing')
            this.pan.active = true

            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)

            const intersects = this.pan.raycaster.intersectObjects([this.pan.hitMesh])

            if (intersects.length) {
                this.pan.start.x = intersects[0].point.x
                this.pan.start.y = intersects[0].point.y
            }
        }

        // Fare hareket olayı
        this.pan.move = (_x, _y) => {
            if (!this.pan.enabled || !this.pan.active) return

            this.pan.mouse.x = (_x / this.sizes.viewport.width) * 2 - 1
            this.pan.mouse.y = - (_y / this.sizes.viewport.height) * 2 + 1

            this.pan.needsUpdate = true
        }

        // Fare bırakma olayı
        this.pan.up = () => {
            this.pan.active = false
            this.renderer.domElement.classList.remove('has-cursor-grabbing')
        }

        // Fare olaylarını dinle
        window.addEventListener('mousedown', (_event) => {
            this.pan.down(_event.clientX, _event.clientY)
        })

        window.addEventListener('mousemove', (_event) => {
            this.pan.move(_event.clientX, _event.clientY)
        })

        window.addEventListener('mouseup', () => {
            this.pan.up()
        })

        // Dokunmatik olayları dinle
        this.renderer.domElement.addEventListener('touchstart', (_event) => {
            if (_event.touches.length === 1) {
                this.pan.down(_event.touches[0].clientX, _event.touches[0].clientY)
            }
        })

        this.renderer.domElement.addEventListener('touchmove', (_event) => {
            if (_event.touches.length === 1) {
                this.pan.move(_event.touches[0].clientX, _event.touches[0].clientY)
            }
        })

        this.renderer.domElement.addEventListener('touchend', () => {
            this.pan.up()
        })

        // Her kare için pan değerlerini güncelle
        this.time.on('tick', () => {
            if (this.pan.active && this.pan.needsUpdate) {
                this.pan.raycaster.setFromCamera(this.pan.mouse, this.instance)

                const intersects = this.pan.raycaster.intersectObjects([this.pan.hitMesh])

                if (intersects.length) {
                    this.pan.targetValue.x = - (intersects[0].point.x - this.pan.start.x)
                    this.pan.targetValue.y = - (intersects[0].point.y - this.pan.start.y)
                }

                this.pan.needsUpdate = false
            }

            this.pan.value.x += (this.pan.targetValue.x - this.pan.value.x) * this.pan.easing
            this.pan.value.y += (this.pan.targetValue.y - this.pan.value.y) * this.pan.easing
        })
    }

    setOrbitControls() {
        // Orbit kontrollerini oluştur
        this.orbitControls = new OrbitControls(this.instance, this.renderer.domElement)
        this.orbitControls.enabled = false // Başlangıçta devre dışı
        this.orbitControls.enableKeys = false // Klavye kontrollerini devre dışı bırak
        this.orbitControls.zoomSpeed = 0.5 // Zoom hızını ayarla

        // Debug modu için orbit kontrol ayarları
        if (this.debug) {
            this.debugFolder.add(this.orbitControls, 'enabled').name('orbitControlsEnabled')
        }
    }
}
