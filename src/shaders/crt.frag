precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;
uniform vec2 uResolution;
uniform float uCurvature;
uniform float uScanlines;
uniform float uAberration;

// Barrel distortion (lens curvature)
vec2 curveUV(vec2 uv) {
    vec2 cc = uv - 0.5;
    float dist = dot(cc, cc);
    return uv + cc * (dist * uCurvature);
}

void main(void) {
    vec2 uv = curveUV(vTextureCoord);

    // Sınır kontrolü (bükülme dışı siyah kenarlık)
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // Chromatic Aberration (Kırmızı ve Mavi renk sapması)
    float r = texture2D(uTexture, vec2(uv.x + uAberration, uv.y)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, vec2(uv.x - uAberration, uv.y)).b;
    float a = texture2D(uTexture, uv).a;
    vec3 color = vec3(r, g, b);

    // Tarama çizgileri (Scanlines)
    float scanline = sin(uv.y * uResolution.y * 1.5 + uTime * 2.0) * 0.5 + 0.5;
    color -= color * scanline * uScanlines;

    // Köşe karartması (Vignette)
    float vignette = uv.x * (1.0 - uv.x) * uv.y * (1.0 - uv.y);
    vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);
    color *= vignette;

    gl_FragColor = vec4(color, a);
}
