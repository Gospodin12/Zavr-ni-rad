import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "./ScenarioPage.css";
import Navbar from "../Navbar/Navbar";
import { getUserInfo } from "../../services/authService";
import { scenarioService } from "../../services/scenarioService"
import { useNavigate, useParams } from "react-router-dom";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { backgroundService } from "../../services/backgroundService";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ScenarioPage() {
  const [user, setUser] = useState<{ role: number } | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [popup, setPopup] = useState<{ visible: boolean; text: string; x: number; y: number }>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { movieId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Get logged in user
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }  

    getUserInfo(token)
      .then((data) => setUser(data.user || data))
      .finally(() => setIsLoading(false));
  }, []);

  // Get scenario
  useEffect(() => {
    scenarioService.getScenario(''+movieId)
      .then((res) => {
        setScenario(res);
        setPdfUrl(`http://localhost:3000${res.fileUrl}`);
        backgroundService.changeBackgroundPerMovie(token,movieId,navigate)
      })
      .catch(() => 
        {
          setScenario(null)
          backgroundService.changeBackgroundPerUser(token,movieId,navigate)

        }
        );
  }, [movieId]);

  // Upload
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) return setError("Niste prijavljeni.");

    try {
      await scenarioService.uploadScenario(file, ''+movieId, token);
      window.location.reload();
    } catch {
      setError("Greška pri učitavanju fajla.");
    }
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const changePage = (offset: number) => setPageNumber((p) => p + offset);
  const zoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
  const zoomOut = () => setScale((p) => Math.max(p - 0.2, 0.6));

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text) {
        const rect = selection!.getRangeAt(0).getBoundingClientRect();
        setPopup({
          visible: true,
          text,
          x: rect.x + rect.width / 2,
          y: rect.y - 40,
        });
      } else {
        setPopup((prev) => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const handleMakeNote = () => {
    localStorage.setItem("selectedText", JSON.stringify({
      text: popup.text,
      page: pageNumber,
      position: { x: popup.x, y: popup.y },
      movieId,
    }));
    setPopup({ ...popup, visible: false });
    navigate(`/${movieId}/note`);
  };


  if (isLoading) {
    return (
      <div className="scenario-loading">
        <Navbar />
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="scenario-container">
      <Navbar />
      <div className="scenario-card">
        <h1 className="scenario-title">Scenario</h1>

        {/* Upload */}
        {user?.role === 1 && !scenario && (
          <div className="upload-section">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden-input" onChange={handleFileChange} />
            <button className="upload-button" onClick={() => fileInputRef.current?.click()}>
              📄 Dodaj scenario
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        )}

        {/* No scenario */}
        {!scenario && user?.role !== 1 && <div className="no-scenario"><p>Još nema scenarija.</p></div>}

        {/* PDF viewer */}
        {scenario && pdfUrl && (
          <div className="pdf-viewer">
            <div className="pdf-controls">
              <button disabled={pageNumber <= 1} onClick={() => changePage(-1)}>◀ Pret.</button>
              <span>Strana {pageNumber} / {numPages}</span>
              <button disabled={pageNumber >= numPages} onClick={() => changePage(1)}>Sled. ▶</button>
              <button onClick={zoomOut}>➖</button>
              <button onClick={zoomIn}>➕</button>
            </div>

            <div className="pdf-scroll-container">
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer renderAnnotationLayer />
              </Document>
            </div>
          </div>
        )}
      </div>

      {/* ✨ Popup for creating note */}
      {popup.visible && (
        <div className="selection-popup" style={{ top: popup.y, left: popup.x }}>
          <button onClick={handleMakeNote}>📝 Napravi belešku</button>
        </div>
      )}
    </div>
  );
}
