import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import JSZip from "jszip";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
import { jsPDF } from "jspdf";
import { renderAsync } from "docx-preview";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function PdfWordViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [writerContent, setWriterContent] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>();
  const [wordCount, setWordCount] = useState<number>(0);
  const [spaceCount, setSpaceCount] = useState<number>(0);
  const [exteriorScenes, setExteriorScenes] = useState<string[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setWriterContent(null);
    setWordCount(0);
    setSpaceCount(0);
    setExteriorScenes([]);

    // DOCX
    if (uploadedFile.name.endsWith(".docx")) {
      const arrayBuffer = await uploadedFile.arrayBuffer();

      // Render the DOCX visually like Word
      if (viewerRef.current) {
        viewerRef.current.innerHTML = "";
        await renderAsync(arrayBuffer, viewerRef.current);
      }

      // Extract raw text for processing
      const text = await extractTextFromDocx(arrayBuffer);
      const scenes = extractExteriorScenes(text);
      setExteriorScenes(scenes);
      setWordCount(text.trim().split(/\s+/).length);
      setSpaceCount((text.match(/\s/g) || []).length);
    }
    // WDZ
    else if (uploadedFile.name.endsWith(".wdz")) {
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        let content = "";
        const filePath = Object.keys(zip.files).find(
          f => f.endsWith("main.json") || f.endsWith("content.xml")
        );
        if (filePath) {
          const text = await zip.files[filePath].async("text");
          content = text;
        } else content = "⚠️ Could not extract content from WDZ file.";
        setWriterContent(content);
        const stripped = content.replace(/<[^>]+>/g, " ");
        const scenes = extractExteriorScenes(stripped);
        setExteriorScenes(scenes);
        setWordCount(stripped.trim().split(/\s+/).length);
        setSpaceCount((stripped.match(/\s/g) || []).length);
      } catch (err) {
        console.error(err);
        setWriterContent("⚠️ Could not extract content from WDZ file.");
      }
    }
    // PDF
    else if (uploadedFile.name.endsWith(".pdf")) {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      setFileData(arrayBuffer as any);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (file) {
      setWordCount(numPages * 300);
      setSpaceCount(numPages * 300);
    }
  };

  const extractTextFromDocx = async (arrayBuffer: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const xml = await zip.file("word/document.xml")?.async("text");
    return xml ? xml.replace(/<[^>]+>/g, " ") : "";
  };

const extractExteriorScenes = (text: string) => {
  // Matches "EXT." or "EXT," or "EXTERIOR" (case-insensitive)
  const regex = /(EXT[\.,\s]|EXTERIOR)[\s\S]*?(?=(INT[\.,\s]|INTERIOR|EXT[\.,\s]|EXTERIOR|$))/gi;
  const matches = text.match(regex);
  return matches ? matches.map(s => s.trim()) : [];
};


  const generatePdf = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(12);
    pdf.text(`Number of words: ${wordCount}`, 10, 20);
    pdf.text(`Number of spaces: ${spaceCount}`, 10, 30);
    pdf.text(`Number of pages: ${numPages || 0}`, 10, 40);
    pdf.text("That's all folks", 10, 50);

    if (exteriorScenes.length > 0) {
      pdf.text("EXTERIOR SCENES:", 10, 70);
      exteriorScenes.forEach((scene, i) => {
        pdf.text(scene.substring(0, 90), 10, 80 + i * 10); // truncate long lines
      });
    }

    pdf.save("generated_info.pdf");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload and View PDF / Word / Writer Solo</h2>
      <input type="file" accept=".pdf,.docx,.wdz" onChange={onFileChange} />

      <div
        ref={viewerRef}
        style={{
          marginTop: 20,
          border: "1px solid #ccc",
          padding: 10,
          minHeight: 400,
          maxHeight: "80vh",
          overflowY: "auto",
          cursor: "text",
        }}
      >
        {!file && <p>Upload a document to preview it here.</p>}
        {file && file.name.endsWith(".pdf") && fileData && (
          <Document file={fileData} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={index} pageNumber={index + 1} width={600} />
            ))}
          </Document>
        )}
      </div>

      {exteriorScenes.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3>Extracted EXTERIOR Scenes</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#f8f8f8",
              padding: 10,
              border: "1px solid #ddd",
            }}
          >
            {exteriorScenes.join("\n\n")}
          </pre>
        </div>
      )}

      {file && (
        <button
          style={{ marginTop: 20 }}
          onClick={() => generatePdf()}
        >
          Generate PDF with Info
        </button>
      )}
    </div>
  );
}
