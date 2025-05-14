import EventEmitter from './EventEmitter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

export default class Resources extends EventEmitter {
    /**
     * Constructor
     */
    constructor() {
        super()

        this.setLoaders()

        this.toLoad = 0
        this.loaded = 0
        this.loadErrors = 0
        this.items = {}
    }

    /**
     * Set loaders
     */
    setLoaders() {
        this.loaders = []

        // Images
        this.loaders.push({
            extensions: ['jpg', 'png', 'webp'],
            action: (_resource) => {
                const image = new Image()

                image.addEventListener('load', () => {
                    this.fileLoadEnd(_resource, image)
                })

                image.addEventListener('error', () => {
                    console.error(`Error loading image: ${_resource.source}`)
                    this.fileLoadEnd(_resource, image, true)
                })

                image.src = _resource.source
            }
        })

        // Draco
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('draco/')
        dracoLoader.setDecoderConfig({ type: 'js' })

        this.loaders.push({
            extensions: ['drc'],
            action: (_resource) => {
                dracoLoader.load(
                    _resource.source, 
                    (_data) => {
                        this.fileLoadEnd(_resource, _data)
                        DRACOLoader.releaseDecoderModule()
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading Draco model ${_resource.source}:`, error)
                        this.fileLoadEnd(_resource, null, true)
                    }
                )
            }
        })

        // GLTF
        const gltfLoader = new GLTFLoader()
        gltfLoader.setDRACOLoader(dracoLoader)

        this.loaders.push({
            extensions: ['glb', 'gltf'],
            action: (_resource) => {
                console.log(`Loading GLTF model: ${_resource.source}`)
                
                // Add a timeout for loading in debug mode
                let loadTimeout = null
                if (window.location.hash === '#debug') {
                    loadTimeout = setTimeout(() => {
                        console.warn(`Loading timeout for ${_resource.source} - continuing anyway`)
                        this.fileLoadEnd(_resource, null, true)
                    }, 5000) // 5s timeout for model loading in debug mode
                }
                
                gltfLoader.load(
                    _resource.source,
                    (_data) => {
                        console.log(`Successfully loaded GLTF model: ${_resource.source}`)
                        if (loadTimeout) clearTimeout(loadTimeout)
                        this.fileLoadEnd(_resource, _data)
                    },
                    (progress) => {
                        console.log(`Loading progress for ${_resource.source}: ${(progress.loaded / progress.total * 100).toFixed(2)}%`)
                    },
                    (error) => {
                        console.error(`Error loading GLTF model ${_resource.source}:`, error)
                        if (loadTimeout) clearTimeout(loadTimeout)
                        this.fileLoadEnd(_resource, null, true)
                    }
                )
            }
        })

        // FBX
        const fbxLoader = new FBXLoader()

        this.loaders.push({
            extensions: ['fbx'],
            action: (_resource) => {
                fbxLoader.load(
                    _resource.source, 
                    (_data) => {
                        this.fileLoadEnd(_resource, _data)
                    },
                    undefined,
                    (error) => {
                        console.error(`Error loading FBX model ${_resource.source}:`, error)
                        this.fileLoadEnd(_resource, null, true)
                    }
                )
            }
        })
    }

    /**
     * Load
     */
    load(_resources = []) {
        for (const _resource of _resources) {
            this.toLoad++
            const extensionMatch = _resource.source.match(/\.([a-z]+)$/)

            if (typeof extensionMatch?.[1] !== 'undefined') {
                const extension = extensionMatch[1]
                const loader = this.loaders.find((_loader) => _loader.extensions.find((_extension) => _extension === extension))

                if (loader) {
                    try {
                        loader.action(_resource)
                    } catch (error) {
                        console.error(`Exception loading ${_resource.source}:`, error)
                        this.fileLoadEnd(_resource, null, true)
                    }
                }
                else {
                    console.warn(`Cannot find loader for ${_resource.source}`)
                    this.fileLoadEnd(_resource, null, true)
                }
            }
            else {
                console.warn(`Cannot find extension of ${_resource.source}`)
                this.fileLoadEnd(_resource, null, true)
            }
        }
    }

    /**
     * File load end
     */
    fileLoadEnd(_resource, _data, isError = false) {
        this.loaded++
        
        if (isError) {
            this.loadErrors++
            console.warn(`Resource ${_resource.name} failed to load (${this.loadErrors} total errors)`)
        }
        
        // Store data even if null to keep track of it
        this.items[_resource.name] = _data

        this.trigger('fileEnd', [_resource, _data])

        if (this.loaded === this.toLoad) {
            if (this.loadErrors > 0) {
                console.warn(`Completed loading with ${this.loadErrors} errors`)
            }
            this.trigger('end')
        }
    }
}
