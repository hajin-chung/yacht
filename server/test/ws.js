const msgpack = MessagePack;
const logOutput = document.getElementById("log");
const input = document.getElementById("input")

function log(message) {
  const row = document.createElement("pre")
  row.innerText = message
  logOutput.appendChild(row)
}

const socket = new WebSocket("ws://localhost:4434/ws");

socket.addEventListener("open", (evt) => {
  log("socket open")
})

socket.addEventListener("close", (evt) => {
  log("socket close")
})

socket.addEventListener("message", async (evt) => {
  const msg = await evt.data.arrayBuffer();
  const decoded = JSON.stringify(msgpack.decode(msg))
  log(`recv: ${decoded}`)
})

socket.addEventListener("error", (evt) => {
  log(`socket error: ${JSON.stringify(evt)}`)
})

input.addEventListener("keydown", (evt) => {
  if (evt.key == "Enter") {
    const msg = msgpack.encode({ type: input.value })
    socket.send(msg)
    input.value = ""
  }
})
