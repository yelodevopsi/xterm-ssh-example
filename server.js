const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const { Client } = require("ssh2");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the front-end files
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  const conn = new Client();

  conn
    .on("ready", () => {
      console.log("SSH Connection established");
      conn.shell({ term: "xterm-256color" }, (err, stream) => {
        if (err) throw err;

        stream
          .on("close", () => {
            console.log("Stream :: close");
            conn.end();
          })
          .on("data", (data) => {
            socket.emit("output", data.toString());
          });

        socket.on("input", (data) => {
          stream.write(data);
        });
      });
    })
    .connect({
      host: "my.host.com",
      port: 22,
      username: "user",
      password: "pwd",
    });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    conn.end();
  });
});
const port = process.env.PORT || 3000;
server.listen(port, () => console.log(`Server running on port ${port}`));
