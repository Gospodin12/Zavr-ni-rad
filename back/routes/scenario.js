// routes/scenario.js
const express = require("express");
const router = express.Router();
const passport = require("./config/config"); // keep your passport config
const Scenario = require("../models/scenario");
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const libre = require("libreoffice-convert"); // uses libreoffice installed on server

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "scenarios"); // save in public/uploads/scenarios
fs.ensureDirSync(UPLOAD_DIR);

// Multer storage (store original upload temporarily)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "..", "uploads", "temp");
    fs.ensureDirSync(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".doc", ".docx", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error("Only .doc, .docx, and .pdf files are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit (adjust)
});

function convertDocToPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const ext = ".pdf";
    const inputBuf = fs.readFileSync(inputPath);
    // libre.convert expects buffer and target extension
    libre.convert(inputBuf, ext, undefined, (err, done) => {
      if (err) return reject(err);
      fs.writeFileSync(outputPath, done);
      resolve(outputPath);
    });
  });
}

// Helper to make safe public filename (so we don't expose temp names)
function publicPdfFilename(origName) {
  const base = path.basename(origName, path.extname(origName)).replace(/\s+/g, "_");
  const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
  return `${base}-${unique}.pdf`;
}

// Create scenario (ADMIN only)
router.post(
  "/add",
  //passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    try {
      const { movieId, title, description } = req.body;
      if (!movieId || !title) return res.status(400).send({ message: "movieId and title are required" });

      // check if movie already has a scenario
      const existingScenario = await Scenario.findOne({ movieId });
      if (existingScenario) {
        return res.status(400).send({ message: "Scenario already exists for this movie" });
      }

      let fileUrl = null;
      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === ".pdf") {
          // move to public uploads
          const publicName = publicPdfFilename(req.file.originalname);
          const dest = path.join(UPLOAD_DIR, publicName);
          await fs.move(req.file.path, dest, { overwrite: true });
          fileUrl = `/uploads/scenarios/${publicName}`;
        } else {
          // convert to pdf
          const tmpInput = req.file.path;
          const publicName = publicPdfFilename(req.file.originalname);
          const dest = path.join(UPLOAD_DIR, publicName);
          try {
            await convertDocToPdf(tmpInput, dest);
            // remove temp input
            await fs.remove(tmpInput);
            fileUrl = `/uploads/scenarios/${publicName}`;
          } catch (convErr) {
            // remove tmp file if conversion fails
            await fs.remove(tmpInput);
            console.error("Conversion error:", convErr);
            return res.status(500).send({ message: "Failed to convert file to PDF", error: convErr.message });
          }
        }
      }

      const scenario = new Scenario({
        movieId,
        title,
        description,
        fileUrl,
      });

      await scenario.save();
      res.status(201).send(scenario);
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Error creating scenario", error: err.message });
    }
  }
);

// Get scenario by movieId (public)
router.get("/:movieId", async (req, res) => {
  try {
    const scenario = await Scenario.findOne({ movieId: req.params.movieId });
    if (!scenario) return res.status(404).send({ message: "Scenario not found" });
    res.send(scenario);
  } catch (err) {
    res.status(500).send({ message: "Error fetching scenario", error: err.message });
  }
});

// Update scenario (ADMIN only) - allow replacing file (converts if needed)
router.put(
  "/update/:movieId",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, description } = req.body;
      const updateData = { title, description };

      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        let fileUrl = null;
        if (ext === ".pdf") {
          const publicName = publicPdfFilename(req.file.originalname);
          const dest = path.join(UPLOAD_DIR, publicName);
          await fs.move(req.file.path, dest, { overwrite: true });
          fileUrl = `/uploads/scenarios/${publicName}`;
        } else {
          const tmpInput = req.file.path;
          const publicName = publicPdfFilename(req.file.originalname);
          const dest = path.join(UPLOAD_DIR, publicName);
          try {
            await convertDocToPdf(tmpInput, dest);
            await fs.remove(tmpInput);
            fileUrl = `/uploads/scenarios/${publicName}`;
          } catch (convErr) {
            await fs.remove(tmpInput);
            return res.status(500).send({ message: "Failed to convert file to PDF", error: convErr.message });
          }
        }
        updateData.fileUrl = fileUrl;
      }

      const updated = await Scenario.findOneAndUpdate({ movieId: req.params.movieId }, { $set: updateData }, { new: true });
      if (!updated) return res.status(404).send({ message: "Scenario not found" });
      res.send(updated);
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Error updating scenario", error: err.message });
    }
  }
);

// Delete scenario (ADMIN only)
router.delete("/delete/:movieId", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const deleted = await Scenario.findOneAndDelete({ movieId: req.params.movieId });
    if (!deleted) return res.status(404).send({ message: "Scenario not found" });
    // also try to remove file if exists
    if (deleted.fileUrl) {
      const filePath = path.join(__dirname, "..", "public", deleted.fileUrl.replace("/uploads/", "uploads/"));
      try { await fs.remove(filePath); } catch (e) { /* ignore */ }
    }
    res.send({ message: "Scenario deleted successfully" });
  } catch (err) {
    res.status(500).send({ message: "Error deleting scenario", error: err.message });
  }
});

module.exports = router;
