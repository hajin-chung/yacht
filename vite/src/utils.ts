async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  const text = await res.text()
  return text
}

export { fetchText }
