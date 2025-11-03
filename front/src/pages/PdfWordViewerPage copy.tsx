import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import axios from "axios";
import { renderAsync } from "docx-preview";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfWordViewerPage() {
  const [movieId, setMovieId] = useState<string>("67179d87e0d3b1c4b77c1234"); // Example ID
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [scenario, setScenario] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const viewerRef = useRef<HTMLDivElement>(null);

  const API_BASE = "http://localhost:3000"; // ✅ your backend port

  // -------------------------------
  // Fetch scenario by movieId
  // -------------------------------
  const fetchScenario = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/scenarios/${movieId}`);
      setScenario(res.data);
      if (res.data.fileUrl) setFileUrl(API_BASE + res.data.fileUrl);
      setTitle(res.data.title);
      setDescription(res.data.description || "");
    } catch {
      setScenario(null);
      setFileUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount -> fetch scenario
  useEffect(() => {
    fetchScenario();
  }, [movieId]);

  // -------------------------------
  // Upload & Save new scenario
  // -------------------------------
  const handleSave = async () => {
    if (!file || !title.trim()) {
      alert("Please provide a title and file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("movieId", movieId);
    formData.append("title", title);
    formData.append("description", description);

    try {
      const res = await axios.post(`${API_BASE}/scenarios/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("✅ Screenplay saved!");
      setScenario(res.data);
      setFileUrl(API_BASE + res.data.fileUrl);
    } catch (err: any) {
      console.error(err);
      alert("❌ Upload failed: " + err.response?.data?.message);
    }
  };

  // -------------------------------
  // File input change handler
  // -------------------------------
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);

    // DOCX visual preview before upload
    if (uploadedFile.name.endsWith(".docx")) {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      if (viewerRef.current) {
        viewerRef.current.innerHTML = "";
        await renderAsync(arrayBuffer, viewerRef.current);
      }
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // -------------------------------
  // Render logic
  // -------------------------------
  if (isLoading) return <p style={{ padding: 20 }}>Loading screenplay...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h2>🎬 Movie Screenplay</h2>

      {/* If no scenario yet -> show upload form */}
      {!scenario && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Screenplay Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ marginRight: 10 }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ marginRight: 10 }}
            />
          </div>

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onFileChange}
            style={{ marginBottom: 20 }}
          />
          <br />
          <button onClick={handleSave}>Upload & Save Screenplay</button>

          {/* DOCX preview before save */}
          <div
            ref={viewerRef}
            style={{
              marginTop: 30,
              border: "1px solid #ccc",
              padding: 10,
              minHeight: 300,
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            {!file && <p>No preview yet. Select a file to preview.</p>}
          </div>
        </div>
      )}

      {/* If scenario exists -> show viewer */}
      {scenario && (
        <div style={{ marginTop: 20 }}>
          <h3>{scenario.title}</h3>
          <p>{scenario.description}</p>

          <div
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginTop: 10,
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {fileUrl && fileUrl.endsWith(".pdf") && (
              <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                {Array.from(new Array(numPages), (_, index) => (
                  <Page key={index} pageNumber={index + 1} width={600} />
                ))}
              </Document>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
