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
  const decoded = formatJson(msgpack.decode(msg))
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

function formatJson(json) {
  let formattedJson = JSON.stringify(json, null, 2);

  // Regex to match arrays that should be in a single line
  // Note: This is a simple example and might need to be adapted based on your specific JSON structure
  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function(match) {
    return match.replace(/\s+/g, ' ');
  });

  return formattedJson;
}
