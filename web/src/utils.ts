async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  const text = await res.text()
  return text
}

function checkError(gl: WebGLRenderingContext) {
  const error = gl.getError();
  if (error !== 0) {
    console.error(error) 
  }
}

export { fetchText, checkError }
