import React, { useEffect, useState, useRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./BookPage.css";
import Navbar from "../Navbar/Navbar";
import { getUserInfo } from "../../services/authService";
import { bookService } from "../../services/bookService";
import { useParams, useNavigate } from "react-router-dom";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { backgroundService } from "../../services/backgroundService";
import { getMAINUserRoleForMovie, getUserRoleForMovie } from "../../services/movieService";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function BookPage() {
  const [user, setUser] = useState<{ role: number } | null>(null);
  const [book, setBook] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(2.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editorContent, setEditorContent] = useState<string>("");
  const [htmlPages, setHtmlPages] = useState<string[]>([]);
  const [htmlPageIndex, setHtmlPageIndex] = useState<number>(0);

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 794, height: 1122 });
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const { movieId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    getUserInfo(token + "")
      .then((data) => 
        {
          getMAINUserRoleForMovie(token+'',movieId+'').then(data2 =>{
              data.role = data2
              setUser(data);
          })
        }
      )
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    backgroundService.changeBackgroundPerUser(token, movieId, navigate);

    bookService
      .getBook("" + movieId)
      .then((res) => {
        setBook(res);
        setPdfUrl(res.fileUrl ? `http://localhost:3000${res.fileUrl}` : null);
        setEditorContent(res.htmlContent || "");
        paginateHtmlToPages(res.htmlContent || "");
        backgroundService.changeBackgroundPerMovie(token, movieId, navigate);
      })
      .catch(() => setBook(null));
  }, [movieId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const changePage = (offset: number) => setPageNumber((p) => p + offset);
  const zoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
  const zoomOut = () => setScale((p) => Math.max(p - 0.2, 0.6));

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!token) return setError("Niste prijavljeni.");

    try {
      await bookService.uploadBook(file, "" + movieId, token);
      window.location.reload();
    } catch {
      setError("Greška pri učitavanju fajla.");
    }
  }, []);

  const handleCreateEmptyBook = async () => {
    if (!token) return setError("Niste prijavljeni.");
    try {
      await bookService.createEmptyBook("" + movieId, token);
      window.location.reload();
    } catch {
      setError("Greška pri kreiranju prazne knjige.");
    }
  };

  const handleSaveHtml = async () => {
    if (!token) return setError("Niste prijavljeni.");
    try {
      await bookService.updateBookContent("" + movieId, editorContent, token);
      const updated = await bookService.getBook("" + movieId);
      setBook(updated);
      setIsEditing(false);
      paginateHtmlToPages(updated.htmlContent || "");
      alert("✅ Promene sačuvane!");
    } catch (err) {
      console.error(err);
      alert("❌ Greška pri čuvanju promena");
    }
  };

  // ---- Pagination ----
  const paginateHtmlToPages = (html: string) => {
    if (!html) return;
    const off = document.createElement("div");
    off.style.position = "fixed";
    off.style.left = "-9999px";
    off.style.width = pageSize.width + "px";
    off.innerHTML = html;
    document.body.appendChild(off);

    const children = Array.from(off.childNodes);
    const pages: string[] = [];
    let currentPage = document.createElement("div");

    for (let i = 0; i < children.length; i++) {
      const node = children[i].cloneNode(true);
      currentPage.appendChild(node);
      off.appendChild(currentPage);
      const height = currentPage.scrollHeight;
      off.removeChild(currentPage);

      if (height > pageSize.height) {
        currentPage.removeChild(currentPage.lastChild!);
        pages.push(currentPage.innerHTML);
        currentPage = document.createElement("div");
        currentPage.appendChild(node);
      }
    }

    if (currentPage.childNodes.length > 0) pages.push(currentPage.innerHTML);
    document.body.removeChild(off);
    setHtmlPages(pages);
    setHtmlPageIndex(0);
  };

  // ---- PDF download ----
  const handleDownloadPDF = async () => {
    if (htmlPages.length === 0) return;

    const pdf = new jsPDF({
      unit: "px",
      format: [pageSize.width, pageSize.height],
    });

    for (let i = 0; i < htmlPages.length; i++) {
      const element = document.createElement("div");
      element.style.width = pageSize.width + "px";
      element.style.height = pageSize.height + "px";
      element.style.paddingLeft = "50px";
      element.style.paddingRight = "50px";
      element.style.paddingTop = "20px";
      element.style.paddingBottom= "20px";
      element.innerHTML = htmlPages[i];
      document.body.appendChild(element);
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      if (i > 0) pdf.addPage([pageSize.width, pageSize.height]);
      pdf.addImage(imgData, "PNG", 0, 0, pageSize.width, pageSize.height);
      document.body.removeChild(element);
    }

    pdf.save(`${book?.title || "knjiga"}.pdf`);
  };

  // ---- Search highlight ----
  const highlightText = (html: string, query: string) => {
    if (!query.trim()) return html;
    const regex = new RegExp(`(${query})`, "gi");
    return html.replace(regex, `<mark>$1</mark>`);
  };

  const filteredPage =
    htmlPages.length > 0
      ? highlightText(htmlPages[htmlPageIndex] || "", searchTerm)
      : book?.htmlContent || "";

  if (isLoading)
    return (
      <div className="book-loading">
        <Navbar />
        <p>Učitavanje...</p>
      </div>
    );

  return (
    <div className="bookpage-container-other">
      <Navbar />
      <div className="bookpage-card-other">
        <h1 className="bookpage-title-other">Knjiga Snimanja</h1>
        {user?.role === 1 && !book && (
          <div className="upload-section">
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden-input" onChange={handleFileChange} />
            <button className="upload-button-other secondary" onClick={handleCreateEmptyBook}>➕ Kreiraj praznu knjigu</button>
            {error && <p className="error">{error}</p>}
          </div>
        )}

        {user?.role !== 1 && !book && (
          <p className="missing-book-message">Režiser još nije postavio knjigu snimanja.</p>
         )}
        {/* Page controls */}
        {book?.htmlContent && !isEditing && (
          <div className="page-controls">

          </div>
        )}

        {isEditing ? (
          <div className="editor-container">
            <ReactQuill
              theme="snow"
              value={editorContent}
              onChange={setEditorContent} 
              className="larger-quill"
              />
            <div className="editor-actions">
              <button onClick={handleSaveHtml}>💾 Sačuvaj</button>
              <button onClick={() => setIsEditing(false)}>❌ Odustani</button>
            </div>
          </div>
        ) : book?.htmlContent ? (
          <div className="html-preview-wrapper">
            <div className="html-preview-controls">
              <button onClick={() => setHtmlPageIndex((p) => Math.max(p - 1, 0))}>◀</button>
              <span>
                Strana {htmlPageIndex + 1} / {htmlPages.length}
              </span>
              <button
                onClick={() => setHtmlPageIndex((p) => Math.min(p + 1, htmlPages.length - 1))}
              >
                ▶
              </button>
              {user?.role === 1 && (
                <button className="edit-button small" onClick={() => setIsEditing(true)}>
                  ✏️ Uredi
                </button>
              )}
            </div>

            <div
              className="html-preview"
              ref={previewContainerRef}
              style={{ height: pageSize.height + "px" }}
            >
              <div
                className="html-page"
                style={{ width: pageSize.width + "px", height: pageSize.height + "px" }}
                dangerouslySetInnerHTML={{ __html: filteredPage }}
              />
            </div>

            <button className="download-btn" onClick={handleDownloadPDF}>
              ⬇️ Preuzmi kao PDF
            </button>
          </div>
        ) : (
          pdfUrl && (
            <div className="pdf-viewer-other">
                {user?.role === 1 && 
                <button className="edit-button-second small" onClick={() => { setEditorContent(""); setIsEditing(true); }}>
                ✏️ Uredi</button>}

              <div className="document-div">
              <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} scale={scale} renderTextLayer renderAnnotationLayer />
              </Document>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
