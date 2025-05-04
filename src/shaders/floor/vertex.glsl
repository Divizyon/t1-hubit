varying vec2 vUv;
varying vec3 vWorldPosition;

void main()
{
    vUv = uv;
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    vec3 newPosition = position;
    newPosition.z = 1.0;
    gl_Position = vec4(newPosition, 1.0);
}
