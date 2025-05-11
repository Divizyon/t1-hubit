import * as THREE from 'three'

export default class PopUpModule {
  constructor(_options) {
    // Options
    this.resources = _options.resources
    this.objects = _options.objects
    this.shadows = _options.shadows
    this.sounds = _options.sounds
    this.areas = _options.areas
    
    // Debug için objects kontrolü
    if (!this.objects) {
      console.error("PopUpModule: objects parametresi bulunamadı!")
      return
    }
    
    // Set up
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false
    
    this.setPopUp()
    
    // Etkileşim alanını ayarla
    if (this.areas) {
      this.setPopUpInteraction()
    }
  }
  
  setPopUp() {
    // Etkileşim etiketi oluştur
    const areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        opacity: 0 // Tamamen şeffaf yap
      })
    )
    areaLabelMesh.position.set(-52, 0, 5) // GreenBox ile aynı hizaya getirildi
    areaLabelMesh.matrixAutoUpdate = false
    areaLabelMesh.updateMatrix()
    this.container.add(areaLabelMesh)
  }
  
  setPopUpInteraction() {
    try {
      if (!this.areas) {
        console.error("Pop-up etkileşim alanı eklenirken hata: areas objesi bulunamadı!")
        return
      }

      // Etkileşim alanı oluştur
      this.popUpArea = this.areas.add({
        position: new THREE.Vector2(-52, 0), // GreenBox ile aynı hizaya getirildi
        halfExtents: new THREE.Vector2(2, 2), // 2x2 birimlik alan
      })

      // Etkileşim fonksiyonunu tanımla
      this.popUpArea.on("interact", () => {
        // Popup oluştur
        const popupContainer = document.createElement("div")
        popupContainer.style.position = "fixed"
        popupContainer.style.top = "0"
        popupContainer.style.left = "0"
        popupContainer.style.width = "100%"
        popupContainer.style.height = "100%"
        popupContainer.style.display = "flex"
        popupContainer.style.justifyContent = "center"
        popupContainer.style.alignItems = "center"
        popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)"
        popupContainer.style.zIndex = "9999"

        // Popup içeriği
        const popupBox = document.createElement("div")
        popupBox.style.position = "relative"
        popupBox.style.backgroundColor = "white"
        popupBox.style.padding = "20px"
        popupBox.style.borderRadius = "8px"
        popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)"
        popupBox.style.maxWidth = "90%"
        popupBox.style.maxHeight = "90vh"
        popupBox.style.overflow = "auto"

        // Görsel
        const image = document.createElement("img")
        image.src = "/models/greenBoximage/konya.JPG"
        image.style.maxWidth = "100%"
        image.style.height = "auto"
        image.style.display = "block"
        image.style.marginBottom = "20px"
        image.style.cursor = "pointer"

        // Görsele tıklama olayı ekle
        image.addEventListener("click", () => {
          console.log("Objects:", this.objects) // Debug için objects'ı kontrol et
          
          // GreenBox'ı bul
          let greenBox = null
          
          // Objects yapısını kontrol et
          if (this.objects && this.objects.items) {
            console.log("Objects items:", this.objects.items) // Debug için items'ı kontrol et
            
            // GreenBox'ı items içinde ara
            for (const key in this.objects.items) {
              const item = this.objects.items[key]
              if (item && item.container && item.container.name === "greenBox_mainModel") {
                greenBox = item.container
                console.log("GreenBox bulundu:", greenBox) // Debug için bulunan GreenBox'ı kontrol et
                break
              }
            }
          }

          if (greenBox) {
            console.log("GreenBox children:", greenBox.children) // Debug için children'ı kontrol et
            
            // Front wall'u bul
            const frontWall = greenBox.children.find(child => 
              child.isMesh && child.name === "greenBox_pureUc"
            )
            
            if (frontWall) {
              console.log("Front wall bulundu:", frontWall) // Debug için front wall'u kontrol et
              
              // Texture yükle
              const textureLoader = new THREE.TextureLoader()
              textureLoader.load(
                '/models/greenBoximage/konya.JPG', // Texture yolu
                (texture) => {
                  // Texture'ı ayarla
                  texture.wrapS = THREE.RepeatWrapping
                  texture.wrapT = THREE.RepeatWrapping
                  texture.repeat.set(1, 1)
                  
                  // Yeni material oluştur
                  const newMaterial = new THREE.MeshStandardMaterial({
                    map: texture,
                    metalness: 0.3,
                    roughness: 0.4
                  })
                  
                  // Material'i güncelle
                  frontWall.material = newMaterial
                  frontWall.material.needsUpdate = true
                  console.log("Texture uygulandı") // Debug için texture uygulamasını kontrol et
                },
                // Loading callback
                undefined,
                // Error callback
                (error) => {
                  console.error("Texture yüklenirken hata oluştu:", error)
                }
              )
            } else {
              console.error("Front wall bulunamadı! Mevcut mesh'ler:", greenBox.children.map(child => child.name))
            }
          } else {
            console.error("GreenBox bulunamadı! Objects yapısı:", this.objects)
          }

          // Popup'ı kapat
          document.body.removeChild(popupContainer)
        })

        // Kapatma butonu
        const closeButton = document.createElement("button")
        closeButton.textContent = "Kapat"
        closeButton.style.padding = "10px 20px"
        closeButton.style.border = "none"
        closeButton.style.backgroundColor = "#e0e0e0"
        closeButton.style.color = "#333"
        closeButton.style.cursor = "pointer"
        closeButton.style.borderRadius = "5px"
        closeButton.style.fontSize = "14px"
        closeButton.style.display = "block"
        closeButton.style.margin = "0 auto"

        // Kapatma fonksiyonu
        closeButton.addEventListener("click", () => {
          document.body.removeChild(popupContainer)
        })

        // Popup dışına tıklamayla kapatma
        popupContainer.addEventListener("click", (event) => {
          if (event.target === popupContainer) {
            document.body.removeChild(popupContainer)
          }
        })

        // Elementleri popupa ekle
        popupBox.appendChild(image)
        popupBox.appendChild(closeButton)
        popupContainer.appendChild(popupBox)
        document.body.appendChild(popupContainer)

        // Ses efekti çal
        if (this.sounds) {
          this.sounds.play("click")
        }
      })
      
      console.log("Pop-up etkileşim alanı başarıyla eklendi")
    } catch (error) {
      console.error("Pop-up etkileşim alanı eklenirken hata oluştu:", error)
    }
  }
} 