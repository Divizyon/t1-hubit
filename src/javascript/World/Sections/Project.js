import * as THREE from 'three'

import ProjectBoardMaterial from '../../Materials/ProjectBoard.js'
import gsap from 'gsap'

export default class Project
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.name = _options.name
        this.geometries = _options.geometries
        this.meshes = _options.meshes
        this.debug = _options.debug
        this.name = _options.name
        this.x = _options.x
        this.y = _options.y
        this.imageSources = _options.imageSources
        this.floorTexture = _options.floorTexture
        this.link = _options.link
        this.distinctions = _options.distinctions
        this.labels = _options.labels || [] // Etiketler için yeni özellik (opsiyonel)

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false
        // this.container.updateMatrix()

        this.setBoards()
        //this.setFloor()
    }

    setBoards()
    {
        // Set up
        this.boards = {}
        this.boards.items = []
        this.boards.xStart = - 5
        this.boards.xInter = 5
        this.boards.y = 5
        this.boards.color = '#8e7161'
        this.boards.threeColor = new THREE.Color(this.boards.color)

        if(this.debug)
        {
            this.debug.addColor(this.boards, 'color').name('boardColor').onChange(() =>
            {
                this.boards.threeColor.set(this.boards.color)
            })
        }

        // Varsayılan etiketleri ayarla - bunu daha sonra dışarıdan güncelleyebilirsiniz
        const defaultLabels = [
            "Çatalhöyük",
            "Genç Kültür Kart",
            "Gençlik Meclisi",
            "Karatay Medresesi",
            "Mevlana Türbesi",
            "Sille Köyü"
        ]

        // Create each board
        let i = 0

        for(const _imageSource of this.imageSources)
        {
            // Set up
            const board = {}
            board.x = this.x + this.boards.xStart + i * this.boards.xInter
            board.y = this.y + this.boards.y

            // Create structure with collision
            this.objects.add({
                base: this.resources.items.projectsBoardStructure.scene,
                collision: this.resources.items.projectsBoardCollision.scene,
                floorShadowTexture: this.resources.items.projectsBoardStructureFloorShadowTexture,
                offset: new THREE.Vector3(board.x, board.y, 0),
                rotation: new THREE.Euler(0, 0, 0),
                duplicated: true,
                mass: 0,
            })

            // Image load
            const image = new Image()
            image.addEventListener('load', () =>
            {
                board.texture = new THREE.Texture(image)
                board.texture.magFilter = THREE.NearestFilter
                board.texture.minFilter = THREE.LinearFilter
                board.texture.anisotropy = 4
                board.texture.colorSpace = THREE.SRGBColorSpace
                board.texture.needsUpdate = true

                board.planeMesh.material.uniforms.uTexture.value = board.texture

                gsap.to(board.planeMesh.material.uniforms.uTextureAlpha, { value: 1, duration: 1, ease: 'power4.inOut' })
            })

            image.src = _imageSource

            // Plane
            board.planeMesh = this.meshes.boardPlane.clone()
            board.planeMesh.position.x = board.x
            board.planeMesh.position.y = board.y
            board.planeMesh.matrixAutoUpdate = false
            board.planeMesh.updateMatrix()
            board.planeMesh.material = new ProjectBoardMaterial()
            board.planeMesh.material.uniforms.uColor.value = this.boards.threeColor
            board.planeMesh.material.uniforms.uTextureAlpha.value = 0
            this.container.add(board.planeMesh)
            
            // Etiket ekle - Canvas kullanarak her tahta için metin oluşturma
            // Etiket için bir canvas oluştur
            const labelText = this.labels[i] || defaultLabels[i] || `Etiket ${i+1}`
            const labelCanvas = document.createElement('canvas')
            const context = labelCanvas.getContext('2d')
            
            // Canvas boyutunu ayarla - Yüksekliği artırıyorum
            labelCanvas.width = 512
            labelCanvas.height = 128
            
            // Yazı tipini ve rengi ayarla - Font boyutunu büyütüyorum
            context.font = 'bold 56px Arial'
            context.textAlign = 'center'
            context.fillStyle = 'white' // Beyaz renk daha belirgin görünecek
            //context.shadowColor = 'rgba(0, 0, 0, 0.5)' // Gölge ekle
            //context.shadowBlur = 5
            //context.shadowOffsetX = 2
            //context.shadowOffsetY = 2
            context.clearRect(0, 0, labelCanvas.width, labelCanvas.height)
            
            // Uzun metinler için kelime kaydırma işlevi
            function wrapText(context, text, maxWidth) {
                const words = text.split(' ');
                let line = '';
                let lines = [];
                
                for(let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = context.measureText(testLine);
                    const testWidth = metrics.width;
                    
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);
                return lines;
            }
            
            // Metni çiz - Dikey konumu ayarlıyorum, uzun metinler için kelime kaydırma
            const maxWidth = 480; // Canvas genişliğinden biraz az
            const lines = wrapText(context, labelText, maxWidth);
            
            if (lines.length === 1) {
                // Tek satır için normal dikey konumlama
                context.fillText(lines[0], labelCanvas.width / 2, labelCanvas.height / 2 + 20);
            } else if (lines.length === 2) {
                // İki satır için dikey konumlama
                context.fillText(lines[0], labelCanvas.width / 2, labelCanvas.height / 2 - 15);
                context.fillText(lines[1], labelCanvas.width / 2, labelCanvas.height / 2 + 45);
            } else {
                // Üç veya daha fazla satır için (gerekirse ilk iki satırı göster)
                context.fillText(lines[0], labelCanvas.width / 2, labelCanvas.height / 2 - 15);
                context.fillText(lines[1], labelCanvas.width / 2, labelCanvas.height / 2 + 45);
            }
            
            // Canvas'tan doku oluştur
            const labelTexture = new THREE.CanvasTexture(labelCanvas)
            labelTexture.minFilter = THREE.LinearFilter
            labelTexture.wrapS = THREE.ClampToEdgeWrapping
            labelTexture.wrapT = THREE.ClampToEdgeWrapping
            
            // Etiket için materyal oluştur - daha belirgin görünmesi için ayarlar
            const labelMaterial = new THREE.MeshBasicMaterial({
                map: labelTexture,
                transparent: true,
                opacity: 1.0, // Tam opaklık
                depthWrite: true, // Derinlik yazımını aktifleştir
                depthTest: true, // Derinlik testini aktifleştir
                side: THREE.DoubleSide,
                toneMapped: false, // Tone mapping'i devre dışı bırak, renk değişmesin
                blending: THREE.NormalBlending // Normal karıştırma kullan
            })
            
            // Etiket mesh'i oluştur
            const labelMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(4, 1.8),
                labelMaterial
            )
            
            // Etiketi konumlandır - tahtanın altında
            labelMesh.position.x = board.x
            labelMesh.position.y = board.y - 2.5
            labelMesh.position.z = -0.001 // Z pozisyonunu negatif yap, arabanın altında görünsün
            labelMesh.matrixAutoUpdate = false
            labelMesh.updateMatrix()
            labelMesh.renderOrder = -1 // Render sırasını düşür, önce çizilsin (arkada kalsın)
            
            // Etiketi sahneye ekle
            this.container.add(labelMesh)
            
            // Etiket için tıklanabilir alan ekle
            const clickableArea = this.areas.add({
                position: new THREE.Vector2(board.x, board.y - 2.5),
                halfExtents: new THREE.Vector2(2.2, 1.35) // Etiketin büyütülmüş haline uygun şekilde artırıyorum
            })
            
            // Click olayı - daha sonra link ekleyebilirsiniz
            clickableArea.on('interact', () => {
                console.log(`${labelText} etiketine tıklandı! Link buraya eklenecek.`)
                
                // Çatalhöyük için özel işlev ekle
                if (labelText === "Çatalhöyük") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Çatalhöyük Neolitik Antik Kenti'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/catalhoyuk.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Çatalhöyük, 9000 yıllık geçmişiyle dünyanın en eski yerleşim yerlerinden biridir. UNESCO Dünya Mirası Listesi\'nde yer alan bu tarihi kent, insanlık tarihine ışık tutan özgün buluntularıyla önemli bir merkezdir.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('http://www.konya.gov.tr/konya-catalhoyuk', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                } 
                // Genç Kültür Kart için özel işlev ekle
                else if (labelText === "Genç Kültür Kart") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Genç Kültür Kart'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/genckulturkart.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Genç Kültür Kart, gençlerin kültürel ve sosyal etkinliklere daha kolay erişimini sağlamak amacıyla Konya Büyükşehir Belediyesi tarafından sunulan bir hizmettir. Konser, tiyatro, festival, spor, sinema, eğitim ve sosyalleşme imkanları sunar.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('https://www.genckultur.com/', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                }
                // Gençlik Meclisi için özel işlev ekle
                else if (labelText === "Gençlik Meclisi") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Konya Büyükşehir Belediyesi Gençlik Meclisi'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/genclikmeclisi.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Konya Büyükşehir Belediyesi Gençlik Meclisi, gençlerin vizyonunu, hedeflerini ve isteklerini gerçekleştirmek üzere gönüllü gençlerle birlikte çalışmalar yürütmekte olan kâr amacı gütmeyen ve siyasi bağlantısı olmayan bir kuruluştur. Farklı çalışma ofisleriyle gençlerin projelerini hayata geçirmelerine destek olur.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('https://www.kbbgenclikmeclisi.com/hosgeldin', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                }
                // Karatay Medresesi için özel işlev ekle
                else if (labelText === "Karatay Medresesi") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Karatay Medresesi'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/karataymedresesi.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Karatay Medresesi, Selçuklu döneminin önemli eğitim kurumlarından biridir. Konya\'nın tarihsel dokusuna katkı sağlayan bu yapı, günümüzde Karatay Çini Eserler Müzesi olarak hizmet vermektedir. İlçede bulunan diğer kültür varlıkları arasında Mevlâna Müzesi, Şemsi Tebrizi Türbesi, Koyunoğlu Müzesi ve Sultan Selim Camii bulunmaktadır.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('https://gokonya.com/tr/karatay', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                }
                // Mevlana Türbesi için özel işlev ekle
                else if (labelText === "Mevlana Türbesi") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Mevlâna Türbesi (Müzesi)'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/mevlanaturbesi.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Büyük fakih, mutasavvıf Mevlâna Celaleddin Muhammed\'in türbesi, Konya\'nın en önemli tarihi ve kültürel değerlerinden biridir. Yeşil kubbesi ve özel mimarisiyle tanınan türbe, her yıl milyonlarca yerli ve yabancı turist tarafından ziyaret edilmektedir. UNESCO Dünya Mirası listesinde yer alan bu değerli yapı, Mevlevi kültürünün de merkezi konumundadır.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('https://gokonya.com/tr/mevlana-turbesi-(muzesi)', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                }
                // Sille Köyü için özel işlev ekle
                else if (labelText === "Sille Köyü") {
                    // Pop-up göster
                    const popupContainer = document.createElement('div')
                    popupContainer.style.position = 'fixed'
                    popupContainer.style.top = '0'
                    popupContainer.style.left = '0'
                    popupContainer.style.width = '100%'
                    popupContainer.style.height = '100%'
                    popupContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
                    popupContainer.style.display = 'flex'
                    popupContainer.style.justifyContent = 'center'
                    popupContainer.style.alignItems = 'center'
                    popupContainer.style.zIndex = '9999'
                    
                    const popupContent = document.createElement('div')
                    popupContent.style.backgroundColor = 'white'
                    popupContent.style.padding = '30px'
                    popupContent.style.borderRadius = '10px'
                    popupContent.style.maxWidth = '500px'
                    popupContent.style.textAlign = 'center'
                    
                    const popupTitle = document.createElement('h2')
                    popupTitle.textContent = 'Sille Köyü'
                    popupTitle.style.marginBottom = '15px'
                    popupTitle.style.color = '#333'
                    
                    const popupImage = document.createElement('img')
                    popupImage.src = './models/projects/threejsJourney/sillekoyu.jpg'
                    popupImage.style.width = '100%'
                    popupImage.style.marginBottom = '15px'
                    popupImage.style.borderRadius = '5px'
                    
                    const popupDescription = document.createElement('p')
                    popupDescription.textContent = 'Sille, Anadolu uygarlıkları içinde çok mühim bir yeri bulunan, kültürlerin bir arada yaşadığı özel bir mekândır. Konya\'nın 7 km kuzeybatısında bulunan bu tarihi yerleşim, doğal silüetiyle, sivil mimarisi ve yerleşim dokusuyla, örf, adet ve gelenekleriyle, bağ ve bahçeleriyle özgün bir yerleşim yeridir. Aya-Elena Kilisesi ve Selçuklu ile Osmanlı dönemlerine ait Taş Câmi başta olmak üzere çeşitli tarihi eserler burada bulunmaktadır.'
                    popupDescription.style.marginBottom = '25px'
                    popupDescription.style.lineHeight = '1.5'
                    popupDescription.style.color = '#555'
                    
                    const buttonContainer = document.createElement('div')
                    buttonContainer.style.display = 'flex'
                    buttonContainer.style.justifyContent = 'space-between'
                    
                    const visitButton = document.createElement('button')
                    visitButton.textContent = 'Resmi Sayfayı Ziyaret Et'
                    visitButton.style.padding = '10px 20px'
                    visitButton.style.backgroundColor = '#4CAF50'
                    visitButton.style.color = 'white'
                    visitButton.style.border = 'none'
                    visitButton.style.borderRadius = '5px'
                    visitButton.style.cursor = 'pointer'
                    visitButton.style.fontWeight = 'bold'
                    visitButton.addEventListener('click', () => {
                        window.open('https://www.kulturportali.gov.tr/turkiye/konya/gezilecekyer/sille', '_blank')
                        document.body.removeChild(popupContainer)
                    })
                    
                    const closeButton = document.createElement('button')
                    closeButton.textContent = 'Kapat'
                    closeButton.style.padding = '10px 20px'
                    closeButton.style.backgroundColor = '#f44336'
                    closeButton.style.color = 'white'
                    closeButton.style.border = 'none'
                    closeButton.style.borderRadius = '5px'
                    closeButton.style.cursor = 'pointer'
                    closeButton.style.fontWeight = 'bold'
                    closeButton.addEventListener('click', () => {
                        document.body.removeChild(popupContainer)
                    })
                    
                    buttonContainer.appendChild(visitButton)
                    buttonContainer.appendChild(closeButton)
                    
                    popupContent.appendChild(popupTitle)
                    popupContent.appendChild(popupImage)
                    popupContent.appendChild(popupDescription)
                    popupContent.appendChild(buttonContainer)
                    
                    popupContainer.appendChild(popupContent)
                    
                    // Popup dışına tıklandığında kapansın
                    popupContainer.addEventListener('click', (e) => {
                        if (e.target === popupContainer) {
                            document.body.removeChild(popupContainer)
                        }
                    })
                    
                    document.body.appendChild(popupContainer)
                }
                else {
                    // Diğer etiketler için varsayılan davranış
                    // window.open('YOUR_LINK_HERE', '_blank')
                }
            })
            
            // Etiket referansını tahta nesnesinde sakla
            board.label = labelMesh
            board.labelClickArea = clickableArea

            // Save
            this.boards.items.push(board)

            i++
        }
    }

    /*setFloor()
    {
        this.floor = {}

        this.floor.x = 0
        this.floor.y = - 2

        // Container
        this.floor.container = new THREE.Object3D()
        this.floor.container.position.x = this.x + this.floor.x
        this.floor.container.position.y = this.y + this.floor.y
        this.floor.container.matrixAutoUpdate = false
        this.floor.container.updateMatrix()
        this.container.add(this.floor.container)

        // Texture
        //this.floor.texture = this.floorTexture
        //this.floor.texture.magFilter = THREE.NearestFilter
        //this.floor.texture.minFilter = THREE.LinearFilter

        // Geometry
        this.floor.geometry = this.geometries.floor

        // Material
        this.floor.material =  new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, alphaMap: this.floor.texture })

        // Mesh
        this.floor.mesh = new THREE.Mesh(this.floor.geometry, this.floor.material)
        this.floor.mesh.matrixAutoUpdate = false
        this.floor.container.add(this.floor.mesh)

        // Distinctions
        if(this.distinctions)
        {
            for(const _distinction of this.distinctions)
            {
                let base = null
                let collision = null
                let shadowSizeX = null
                let shadowSizeY = null

                switch(_distinction.type)
                {
                    case 'awwwards':
                        base = this.resources.items.projectsDistinctionsAwwwardsBase.scene
                        collision = this.resources.items.projectsDistinctionsAwwwardsCollision.scene
                        shadowSizeX = 1.5
                        shadowSizeY = 1.5
                        break

                    case 'fwa':
                        base = this.resources.items.projectsDistinctionsFWABase.scene
                        collision = this.resources.items.projectsDistinctionsFWACollision.scene
                        shadowSizeX = 2
                        shadowSizeY = 1
                        break

                    case 'cssda':
                        base = this.resources.items.projectsDistinctionsCSSDABase.scene
                        collision = this.resources.items.projectsDistinctionsCSSDACollision.scene
                        shadowSizeX = 1.2
                        shadowSizeY = 1.2
                        break
                }

                this.objects.add({
                    base: base,
                    collision: collision,
                    offset: new THREE.Vector3(this.x + this.floor.x + _distinction.x, this.y + this.floor.y + _distinction.y, 0),
                    rotation: new THREE.Euler(0, 0, 0),
                    duplicated: true,
                    shadow: { sizeX: shadowSizeX, sizeY: shadowSizeY, offsetZ: - 0.1, alpha: 0.5 },
                    mass: 1.5,
                    soundName: 'woodHit'
                })
            }
        }

        // Area
        this.floor.area = this.areas.add({
            position: new THREE.Vector2(this.x + this.link.x, this.y + this.floor.y + this.link.y),
            halfExtents: new THREE.Vector2(this.link.halfExtents.x, this.link.halfExtents.y)
        })
        this.floor.area.on('interact', () =>
        {
            window.open(this.link.href, '_blank')
        })

        // Area label
        this.floor.areaLabel = this.meshes.areaLabel.clone()
        this.floor.areaLabel.position.x = this.link.x
        this.floor.areaLabel.position.y = this.link.y
        this.floor.areaLabel.position.z = 0.001
        this.floor.areaLabel.matrixAutoUpdate = false
        this.floor.areaLabel.updateMatrix()
        this.floor.container.add(this.floor.areaLabel)
    }*/
}
