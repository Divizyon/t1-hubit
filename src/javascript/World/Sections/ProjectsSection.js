import * as THREE from 'three'
import Project from './Project'
import gsap from 'gsap'

export default class ProjectsSection
{
    constructor(_options)
    {
        // Constructor'a aktarılan seçenekleri kaydet
        this.time = _options.time // Animasyonlar için zaman yöneticisi
        this.resources = _options.resources // Kaynaklar yöneticisi
        this.camera = _options.camera // Kamera örneği
        this.passes = _options.passes // Post-processing geçişleri
        this.objects = _options.objects // 3B nesneler yöneticisi
        this.areas = _options.areas // Etkileşimli alanlar
        this.zones = _options.zones // Kamera bölgeleri yöneticisi
        this.tiles = _options.tiles // Projeler arasındaki bağlantı karoları
        this.debug = _options.debug // Hata ayıklama seçenekleri
        
        // Çalışan Gençlik Merkezi modeline (x:60, y:-28) yakın olması için X konumunu ayarla
        this.x = 37 // Bölümün X konumu - Çalışan Gençlik Merkezi'nin batısında
        this.y = _options.y // Bölümün Y konumu

        // Hata ayıklama etkinleştirilmişse klasörünü başlat
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('projects')
            this.debugFolder.open()
        }

        // Temel özellikleri ayarla
        this.items = [] // Proje örneklerini depolamak için dizi

        this.interDistance = 15 // Projeler arasındaki mesafe - daha yakın yerleşim için azaltıldı (24'ten 15'e)
        this.positionRandomess = 5 // Y konumundaki rastgele varyasyon
        this.projectHalfWidth = 9 // Bir projenin yarı genişliği

        // Tüm projeler için bir kapsayıcı oluştur
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false // Performans için otomatik matris güncellemelerini devre dışı bırak
        this.container.updateMatrix() // Matrisi bir kez güncelle

        // Bileşenleri başlat
        this.setGeometries() // Geometrileri ayarla
        this.setMeshes() // Meshları ayarla
        this.setList() // Proje listesini ayarla
        //this.setZone() // Kamera bölgesini ayarla

        // Listedeki projeleri oluştur
        for(const _options of this.list)
        {
            this.add(_options)
        }
    }

    // Projeler bölümünde kullanılan geometrileri oluştur
    setGeometries()
    {
        this.geometries = {}
        this.geometries.floor = new THREE.PlaneGeometry(16, 8) // Zemin düzlemi geometrisi
    }

    // Projeler bölümünde kullanılan meshları ayarla
    setMeshes()
    {
        this.meshes = {}

        // Alan etiketi için doku ayarlarını yapılandır
        this.resources.items.areaOpenTexture.magFilter = THREE.NearestFilter
        this.resources.items.areaOpenTexture.minFilter = THREE.LinearFilter
        
        // Tahta düzlemini kaynaklardan al
        this.meshes.boardPlane = this.resources.items.projectsBoardPlane.scene.children[0]
        
        // Metin dokusu ile alan etiketi meshini oluştur
        this.meshes.areaLabel = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5), 
            new THREE.MeshBasicMaterial({ 
                transparent: true, 
                depthWrite: false, 
                color: 0xffffff, 
                alphaMap: this.resources.items.areaOpenTexture 
            })
        )
        this.meshes.areaLabel.matrixAutoUpdate = false // Performans için otomatik matris güncellemelerini devre dışı bırak
    }

    // Projelerin özelliklerini ve listesini tanımla
    setList()
    {
        this.list = [
            {
                name: 'Three.js Journey', // Proje adı
                imageSources: // Proje için slaytlar
                [
                    './models/projects/threejsJourney/catalhoyuk.jpg',
                    './models/projects/threejsJourney/genckulturkart.jpg',
                    './models/projects/threejsJourney/genclikmeclisi.jpg',
                    './models/projects/threejsJourney/karataymedresesi.jpg',
                    './models/projects/threejsJourney/mevlanaturbesi.jpg',
                    './models/projects/threejsJourney/sillekoyu.jpg',
                    
                ],
                //floorTexture: this.resources.items.projectsThreejsJourneyFloorTexture, // Zemin dokusu
                link: // Etkileşimli bağlantı alanı
                {
                    href: 'https://threejs-journey.com?c=p3', // URL
                    x: - 4.8, // Bağlantının X konumu
                    y: - 3, // Bağlantının Y konumu
                    halfExtents: // Tıklanabilir alanın boyutu
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                // Özel etiketler - her resim için bir etiket
                labels: [
                    "Çatalhöyük",
                    "Genç Kültür Kart",
                    "Gençlik Meclisi",
                    "Karatay Medresesi",
                    "Mevlana Türbesi",
                    "Sille Köyü"
                ],
                //distinctions: // Ödüller/tanınmalar
                //[
                //    { type: 'fwa', x: 3.95, y: 4.15 }
                //]
            },
            /*{
                name: 'Chartogne Taillet',
                imageSources:
                [
                    './models/projects/chartogne/slideA.jpg',
                    './models/projects/chartogne/slideB.jpg',
                    './models/projects/chartogne/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsChartogneFloorTexture,
                link:
                {
                    href: 'https://chartogne-taillet.com',
                    x: - 4.8,
                    y: - 3.3,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                    { type: 'cssda', x: 7.2, y: 4.15 }
                ]
            },
            {
                name: 'Bonhomme | 10 ans',
                imageSources:
                [
                    './models/projects/bonhomme10ans/slideA.webp',
                    './models/projects/bonhomme10ans/slideB.webp',
                    './models/projects/bonhomme10ans/slideC.webp',
                    './models/projects/bonhomme10ans/slideD.webp'
                ],
                floorTexture: this.resources.items.projectsBonhomme10ansFloorTexture,
                link:
                {
                    href: 'https://anniversary.bonhommeparis.com/',
                    x: - 4.8,
                    y: - 2,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                ]
            },
            {
                name: 'Luni.app',
                imageSources:
                [
                    './models/projects/luni/slideA.webp',
                    './models/projects/luni/slideB.webp',
                    './models/projects/luni/slideC.webp',
                    './models/projects/luni/slideD.webp'
                ],
                floorTexture: this.resources.items.projectsLuniFloorTexture,
                link:
                {
                    href: 'https://luni.app',
                    x: - 4.8,
                    y: - 3,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                ]
            },
            {
                name: 'Madbox',
                imageSources:
                [
                    './models/projects/madbox/slideA.jpg',
                    './models/projects/madbox/slideB.jpg',
                    './models/projects/madbox/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsMadboxFloorTexture,
                link:
                {
                    href: 'https://madbox.io',
                    x: - 4.8,
                    y: - 4,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 }
                ]
            },
            {
                name: 'Scout',
                imageSources:
                [
                    './models/projects/scout/slideA.jpg',
                    './models/projects/scout/slideB.jpg',
                    './models/projects/scout/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsScoutFloorTexture,
                link:
                {
                    href: 'https://fromscout.com',
                    x: - 4.8,
                    y: - 2,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                ]
            },*/
            // Yoruma alınmış proje (Zenly)
            // {
            //     name: 'Zenly',
            //     imageSources:
            //     [
            //         './models/projects/zenly/slideA.jpg',
            //         './models/projects/zenly/slideB.jpg',
            //         './models/projects/zenly/slideC.jpg'
            //     ],
            //     floorTexture: this.resources.items.projectsZenlyFloorTexture,
            //     link:
            //     {
            //         href: 'https://zen.ly',
            //         x: - 4.8,
            //         y: - 4.2,
            //         halfExtents:
            //         {
            //             x: 3.2,
            //             y: 1.5
            //         }
            //     },
            //     distinctions:
            //     [
            //         { type: 'awwwards', x: 3.95, y: 4.15 },
            //         { type: 'fwa', x: 5.6, y: 4.15 },
            //         { type: 'cssda', x: 7.2, y: 4.15 }
            //     ]
            // },
            /*{
                name: 'priorHoldings',
                imageSources:
                [
                    './models/projects/priorHoldings/slideA.jpg',
                    './models/projects/priorHoldings/slideB.jpg',
                    './models/projects/priorHoldings/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsPriorHoldingsFloorTexture,
                link:
                {
                    href: 'https://prior.co.jp/discover/',
                    x: - 4.8,
                    y: - 3,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                    { type: 'cssda', x: 7.2, y: 4.15 }
                ]
            },
            {
                name: 'orano',
                imageSources:
                [
                    './models/projects/orano/slideA.jpg',
                    './models/projects/orano/slideB.jpg',
                    './models/projects/orano/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsOranoFloorTexture,
                link:
                {
                    href: 'https://orano.imm-g-prod.com/experience/innovation/en',
                    x: - 4.8,
                    y: - 3.4,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                    { type: 'cssda', x: 7.2, y: 4.15 }
                ]
            },
            {
                name: 'citrixRedbull',
                imageSources:
                [
                    './models/projects/citrixRedbull/slideA.jpg',
                    './models/projects/citrixRedbull/slideB.jpg',
                    './models/projects/citrixRedbull/slideC.jpg'
                ],
                floorTexture: this.resources.items.projectsCitrixRedbullFloorTexture,
                link:
                {
                    href: 'https://thenewmobileworkforce.imm-g-prod.com/',
                    x: - 4.8,
                    y: - 4.4,
                    halfExtents:
                    {
                        x: 3.2,
                        y: 1.5
                    }
                },
                distinctions:
                [
                    { type: 'awwwards', x: 3.95, y: 4.15 },
                    { type: 'fwa', x: 5.6, y: 4.15 },
                    { type: 'cssda', x: 7.2, y: 4.15 }
                ]
            },*/
            // Yoruma alınmış projeler (gleecChat ve keppler)
            // {
            //     name: 'gleecChat',
            //     imageSources:
            //     [
            //         './models/projects/gleecChat/slideA.jpg',
            //         './models/projects/gleecChat/slideB.jpg',
            //         './models/projects/gleecChat/slideC.jpg',
            //         './models/projects/gleecChat/slideD.jpg'
            //     ],
            //     floorTexture: this.resources.items.projectsGleecChatFloorTexture,
            //     link:
            //     {
            //         href: 'http://gleec.imm-g-prod.com',
            //         x: - 4.8,
            //         y: - 3.4,
            //         halfExtents:
            //         {
            //             x: 3.2,
            //             y: 1.5
            //         }
            //     },
            //     distinctions:
            //     [
            //         { type: 'awwwards', x: 3.95, y: 4.15 },
            //         { type: 'fwa', x: 5.6, y: 4.15 },
            //         { type: 'cssda', x: 7.2, y: 4.15 }
            //     ]
            // },
            // {
            //     name: 'keppler',
            //     imageSources:
            //     [
            //         './models/projects/keppler/slideA.jpg',
            //         './models/projects/keppler/slideB.jpg',
            //         './models/projects/keppler/slideC.jpg'
            //     ],
            //     floorTexture: this.resources.items.projectsKepplerFloorTexture,
            //     link:
            //     {
            //         href: 'https://brunosimon.github.io/keppler/',
            //         x: 2.75,
            //         y: - 1.1,
            //         halfExtents:
            //         {
            //             x: 3.2,
            //             y: 1.5
            //         }
            //     },
            //     distinctions: []
            // }
        ]
    }

    // Bu bölüm için kamera bölgesini ayarla
    /*setZone()
    {
        // Tüm projelerin toplam genişliğini hesapla
        const totalWidth = this.list.length * (this.interDistance / 2)

        // Kamera kontrolü için bir bölge oluştur
        const zone = this.zones.add({
            position: { x: this.x + totalWidth - this.projectHalfWidth - 6, y: this.y }, // Bölgenin konumu
            halfExtents: { x: totalWidth, y: 12 }, // Bölgenin boyutu
            data: { cameraAngle: 'projects' } // Bölge için veri
        })

        // Bölgeye girildiğinde gerçekleşecek olay
        zone.on('in', (_data) =>
        {
            this.camera.angle.set(_data.cameraAngle) // Projeler görünümü için kamera açısını ayarla
            // Bulanıklık efektlerini kapat (animasyonla)
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: 0, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: 0, duration: 2 })
        })

        // Bölgeden çıkıldığında gerçekleşecek olay
        zone.on('out', () =>
        {
            this.camera.angle.set('default') // Kamera açısını sıfırla
            // Bulanıklık efektlerini geri aç (animasyonla)
            gsap.to(this.passes.horizontalBlurPass.material.uniforms.uStrength.value, { x: this.passes.horizontalBlurPass.strength, duration: 2 })
            gsap.to(this.passes.verticalBlurPass.material.uniforms.uStrength.value, { y: this.passes.verticalBlurPass.strength, duration: 2 })
        })
    }*/

    // Sahneye yeni bir proje ekle
    add(_options)
    {
        // Yeni proje için konum hesapla
        const x = this.x + this.items.length * this.interDistance
        let y = this.y
        // İlk projeden sonraki projeler için Y konumuna rastgelelik ekle
        if(this.items.length > 0)
        {
            y += (Math.random() - 0.5) * this.positionRandomess
        }

        // Proje örneği oluştur
        const project = new Project({
            time: this.time,
            resources: this.resources,
            objects: this.objects,
            areas: this.areas,
            geometries: this.geometries,
            meshes: this.meshes,
            debug: this.debugFolder,
            x: x,
            y: y,
            ..._options // Projeye özgü seçenekleri yay
        })

        // Projeyi kapsayıcıya ekle
        this.container.add(project.container)

        // Projeler arasına bağlantı karoları ekle
        if(this.items.length >= 1)
        {
            const previousProject = this.items[this.items.length - 1]
            // Karo için başlangıç ve bitiş noktalarını hesapla
            const start = new THREE.Vector2(previousProject.x + this.projectHalfWidth, previousProject.y)
            const end = new THREE.Vector2(project.x - this.projectHalfWidth, project.y)
            const delta = end.clone().sub(start) // Fark vektörünü hesapla
            // Projeler arasına karo ekle
            this.tiles.add({
                start: start,
                delta: delta
            })
        }

        // Projeyi öğeler dizisine kaydet
        this.items.push(project)
    }
}
