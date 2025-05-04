import * as THREE from 'three'
import CANNON from 'cannon'

export default class PlaygroundSection
{
    constructor(_options)
    {
        // Options
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.areas = _options.areas
        this.walls = _options.walls
        this.tiles = _options.tiles
        this.debug = _options.debug
        this.x = _options.x
        this.y = _options.y
        this.physics = _options.physics // Physics motoru eklendi
        
        // Gol metni için flag
        this.goalScored = false
        this.goalTextShown = false
        this.goalTextTimer = null

        // Debug
        if(this.debug)
        {
            this.debugFolder = this.debug.addFolder('playgroundSection')
            // this.debugFolder.open()
        }

        // Set up
        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.resources.items.areaResetTexture.magFilter = THREE.NearestFilter
        this.resources.items.areaResetTexture.minFilter = THREE.LinearFilter

        // Sadece bowling alanını etkinleştir
        // this.setStatic()
        // this.setBricksWalls()
        this.setBowling()
        
        // Gol metni oluştur ama henüz gösterme
        this.createGoalText()
    }

    setStatic()
    {
        // Diğer nesneleri geri getirmemek için etkisizleştirildi
        /*
        this.objects.add({
            base: this.resources.items.playgroundStaticBase.scene,
            collision: this.resources.items.playgroundStaticCollision.scene,
            floorShadowTexture: this.resources.items.playgroundStaticFloorShadowTexture,
            offset: new THREE.Vector3(this.x, this.y, 0),
            mass: 0
        })
        */
    }

    setBricksWalls()
    {
        // Diğer nesneleri geri getirmemek için etkisizleştirildi
        /*
        // Set up
        this.brickWalls = {}
        this.brickWalls.x = this.x + 15
        this.brickWalls.y = this.y + 14
        this.brickWalls.items = []

        // Brick options
        this.brickWalls.brickOptions = {
            base: this.resources.items.brickBase.scene,
            collision: this.resources.items.brickCollision.scene,
            offset: new THREE.Vector3(0, 0, 0.1),
            rotation: new THREE.Euler(0, 0, 0),
            duplicated: true,
            shadow: { sizeX: 1.2, sizeY: 1.8, offsetZ: - 0.15, alpha: 0.35 },
            mass: 0.5,
            soundName: 'brick'
        }

        this.brickWalls.items.push(
            this.walls.add({
                object: this.brickWalls.brickOptions,
                shape:
                {
                    type: 'rectangle',
                    widthCount: 5,
                    heightCount: 6,
                    position: new THREE.Vector3(this.brickWalls.x - 6, this.brickWalls.y, 0),
                    offsetWidth: new THREE.Vector3(0, 1.05, 0),
                    offsetHeight: new THREE.Vector3(0, 0, 0.45),
                    randomOffset: new THREE.Vector3(0, 0, 0),
                    randomRotation: new THREE.Vector3(0, 0, 0.4)
                }
            }),
            this.walls.add({
                object: this.brickWalls.brickOptions,
                shape:
                {
                    type: 'brick',
                    widthCount: 5,
                    heightCount: 6,
                    position: new THREE.Vector3(this.brickWalls.x - 12, this.brickWalls.y, 0),
                    offsetWidth: new THREE.Vector3(0, 1.05, 0),
                    offsetHeight: new THREE.Vector3(0, 0, 0.45),
                    randomOffset: new THREE.Vector3(0, 0, 0),
                    randomRotation: new THREE.Vector3(0, 0, 0.4)
                }
            }),
            this.walls.add({
                object: this.brickWalls.brickOptions,
                shape:
                {
                    type: 'triangle',
                    widthCount: 6,
                    position: new THREE.Vector3(this.brickWalls.x - 18, this.brickWalls.y, 0),
                    offsetWidth: new THREE.Vector3(0, 1.05, 0),
                    offsetHeight: new THREE.Vector3(0, 0, 0.45),
                    randomOffset: new THREE.Vector3(0, 0, 0),
                    randomRotation: new THREE.Vector3(0, 0, 0.4)
                }
            })
        )

        // Reset
        this.brickWalls.reset = () =>
        {
            for(const _wall of this.brickWalls.items)
            {
                for(const _brick of _wall.items)
                {
                    _brick.collision.reset()
                }
            }
        }

        // Reset area
        this.brickWalls.resetArea = this.areas.add({
            position: new THREE.Vector2(this.brickWalls.x, this.brickWalls.y),
            halfExtents: new THREE.Vector2(2, 2)
        })
        this.brickWalls.resetArea.on('interact', () =>
        {
            this.brickWalls.reset()
        })

        // Reset label
        this.brickWalls.areaLabelMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, color: 0xffffff, alphaMap: this.resources.items.areaResetTexture }))
        this.brickWalls.areaLabelMesh.position.x = this.brickWalls.x
        this.brickWalls.areaLabelMesh.position.y = this.brickWalls.y
        this.brickWalls.areaLabelMesh.matrixAutoUpdate = false
        this.brickWalls.areaLabelMesh.updateMatrix()
        this.container.add(this.brickWalls.areaLabelMesh)

        // Debug
        if(this.debugFolder)
        {
            this.debugFolder.add(this.brickWalls, 'reset').name('brickWalls reset')
        }
        */
    }

    setBowling()
    {
        this.bowling = {}
        // Bowling alanını (-10, -10) konumuna taşı
        this.bowling.x = -10
        this.bowling.y = -10

        // Lobutlar kaldırıldı
        
        // Lobutların yerine 3D çerçeve ekle
        this.add3DFrame()

        // Bowling topunu yarı boyutta küre ile değiştir
        this.addSmallSphere()
        
        // "Tekrar!" yazılı özel texture oluştur
        this.createTekrarTexture();

        // Reset area
        this.bowling.resetArea = this.areas.add({
            position: new THREE.Vector2(this.bowling.x + 10, this.bowling.y),
            halfExtents: new THREE.Vector2(2, 2)
        })
        
        // Reset alanın dış çerçevesini yeşil yap
        this.bowling.resetArea.floorBorder.material.uniforms.uColor.value = new THREE.Color(0x00aa00)
        
        // Shader material klonlama ve özelleştirme
        // Orijinal fence shader material'ini klonla
        const originalMaterial = this.bowling.resetArea.fence.material;
        const greenMaterial = originalMaterial.clone();
        
        // Fence shader'ını özelleştir - yeşil renk ekle
        // Fragment shader'ı değiştir - vec3(1.0) yerine vec3(0.0, 1.0, 0.0) kullan
        const fragmentShader = originalMaterial.fragmentShader.replace(
            'gl_FragColor = vec4(vec3(1.0), alpha);',
            'gl_FragColor = vec4(vec3(0.0, 1.0, 0.0), alpha);'
        );
        
        greenMaterial.fragmentShader = fragmentShader;
        
        // Uniform değerlerini kopyala
        greenMaterial.uniforms = THREE.UniformsUtils.clone(originalMaterial.uniforms);
        
        // Yeni material'i fence'e atama
        this.bowling.resetArea.fence.mesh.material = greenMaterial;
        
        // Zaman tick'ini kopyala (orijinal material'deki time update'i çalışmayacak)
        this.time.on('tick', () => {
            greenMaterial.uniforms.uTime.value = this.time.elapsed;
        });
        
        this.bowling.resetArea.on('interact', () =>
        {
            this.bowling.reset()
            
            // Gol yazısını sıfırla
            this.resetGoalText()
        })

        // Reset label - yeşil renk olarak değiştirildi ve özel texture kullanılıyor
        this.bowling.areaLabelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5), 
            new THREE.MeshBasicMaterial({ 
                transparent: true, 
                depthWrite: false, 
                color: 0x00aa00, // Yeşil renk
                alphaMap: this.tekrarTexture  // Özel oluşturduğumuz texture
            })
        )
        this.bowling.areaLabelMesh.position.x = this.bowling.x + 10
        this.bowling.areaLabelMesh.position.y = this.bowling.y
        this.bowling.areaLabelMesh.matrixAutoUpdate = false
        this.bowling.areaLabelMesh.updateMatrix()
        this.container.add(this.bowling.areaLabelMesh)
        
        // Reset function
        this.bowling.reset = () =>
        {
            // Reset ball
            if(this.bowling.sphere && this.bowling.sphere.body)
            {
                // Pozisyonu sıfırla
                this.bowling.sphere.body.position.set(this.bowling.x + 5, this.bowling.y, 0.5);
                
                // Hızı sıfırla
                this.bowling.sphere.body.velocity.set(0, 0, 0);
                this.bowling.sphere.body.angularVelocity.set(0, 0, 0);
                
                // Uyandır
                this.bowling.sphere.body.wakeUp();
            }
            
            // Reset goal state
            this.resetGoalText()
        }
        
        // Her tick'te çarpışma kontrolü yap
        this.time.on('tick', () => {
            this.checkGoalCollision()
        })

        // Debug
        if(this.debugFolder)
        {
            this.debugFolder.add(this.bowling, 'reset').name('bowling reset')
        }
    }
    
    // "Tekrar!" yazılı texture oluştur
    createTekrarTexture() {
        // Canvas oluştur
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        
        // Context al
        const context = canvas.getContext('2d');
        
        // Arka planı temizle (transparan)
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Tekrar! yazısını ekle
        context.font = 'bold 72px Arial'; // Font boyutunu 2 katına çıkarttık (36px -> 72px)
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // Siyah çerçeve ekle
        context.strokeStyle = 'black';
        context.lineWidth = 8;
        context.strokeText('Tekrar!', canvas.width / 2, canvas.height / 2);
        
        // Ana metin rengini beyaz olarak ayarla
        context.fillStyle = 'white';
        context.fillText('Tekrar!', canvas.width / 2, canvas.height / 2);
        
        // Texture oluştur
        this.tekrarTexture = new THREE.Texture(canvas);
        this.tekrarTexture.magFilter = THREE.NearestFilter;
        this.tekrarTexture.minFilter = THREE.LinearFilter;
        this.tekrarTexture.needsUpdate = true;
    }
    
    // Yarı boyutunda küre ekle
    addSmallSphere()
    {
        // Bowling topu boyutunun yarısı (varsayılan bowling topu boyutu yaklaşık 1 birim)
        const sphereRadius = 0.5;
        
        // Küre için mavi materyal
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: 0x3366ff,
            metalness: 0.3,
            roughness: 0.2
        });
        
        // THREE.js için görsel mesh
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphereMesh.castShadow = true;
        sphereMesh.receiveShadow = true;
        
        // Bowling topunun konumunu ayarla
        const sphereX = this.bowling.x + 5;
        const sphereY = this.bowling.y;
        const sphereZ = sphereRadius; // Zeminden yarıçapı kadar yukarıda
        
        sphereMesh.position.set(sphereX, sphereY, sphereZ);
        this.container.add(sphereMesh);
        
        // Cannon.js için fiziksel nesne
        const sphereShape = new CANNON.Sphere(sphereRadius);
        const sphereBody = new CANNON.Body({
            mass: 1, // Bowling topu ile aynı kütle
            position: new CANNON.Vec3(sphereX, sphereY, sphereZ),
            shape: sphereShape,
            material: this.physics.materials.items.default,
            sleepSpeedLimit: 0.1,
            linearDamping: 0.3, // Sürtünme
            angularDamping: 0.3 // Dönüş sürtünmesi
        });
        
        // Fizik motoruna ekle
        this.physics.world.addBody(sphereBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.sphere = {
            mesh: sphereMesh,
            body: sphereBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula
            this.bowling.sphere.mesh.position.x = this.bowling.sphere.body.position.x;
            this.bowling.sphere.mesh.position.y = this.bowling.sphere.body.position.y;
            this.bowling.sphere.mesh.position.z = this.bowling.sphere.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.sphere.mesh.quaternion.x = this.bowling.sphere.body.quaternion.x;
            this.bowling.sphere.mesh.quaternion.y = this.bowling.sphere.body.quaternion.y;
            this.bowling.sphere.mesh.quaternion.z = this.bowling.sphere.body.quaternion.z;
            this.bowling.sphere.mesh.quaternion.w = this.bowling.sphere.body.quaternion.w;
        });
    }
    
    // Lobutların olduğu yerde fiziksel olarak 3D çerçeve oluşturma metodu
    add3DFrame()
    {
        // Dikdörtgen boyutları (lobutların bulunduğu alan)
        const rectWidth = 4; // Genişlik
        const rectHeight = 4; // Yükseklik
        const frameDepth = 3; // Çerçevenin yukarı uzanacağı yükseklik
        const postThickness = 0.2; // İnce dikey çubukların kalınlığı
        
        // Çerçeve pozisyonu (eski lobutların olduğu yer)
        const frameX = this.bowling.x - 10;
        const frameY = this.bowling.y;
        
        // Çerçeve için materyal (parlak kırmızı)
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xff0000, 
            metalness: 0.5,
            roughness: 0.3,
            emissive: 0xff0000,
            emissiveIntensity: 0.2
        });
        
        // Sadece iki adet ince dikey çubuk oluştur
        this.bowling.posts = [];
        
        // X ekseni üzerinde aynı noktada iki çubuk yerleştir
        // Biri alt, biri üst kısımda olacak
        const postPositions = [
            { x: frameX, y: frameY + rectHeight/2 }, // Üst çubuk
            { x: frameX, y: frameY - rectHeight/2 }  // Alt çubuk
        ];
        
        // Y ekseninden 2 birim ileride başka iki çubuk daha ekle
        const additionalPostPositions = [
            { x: frameX, y: frameY + rectHeight/2 + 2 },  // Üst çubuk + 2 birim pozisyonunu tut
            { x: frameX, y: frameY + rectHeight/2 + 2 - rectHeight * 2 }  // İki kat aşağı indirdim
        ];
        
        // Tüm pozisyonları birleştir
        const allPostPositions = [...postPositions, ...additionalPostPositions];
        
        // İçinden geçilemeyen fiziksel çubuklar oluştur
        allPostPositions.forEach((pos, index) => {
            // THREE.js için görsel mesh
            // Sadece eklenen çubuk için extra uzun geometri kullan
            const isExtraPost = index >= 2; // additionalPostPositions'daki tüm öğeler (indeks 2, 3, 4)
            
            // X ekseninde uzatılmış geometri veya normal geometri kullan
            const postGeometry = isExtraPost ? 
                new THREE.BoxGeometry(15, postThickness/2, frameDepth/2) : // X ekseninde 15 birim uzun, genişliği ve yüksekliği yarı yarıya azaltıldı
                new THREE.BoxGeometry(postThickness, postThickness, frameDepth);
                
            const postMesh = new THREE.Mesh(postGeometry, frameMaterial);
            
            // X ekseninde uzatılmış çubuğun konumunu ayarla
            if (isExtraPost) {
                // X ekseninde 7.5 birim sağa kaydır (çünkü çubuk merkezi etrafında oluşur, 15/2=7.5)
                postMesh.position.set(pos.x + 7.5, pos.y, frameDepth / 4); // Z pozisyonunu yarıya indirdim
            } else {
                postMesh.position.set(pos.x, pos.y, frameDepth / 2);
            }
            
            postMesh.castShadow = true;
            postMesh.receiveShadow = true;
            this.container.add(postMesh);
            
            // Cannon.js için fiziksel nesne
            // X ekseninde uzatılmış çubuk için farklı şekil oluştur
            const postShape = isExtraPost ?
                new CANNON.Box(new CANNON.Vec3(7.5, postThickness/4, frameDepth/4)) : // 15/2=7.5, genişliği ve yüksekliği yarı yarıya azaltıldı
                new CANNON.Box(new CANNON.Vec3(postThickness/2, postThickness/2, frameDepth/2));
            
            const postBody = new CANNON.Body({
                mass: 0, // Sabit, hareket etmez
                position: new CANNON.Vec3(
                    isExtraPost ? pos.x + 7.5 : pos.x, // Uzatılmış çubuğun pozisyonunu ayarla
                    pos.y,
                    isExtraPost ? frameDepth/4 : frameDepth/2 // Uzatılmış çubuğun Z pozisyonunu yarıya indirdim
                ),
                shape: postShape,
                material: this.physics.materials.items.default
            });
            
            // Fizik motoruna ekle
            this.physics.world.addBody(postBody);
            
            // Görsel mesh ile fiziksel nesneyi birbirine bağla
            const post = {
                mesh: postMesh,
                body: postBody,
                index: index
            };
            
            // Çubukları kaydet
            this.bowling.posts.push(post);
            
            // Time tick ile güncelleme
            this.time.on('tick', () => {
                // Body pozisyonunu mesh'e uygula (sabit olsa bile)
                post.mesh.position.x = post.body.position.x;
                post.mesh.position.y = post.body.position.y;
                post.mesh.position.z = post.body.position.z;
                
                // Quaternionu mesh'e uygula
                post.mesh.quaternion.x = post.body.quaternion.x;
                post.mesh.quaternion.y = post.body.quaternion.y;
                post.mesh.quaternion.z = post.body.quaternion.z;
                post.mesh.quaternion.w = post.body.quaternion.w;
            });
        });
        
        // Yarı boyutunda yatay çubuk ekle
        this.addHalfSizeHorizontalPost(frameX, frameY, frameDepth, postThickness, frameMaterial);
        
        // İkinci bir yatay çubuk ekle (alt çubukla aynı seviyede)
        this.addSecondHalfSizeHorizontalPost(frameX, frameY, frameDepth, postThickness, frameMaterial, rectHeight);
        
        // Eğimli uzun çubuk ekle
        this.addDiagonalPost(frameX, frameY, frameDepth, postThickness, frameMaterial, rectHeight);
        
        // İkinci eğimli uzun çubuk ekle (alt kısma)
        this.addSecondDiagonalPost(frameX, frameY, frameDepth, postThickness, frameMaterial, rectHeight);
        
        // Üstte yatay bağlantı çubuğu ekle
        // Bu çubuk iki dikey çubuğu üstten birleştirecek
        this.addTopConnector(frameX, frameY, rectHeight, postThickness, frameDepth, frameMaterial);
        
        // İkinci bir üst yatay bağlantı çubuğu ekle (x koordinatı 1/4 kadar azaltılmış)
        this.addSecondTopConnector(frameX, frameY, rectHeight, postThickness, frameDepth, frameMaterial);
        
        // Altta 2D çizgi ekle (sadece görsel, fiziksel değil)
        this.addBottomLine(frameX, frameY, rectHeight, postThickness);
        
        // Çubukları bowling objemize ekle
        this.bowling.frame = {
            posts: this.bowling.posts,
            topConnector: this.bowling.topConnector,
            secondTopConnector: this.bowling.secondTopConnector,
            bottomLine: this.bowling.bottomLine,
            horizontalPost: this.bowling.horizontalPost,
            secondHorizontalPost: this.bowling.secondHorizontalPost,
            diagonalPost: this.bowling.diagonalPost,
            secondDiagonalPost: this.bowling.secondDiagonalPost
        };
    }
    
    // Yarı boyutunda yatay çubuk ekleyen metot
    addHalfSizeHorizontalPost(frameX, frameY, frameDepth, postThickness, material) {
        // Yarı boyutunda yatay çubuğun özellikleri
        const halfPostLength = frameDepth / 2; // Yarı uzunluk
        const horizontalOffset = -1; // X ekseninde 1 birim sola kaydır (diğer çubukların 1 eksiği)
        
        // Diğer çubukların konumu ile uyumlu olması için y koordinatı üst çubukla aynı olacak
        const targetY = frameY + 4/2; // rectHeight/2 = 4/2
        
        // z koordinatını iki katına çıkar
        const targetZ = frameDepth; // frameDepth/2 * 2 = frameDepth
        
        // THREE.js için görsel mesh - yatay çubuk için
        const postGeometry = new THREE.BoxGeometry(halfPostLength, postThickness, postThickness);
        const postMesh = new THREE.Mesh(postGeometry, material);
        
        // Yatay çubuğu konumlandır - X'te azalt, Y diğer çubuklarla aynı, Z diğer çubuklarla aynı
        postMesh.position.set(
            frameX + horizontalOffset, // X konumu diğer çubukların 1 eksiği
            targetY, // Üst çubukla aynı y koordinatı
            targetZ // Z konumu iki katına çıkarıldı
        );
        
        postMesh.castShadow = true;
        postMesh.receiveShadow = true;
        this.container.add(postMesh);
        
        // Cannon.js için fiziksel nesne
        const postShape = new CANNON.Box(new CANNON.Vec3(
            halfPostLength/2, 
            postThickness/2, 
            postThickness/2
        ));
        
        const postBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                frameX + horizontalOffset,
                targetY,
                targetZ
            ),
            shape: postShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik motoruna ekle
        this.physics.world.addBody(postBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.horizontalPost = {
            mesh: postMesh,
            body: postBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.horizontalPost.mesh.position.x = this.bowling.horizontalPost.body.position.x;
            this.bowling.horizontalPost.mesh.position.y = this.bowling.horizontalPost.body.position.y;
            this.bowling.horizontalPost.mesh.position.z = this.bowling.horizontalPost.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.horizontalPost.mesh.quaternion.x = this.bowling.horizontalPost.body.quaternion.x;
            this.bowling.horizontalPost.mesh.quaternion.y = this.bowling.horizontalPost.body.quaternion.y;
            this.bowling.horizontalPost.mesh.quaternion.z = this.bowling.horizontalPost.body.quaternion.z;
            this.bowling.horizontalPost.mesh.quaternion.w = this.bowling.horizontalPost.body.quaternion.w;
        });
    }
    
    // İkinci yarı boyutunda yatay çubuğu ekleyen metot
    addSecondHalfSizeHorizontalPost(frameX, frameY, frameDepth, postThickness, material, rectHeight) {
        // Yarı boyutunda yatay çubuğun özellikleri
        const halfPostLength = frameDepth / 2; // Yarı uzunluk
        const horizontalOffset = -1; // X ekseninde 1 birim sola kaydır (diğer çubukların 1 eksiği)
        
        // Diğer çubukların konumu ile uyumlu olması için y koordinatı alt çubukla aynı olacak
        const targetY = frameY - rectHeight/2; // Alt çubuk ile aynı y koordinatı
        
        // z koordinatını iki katına çıkar
        const targetZ = frameDepth; // frameDepth/2 * 2 = frameDepth
        
        // THREE.js için görsel mesh - yatay çubuk için
        const postGeometry = new THREE.BoxGeometry(halfPostLength, postThickness, postThickness);
        const postMesh = new THREE.Mesh(postGeometry, material);
        
        // Yatay çubuğu konumlandır
        postMesh.position.set(
            frameX + horizontalOffset, // X konumu diğer çubukların 1 eksiği
            targetY, // Alt çubukla aynı y koordinatı
            targetZ // Z konumu iki katına çıkarıldı
        );
        
        postMesh.castShadow = true;
        postMesh.receiveShadow = true;
        this.container.add(postMesh);
        
        // Cannon.js için fiziksel nesne
        const postShape = new CANNON.Box(new CANNON.Vec3(
            halfPostLength/2, 
            postThickness/2, 
            postThickness/2
        ));
        
        const postBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                frameX + horizontalOffset,
                targetY,
                targetZ
            ),
            shape: postShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik motoruna ekle
        this.physics.world.addBody(postBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.secondHorizontalPost = {
            mesh: postMesh,
            body: postBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.secondHorizontalPost.mesh.position.x = this.bowling.secondHorizontalPost.body.position.x;
            this.bowling.secondHorizontalPost.mesh.position.y = this.bowling.secondHorizontalPost.body.position.y;
            this.bowling.secondHorizontalPost.mesh.position.z = this.bowling.secondHorizontalPost.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.secondHorizontalPost.mesh.quaternion.x = this.bowling.secondHorizontalPost.body.quaternion.x;
            this.bowling.secondHorizontalPost.mesh.quaternion.y = this.bowling.secondHorizontalPost.body.quaternion.y;
            this.bowling.secondHorizontalPost.mesh.quaternion.z = this.bowling.secondHorizontalPost.body.quaternion.z;
            this.bowling.secondHorizontalPost.mesh.quaternion.w = this.bowling.secondHorizontalPost.body.quaternion.w;
        });
    }
    
    // Eğimli uzun çubuk ekleyen metot
    addDiagonalPost(frameX, frameY, frameDepth, postThickness, material, rectHeight) {
        // Diagonal çubuğun özellikleri
        const diagonalLength = frameDepth * 1.5; // Daha uzun çubuk
        
        // Üst yatay çubuğun konumu (başlangıç noktası)
        const horizontalOffset = -1.5; // X eksenindeki ofset (0.5 birim daha azaltıldı)
        const startY = frameY + rectHeight/2; // Üst çubuk ile aynı y koordinatı
        const startZ = frameDepth; // Z konumu üst yatay çubukla aynı
        
        // Eğimli çubuğun başlangıç ve bitiş noktaları
        const startPoint = new THREE.Vector3(frameX + horizontalOffset, startY, startZ);
        // Bitiş noktası - zemine kadar (z=0), x ve y değişiyor
        const endPoint = new THREE.Vector3(frameX + horizontalOffset - 2, startY, 0);
        
        // Çubuğun yönünü hesapla
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
        
        // İki nokta arasındaki mesafe
        const distance = startPoint.distanceTo(endPoint);
        
        // THREE.js için görsel mesh - silindir kullanacağız
        const postGeometry = new THREE.CylinderGeometry(postThickness/2, postThickness/2, distance, 8);
        const postMesh = new THREE.Mesh(postGeometry, material);
        
        // Silindir varsayılan olarak Y ekseni boyunca uzanır, onu döndürmemiz gerekiyor
        // Döndürme için hedef ekseni hesapla (Y ekseninden hedef yöne)
        const yAxis = new THREE.Vector3(0, 1, 0);
        const rotationAxis = new THREE.Vector3().crossVectors(yAxis, direction).normalize();
        const angle = Math.acos(yAxis.dot(direction));
        
        // Silindirin ortasını başlangıç ve bitiş noktalarının ortasına yerleştir
        const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
        postMesh.position.copy(midPoint);
        
        // Silindiri yönlendirme
        postMesh.quaternion.setFromAxisAngle(rotationAxis, angle);
        
        postMesh.castShadow = true;
        postMesh.receiveShadow = true;
        this.container.add(postMesh);
        
        // Cannon.js için fiziksel nesne
        // NOT: Cannon.js ile eğimli bir silindiri doğrudan oluşturmak zor
        // Basit bir yaklaşım: Kutu şekli kullanma
        const postShape = new CANNON.Box(new CANNON.Vec3(
            postThickness/2, 
            distance/2, 
            postThickness/2
        ));
        
        const postBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                midPoint.x,
                midPoint.y,
                midPoint.z
            ),
            shape: postShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik gövdesini de döndür
        const cannonQuaternion = new CANNON.Quaternion();
        cannonQuaternion.setFromAxisAngle(
            new CANNON.Vec3(rotationAxis.x, rotationAxis.y, rotationAxis.z),
            angle
        );
        postBody.quaternion = cannonQuaternion;
        
        // Fizik motoruna ekle
        this.physics.world.addBody(postBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.diagonalPost = {
            mesh: postMesh,
            body: postBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.diagonalPost.mesh.position.x = this.bowling.diagonalPost.body.position.x;
            this.bowling.diagonalPost.mesh.position.y = this.bowling.diagonalPost.body.position.y;
            this.bowling.diagonalPost.mesh.position.z = this.bowling.diagonalPost.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.diagonalPost.mesh.quaternion.x = this.bowling.diagonalPost.body.quaternion.x;
            this.bowling.diagonalPost.mesh.quaternion.y = this.bowling.diagonalPost.body.quaternion.y;
            this.bowling.diagonalPost.mesh.quaternion.z = this.bowling.diagonalPost.body.quaternion.z;
            this.bowling.diagonalPost.mesh.quaternion.w = this.bowling.diagonalPost.body.quaternion.w;
        });
    }
    
    // İkinci eğimli uzun çubuk ekleyen metot
    addSecondDiagonalPost(frameX, frameY, frameDepth, postThickness, material, rectHeight) {
        // Diagonal çubuğun özellikleri
        const diagonalLength = frameDepth * 1.5; // Daha uzun çubuk
        
        // Üst yatay çubuğun konumu (başlangıç noktası)
        const horizontalOffset = -1.5; // X eksenindeki ofset (0.5 birim daha azaltıldı)
        const startY = frameY - rectHeight/2; // Alt çubuk ile aynı y koordinatı
        const startZ = frameDepth; // Z konumu üst yatay çubukla aynı
        
        // Eğimli çubuğun başlangıç ve bitiş noktaları
        const startPoint = new THREE.Vector3(frameX + horizontalOffset, startY, startZ);
        // Bitiş noktası - zemine kadar (z=0), x ve y değişiyor
        const endPoint = new THREE.Vector3(frameX + horizontalOffset - 2, startY, 0);
        
        // Çubuğun yönünü hesapla
        const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
        
        // İki nokta arasındaki mesafe
        const distance = startPoint.distanceTo(endPoint);
        
        // THREE.js için görsel mesh - silindir kullanacağız
        const postGeometry = new THREE.CylinderGeometry(postThickness/2, postThickness/2, distance, 8);
        const postMesh = new THREE.Mesh(postGeometry, material);
        
        // Silindir varsayılan olarak Y ekseni boyunca uzanır, onu döndürmemiz gerekiyor
        // Döndürme için hedef ekseni hesapla (Y ekseninden hedef yöne)
        const yAxis = new THREE.Vector3(0, 1, 0);
        const rotationAxis = new THREE.Vector3().crossVectors(yAxis, direction).normalize();
        const angle = Math.acos(yAxis.dot(direction));
        
        // Silindirin ortasını başlangıç ve bitiş noktalarının ortasına yerleştir
        const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5);
        postMesh.position.copy(midPoint);
        
        // Silindiri yönlendirme
        postMesh.quaternion.setFromAxisAngle(rotationAxis, angle);
        
        postMesh.castShadow = true;
        postMesh.receiveShadow = true;
        this.container.add(postMesh);
        
        // Cannon.js için fiziksel nesne
        // NOT: Cannon.js ile eğimli bir silindiri doğrudan oluşturmak zor
        // Basit bir yaklaşım: Kutu şekli kullanma
        const postShape = new CANNON.Box(new CANNON.Vec3(
            postThickness/2, 
            distance/2, 
            postThickness/2
        ));
        
        const postBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                midPoint.x,
                midPoint.y,
                midPoint.z
            ),
            shape: postShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik gövdesini de döndür
        const cannonQuaternion = new CANNON.Quaternion();
        cannonQuaternion.setFromAxisAngle(
            new CANNON.Vec3(rotationAxis.x, rotationAxis.y, rotationAxis.z),
            angle
        );
        postBody.quaternion = cannonQuaternion;
        
        // Fizik motoruna ekle
        this.physics.world.addBody(postBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.secondDiagonalPost = {
            mesh: postMesh,
            body: postBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.secondDiagonalPost.mesh.position.x = this.bowling.secondDiagonalPost.body.position.x;
            this.bowling.secondDiagonalPost.mesh.position.y = this.bowling.secondDiagonalPost.body.position.y;
            this.bowling.secondDiagonalPost.mesh.position.z = this.bowling.secondDiagonalPost.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.secondDiagonalPost.mesh.quaternion.x = this.bowling.secondDiagonalPost.body.quaternion.x;
            this.bowling.secondDiagonalPost.mesh.quaternion.y = this.bowling.secondDiagonalPost.body.quaternion.y;
            this.bowling.secondDiagonalPost.mesh.quaternion.z = this.bowling.secondDiagonalPost.body.quaternion.z;
            this.bowling.secondDiagonalPost.mesh.quaternion.w = this.bowling.secondDiagonalPost.body.quaternion.w;
        });
    }
    
    // Üstte yatay bağlantı çubuğu ekleyen metot
    addTopConnector(frameX, frameY, rectHeight, postThickness, frameDepth, material) {
        // Yatay çubuğun boyutları
        const connectorLength = rectHeight; // Üst ve alt çubuk arasındaki mesafe
        
        // THREE.js için görsel mesh
        // Çubuğu yatay olarak yerleştirmek için genişlik ve yüksekliği değiştir
        const connectorGeometry = new THREE.BoxGeometry(postThickness, connectorLength, postThickness);
        const connectorMesh = new THREE.Mesh(connectorGeometry, material);
        
        // Yatay çubuğu dikey çubukların üstünde konumlandır
        // X konumu aynı kalacak, Y konumu iki dikey çubuğun ortasında, Z konumu dikey çubukların üstünde
        connectorMesh.position.set(
            frameX, // X konumu değişmiyor
            frameY, // Y konumu iki dikey çubuğun ortasında
            frameDepth + postThickness/2 // Z konumu dikey çubukların üstünde
        );
        
        connectorMesh.castShadow = true;
        connectorMesh.receiveShadow = true;
        this.container.add(connectorMesh);
        
        // Cannon.js için fiziksel nesne
        const connectorShape = new CANNON.Box(new CANNON.Vec3(
            postThickness/2, 
            connectorLength/2, 
            postThickness/2
        ));
        
        const connectorBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                frameX,
                frameY,
                frameDepth + postThickness/2
            ),
            shape: connectorShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik motoruna ekle
        this.physics.world.addBody(connectorBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.topConnector = {
            mesh: connectorMesh,
            body: connectorBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.topConnector.mesh.position.x = this.bowling.topConnector.body.position.x;
            this.bowling.topConnector.mesh.position.y = this.bowling.topConnector.body.position.y;
            this.bowling.topConnector.mesh.position.z = this.bowling.topConnector.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.topConnector.mesh.quaternion.x = this.bowling.topConnector.body.quaternion.x;
            this.bowling.topConnector.mesh.quaternion.y = this.bowling.topConnector.body.quaternion.y;
            this.bowling.topConnector.mesh.quaternion.z = this.bowling.topConnector.body.quaternion.z;
            this.bowling.topConnector.mesh.quaternion.w = this.bowling.topConnector.body.quaternion.w;
        });
    }
    
    // İkinci üst yatay bağlantı çubuğu ekleyen metot
    addSecondTopConnector(frameX, frameY, rectHeight, postThickness, frameDepth, material) {
        // Yatay çubuğun boyutları
        const connectorLength = rectHeight; // Üst ve alt çubuk arasındaki mesafe
        
        // X koordinatını 1/4 kadar azalt ve 0.5 birim daha azalt (0.25 + 0.25)
        const offsetX = -connectorLength / 4 - 0.5; // 1/4 oranında azaltma + 0.5 birim daha
        
        // THREE.js için görsel mesh
        // Çubuğu yatay olarak yerleştirmek için genişlik ve yüksekliği değiştir
        const connectorGeometry = new THREE.BoxGeometry(postThickness, connectorLength, postThickness);
        const connectorMesh = new THREE.Mesh(connectorGeometry, material);
        
        // Yatay çubuğu üstte konumlandır, x pozisyonu azaltılmış
        connectorMesh.position.set(
            frameX + offsetX, // X konumu asıl çubuğun 1/4'ü kadar + 0.5 birim daha azaltıldı
            frameY, // Y konumu iki dikey çubuğun ortasında
            frameDepth + postThickness/2 // Z konumu dikey çubukların üstünde
        );
        
        connectorMesh.castShadow = true;
        connectorMesh.receiveShadow = true;
        this.container.add(connectorMesh);
        
        // Cannon.js için fiziksel nesne
        const connectorShape = new CANNON.Box(new CANNON.Vec3(
            postThickness/2, 
            connectorLength/2, 
            postThickness/2
        ));
        
        const connectorBody = new CANNON.Body({
            mass: 0, // Sabit, hareket etmez
            position: new CANNON.Vec3(
                frameX + offsetX,
                frameY,
                frameDepth + postThickness/2
            ),
            shape: connectorShape,
            material: this.physics.materials.items.default
        });
        
        // Fizik motoruna ekle
        this.physics.world.addBody(connectorBody);
        
        // Görsel mesh ile fiziksel nesneyi birbirine bağla
        this.bowling.secondTopConnector = {
            mesh: connectorMesh,
            body: connectorBody
        };
        
        // Time tick ile güncelleme
        this.time.on('tick', () => {
            // Body pozisyonunu mesh'e uygula (sabit olsa bile)
            this.bowling.secondTopConnector.mesh.position.x = this.bowling.secondTopConnector.body.position.x;
            this.bowling.secondTopConnector.mesh.position.y = this.bowling.secondTopConnector.body.position.y;
            this.bowling.secondTopConnector.mesh.position.z = this.bowling.secondTopConnector.body.position.z;
            
            // Quaternionu mesh'e uygula
            this.bowling.secondTopConnector.mesh.quaternion.x = this.bowling.secondTopConnector.body.quaternion.x;
            this.bowling.secondTopConnector.mesh.quaternion.y = this.bowling.secondTopConnector.body.quaternion.y;
            this.bowling.secondTopConnector.mesh.quaternion.z = this.bowling.secondTopConnector.body.quaternion.z;
            this.bowling.secondTopConnector.mesh.quaternion.w = this.bowling.secondTopConnector.body.quaternion.w;
        });
    }
    
    // Altta 2D çizgi ekleyen metot (sadece görsel, fiziksel değil)
    addBottomLine(frameX, frameY, rectHeight, postThickness) {
        // Çizgi için boyutlar
        const lineLength = rectHeight;
        const lineWidth = postThickness * 0.75; // Biraz daha görünür olması için - yarı yarıya azaltıldı
        
        // Çizgi için materyal - parlak kırmızı
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0xff0000,
            linewidth: lineWidth // Not: WebGL sınırlamaları nedeniyle çoğu tarayıcıda line width 1 ile sınırlıdır
        });
        
        // Çizgi için geometri
        const lineGeometry = new THREE.BufferGeometry();
        
        // Çizginin başlangıç ve bitiş noktaları
        // X koordinatı sabit kalacak (dikey çizgi), Y ekseni boyunca uzanacak
        const lineStart = new THREE.Vector3(frameX, frameY - rectHeight/2, 0.05); // Alt nokta
        const lineEnd = new THREE.Vector3(frameX, frameY + rectHeight/2, 0.05);   // Üst nokta
        
        // Çizgi için noktaları ayarla
        const points = [lineStart, lineEnd];
        lineGeometry.setFromPoints(points);
        
        // Çizgiyi oluştur
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.container.add(line);
        
        // Çizgiyi kaydet
        this.bowling.bottomLine = line;
        
        // Alternatif olarak, daha kalın ve daha görünür bir çizgi için düzlem kullanabilirsiniz
        const planeGeometry = new THREE.PlaneGeometry(lineWidth, lineLength);
        const planeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.set(frameX, frameY, 0.05); // Orta noktada
        // Düzlemi dikey olarak yerleştir
        
        // Düzlemi ekle
        this.container.add(plane);
        
        // İkinci bir daha kalın çizgi olarak da kaydet
        this.bowling.bottomPlane = plane;
        
        // Çarpışma kontrolü için çizgi pozisyonunu ve boyutunu kaydet
        this.bowling.goalLine = {
            x: frameX,
            y: frameY,
            width: lineWidth,
            height: lineLength,
            hitBox: new THREE.Box2(
                new THREE.Vector2(frameX - lineWidth/2, frameY - lineLength/2),
                new THREE.Vector2(frameX + lineWidth/2, frameY + lineLength/2)
            )
        }
    }
    
    // Gol yazısını oluştur
    createGoalText() {
        // HTML element oluştur
        this.goalTextElement = document.createElement('div');
        this.goalTextElement.style.position = 'absolute';
        this.goalTextElement.style.bottom = '30px';
        this.goalTextElement.style.right = '30px';
        this.goalTextElement.style.fontFamily = 'Arial, sans-serif';
        this.goalTextElement.style.fontSize = '40px';
        this.goalTextElement.style.fontWeight = 'bold';
        this.goalTextElement.style.color = '#00ff00'; // Yeşil renk
        this.goalTextElement.style.textShadow = '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 0 8px #00aa00'; // Siyah çerçeve ve yeşil gölge
        this.goalTextElement.style.transition = 'opacity 0.5s ease';
        this.goalTextElement.style.opacity = '0';
        this.goalTextElement.style.pointerEvents = 'none'; // Tıklamalardan etkilenmesin
        this.goalTextElement.style.zIndex = '100';
        this.goalTextElement.style.padding = '10px 15px'; // Biraz boşluk ekle
        this.goalTextElement.style.borderRadius = '8px'; // Köşeleri yuvarla
        this.goalTextElement.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'; // Hafif siyah arka plan
        this.goalTextElement.innerHTML = 'GOOOOL!';
        
        // Sayfaya ekle
        document.body.appendChild(this.goalTextElement);
    }
    
    // Kürenin çizgiyle çarpışıp çarpışmadığını kontrol et
    checkGoalCollision() {
        // Top ve çizgi var mı kontrol et
        if(!this.bowling.sphere || !this.bowling.goalLine) return;
        
        // Topun pozisyonu
        const spherePosition = this.bowling.sphere.body.position;
        
        // Kürenin 2D konumu (x, y)
        const spherePos2D = new THREE.Vector2(spherePosition.x, spherePosition.y);
        
        // Kürenin yarıçapı
        const sphereRadius = 0.5;
        
        // Çizgi ile mesafe
        const distanceToLine = Math.abs(spherePosition.x - this.bowling.goalLine.x);
        
        // Eğer küre çizgiye yeterince yakınsa ve henüz gol sayılmadıysa
        if(distanceToLine < sphereRadius + this.bowling.goalLine.width/2 && 
           spherePos2D.y >= this.bowling.goalLine.hitBox.min.y && 
           spherePos2D.y <= this.bowling.goalLine.hitBox.max.y &&
           !this.goalScored) {
            
            // Gol sayıldı
            this.goalScored = true;
            
            // Gol yazısını göster
            this.showGoalText();
        }
    }
    
    // Gol yazısını göster
    showGoalText() {
        // Önce zamanlayıcıyı temizle
        if(this.goalTextTimer) {
            clearTimeout(this.goalTextTimer);
        }
        
        // Yazıyı göster
        this.goalTextElement.style.opacity = '1';
        this.goalTextShown = true;
        
        // 3 saniye sonra yazıyı gizle
        this.goalTextTimer = setTimeout(() => {
            this.goalTextElement.style.opacity = '0';
            this.goalTextShown = false;
        }, 3000);
    }
    
    // Gol yazısını sıfırla
    resetGoalText() {
        // Gol durumunu sıfırla
        this.goalScored = false;
        
        // Yazıyı gizle
        this.goalTextElement.style.opacity = '0';
        this.goalTextShown = false;
        
        // Zamanlayıcıyı temizle
        if(this.goalTextTimer) {
            clearTimeout(this.goalTextTimer);
            this.goalTextTimer = null;
        }
    }
}
