// Vitest global test setup
import '@testing-library/jest-dom'

// Polyfill canvas for jsdom (canvas operations return blank but don't throw)
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => ({
    fillRect: () => {},
    clearRect: () => {},
    getImageData: (_x, _y, w, h) => ({ data: new Array(w * h * 4).fill(0) }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  })
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,dummydata'
}

// Silence noisy console.error in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {})
