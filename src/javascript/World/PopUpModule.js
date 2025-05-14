import * as THREE from 'three'

export default class PopUpModule {
  constructor(_options) {
    // Diğer modüllerden gelen kaynakları ve referansları sakla
    this.resources = _options.resources  // Kaynaklar (textures, models vb.)
    this.objects = _options.objects      // Sahnedeki tüm 3B nesneler
    this.shadows = _options.shadows      // Gölge işlemleri
    this.sounds = _options.sounds        // Ses efektleri
    this.areas = _options.areas          // Etkileşim alanları
    
    // Gerekli objects parametresinin varlığını kontrol et - yoksa hata ver
    if (!this.objects) {
      console.error("PopUpModule: objects parametresi bulunamadı!")
      return
    }
    
    // Ana container oluştur - tüm popup nesneleri bunun içine eklenecek
    this.container = new THREE.Object3D()
    this.container.matrixAutoUpdate = false  // Performans için matrixAutoUpdate'i kapat
    
    // İlk popup ayarlarını yap
    this.setPopUp()
    
    // Etkileşim alanı varsa, etkileşim işlevselliğini ekle
    if (this.areas) {
      this.setPopUpInteraction()
    }
    
    // Enter tuşu basımını dinlemek için event listener ekle
    this.addKeyboardListener()
  }
  
  // Popup temel bileşenlerini oluştur
  setPopUp() {
    // Görünmez etkileşim etiketi/planı oluştur
    const areaLabelMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 0.5),  // 2x0.5 birim boyutunda düzlem geometrisi
      new THREE.MeshBasicMaterial({
        transparent: true,              // Şeffaflığı etkinleştir
        depthWrite: false,              // Derinlik yazımını devre dışı bırak
        color: 0xffffff,                // Beyaz renk (görünmez olduğu için önemsiz)
        opacity: 0                      // Tamamen şeffaf yap
      })
    )

    // GreenBox'ın tam önünde ve Divizyon'a yakın bir konuma yerleştir
    // GreenBox: x:-60, y:6, z:0 ve Divizyon: x:-69, y:-3, z:2
    areaLabelMesh.position.set(-60, 6, 2) // GreenBox'ın önünde
    areaLabelMesh.rotation.y = 0.5 // Y ekseni etrafında 0.5 radyan döndür
    areaLabelMesh.matrixAutoUpdate = false  // Performans için otomatik matris güncellemesini kapat
    areaLabelMesh.updateMatrix()            // Matris pozisyonunu manuel güncelle
    this.container.add(areaLabelMesh)       // Container'a ekle
  }
  
  // Klavye dinleyicisi ekle - Enter tuşu için
  addKeyboardListener() {
    // Enter tuşu dinleyicisi
    this.keyDownHandler = (event) => {
      // Enter tuşuna basıldığında (Tuş kodu 13)
      if (event.keyCode === 13 || event.key === "Enter") {
        // Etkileşim alanı yakında mı kontrol et
        if (this.isNearInteractionArea) {
          // Etkileşimi başlat
          this.showPopUp()
          
          // Ses efekti çal
          if (this.sounds) {
            this.sounds.play("click")
          }
        }
      }
    }
    
    // Event dinleyicisini ekle
    window.addEventListener("keydown", this.keyDownHandler)

  }
  
  // Popup etkileşimli alanını ve davranışını ayarla
  setPopUpInteraction() {
    try {
      // Areas modülünün varlığını tekrar kontrol et
      if (!this.areas) {
        console.error("Pop-up etkileşim alanı eklenirken hata: areas objesi bulunamadı!")
        return
      }

      // GreenBox'ın önündeki alanda, Divizyon konumlarını referans alarak etkileşim alanı oluştur
      // GreenBox: x:-60, y:6, z:0
      // Divizyon: x:-69, y:-3, z:2
      this.popUpArea = this.areas.add({
        position: new THREE.Vector2(-54, 5), // GreenBox'ın tam önü
        halfExtents: new THREE.Vector2(1.5, 1.5), // Daha büyük bir alan (3x3 birim) - kolay etkileşim için
      })

      // Etkileşim olayları tanımla
      
      // Yaklaşma olayı - kullanıcı alana yaklaştığında
      this.popUpArea.on("in", () => {
        console.log("GreenBox etkileşim alanına girildi")
        
        // Etkileşim durumunu güncelle
        this.isNearInteractionArea = true
        
        // Ekranda bir kullanım ipucu göster
        this.showInteractionHint()
      })
      
      // Uzaklaşma olayı - kullanıcı alandan uzaklaştığında
      this.popUpArea.on("out", () => {
        console.log("GreenBox etkileşim alanından çıkıldı")
        
        // Etkileşim durumunu güncelle
        this.isNearInteractionArea = false
        
        // Kullanım ipucunu kaldır
        this.hideInteractionHint()
      })
      
      console.log("GreenBox etkileşim alanı başarıyla eklendi")
    } catch (error) {
      console.error("GreenBox etkileşim alanı eklenirken hata oluştu:", error)
    }
  }
  
  // Kullanıcıya etkileşim ipucu göster
  showInteractionHint() {
    // Eğer ipucu zaten gösteriliyorsa tekrar oluşturma
    if (document.getElementById('interaction-hint')) return;
    
    // Etkileşim ipucu div'i oluştur
    const hintDiv = document.createElement('div');
    hintDiv.id = 'interaction-hint';
    hintDiv.style.position = 'fixed';
    hintDiv.style.bottom = '20px';
    hintDiv.style.left = '50%';
    hintDiv.style.transform = 'translateX(-50%)';
    hintDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hintDiv.style.color = 'white';
    hintDiv.style.padding = '10px 20px';
    hintDiv.style.borderRadius = '5px';
    hintDiv.style.fontFamily = 'Arial, sans-serif';
    hintDiv.style.zIndex = '1000';
    hintDiv.style.pointerEvents = 'none';
    hintDiv.textContent = 'GreenBox ile etkileşim için ENTER tuşuna basın';
    
    // Sayfaya ekle
    document.body.appendChild(hintDiv);
  }
  
  // Etkileşim ipucunu kaldır
  hideInteractionHint() {
    const hintDiv = document.getElementById('interaction-hint');
    if (hintDiv) {
      document.body.removeChild(hintDiv);
    }
  }
  
  // Popup'ı görüntüle - Enter tuşu ile çağrılır
  showPopUp() {
    // Ana popup container'ı oluştur - tüm ekranı kaplar
    const popupContainer = document.createElement("div")
    popupContainer.style.position = "fixed"          // Sabit pozisyon
    popupContainer.style.top = "0"                   // Üstten sıfır
    popupContainer.style.left = "0"                  // Soldan sıfır
    popupContainer.style.width = "100%"              // Tam genişlik
    popupContainer.style.height = "100%"             // Tam yükseklik
    popupContainer.style.display = "flex"            // Flexbox düzeni
    popupContainer.style.justifyContent = "center"   // Yatay ortalama
    popupContainer.style.alignItems = "center"       // Dikey ortalama
    popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)"  // Yarı saydam siyah arka plan
    popupContainer.style.zIndex = "9999"             // En üstte göster

    // İçerik kutusu - görsel ve butonlar burada olacak
    const popupBox = document.createElement("div")
    popupBox.style.position = "relative"             // Göreceli konum
    popupBox.style.backgroundColor = "white"         // Beyaz arka plan
    popupBox.style.padding = "20px"                  // İç boşluk
    popupBox.style.borderRadius = "8px"              // Köşe yuvarlatma
    popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)"  // Gölge efekti
    popupBox.style.maxWidth = "90%"                  // Maksimum genişlik
    popupBox.style.maxHeight = "90vh"                // Maksimum yükseklik
    popupBox.style.overflow = "auto"                 // Gerekirse kaydırma çubuğu
    popupBox.style.textAlign = "center"              // İçeriği ortala
    
    // Popup başlığı oluştur
    const title = document.createElement("h2")       // H2 başlık elementi
    title.textContent = "Arkaplan Seçin"             // Başlık metni
    title.style.marginBottom = "20px"                // Alt boşluk
    popupBox.appendChild(title)                      // Başlığı kutuya ekle
    
    // Görseller için galeri container'ı oluştur
    const imageGallery = document.createElement("div")
    imageGallery.style.display = "flex"              // Flexbox düzeni
    imageGallery.style.flexWrap = "wrap"             // Gerekirse alt satıra geç
    imageGallery.style.justifyContent = "center"     // Yatay ortala
    imageGallery.style.gap = "15px"                  // Öğeler arası boşluk
    imageGallery.style.marginBottom = "20px"         // Alt boşluk
    
    // Kullanılacak görsel dosyalarını ve başlıklarını tanımla
    const imageFiles = [
      { src: "/models/greenBoximage/lake_greenscreen.webp", title: "Göl" },
      { src: "/models/greenBoximage/iceland_greenscreen.webp", title: "İzlanda" },
      { src: "/models/greenBoximage/desert_greenscreen_.webp", title: "Çöl" }
    ]
    
    // Her bir görsel için döngü oluştur
    imageFiles.forEach(imgData => {
      // Her görsel için dış container
      const imageContainer = document.createElement("div")
      imageContainer.style.width = "200px"           // Genişlik
      imageContainer.style.marginBottom = "10px"     // Alt boşluk
      imageContainer.style.cursor = "pointer"        // İmleç şekli - tıklanabilir
      
      // Görsel elementi
      const image = document.createElement("img")
      image.src = imgData.src                        // Görsel kaynağı
      image.style.width = "100%"                     // Container'a göre tam genişlik
      image.style.height = "auto"                    // Otomatik yükseklik (oran korunur)
      image.style.borderRadius = "4px"               // Köşe yuvarlatma
      image.style.transition = "transform 0.2s"      // Animasyon için geçiş efekti
      image.alt = imgData.title                      // Alternatif metin (erişilebilirlik)
      
      // Görsel etiketi/başlığı
      const imageLabel = document.createElement("div")
      imageLabel.textContent = imgData.title         // Etiket metni
      imageLabel.style.marginTop = "5px"             // Üst boşluk
      
      // Fareyle üzerine gelindiğinde büyütme efekti
      imageContainer.addEventListener("mouseover", () => {
        image.style.transform = "scale(1.05)"        // %5 büyüt
      })
      
      // Fare ayrıldığında normal boyuta dön
      imageContainer.addEventListener("mouseout", () => {
        image.style.transform = "scale(1)"           // Normal boyut
      })
      
      // Görsele tıklama olayı - texture'ı değiştir ve popup'ı kapat
      imageContainer.addEventListener("click", () => {
        this.applyTexture(imgData.src)               // Seçilen texture'ı uygula
        document.body.removeChild(popupContainer)    // Popup'ı kapat
      })
      
      // Görsel ve etiketi container'a ekle
      imageContainer.appendChild(image)
      imageContainer.appendChild(imageLabel)
      imageGallery.appendChild(imageContainer)       // Galeri container'ına ekle
    })
    
    // Galeriyi popup kutusuna ekle
    popupBox.appendChild(imageGallery)

    // Kapatma butonu oluştur
    const closeButton = document.createElement("button")
    closeButton.textContent = "Kapat"                // Buton metni
    closeButton.style.padding = "10px 20px"          // İç boşluk
    closeButton.style.border = "none"                // Kenarlık yok
    closeButton.style.backgroundColor = "#e0e0e0"    // Gri arka plan
    closeButton.style.color = "#333"                 // Koyu gri metin
    closeButton.style.cursor = "pointer"             // İmleç şekli - tıklanabilir
    closeButton.style.borderRadius = "5px"           // Köşe yuvarlatma
    closeButton.style.fontSize = "14px"              // Font boyutu
    closeButton.style.display = "block"              // Blok element
    closeButton.style.margin = "0 auto"              // Yatay ortalama

    // Kapatma butonu tıklama olayı
    closeButton.addEventListener("click", () => {
      document.body.removeChild(popupContainer)      // Popup'ı DOM'dan kaldır
    })

    // Popup dışına tıklamayla kapatma - arka plan tıklamaları
    popupContainer.addEventListener("click", (event) => {
      if (event.target === popupContainer) {         // Sadece arka plana tıklandığında
        document.body.removeChild(popupContainer)    // Popup'ı kapat
      }
    })

    // Tüm elementleri ana container'a ekle
    popupBox.appendChild(closeButton)                // Buton ekle
    popupContainer.appendChild(popupBox)             // İçerik kutusunu ana container'a ekle
    document.body.appendChild(popupContainer)        // Popup'ı sayfaya ekle
  }
  
  // Texture uygulama fonksiyonu - seçilen görseli GreenBox'a uygula
  applyTexture(texturePath) {
    console.log("Texture uygulanıyor:", texturePath)
    
    // GreenBox nesnesini bul
    let greenBox = null
    
    // Objects içinde GreenBox'ı ara
    if (this.objects && this.objects.items) {
      // Tüm nesneler içinde döngü oluştur
      for (const key in this.objects.items) {
        const item = this.objects.items[key]
        // greenBox_mainModel isimli nesneyi bul
        if (item && item.container && item.container.name === "greenBox_mainModel") {
          greenBox = item.container
          console.log("GreenBox bulundu")
          break
        }
      }
    }

    if (greenBox) {
      // GreenBox'ın ön duvarını (greenscreen) bul
      const frontWall = greenBox.children.find(child => 
        child.isMesh && child.name === "greenBox_pureUc"  // İsimlendirmeye göre filtreleme
      )
      
      if (frontWall) {
        // Three.js texture yükleyici oluştur
        const textureLoader = new THREE.TextureLoader()
        // Seçilen texture'ı yükle
        textureLoader.load(
          texturePath,                             // Dosya yolu
          (texture) => {
            // Texture başarıyla yüklendiğinde
            // Texture ayarlarını yapılandır
            texture.wrapS = THREE.RepeatWrapping    // Yatay sarma modu
            texture.wrapT = THREE.RepeatWrapping    // Dikey sarma modu
            texture.repeat.set(1, 1)                // Tekrarlama ayarı (x, y)
            
            // Yeni 3B materyal oluştur
            const newMaterial = new THREE.MeshStandardMaterial({
              map: texture,                        // Texture'ı materyal haritasına ata
              metalness: 0.3,                      // Metalik özellik derecesi
              roughness: 0.4                       // Pürüzlülük derecesi
            })
            
            // Duvarın materyalini güncelle
            frontWall.material = newMaterial       // Yeni materyal ata
            frontWall.material.needsUpdate = true  // Material güncellemesini zorla
            console.log("Texture uygulandı")
          },
          undefined,                               // Yükleme ilerleme callback'i (kullanılmıyor)
          (error) => {
            // Hata durumunda
            console.error("Texture yüklenirken hata oluştu:", error)
          }
        )
      } else {
        console.error("Front wall bulunamadı!")
      }
    } else {
      console.error("GreenBox bulunamadı!")
    }
  }
} 