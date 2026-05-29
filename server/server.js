const express = require("express");
const cors = require("cors");
const multer = require("multer");
const http = require("http");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
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

/* ---------------- DATABASE ---------------- */

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

/* ---------------- MULTER STORAGE ---------------- */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, "uploads/");

  },

  filename: (req, file, cb) => {

    cb(
      null,
      Date.now() + "-" + file.originalname
    );

  }

});

const upload = multer({
  storage
});

/* ---------------- UPLOAD API ---------------- */

app.post(
  "/api/upload",
  upload.array("files"),
  (req, res) => {

    const files = req.files;

    files.forEach((file) => {

      db.run(
        `
        INSERT INTO files
        (name, size, path, date)
        VALUES (?, ?, ?, ?)
        `,
        [
          file.originalname,
          file.size,
          file.path,
          new Date().toISOString()
        ]
      );

    });

    if (files.length > 3) {

      const message =
        `${files.length} files uploaded successfully`;

      db.run(
        `
        INSERT INTO notifications
        (message, type, read, timestamp)
        VALUES (?, ?, ?, ?)
        `,
        [
          message,
          "success",
          0,
          new Date().toISOString()
        ],
        function () {

          const notification = {
            id: this.lastID,
            message,
            type: "success",
            read: 0,
            timestamp: new Date().toISOString()
          };

          io.emit(
            "new-notification",
            notification
          );

        }
      );

    }

    res.json({
      success: true
    });

  }
);

/* ---------------- GET FILES ---------------- */

app.get("/api/files", (req, res) => {

  db.all(
    `
    SELECT * FROM files
    ORDER BY id DESC
    `,
    [],
    (err, rows) => {

      if (err) {

        return res.status(500).json({
          error: err.message
        });

      }

      res.json(rows);

    }
  );

});

/* ---------------- GET NOTIFICATIONS ---------------- */

app.get(
  "/api/notifications",
  (req, res) => {

    db.all(
      `
      SELECT * FROM notifications
      ORDER BY id DESC
      `,
      [],
      (err, rows) => {

        if (err) {

          return res.status(500).json({
            error: err.message
          });

        }

        res.json(rows);

      }
    );

  }
);

/* ---------------- MARK SINGLE READ ---------------- */

app.put(
  "/api/notifications/:id",
  (req, res) => {

    db.run(
      `
      UPDATE notifications
      SET read = 1
      WHERE id = ?
      `,
      [req.params.id],
      function (err) {

        if (err) {

          return res.status(500).json({
            error: err.message
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* ---------------- MARK ALL READ ---------------- */

app.put(
  "/api/notifications",
  (req, res) => {

    db.run(
      `
      UPDATE notifications
      SET read = 1
      `,
      function (err) {

        if (err) {

          return res.status(500).json({
            error: err.message
          });

        }

        res.json({
          success: true
        });

      }
    );

  }
);

/* ---------------- DOWNLOAD FILE ---------------- */

app.get(
  "/api/download/:filename",
  (req, res) => {

    const filePath = path.join(
      __dirname,
      "uploads",
      req.params.filename
    );

    res.download(filePath);

  }
);

/* ---------------- DELETE FILE ---------------- */

app.delete(
  "/api/files/:id",
  (req, res) => {

    const id = req.params.id;

    db.get(
      `
      SELECT * FROM files
      WHERE id = ?
      `,
      [id],
      (err, row) => {

        if (err) {

          return res.status(500).json({
            error: err.message
          });

        }

        if (!row) {

          return res.status(404).json({
            error: "File not found"
          });

        }

        if (fs.existsSync(row.path)) {

          fs.unlinkSync(row.path);

        }

        db.run(
          `
          DELETE FROM files
          WHERE id = ?
          `,
          [id],
          function (err) {

            if (err) {

              return res.status(500).json({
                error: err.message
              });

            }

            res.json({
              success: true
            });

          }
        );

      }
    );

  }
);

/* ---------------- SOCKET CONNECTION ---------------- */

io.on("connection", (socket) => {

  console.log("User connected");

});

/* ---------------- START SERVER ---------------- */

server.listen(5000, () => {

  console.log(
    "Server running on port 5000"
  );

});
