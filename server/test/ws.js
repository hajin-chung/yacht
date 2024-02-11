const msgpack = MessagePack;
const logOutput = document.getElementById("log");
const typeInput = document.getElementById("type")
const dataInput = document.getElementById("data")

function log(message) {
  const row = document.createElement("pre")
  if (message.length > 1000) {
    row.innerText = message.slice(0, 100) + "\n...";
  } else {
    row.innerText = message;
  }
  logOutput.prepend(row)
}

const socket = new WebSocket("ws://localhost:4434/ws");

socket.addEventListener("open", () => {
  log("socket open")
})

socket.addEventListener("close", () => {
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

type.addEventListener("keydown", (evt) => {
  if (evt.key == "Enter") sendMessage()
})

data.addEventListener("keydown", (evt) => {
  if (evt.key == "Enter") sendMessage()
})

function sendMessage() {
  const msg = msgpack.encode({
    type: type.value,
    data: data.value && JSON.parse("{" + data.value + "}")
  })
  socket.send(msg)
  type.value = ""
  data.value = ""
}

function formatJson(json) {
  let formattedJson = JSON.stringify(json, null, 2);

  // Regex to match arrays that should be in a single line
  // Note: This is a simple example and might need to be adapted based on your specific JSON structure
  formattedJson = formattedJson.replace(/(\[[\d,\s]+?\])/g, function(match) {
    return match.replace(/\s+/g, ' ');
  });

  return formattedJson;
}
