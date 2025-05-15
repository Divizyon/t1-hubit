import * as THREE from 'three'
import CANNON from 'cannon'

const DEFAULT_POSITION = new THREE.Vector3(61, -27, 1.3)

export default class CalisanGenclikMerkezi {
    constructor({ scene, resources, objects, physics, debug, rotateX = 0, rotateY = 0, rotateZ = 0 }) {
        this.scene = scene
        this.resources = resources
        this.objects = objects
        this.physics = physics
        this.debug = debug

        this.rotateX = rotateX
        this.rotateY = rotateY
        this.rotateZ = rotateZ
        
        this.container = new THREE.Object3D()
        this.position = DEFAULT_POSITION.clone()
        
        this._buildModel()
        
        // ÖNEMLİ: DivizyonBina.js'de olduğu gibi container'ı direkt sahneye ekliyoruz
        this.scene.add(this.container)
    }
    
    _buildModel() {
        try {
            // Model dosyasını al - Resources.js'de baş harfi Büyük
            const gltf = this.resources.items.CalisanGenclikMerkezi
            if (!gltf || !gltf.scene) {
                console.error('CalisanGenclikMerkezi modeli bulunamadı')
                console.log('Mevcut kaynaklar:', Object.keys(this.resources.items))
                return
            }
            
            console.log('CalisanGenclikMerkezi modeli yüklendi')
            
            // Modeli klonla ve malzemeleri kopyala
            const model = gltf.scene.clone(true)
            model.traverse(child => {
                if (child.isMesh) {
                    const origMat = child.material
                    const mat = origMat.clone()
                    if (origMat.map) mat.map = origMat.map
                    if (origMat.normalMap) mat.normalMap = origMat.normalMap
                    if (origMat.roughnessMap) mat.roughnessMap = origMat.roughnessMap
                    if (origMat.metalnessMap) mat.metalnessMap = origMat.metalnessMap
                    mat.needsUpdate = true
                    child.material = mat
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
            
            // Model pozisyonu ve dönüşü
            model.position.copy(this.position)
            model.rotation.set(this.rotateX, this.rotateY, this.rotateZ)
            this.container.add(model)
            
            // Bounding box hesapla
            model.updateMatrixWorld(true)
            const bbox = new THREE.Box3().setFromObject(model)
            const size = bbox.getSize(new THREE.Vector3())
            
            console.log('CalisanGenclikMerkezi model boyutları:', size)
            
            // Fizik gövdesi oluştur - modelin yarısı kadar boyut
            const halfExtents = new CANNON.Vec3(
                Math.abs(size.x) / 3, 
                Math.abs(size.y) / 3, 
                Math.abs(size.z) / 3
            )
            const boxShape = new CANNON.Box(halfExtents)
            
            const body = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(...this.position.toArray()),
                material: this.physics.materials.items.floor,
                type: CANNON.Body.STATIC
            })
            
            // Dönüşü quaternion olarak ayarla
            const quat = new CANNON.Quaternion()
            quat.setFromEuler(this.rotateX, this.rotateY, this.rotateZ, 'XYZ')
            body.quaternion.copy(quat)
            
            body.addShape(boxShape)
            this.physics.world.addBody(body)
            
            console.log('CalisanGenclikMerkezi collision eklendi, boyutlar:', halfExtents)
            
            // Debug için collision gösterimi ekleyelim
            if (this.debug) {
                const collisionBoxGeom = new THREE.BoxGeometry(
                    halfExtents.x * 2,
                    halfExtents.y * 2,
                    halfExtents.z * 2
                )
                const wireMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.3
                })
                const collisionMesh = new THREE.Mesh(collisionBoxGeom, wireMaterial)
                collisionMesh.position.copy(this.position)
                this.container.add(collisionMesh)
                console.log('Collision debug gösterimi eklendi')
            }
            
            // Obje sistemine ekle
            if (this.objects) {
                const children = model.children.slice()
                const objectEntry = this.objects.add({
                    base: { children },
                    collision: { children },
                    offset: this.position.clone(),
                    mass: 0
                })
                objectEntry.collision = { body }
                
                if (objectEntry.container) {
                    this.container.add(objectEntry.container)
                }
            }
            
            console.log('CalisanGenclikMerkezi modeli başarıyla kuruldu')
            
        } catch (error) {
            console.error('CalisanGenclikMerkezi oluşturulurken hata:', error)
            console.log('Hata detayları:', error.message, error.stack)
        }
    }
} 
