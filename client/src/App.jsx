
import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [files, setFiles] = useState([]);
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
    const res = await axios.get("http://localhost:5000/api/files");
    setUploadedFiles(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get("http://localhost:5000/api/notifications");
    setNotifications(res.data);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Select files first");
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    setStatus("Uploading...");

    if (files.length > 3) {
      toast("Upload in progress...");
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

      setProgress(0);

    } catch (error) {
      toast.error("Upload Failed");
      setStatus("Failed");
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        background: "#f4f7fb",
        minHeight: "100vh",
        fontFamily: "Arial"
      }}
    >
      <Toaster />

      <h1
        style={{
          color: "#2563eb",
          marginBottom: "30px"
        }}
      >
        Document Dashboard
      </h1>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
          marginBottom: "30px"
        }}
      >
        <h2>Upload PDF Files</h2>

        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setFiles(e.target.files)}
        />

        <br />
        <br />

        <button
          onClick={handleUpload}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Upload Files
        </button>

        {progress > 0 && (
          <div style={{ marginTop: "25px" }}>
            <div
              style={{
                width: "100%",
                maxWidth: "400px",
                height: "20px",
                background: "#ddd",
                borderRadius: "20px",
                overflow: "hidden"
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#2563eb",
                  transition: "0.3s"
                }}
              />
            </div>

            <p style={{ marginTop: "10px" }}>
              {progress}% Completed
            </p>

            <p>
              Status: <b>{status}</b>
            </p>
          </div>
        )}
      </div>

      <div
        style={{
          background: "#2563eb",
          color: "white",
          padding: "12px 20px",
          borderRadius: "30px",
          display: "inline-block",
          marginBottom: "20px"
        }}
      >
        Notifications ({notifications.length})
      </div>

      <div style={{ marginBottom: "40px" }}>
        {notifications.length === 0 ? (
          <p>No notifications yet</p>
        ) : (
          notifications.map((note) => (
            <div
              key={note.id}
              style={{
                background: "white",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "10px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
              }}
            >
              <p>{note.message}</p>

              <small>
                {new Date(note.timestamp).toLocaleString()}
              </small>
            </div>
          ))
        )}
      </div>

      <h2 style={{ marginBottom: "20px" }}>
        Uploaded Documents
      </h2>

      <table
        style={{
          width: "100%",
          background: "white",
          borderCollapse: "collapse",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
        }}
        border="1"
      >
        <thead
          style={{
            background: "#2563eb",
            color: "white"
          }}
        >
          <tr>
            <th style={{ padding: "15px" }}>Name</th>
            <th style={{ padding: "15px" }}>Size</th>
            <th style={{ padding: "15px" }}>Date</th>
            <th style={{ padding: "15px" }}>Download</th>
          </tr>
        </thead>

        <tbody>
          {uploadedFiles.map((file) => (
            <tr key={file.id}>
              <td style={{ padding: "15px" }}>
                {file.name}
              </td>

              <td style={{ padding: "15px" }}>
                {(file.size / 1024).toFixed(2)} KB
              </td>

              <td style={{ padding: "15px" }}>
                {new Date(file.date).toLocaleString()}
              </td>

              <td style={{ padding: "15px" }}>
                <a
                  href={`http://localhost:5000/api/download/${file.path.split("\\").pop()}`}
                  target="_blank"
                >
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

