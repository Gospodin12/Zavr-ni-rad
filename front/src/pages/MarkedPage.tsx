import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import mammoth from "mammoth";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function MarkedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { text, fileName, fileData } = (location.state as any) || {};
  const [numPages, setNumPages] = useState<number>();
  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fileData || !fileName) return;

    if (fileName.endsWith(".docx")) {
      const loadDocx = async () => {
        const arrayBuffer = await fetch(fileData).then((res) => res.arrayBuffer());
        const result = await mammoth.convertToHtml({ arrayBuffer });
        let html = result.value;

        // Highlight selected text
        const regex = new RegExp(text, "i");
        html = html.replace(regex, `<span style="background:red;color:white;">${text}</span>`);

        setDocxHtml(html);
      };
      loadDocx();
    }
  }, [fileData, fileName, text]);

  // Scroll to highlighted part after render
  useEffect(() => {
    if (!viewerRef.current) return;
    const highlighted = viewerRef.current.querySelector("span[style*='background:red']");
    if (highlighted) {
      highlighted.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [docxHtml]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Marked Text in File</h2>

      <div
        ref={viewerRef}
        style={{
          border: "1px solid #ccc",
          padding: 10,
          minHeight: 400,
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {!fileData && <p>No file loaded.</p>}

        {/* Show PDF again */}
        {fileName?.endsWith(".pdf") && (
          <Document file={fileData} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page key={index} pageNumber={index + 1} width={600} />
            ))}
          </Document>
        )}

        {/* Show DOCX with highlight */}
        {fileName?.endsWith(".docx") && docxHtml && (
          <div dangerouslySetInnerHTML={{ __html: docxHtml }} />
        )}
      </div>

      {text && (
        <p style={{ marginTop: 10 }}>
          <strong>Selected Text:</strong> {text}
        </p>
      )}

      <button style={{ marginTop: 20 }} onClick={() => navigate(-1)}>
        🔙 Back to Viewer
      </button>
    </div>
  );
}
