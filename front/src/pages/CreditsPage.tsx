import { useRef, useState } from "react";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
export default function ScrollingTextVideo({ text }: { text: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateVideo = async () => {
    setIsGenerating(true);
    const ffmpeg = createFFmpeg({ log: true });
    await ffmpeg.load();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    const lines = text.split("\n");
    let yOffset = height;

    const frames: Uint8Array[] = [];
    for (let i = 0; i < 180; i++) { // 6s of video at 30fps
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "white";
      ctx.font = "20px monospace";
      let y = yOffset - i * 2;
      for (const line of lines) {
        ctx.fillText(line, 50, y);
        y += 30;
      }

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );
      const arrayBuffer = await blob.arrayBuffer();
      frames.push(new Uint8Array(arrayBuffer));
    }

    // Write frames to ffmpeg virtual FS
    for (let i = 0; i < frames.length; i++) {
      const filename = `frame_${String(i).padStart(4, "0")}.png`;
      await ffmpeg.FS("writeFile", filename, frames[i]);
    }

    // Encode video
    await ffmpeg.run(
      "-framerate",
      "30",
      "-pattern_type",
      "glob",
      "-i",
      "frame_*.png",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "out.mp4"
    );

    const data = ffmpeg.FS("readFile", "out.mp4");
    const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    setVideoUrl(url);
    setIsGenerating(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 30 }}>
      <h2>🎞️ Generate Scrolling Video</h2>
      <canvas ref={canvasRef} style={{ border: "1px solid #ccc" }} />
      <br />
      <button
        onClick={generateVideo}
        disabled={isGenerating}
        style={{
          marginTop: 20,
          padding: "10px 20px",
          background: isGenerating ? "#999" : "red",
          color: "white",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        {isGenerating ? "Generating..." : "🎬 Create Video Short"}
      </button>

      {videoUrl && (
        <div style={{ marginTop: 20 }}>
          <video src={videoUrl} controls width="640" />
          <a
            href={videoUrl}
            download="text_short.mp4"
            style={{ display: "block", marginTop: 10 }}
          >
            ⬇️ Download MP4
          </a>
        </div>
      )}
    </div>
  );
}
