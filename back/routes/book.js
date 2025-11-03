const express = require("express");
const router = express.Router();
const passport = require("./config/config");
const Book = require("../models/book");
const Movie = require("../models/movie"); // ✅ import Movie model
const multer = require("multer");
const path = require("path");
const fs = require("fs-extra");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");

// 📁 Directory for saving uploaded books
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads", "books");
fs.ensureDirSync(UPLOAD_DIR);

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// ✅ File filter (only PDF/ePub)
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".epub"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error("Only .pdf and .epub files are allowed"));
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});


// ✅ Create empty book (no upload, just blank PDF)
router.post(
  "/create-empty",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { movieId } = req.body;
      if (!movieId) return res.status(400).json({ message: "movieId is required" });

      const movie = await Movie.findById(movieId);
      if (!movie) return res.status(404).json({ message: "Film nije pronađen" });

      // create folders if needed
      const booksDir = path.join(__dirname, "..", "public", "uploads", "books");
      fs.ensureDirSync(booksDir);

      // Generate a simple empty book PDF
      const filename = `book-${uuidv4()}.pdf`;
      const filePath = path.join(booksDir, filename);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      doc.fontSize(22).text(`Knjiga snimanja`, { align: "center" });
      doc.moveDown(2);
      doc.fontSize(14).text("Ova knjiga je trenutno prazna i kreirana automatski.", { align: "center" });
      doc.end();

      await new Promise((resolve) => stream.on("finish", resolve));

      const fileUrl = `/uploads/books/${filename}`;

      const newBook = new Book({
        movieId,
        fileUrl,
        title: "Knjiga snimanja",
        description: "Prazna knjiga kreirana automatski.",
      });

      await newBook.save();

      res.status(201).json({ success: true, book: newBook });
    } catch (err) {
      console.error("❌ Error creating empty book:", err);
      res.status(500).json({ success: false, message: "Error creating empty book", error: err.message });
    }
  }
);


// 📘 Add book by uploading a file
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  upload.single("file"),
  async (req, res) => {
    try {
      const { movieId } = req.body;
      if (!movieId) return res.status(400).json({ message: "movieId is required" });

      const existingBook = await Book.findOne({ movieId });
      if (existingBook) {
        return res.status(400).json({ message: "Book already exists for this movie" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Book file is required" });
      }

      const fileUrl = `/uploads/books/${req.file.filename}`;
      const book = new Book({ movieId, fileUrl });
      await book.save();

      res.status(201).json({ success: true, book });
    } catch (err) {
      console.error("❌ Error creating book:", err);
      res.status(500).json({ success: false, message: "Error creating book", error: err.message });
    }
  }
);


// 📖 Get book by movieId
router.get("/:movieId", async (req, res) => {
  try {
    const book = await Book.findOne({ movieId: req.params.movieId });
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
});


// 🗑️ Delete book
router.delete(
  "/delete/:movieId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const deleted = await Book.findOneAndDelete({ movieId: req.params.movieId });
      if (!deleted) return res.status(404).json({ message: "Book not found" });

      if (deleted.fileUrl) {
        const filePath = path.join(__dirname, "..", "public", deleted.fileUrl);
        try {
          await fs.remove(filePath);
        } catch (err) {
          console.warn("⚠️ Could not remove file:", err.message);
        }
      }

      res.json({ success: true, message: "Book deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error deleting book", error: err.message });
    }
  }
);

module.exports = router;
