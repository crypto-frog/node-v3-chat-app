const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");

const Filter = require("bad-words");
// const { get } = require("express/lib/response");
//const { isTypedArray } = require("util/types");

app.use(express.static(publicDirectoryPath));

//let helloMessage = "Welcome !";

io.on("connection", (socket) => {
  console.log("New WebSocket connection");

  socket.on("join", ({ username, room }, callback) => {
    console.log(room);
    const user = addUser({ id: socket.id, username, room });

    if (user.error) {
      return callback(user.error);
    }
    socket.join(user.room);

    socket.emit("message", generateMessage("admin", "Welcome!"));

    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined !`));

    console.log("-=-=-=-=-=-=-=-"); //-------------------

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback(); // let them know they sucesfully joined
  });

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("No FUCKING profanity");
    }
    const user = getUser(socket.id);
    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("admin", `${user.username} has left !`)
      );
      io.to(user.room).emit("userData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });

  socket.on("sendLocation", (coordinates, callback) => {
    user = getUser(socket.id);
    io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coordinates.lat},${coordinates.long}`
      )
    );
    callback();
  });
});

// app.get("", (req, res) => {
//   res.send("Chat App");
// });

server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});
