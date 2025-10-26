const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname)); // serve index.html + css

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("sendData", (data) => {
    console.log(`${data.user}: ${data.text}`);
    io.emit("broadcast", data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  const interfaces = os.networkInterfaces();
  let ip;
  for (let name in interfaces) {
    for (let info of interfaces[name]) {
      if (info.family === "IPv4" && !info.internal) ip = info.address;
    }
  }
  console.log(`Server running at: http://${ip}:${PORT}`);
});
