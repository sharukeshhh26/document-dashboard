import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {

  const [queueFiles, setQueueFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {

    fetchFiles();
    fetchNotifications();

    socket.on("new-notification", (data) => {

      toast.success(data.message);

      setNotifications((prev) => [data, ...prev]);

    });

  }, []);

  const fetchFiles = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/files"
    );

    setUploadedFiles(res.data);

  };

  const fetchNotifications = async () => {

    const res = await axios.get(
      "http://localhost:5000/api/notifications"
    );

    setNotifications(res.data);

  };

  const handleUpload = async () => {

    if (queueFiles.length === 0) {

      toast.error("Select files first");

      return;

    }

    const formData = new FormData();

    queueFiles.forEach((file) => {

      formData.append("files", file);

    });

    setStatus("Uploading...");

    if (queueFiles.length > 3) {

      toast(
        `Upload in progress — processing ${queueFiles.length} files in background`
      );

    }

    try {

      await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          onUploadProgress: (progressEvent) => {

            const percent = Math.round(
              (progressEvent.loaded * 100) /
              progressEvent.total
            );

            setProgress(percent);

          }
        }
      );

      toast.success("Upload Complete");

      setStatus("Completed");

      fetchFiles();

      fetchNotifications();

      setTimeout(() => {

        setProgress(0);

        setQueueFiles([]);

      }, 1500);

    } catch (error) {

      toast.error("Upload Failed");

      setStatus("Failed");

    }

  };

  return (

    <div
      style={{
        padding: "40px",
        maxWidth: "1100px",
        margin: "0 auto",
        background: "#f4f7fb",
        minHeight: "100vh",
        fontFamily: "Arial"
      }}
    >

      <Toaster />

      {/* HEADER */}

      <div
        style={{
          marginBottom: "35px"
        }}
      >

        <h1
          style={{
            color: "#2563eb",
            marginBottom: "10px",
            fontSize: "40px"
          }}
        >
          Smart Upload Dashboard
        </h1>

        <p
          style={{
            color: "#6b7280",
            fontSize: "17px"
          }}
        >
          Manage and track company documents in real time
        </p>

      </div>

      {/* UPLOAD BOX */}

      <div
        style={{
          background: "white",
          padding: "50px 30px",
          borderRadius: "18px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          marginBottom: "35px",
          textAlign: "center",
          border: "2px dashed #bfdbfe"
        }}
      >

        <div
          style={{
            fontSize: "55px",
            marginBottom: "10px"
          }}
        >
          📄
        </div>

        <h2
          style={{
            marginBottom: "10px",
            fontSize: "32px"
          }}
        >
          Drop files here or click to browse
        </h2>

        <p
          style={{
            color: "#6b7280",
            marginBottom: "30px"
          }}
        >
          PDF files only • Max 20 MB per file
        </p>

        <label
          style={{
            display: "inline-block",
            padding: "14px 24px",
            background: "#2563eb",
            color: "white",
            borderRadius: "10px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "16px"
          }}
        >

          Choose PDF Files

          <input
            type="file"
            multiple
            accept="application/pdf"
            hidden
            onChange={(e) => {

              setQueueFiles(
                Array.from(e.target.files)
              );

            }}
          />

        </label>

        {queueFiles.length > 0 && (

          <div
            style={{
              marginTop: "25px"
            }}
          >

            <button
              onClick={handleUpload}
              style={{
                background: "#16a34a",
                color: "white",
                border: "none",
                padding: "14px 28px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Upload Files
            </button>

          </div>

        )}

      </div>

      {/* UPLOAD QUEUE */}

      {queueFiles.length > 0 && (

        <div
          style={{
            marginBottom: "40px"
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px"
            }}
          >

            <h2>Upload Queue</h2>

            <p
              style={{
                color: "#6b7280"
              }}
            >
              {queueFiles.length} files
            </p>

          </div>

          {queueFiles.map((file, index) => (

            <div
              key={index}
              style={{
                background: "white",
                borderRadius: "14px",
                padding: "20px",
                marginBottom: "18px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px"
                }}
              >

                <div>

                  <h3
                    style={{
                      margin: 0
                    }}
                  >
                    {file.name}
                  </h3>

                  <p
                    style={{
                      color: "#16a34a",
                      marginTop: "8px",
                      fontWeight: "500"
                    }}
                  >
                    {status || "Pending"}
                  </p>

                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px"
                  }}
                >

                  <span
                    style={{
                      color: "#6b7280"
                    }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </span>

                  <button
                    onClick={() => {

                      const updated =
                        queueFiles.filter(
                          (_, i) => i !== index
                        );

                      setQueueFiles(updated);

                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "red",
                      cursor: "pointer",
                      fontSize: "20px"
                    }}
                  >
                    ✕
                  </button>

                </div>

              </div>

              <div
                style={{
                  width: "100%",
                  height: "12px",
                  background: "#e5e7eb",
                  borderRadius: "999px",
                  overflow: "hidden"
                }}
              >

                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "#22c55e",
                    transition: "0.3s"
                  }}
                />

              </div>

              <p
                style={{
                  marginTop: "10px",
                  fontWeight: "600"
                }}
              >
                {progress}% Completed
              </p>

            </div>

          ))}

        </div>

      )}

      {/* NOTIFICATIONS */}

      <div
        style={{
          marginBottom: "35px"
        }}
      >

        <div
          style={{
            background: "#2563eb",
            color: "white",
            padding: "12px 20px",
            borderRadius: "30px",
            display: "inline-block",
            marginBottom: "20px",
            fontWeight: "600"
          }}
        >
          Notifications (
          {
            notifications.filter(
              note => !note.read
            ).length
          }
          )
        </div>

        {notifications.map((note) => (

          <div
            key={note.id}
            style={{
              background: "white",
              padding: "15px",
              borderRadius: "12px",
              marginBottom: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
            }}
          >

            <p
              style={{
                marginBottom: "8px"
              }}
            >
              {note.message}
            </p>

            <small
              style={{
                color: "#6b7280"
              }}
            >
              {
                new Date(
                  note.timestamp
                ).toLocaleString()
              }
            </small>

          </div>

        ))}

      </div>

      {/* DOCUMENT TABLE */}

      <h2
        style={{
          marginBottom: "20px"
        }}
      >
        Uploaded Documents
      </h2>

      <table
        style={{
          width: "100%",
          background: "white",
          borderCollapse: "collapse",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}
      >

        <thead
          style={{
            background: "#2563eb",
            color: "white"
          }}
        >

          <tr>

            <th style={{ padding: "18px" }}>
              Name
            </th>

            <th style={{ padding: "18px" }}>
              Size
            </th>

            <th style={{ padding: "18px" }}>
              Date
            </th>

            <th style={{ padding: "18px" }}>
              Actions
            </th>

          </tr>

        </thead>

        <tbody>

          {uploadedFiles.map((file) => (

            <tr
              key={file.id}
              style={{
                borderBottom: "1px solid #e5e7eb"
              }}
            >

              <td style={{ padding: "18px" }}>
                {file.name}
              </td>

              <td style={{ padding: "18px" }}>
                {(file.size / 1024).toFixed(2)} KB
              </td>

              <td style={{ padding: "18px" }}>
                {
                  new Date(
                    file.date
                  ).toLocaleString()
                }
              </td>

              <td style={{ padding: "18px" }}>

                <a
                  href={`http://localhost:5000/api/download/${file.path.split("\\").pop()}`}
                  target="_blank"
                  style={{
                    textDecoration: "none",
                    color: "#2563eb",
                    fontWeight: "600"
                  }}
                >
                  Download
                </a>

                <button
                  onClick={async () => {

                    await axios.delete(
                      `http://localhost:5000/api/files/${file.id}`
                    );

                    toast.success(
                      "File deleted"
                    );

                    fetchFiles();

                  }}
                  style={{
                    marginLeft: "14px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600"
                  }}
                >
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default App;
