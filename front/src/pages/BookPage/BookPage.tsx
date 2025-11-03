import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "./BookPage.css";
import Navbar from "../Navbar/Navbar";
import { getUserInfo } from "../../services/authService";
import { bookService } from "../../services/bookService";
import { useParams } from "react-router-dom";
import { useNavigate} from "react-router-dom";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { backgroundService } from "../../services/backgroundService";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function BookPage() {
  const [user, setUser] = useState<{ role: number } | null>(null);
  const [book, setBook] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { movieId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  // ✅ Get logged in user
  useEffect(() => {

    getUserInfo(token+"")
      .then((data) => setUser(data.user || data))
      .finally(() => setIsLoading(false));
  }, []);

  // ✅ Get book
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }  
    backgroundService.changeBackgroundPerUser(token,movieId,navigate)
    bookService
      .getBook("" + movieId)
      .then((res) => {
        setBook(res);
        setPdfUrl(`http://localhost:3000${res.fileUrl}`);
        backgroundService.changeBackgroundPerMovie(token,movieId,navigate)

      })
      .catch(() => setBook(null));
  }, [movieId]);

  // ✅ Upload new book
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    if (!token) return setError("Niste prijavljeni.");

    try {
      await bookService.uploadBook(file, "" + movieId, token);
      window.location.reload();
    } catch {
      setError("Greška pri učitavanju fajla.");
    }
  }, []);

  // ✅ Create empty book
  const handleCreateEmptyBook = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setError("Niste prijavljeni.");

    try {
      await bookService.createEmptyBook("" + movieId, token);
      window.location.reload();
    } catch {
      setError("Greška pri kreiranju prazne knjige.");
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const changePage = (offset: number) => setPageNumber((p) => p + offset);
  const zoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
  const zoomOut = () => setScale((p) => Math.max(p - 0.2, 0.6));

  if (isLoading) {
    return (
      <div className="book-loading">
        <Navbar />
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="bookpage-container-other">
      <Navbar />
      <div className="bookpage-card-other">
        <h1 className="bookpage-title-other">Knjiga Snimanja</h1>

        {/* Upload / Create new */}
        {user?.role === 1 && !book && (
          <div className="upload-section">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden-input"
              onChange={handleFileChange}
            />
            <button className="upload-button-other" onClick={() => fileInputRef.current?.click()}>
              📚 Dodaj knjigu
            </button>
            <div></div>
            <button className="upload-button-other secondary" onClick={handleCreateEmptyBook}>
              ➕ Kreiraj praznu knjigu
            </button>

            {error && <p className="error">{error}</p>}
          </div>
        )}

        {/* No book */}
        {!book && user?.role !== 1 && (
          <div className="no-book-other">
            <p>Još nema knjige.</p>
          </div>
        )}

        {/* PDF viewer */}
        {book && pdfUrl && (
          <div className="pdf-viewer-other">
            <div className="pdf-controls-other">
              <button disabled={pageNumber <= 1} onClick={() => changePage(-1)}>
                ◀ Pret.
              </button>
              <span>
                Strana {pageNumber} / {numPages}
              </span>
              <button disabled={pageNumber >= numPages} onClick={() => changePage(1)}>
                Sled. ▶
              </button>
              <button onClick={zoomOut}>➖</button>
              <button onClick={zoomIn}>➕</button>
            </div>

            <div className="pdf-scroll-container-other">
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer renderAnnotationLayer />
              </Document>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
