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
    
    // Bina tipleri ve her bina için popup konfigürasyonu
    this.buildingConfigs = {
      
      sosyalino: {
        position: new THREE.Vector2(64, 17),
        title: "Sosyal İnovasyon Ajansı",
        type: "info", // bilgi tipi popup
        url: "www.sosyalinovasyonajansi.com",
        description: "Sosyal İnovasyon Ajansı, toplumsal sorunlara yenilikçi çözümler geliştiren ve sürdürülebilir projeler üreten bir organizasyondur. Daha fazla bilgi için web sitemizi ziyaret edin."
      },
      bilimMerkezi: {
        position: new THREE.Vector2(26, 17),
        title: "Bilim Merkezi",
        type: "info", // bilgi tipi popup
        url: "www.bilimmerkezi.org.tr",
        description: "Konya Bilim Merkezi, bilim ve teknolojiyi halka sevdiren ve anlaşılır kılan, deneysel ve uygulamalı bir eğitim ortamıdır. Ziyaretçilerin bilimi yaşayarak ve eğlenerek öğrenmelerine imkân sağlar."
      },
      kapsul: {
        position: new THREE.Vector2(38, -7),
        title: "Kapsül",
        type: "info", // bilgi tipi popup
        url: "www.kapsul.org.tr",
        description: "Kapsül hakkında daha fazla bilgi edinmek için web sitemizi ziyaret edin."
      },
      stadyum: {
        position: new THREE.Vector2(32, -55),
        title: "Konya Büyükşehir Stadyumu",
        type: "info", // bilgi tipi popup
        url: "stadyum.konya.bel.tr",
        description: "Konya Büyükşehir Stadyumu, Konya'nın merkezinde yer alan, modern bir spor kompleksidir. Futbol maçları ve diğer spor etkinlikleri için kullanılmaktadır."
      },
      divizyonBina: {
        position: new THREE.Vector2(-61, -3),
        title: "Divizyon Bina",
        type: "info", // bilgi tipi popup
        url: "www.divizyon.org",
        description: "Divizyon Bina, Konya'nın önemli kültür ve sanat merkezlerinden biridir. Çeşitli etkinlikler ve sergiler için kullanılmaktadır."
      },
      konyaGencKart: {
        position: new THREE.Vector2(-5, 22),
        title: "Konya Genç Kart",
        type: "info", // bilgi tipi popup
        url: "genckultur.com",
        description: "Konya Genç Kart hakkında daha fazla bilgi almak için web sitemizi ziyaret edin."
      },
      japonparki: {
        position: new THREE.Vector2(2, -25),
        title: "Japon Parkı",
        type: "info", // bilgi tipi popup
        url: "www.konya.bel.tr/hizmet-binalari-ve-sosyal-tesisler/japon-parki",
        description: "Japon Parkı, Konya'nın merkezinde yer alan, Japon kültürünü yansıtan özel bir parktır. Japon bahçe sanatının örneklerini barındırır."
      },
      kelebeklervadisi: {
        position: new THREE.Vector2(60, 3),
        title: "Kelebekler Vadisi",
        type: "info", // bilgi tipi popup
        url: "konyatropikalkelebekbahcesi.com/tr",
        description: "Kelebekler Vadisi, Konya'nın doğal güzelliklerinden biridir. Çeşitli kelebek türlerine ev sahipliği yapmaktadır."
      },     
      alaaddinTepesi: {
        position: new THREE.Vector2(15, -21),
        title: "Alaaddin Tepesi",
        type: "info", // bilgi tipi popup
        url: "kilicarslanyarisma.konya.bel.tr",
        description: "Alaaddin Tepesi, Konya'nın merkezinde yer alan tarihi bir tepedir. Selçuklu döneminden kalma önemli eserleri barındırır."
      },

      calisanGenclikMerkezi: {
        position: new THREE.Vector2(68, -32),
        title: "Çalışan Gençlik Merkezi",
        type: "info", // bilgi tipi popup
        url: "konya.bel.tr/calisan-genclik",
        description: "Çalışan Gençlik Merkezi, Konya'daki gençlerin eğitim ve sosyal gelişimini desteklemek için kurulmuş bir merkezdir."
      },
      // Diğer binalar için buraya ekleyebilirsiniz
    }
    
    // Tüm binalar için popup alanları oluştur
    this.setupAllPopups()
    
    // Enter tuşu basımını dinlemek için event listener ekle
    this.addKeyboardListener()
  }
  
  // Tüm binaların popup alanlarını hazırla
  setupAllPopups() {
    this.popupAreas = {}
    this.currentBuildingType = null
    
    // Her bina tipi için popup alanı oluştur
    for (const buildingType in this.buildingConfigs) {
      this.setupPopupForBuilding(buildingType)
    }
  }
  
  // Belirli bir bina tipi için popup alanı oluştur
  setupPopupForBuilding(buildingType) {
    const config = this.buildingConfigs[buildingType]
    
    // Etkileşim alanı varsa, etkileşim alanı ekle
    if (this.areas) {
      try {
        // 2B etkileşim alanı oluştur - kesinlikle beyaz zemin ile aynı boyutta olsun
        const popupArea = this.areas.add({
          position: config.position,
          halfExtents: new THREE.Vector2(1.95, 1.95), // Biraz daha küçük yaparak taşmayı engelleyelim
        })
        
        // Etkileşim alanı görünürlüğünü azalt - sadece beyaz zeminde olsun
        popupArea.floorBorder.material.uniforms.uAlpha.value = 0
        popupArea.fence.material.uniforms.uBorderAlpha.value = 0
        popupArea.fence.material.uniforms.uStrikeAlpha.value = 0

        // İnfo butonu için texture yükle
        const textureLoader = new THREE.TextureLoader()
        const infoTexture = textureLoader.load('/models/infobutton/info_BG.png')
        
        // İnfo butonu için mesh oluştur - etkileşim alanı üzerine yerleştir, tam aynı boyutta
        const areaLabelMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 11), // Etkileşim alanı ile tam aynı boyutta
          new THREE.MeshBasicMaterial({
            map: infoTexture,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
          })
        )
        
        // Butonu etkileşim alanı üzerine yerleştir
        areaLabelMesh.position.set(config.position.x, config.position.y, 0.02) // Zemine çok yakın
        areaLabelMesh.rotation.x = Math.PI // Yatay olarak yerleştir (zemine paralel)
        areaLabelMesh.matrixAutoUpdate = false
        areaLabelMesh.updateMatrix()
        this.container.add(areaLabelMesh)

        // Beyaz zemin kontrolünü ekle - isOnWhiteFloor fonksiyonunu override ederek
        popupArea.isOnWhiteFloor = function() {
          // Burada, etkileşim alanı bu objenin tam kendi boyutlarında
          // ve sadece beyaz zemin üzerinde olduğu için her zaman true dönebiliriz
          return true
        }

        // Etkileşim olayları tanımla
        popupArea.on("in", () => {
          console.log(`${buildingType} etkileşim alanına girildi`)
          this.currentBuildingType = buildingType
          this.isNearInteractionArea = true
        })
        
        popupArea.on("out", () => {
          console.log(`${buildingType} etkileşim alanından çıkıldı`)
          this.isNearInteractionArea = false
          this.currentBuildingType = null
        })
        
        // Popupları tutan nesneye ekle
        this.popupAreas[buildingType] = popupArea
        
        console.log(`${buildingType} için popup alanı başarıyla eklendi`)
      } catch (error) {
        console.error(`${buildingType} için popup alanı eklenirken hata oluştu:`, error)
      }
    }
  }
  
  // Klavye dinleyicisi ekle - Enter tuşu için
  addKeyboardListener() {
    // Enter tuşu dinleyicisi
    this.keyDownHandler = (event) => {
      // Enter tuşuna basıldığında (Tuş kodu 13)
      if (event.keyCode === 13 || event.key === "Enter") {
        // Etkileşim alanı yakında mı kontrol et
        if (this.isNearInteractionArea && this.currentBuildingType) {
          // Geçerli bina tipine göre popup göster
          this.showPopUp(this.currentBuildingType)
          
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
  
  // Popup'ı görüntüle - Enter tuşu ile çağrılır
  showPopUp(buildingType) {
    // Bina konfigürasyonunu al
    const config = this.buildingConfigs[buildingType]
    if (!config) {
      console.error(`${buildingType} için konfigürasyon bulunamadı!`)
      return
    }
    
    // Popup tipine göre farklı içerik göster
    if (config.type === "gallery") {
      this.showGalleryPopUp(buildingType, config)
    } else if (config.type === "info") {
      this.showInfoPopUp(buildingType, config)
    }
  }
  
  // Galeri tipi popup göster (GreenBox için)
  showGalleryPopUp(buildingType, config) {
    // Ana popup container'ı oluştur - tüm ekranı kaplar
    const popupContainer = document.createElement("div");
    popupContainer.style.position = "fixed";
    popupContainer.style.top = "0";
    popupContainer.style.left = "0";
    popupContainer.style.width = "100%";
    popupContainer.style.height = "100%";
    popupContainer.style.display = "flex";
    popupContainer.style.justifyContent = "center";
    popupContainer.style.alignItems = "center";
    popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    popupContainer.style.zIndex = "9999";

    // İçerik kutusu - görsel ve butonlar burada olacak
    const popupBox = document.createElement("div");
    popupBox.style.position = "relative";
    popupBox.style.backgroundColor = "white";
    popupBox.style.padding = "20px";
    popupBox.style.borderRadius = "8px";
    popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";
    popupBox.style.maxWidth = "90%";
    popupBox.style.maxHeight = "90vh";
    popupBox.style.overflow = "auto";
    popupBox.style.textAlign = "center";
    
    // Popup başlığı oluştur
    const title = document.createElement("h2");
    title.textContent = config.title;
    title.style.marginBottom = "20px";
    popupBox.appendChild(title);
    
    // Görseller için galeri container'ı oluştur
    const imageGallery = document.createElement("div");
    imageGallery.style.display = "flex";
    imageGallery.style.flexWrap = "wrap";
    imageGallery.style.justifyContent = "center";
    imageGallery.style.gap = "15px";
    imageGallery.style.marginBottom = "20px";
    
    // Her bir görsel için döngü oluştur
    config.images.forEach(imgData => {
      // Her görsel için dış container
      const imageContainer = document.createElement("div");
      imageContainer.style.width = "200px";
      imageContainer.style.marginBottom = "10px";
      imageContainer.style.cursor = "pointer";
      
      // Görsel elementi
      const image = document.createElement("img");
      image.src = imgData.src;
      image.style.width = "100%";
      image.style.height = "auto";
      image.style.borderRadius = "4px";
      image.style.transition = "transform 0.2s";
      image.alt = imgData.title;
      
      // Görsel etiketi/başlığı
      const imageLabel = document.createElement("div");
      imageLabel.textContent = imgData.title;
      imageLabel.style.marginTop = "5px";
      
      // Fareyle üzerine gelindiğinde büyütme efekti
      imageContainer.addEventListener("mouseover", () => {
        image.style.transform = "scale(1.05)";
      });
      
      // Fare ayrıldığında normal boyuta dön
      imageContainer.addEventListener("mouseout", () => {
        image.style.transform = "scale(1)";
      });
      
      // Görsele tıklama olayı - bina tipine özel fonksiyonu çağır
      imageContainer.addEventListener("click", () => {
        config.applyFunction(imgData.src, buildingType);
        document.body.removeChild(popupContainer);
      });
      
      // Görsel ve etiketi container'a ekle
      imageContainer.appendChild(image);
      imageContainer.appendChild(imageLabel);
      imageGallery.appendChild(imageContainer);
    });
    
    // Galeriyi popup kutusuna ekle
    popupBox.appendChild(imageGallery);

    // Kapatma butonu oluştur
    const closeButton = document.createElement("button");
    closeButton.textContent = "Kapat";
    closeButton.style.padding = "10px 20px";
    closeButton.style.border = "none";
    closeButton.style.backgroundColor = "#e0e0e0";
    closeButton.style.color = "#333";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "5px";
    closeButton.style.fontSize = "14px";
    closeButton.style.display = "block";
    closeButton.style.margin = "0 auto";

    // Kapatma butonu tıklama olayı
    closeButton.addEventListener("click", () => {
      document.body.removeChild(popupContainer);
    });

    // Popup dışına tıklamayla kapatma - arka plan tıklamaları
    popupContainer.addEventListener("click", (event) => {
      if (event.target === popupContainer) {
        document.body.removeChild(popupContainer);
      }
    });

    // Tüm elementleri ana container'a ekle
    popupBox.appendChild(closeButton);
    popupContainer.appendChild(popupBox);
    document.body.appendChild(popupContainer);
  }
  
  // Bilgi tipi popup göster (diğer binalar için)
  showInfoPopUp(buildingType, config) {
    // Ana popup container'ı oluştur - tüm ekranı kaplar
    const popupContainer = document.createElement("div");
    popupContainer.style.position = "fixed";
    popupContainer.style.top = "0";
    popupContainer.style.left = "0";
    popupContainer.style.width = "100%";
    popupContainer.style.height = "100%";
    popupContainer.style.display = "flex";
    popupContainer.style.justifyContent = "center";
    popupContainer.style.alignItems = "center";
    popupContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    popupContainer.style.zIndex = "9999";

    // İçerik kutusu
    const popupBox = document.createElement("div");
    popupBox.style.position = "relative";
    popupBox.style.backgroundColor = "white";
    popupBox.style.padding = "30px";
    popupBox.style.borderRadius = "8px";
    popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)";
    popupBox.style.maxWidth = "500px";
    popupBox.style.width = "80%";
    popupBox.style.textAlign = "center";
    
    // Popup başlığı oluştur
    const title = document.createElement("h2");
    title.textContent = config.title;
    title.style.marginBottom = "20px";
    title.style.color = "#333";
    title.style.fontSize = "24px";
    popupBox.appendChild(title);
    
    // Açıklama metni
    const description = document.createElement("p");
    description.textContent = config.description;
    description.style.marginBottom = "25px";
    description.style.fontSize = "16px";
    description.style.lineHeight = "1.5";
    description.style.color = "#555";
    popupBox.appendChild(description);
    
    // URL bağlantısı
    const urlLink = document.createElement("a");
    urlLink.textContent = config.url;
    urlLink.href = "https://" + config.url;
    urlLink.target = "_blank";
    urlLink.style.display = "inline-block";
    urlLink.style.marginBottom = "25px";
    urlLink.style.color = "#0066cc";
    urlLink.style.fontSize = "18px";
    urlLink.style.textDecoration = "none";
    urlLink.style.fontWeight = "bold";
    
    // Bağlantı hover efekti
    urlLink.addEventListener("mouseover", () => {
      urlLink.style.textDecoration = "underline";
    });
    
    urlLink.addEventListener("mouseout", () => {
      urlLink.style.textDecoration = "none";
    });
    
    popupBox.appendChild(urlLink);

    // Kapatma butonu oluştur
    const closeButton = document.createElement("button");
    closeButton.textContent = "Kapat";
    closeButton.style.padding = "10px 25px";
    closeButton.style.border = "none";
    closeButton.style.backgroundColor = "#e0e0e0";
    closeButton.style.color = "#333";
    closeButton.style.cursor = "pointer";
    closeButton.style.borderRadius = "5px";
    closeButton.style.fontSize = "16px";
    closeButton.style.display = "block";
    closeButton.style.margin = "0 auto";
    closeButton.style.transition = "background-color 0.2s";
    
    // Buton hover efekti
    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = "#d0d0d0";
    });
    
    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "#e0e0e0";
    });

    // Kapatma butonu tıklama olayı
    closeButton.addEventListener("click", () => {
      document.body.removeChild(popupContainer);
    });

    // Popup dışına tıklamayla kapatma - arka plan tıklamaları
    popupContainer.addEventListener("click", (event) => {
      if (event.target === popupContainer) {
        document.body.removeChild(popupContainer);
      }
    });

    // Tüm elementleri ana container'a ekle
    popupBox.appendChild(closeButton);
    popupContainer.appendChild(popupBox);
    document.body.appendChild(popupContainer);
  }
} 