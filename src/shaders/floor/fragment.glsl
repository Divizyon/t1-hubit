uniform sampler2D tBackground;
uniform vec2 uForestCenter;

varying vec2 vUv;
varying vec3 vWorldPosition;

void main()
{
    vec4 backgroundColor = texture(tBackground, vUv);
    gl_FragColor = backgroundColor;
}
