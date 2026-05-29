const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

const uploadedFiles = [];
const notifications = [];

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/api/upload", upload.array("files"), (req, res) => {

  const files = req.files;

  files.forEach(file => {

    uploadedFiles.push({
      id: Date.now() + Math.random(),
      name: file.originalname,
      size: file.size,
      path: file.path,
      date: new Date()
    });

  });

  if(files.length > 3){

    const notification = {
      id: Date.now(),
      message: `${files.length} files uploaded successfully`,
      read: false,
      timestamp: new Date()
    };

    notifications.unshift(notification);

    io.emit("new-notification", notification);

  }

  res.json({
    success: true
  });

});

app.get("/api/files", (req, res) => {
  res.json(uploadedFiles);
});

app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});