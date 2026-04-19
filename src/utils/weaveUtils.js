export function expandSett(sett) {
  const t = []
  sett.forEach(s => { for(let i=0; i<Math.max(1,s.n|0); i++) t.push(s.c) })
  return t
}

export function weaveMatrix(type, size) {
  return Array.from({length:size}, (_,i) =>
    Array.from({length:size}, (_,j) => {
      if(type==='twill22') return (i+j)%4<2 ? 1 : 0
      if(type==='twill21') return (i+j)%3<2 ? 1 : 0
      if(type==='plain')   return (i+j)%2
      if(type==='satin5')  return (i*2+j)%5===0 ? 1 : 0
      return (i+j)%4<2 ? 1 : 0
    })
  )
}

let _fiber = null
export function getFiberCanvas() {
  if (_fiber) return _fiber
  const cv = document.createElement('canvas')
  cv.width = cv.height = 256
  const ctx = cv.getContext('2d')
  const id = ctx.createImageData(256, 256)
  const d = id.data
  for(let y=0; y<256; y++) for(let x=0; x<256; x++) {
    const i = (y*256+x)*4
    const n = Math.sin(x*.9+y*.3)*.35 + Math.sin(x*2.3+y*.8)*.2
            + Math.sin(x*.4+y*3.1)*.15 + Math.sin(x*5.1+y*1.2)*.08
    d[i] = d[i+1] = d[i+2] = 128 + Math.floor((n+1)*.5*22)
    d[i+3] = 255
  }
  ctx.putImageData(id, 0, 0)
  _fiber = cv
  return cv
}
