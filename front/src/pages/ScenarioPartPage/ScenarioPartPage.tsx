import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "./ScenarioPartPage.css";
import Navbar from "../Navbar/Navbar";
import { getUserInfo } from "../../services/authService";
import { scenarioService } from "../../services/scenarioService";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { noteService } from "../../services/noteService";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { backgroundService } from "../../services/backgroundService";

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function ScenarioPartPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [user, setUser] = useState<{ role: number } | null>(null);
  const [scenario, setScenario] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [filteredPdfUrl, setFilteredPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scriptText, setScriptText] = useState<string>("");
  const [allCharacters, setAllCharacters] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");

  const navigate = useNavigate();
  const { movieId } = useParams();

  // Highlight notes in script text
  const highlightTextWithNotes = (text: string) => {
    if (!notes || notes.length === 0) return text;

    let highlighted = text;
    notes.forEach((note) => {
      if (!note.text) return;

      const safeText = note.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${safeText})`, "gi");

      highlighted = highlighted.replace(
        regex,
        `<span class="note-highlight" data-id="${note._id}">$1</span>`
      );
    });

    return highlighted;
  };

  const handleNoteClick = (e: any) => {
    if (e.target.classList.contains("note-highlight")) {
      const id = e.target.getAttribute("data-id");
      navigate(`/notes/${id}`);
    }
  };
  const token = localStorage.getItem("token");
  // Load user + notes
  useEffect(() => {

    if (!token) {
      navigate("/login");
      return;
    }  

    noteService.getAllNotes(token).then((res) => setNotes(res));

    getUserInfo(token)
      .then((data) => setUser(data.user || data))
      .finally(() => setIsLoading(false));
  }, []);

  // Load scenario PDF
  useEffect(() => {
    scenarioService
      .getScenario(movieId+'')
      .then(async (res) => {
        setScenario(res);
        const fullUrl = `http://localhost:3000${res.fileUrl}`;
        setPdfUrl(fullUrl);
        extractTextFromPDF(fullUrl);
        backgroundService.changeBackgroundPerMovie(token,movieId,navigate)
        
      })
      .catch(() => {
        setScenario(null)
        backgroundService.changeBackgroundPerUser(token,movieId,navigate)

      });
  }, [movieId]);

  // Extract script text from PDF
  const extractTextFromPDF = async (pdfUrl: string) => {
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    let textContent = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      textContent += strings.join("\n") + "\n";
    }

    setScriptText(textContent);

    const regex = /^[A-Z][A-Z0-9 .'\-]{1,25}$/gm;
    const matches = Array.from(new Set(textContent.match(regex) || []));
    setAllCharacters(matches.filter((m) => m.length > 2 && m.length < 25));
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const changePage = (offset: number) => setPageNumber((p) => p + offset);
  const zoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
  const zoomOut = () => setScale((p) => Math.max(p - 0.2, 0.6));

  // Filter dialogue + regenerate PDF
  const handleCharacterSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedCharacter(name);
    if (!name) {
      setFilteredPdfUrl(null);
      return;
    }

    const lines = scriptText.split("\n");
    const filtered: string[] = [];
    let capturing = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === name) {
        capturing = true;
        filtered.push(name);
        continue;
      }
      const isNextName = /^[A-Z][A-Z0-9 .'\-]{1,25}$/.test(line);
      if (isNextName && capturing) capturing = false;
      if (capturing && line.length > 0) filtered.push(line);
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Courier);
    const { height } = page.getSize();
    let y = height - 60;

    for (const line of filtered) {
      let text = line.trim();

      if (y < 80) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = height - 60;
      }

      if (text === name) {
        page.drawText(text, {
          x: 297.64 - font.widthOfTextAtSize(text, 14) / 2,
          y,
          size: 14,
          font,
          color: rgb(0, 0, 0),
        });
        y -= 30;
      } else {
        const maxWidth = 350;
        const words = text.split(" ");
        let lineText = "";
        for (const word of words) {
          const testLine = lineText + word + " ";
          if (font.widthOfTextAtSize(testLine, 12) > maxWidth) {
            page.drawText(lineText.trim(), { x: 120, y, size: 12, font, color: rgb(0, 0, 0) });
            y -= 18;
            lineText = word + " ";
            if (y < 80) {
              page = pdfDoc.addPage([595.28, 841.89]);
              y = height - 60;
            }
          } else {
            lineText = testLine;
          }
        }
        if (lineText.trim()) {
          page.drawText(lineText.trim(), { x: 120, y, size: 12, font, color: rgb(0, 0, 0) });
          y -= 18;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    setFilteredPdfUrl(url);
    setPageNumber(1);
  };

  const downloadCurrentPDF = () => {
    const currentUrl = filteredPdfUrl || pdfUrl;
    const a = document.createElement("a");
    a.href = currentUrl!;
    a.download = filteredPdfUrl ? `${selectedCharacter}_dialogue.pdf` : "full_scenario.pdf";
    a.click();
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
        {!scenario && (
           <>
           <div className="no-scenario"><p>Još nema scenarija.</p></div>
           </>
        )}
        {scenario && (
          <>
            <div className="character-filter">
              <label>Filtriraj po liku: </label>
              <select onChange={handleCharacterSelect} value={selectedCharacter}>
                <option value="">-- Svi likovi --</option>
                {allCharacters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button className="leftButtonPlus" onClick={downloadCurrentPDF}>📘 Preuzmi prikazani PDF</button>
            </div>

            {/* PDF VIEWER */}
            <div className="pdf-viewer">
              <div className="pdf-controls">
                <button disabled={pageNumber <= 1} onClick={() => changePage(-1)}>◀ Pret.</button>
                <span>Strana {pageNumber} / {numPages}</span>
                <button disabled={pageNumber >= numPages} onClick={() => changePage(1)}>Sled. ▶</button>
                <button onClick={zoomOut}>➖</button>
                <button onClick={zoomIn}>➕</button>
              </div>

              <div className="pdf-scroll-container">
                <Document
                  file={filteredPdfUrl || pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer
                    renderAnnotationLayer
                  />
                </Document>
              </div>
            </div>

            {/* FULL SCRIPT HIGHLIGHT 
            {!selectedCharacter && scriptText && (
              <div
                className="script-highlight-view"
                dangerouslySetInnerHTML={{ __html: highlightTextWithNotes(scriptText) }}
                onClick={handleNoteClick}
              />
            )}*/}
          </>
        )}
      </div>
    </div>
  );
}
