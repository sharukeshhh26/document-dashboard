
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.db");

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      size INTEGER,
      path TEXT,
      date TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT,
      type TEXT,
      read INTEGER,
      timestamp TEXT
    )
  `);

});

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

const path = require("path");

app.get("/api/download/:filename", (req, res) => {

  const filePath = path.join(__dirname, "uploads", req.params.filename);

  res.download(filePath);

});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});

