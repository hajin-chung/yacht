async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  const text = await res.text()
  return text
}

async function fetchImage(url: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const image=  new Image();
    image.onload = () => {
      resolve(image)
    }
    image.src = url;
  })
}

function checkError(gl: WebGLRenderingContext) {
  const error = gl.getError();
  if (error !== 0) {
    console.error(error) 
  }
}

export { fetchText, fetchImage, checkError }
