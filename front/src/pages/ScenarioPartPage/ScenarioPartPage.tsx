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
import { useNavigate, useParams } from "react-router-dom";
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
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [sceneNumbers, setSceneNumbers] = useState<number[]>([]);
  const [selectedScene, setSelectedScene] = useState<number | "">("");

  const navigate = useNavigate();
  const { movieId } = useParams();
  const token = localStorage.getItem("token");

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
      .getScenario(movieId + "")
      .then(async (res) => {
        setScenario(res);
        const fullUrl = `http://localhost:3000${res.fileUrl}`;
        setPdfUrl(fullUrl);
        extractTextFromPDF(fullUrl);
        backgroundService.changeBackgroundPerMovie(token, movieId, navigate);
      })
      .catch(() => {
        setScenario(null);
        backgroundService.changeBackgroundPerUser(token, movieId, navigate);
      });
  }, [movieId]);

  // 🧠 Extract text and detect characters + locations + scenes
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

    // 🧩 Extract characters (exclude INT./EXT.)
    const regexChar = /^[A-Z][A-Z0-9 .'\-]{1,25}$/gm;
    const matches = textContent.match(regexChar) || [];
    const counts: Record<string, number> = {};

    matches.forEach((m) => {
      if (!m.startsWith("INT.") && !m.startsWith("EXT.")) {
        counts[m] = (counts[m] || 0) + 1;
      }
    });

    const uniqueChars = Object.keys(counts).filter((c) => counts[c] >= 3);
    setAllCharacters(uniqueChars);

    // 🏠 Extract locations
    const regexLoc = /^(INT\.|EXT\.)[^\n]*/gm;
    const locMatches = textContent.match(regexLoc) || [];
    const uniqueLocs = Array.from(new Set(locMatches));
    setAllLocations(uniqueLocs);

    // 🎬 Count scenes
    const sceneCount = locMatches.length;
    setSceneNumbers(Array.from({ length: sceneCount }, (_, i) => i + 1));
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) =>
    setNumPages(numPages);
  const changePage = (offset: number) => setPageNumber((p) => p + offset);
  const zoomIn = () => setScale((p) => Math.min(p + 0.2, 3));
  const zoomOut = () => setScale((p) => Math.max(p - 0.2, 0.6));

  // 🧩 Generate filtered PDF by character/location/scene
const handleFilter = async (
  character?: string,
  location?: string,
  sceneNum?: number
) => {
  let lines = scriptText.split("\n");

  // --- Split into scenes first
  const sceneSplits = scriptText.split(/(?=^(INT\.|EXT\.).*)/gm);
  if (sceneNum) {
    const selectedSceneText = sceneSplits[sceneNum] || "";
    lines = selectedSceneText.split("\n");
  }

  // --- Filter by location ---
  if (location) {
    let capturing = false;
    const filtered: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith(location)) {
        capturing = true;
        filtered.push(trimmed);
        continue;
      }
      if (/^(INT\.|EXT\.)/.test(trimmed) && capturing && !trimmed.startsWith(location)) {
        capturing = false;
      }
      if (capturing) filtered.push(trimmed);
    }
    lines = filtered;
  }

  // --- Filter by character ---
  if (character) {
    const filtered: string[] = [];
    let capturing = false;
    const charRegex = new RegExp(`^${character}\\b`, "i");

    for (const line of lines) {
      const trimmed = line.trim();
      if (charRegex.test(trimmed)) {
        capturing = true;
        filtered.push(trimmed);
        continue;
      }
      const isNextName = /^[A-Z][A-Z0-9 .'\-()]{1,30}$/.test(trimmed);
      if (isNextName && capturing && !charRegex.test(trimmed)) capturing = false;
      if (capturing && trimmed.length > 0) filtered.push(trimmed);
    }
    lines = filtered;
  }

  // 🧹 Clean diacritics and unsupported letters
const cleanText = (text: string) =>
      text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accent marks
      .replace(/[čćšžđ]/g, c => ({ č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj' }[c] as string)) // <--- Added type assertion here
      .replace(/[ČĆŠŽĐ]/g, c => ({ Č: 'C', Ć: 'C', Š: 'S', Ž: 'Z', Đ: 'Dj' }[c] as string)); // <--- And here
  // --- Build new PDF ---
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Courier);
  const { height } = page.getSize();
  let y = height - 60;

  for (const line of lines) {
    const text = cleanText(line.trim());
    if (!text) continue;

    if (y < 80) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 60;
    }

    const isChar = /^[A-Z][A-Z0-9 .'\-()]{1,30}$/.test(text);
    const size = isChar ? 14 : 12;
    const x = isChar
      ? 297.64 - font.widthOfTextAtSize(text, size) / 2
      : 80;

    page.drawText(text, { x, y, size, font, color: rgb(0, 0, 0) });
    y -= isChar ? 30 : 18;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  setFilteredPdfUrl(url);
  setPageNumber(1);
};



  const handleCharacterSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedCharacter(name);
    handleFilter(name, selectedLocation, selectedScene as number);
  };

  const handleLocationSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const loc = e.target.value;
    setSelectedLocation(loc);
    handleFilter(selectedCharacter, loc, selectedScene as number);
  };

  const handleSceneSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scene = e.target.value ? Number(e.target.value) : "";
    setSelectedScene(scene);
    handleFilter(selectedCharacter, selectedLocation, scene as number);
  };

  const downloadCurrentPDF = () => {
    const currentUrl = filteredPdfUrl || pdfUrl;
    const a = document.createElement("a");
    a.href = currentUrl!;
    a.download = filteredPdfUrl
      ? `${selectedCharacter || selectedLocation || selectedScene}_filter.pdf`
      : "full_scenario.pdf";
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
          <div className="no-scenario">
            <p>Još nema scenarija.</p>
          </div>
        )}
        {scenario && (
          <>
            <div className="character-filter">
              <label>Filtriraj po liku: </label>
              <select className="select-height-size" onChange={handleCharacterSelect} value={selectedCharacter}>
                <option value="">-- Svi likovi --</option>
                {allCharacters.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="label-height-size2">Filtriraj po lokaciji: </label>
              <select className="select-height-size2" onChange={handleLocationSelect} value={selectedLocation}>
                <option value="">-- Sve lokacije --</option>
                {allLocations.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>


            </div>

            <div className="pdf-viewer">
              <div className="pdf-controls">
                <button
                  disabled={pageNumber <= 1}
                  onClick={() => changePage(-1)}
                >
                  ◀ Pret.
                </button>
                <span>
                  Strana {pageNumber} / {numPages}
                </span>
                <button
                  disabled={pageNumber >= numPages}
                  onClick={() => changePage(1)}
                >
                  Sled. ▶
                </button>
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

            <div className="download-btn-container">
              <button className="leftButtonPlus" onClick={downloadCurrentPDF}>
                📘 Preuzmi prikazani PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
