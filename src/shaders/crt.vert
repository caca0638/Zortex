attribute vec2 aPosition;
varying vec2 vTextureCoord;

void main(void) {
    vTextureCoord = aPosition;
    gl_Position = vec4(aPosition * 2.0 - 1.0, 0.0, 1.0);
}
