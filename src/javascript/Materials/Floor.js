import * as THREE from 'three'

import shaderFragment from '../../shaders/floor/fragment.glsl'
import shaderVertex from '../../shaders/floor/vertex.glsl'

export default function()
{
    const uniforms = {
        tBackground: { value: null },
        uForestCenter: { value: new THREE.Vector2(0.5, 0.5) }
    }

    const material = new THREE.ShaderMaterial({
        wireframe: false,
        transparent: false,
        uniforms,
        vertexShader: shaderVertex,
        fragmentShader: shaderFragment
    })

    return material
}
