import * as THREE from 'three'
import CANNON from 'cannon'

let posizyonX = 40
let posizyonY = -40
let posizyonZ = 0

export default class kelebeklervadisi {
    constructor(_options) {
        this.time = _options.time
        this.resources = _options.resources
        this.objects = _options.objects
        this.physics = _options.physics
        this.debug = _options.debug
        this.areas = _options.areas

        this.container = new THREE.Object3D()
        this.container.matrixAutoUpdate = false

        this.setModel()
        this.setKelebeklerVadisiArea()
    }

    setModel() {
        const baseScene = this.resources.items.kelebeklervadisi?.scene
        if (!baseScene) {
            console.error('Kelebekler Vadisi modeli yüklenemedi!')
            return
        }

        let baseChildren = []
        if (baseScene.children && baseScene.children.length > 0) {
            baseChildren = baseScene.children
        } else {
            baseChildren = [baseScene]
        }

        const bbox = new THREE.Box3().setFromObject(baseScene)
        const size = bbox.getSize(new THREE.Vector3())
        
        const scaleFactor = 1

        const body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(posizyonX, posizyonY, posizyonZ),
            material: this.physics.materials.items.floor
        })

        const mainShape = new CANNON.Box(new CANNON.Vec3(
            Math.abs(size.x) * scaleFactor / 2,
            Math.abs(size.y) * scaleFactor / 2,
            Math.abs(size.z) * scaleFactor / 2
        ))
        body.addShape(mainShape)

        this.physics.world.addBody(body)

        this.model = {}
        this.model.base = this.objects.add({
            base: { children: baseChildren },
            offset: new THREE.Vector3(posizyonX, posizyonY, posizyonZ),
            mass: 0
        })

        this.model.base.collision = { body }
        this.container.add(this.model.base.container)
    }

    setKelebeklerVadisiArea() {
        const areaLabelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 0.5),
            new THREE.MeshBasicMaterial({
                transparent: true,
                depthWrite: false,
                color: 0xffffff,
                alphaMap: this.resources.items.areaEnterTexture,
            })
        )
        areaLabelMesh.position.set(posizyonX + 6, posizyonY, 0.5)
        areaLabelMesh.matrixAutoUpdate = false
        areaLabelMesh.updateMatrix()
        this.container.add(areaLabelMesh)

        this.kelebeklerVadisiArea = this.areas.add({
            position: new THREE.Vector2(posizyonX + 6, posizyonY),
            halfExtents: new THREE.Vector2(2, 2),
        })

        this.kelebeklerVadisiArea.on("interact", () => {
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

            const popupBox = document.createElement("div")
            popupBox.style.backgroundColor = "white"
            popupBox.style.color = "black"
            popupBox.style.padding = "30px 40px"
            popupBox.style.borderRadius = "8px"
            popupBox.style.minWidth = "350px"
            popupBox.style.maxWidth = "90%"
            popupBox.style.textAlign = "center"
            popupBox.style.boxShadow = "0 0 30px rgba(0, 0, 0, 0.6)"

            const titleEl = document.createElement("h2")
            titleEl.style.margin = "0 0 25px 0"
            titleEl.style.fontSize = "24px"
            titleEl.style.fontWeight = "bold"
            titleEl.textContent = "Kelebekler Vadisi"

            const descriptionEl = document.createElement("p")
            descriptionEl.textContent = "Kelebekler Vadisi hakkında daha fazla bilgi almak için tıklayın."
            descriptionEl.style.margin = "0 0 20px 0"

            const linkEl = document.createElement("a")
            linkEl.href = "https://www.kelebeklervadisi.com/"
            linkEl.textContent = "www.kelebeklervadisi.com"
            linkEl.target = "_blank"
            linkEl.style.display = "inline-block"
            linkEl.style.padding = "12px 25px"
            linkEl.style.backgroundColor = "#3498db"
            linkEl.style.color = "white"
            linkEl.style.textDecoration = "none"
            linkEl.style.borderRadius = "5px"
            linkEl.style.fontWeight = "bold"
            linkEl.style.margin = "15px 0"
            linkEl.style.transition = "background-color 0.3s"
            linkEl.addEventListener("mouseover", () => {
                linkEl.style.backgroundColor = "#2980b9"
            })
            linkEl.addEventListener("mouseout", () => {
                linkEl.style.backgroundColor = "#3498db"
            })

            const closeButton = document.createElement("button")
            closeButton.textContent = "Kapat"
            closeButton.style.padding = "10px 20px"
            closeButton.style.border = "none"
            closeButton.style.backgroundColor = "#e0e0e0"
            closeButton.style.color = "#333"
            closeButton.style.cursor = "pointer"
            closeButton.style.borderRadius = "5px"
            closeButton.style.fontSize = "14px"
            closeButton.style.marginTop = "20px"
            closeButton.addEventListener("click", () => {
                document.body.removeChild(popupContainer)
            })
            popupContainer.addEventListener("click", (event) => {
                if (event.target === popupContainer) {
                    document.body.removeChild(popupContainer)
                }
            })

            popupBox.appendChild(titleEl)
            popupBox.appendChild(descriptionEl)
            popupBox.appendChild(linkEl)
            popupBox.appendChild(closeButton)
            popupContainer.appendChild(popupBox)
            document.body.appendChild(popupContainer)

            if (this.sounds) {
                this.sounds.play("click")
            }
        })
    }
} 