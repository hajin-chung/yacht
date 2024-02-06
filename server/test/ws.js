const logOutput = document.getElementById("log");
const input = document.getElementById("input")

function log(message) {
  logOutput.innerText += `${message}\n`
}

const socket = new WebSocket("ws://localhost:4434/ws");

socket.addEventListener("open", (evt) => {
  log("socket open")
})

socket.addEventListener("close", (evt) => {
  log("socket close")
})

socket.addEventListener("message", (evt) => {
  log(`recv: ${evt.data}`)
})

socket.addEventListener("error", (evt) => {
  log(`socket error: ${JSON.stringify(evt)}`)
})

input.addEventListener("keydown", (evt) => {
  if (evt.key == "Enter") {
    socket.send(input.value)
    input.value = ""
  }
})
