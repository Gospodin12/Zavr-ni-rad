const express = require("express"); // Use require for express
const router = express.Router();
const passport = require("./config/config"); // keep your passport config

const Note = require("../models/note"); // Use require for Note model
const jwt = require("jsonwebtoken"); // Use require for jsonwebtoken
const User = require("../models/user"); // Use require for User model


const ROLE_ACCESS = {
  1: ["Rezija", "Gluma", "Snimanje", "Montaza", "Scenografija","Scenario"], // Reziser
  2: ["Gluma","Scenario"], // Glumac
  3: ["Snimanje", "Scenografija","Scenario"], // Snimatelj
  4: ["Scenografija","Scenario"], // Scenograf
  5: ["Montaza", "Snimanje","Scenario"], // Montazer
};

router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { text, description, page, location, priority, assignedTo, category, _film_id, quote,title } = req.body;
    const user = req.user;

    const allUsers = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    const note = new Note({
      title,
      text,
      description,
      page,
      location,
      priority,
      category,
      assignedTo: allUsers,
      createdBy: user._id || user.id,
      _film_id,
      quote,
    });

    await note.save();
    res.status(201).json(note);
  } catch (err) {
    console.error("❌ Error creating note:", err);
    res.status(500).json({ message: "Greška pri čuvanju beleške" });
  }
});


// ✅ Get notes for user
router.get("/", 
   passport.authenticate('jwt', { session: false })
, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === 1) {
      // Reziser vidi sve
      const allNotes = await Note.find().populate("assignedTo createdBy");
      return res.json(allNotes);
    }

    // Ostali vide samo svoje kategorije
    const allowedCategories = ROLE_ACCESS[user.role] || [];
    const notes = await Note.find({
      $and: [
        { category: { $in: allowedCategories } },
        { assignedTo: user.id },
      ],
    }).populate("assignedTo createdBy");

    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Greška pri učitavanju beleški" });
  }
});

router.get(
  "/user",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;

      if (user.role === 1) {
        // Reziser vidi sve
        const allNotes = await Note.find().populate("assignedTo createdBy");
        return res.json(allNotes);
      }

      const allowedCategories = ROLE_ACCESS[user.role] || [];

      const notes = await Note.find({
        $and: [
          { category: { $in: allowedCategories } },
          {
            $or: [
              { createdBy: user._id },
              { assignedTo: user._id },
            ],
          },
        ],
      }).populate("assignedTo createdBy");

      res.json(notes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Greška pri učitavanju beleški" });
    }
  }
);



// GET /notes/mine → notes created by me or assigned to me
// GET /notes/mine/:movieId → notes created by me or assigned to me for that film
router.get(
  "/mine/:movieId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const { movieId } = req.params; // ✅ get movieId from URL

      if (!movieId) {
        return res.status(400).json({ success: false, message: "movieId je obavezan parametar" });
      }

      const notes = await Note.find({
        $and: [
          { _film_id: movieId }, // ✅ only notes for this movie
          {
            $or: [
              { createdBy: user._id },
              { assignedTo: user._id },
            ],
          },
        ],
      }).populate("assignedTo createdBy");

      res.json({ success: true, notes });
    } catch (err) {
      console.error("Error fetching notes for movie:", err);
      res.status(500).json({ success: false, message: "Greška pri učitavanju beleški za film" });
    }
  }
);


router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      // Find note by ID and populate user fields
      const note = await Note.findById(id).populate("assignedTo createdBy");

      if (!note) {
        return res.status(404).json({ success: false, message: "Beleška nije pronađena" });
      }

      /* Optional: authorization check — user must be creator or assigned
      if (
        note.createdBy._id.toString() !== user._id.toString() &&
        !note.assignedTo.some((u) => u._id.toString() === user._id.toString()) &&
        user.role !== 1 // director can view all
      ) {
        return res.status(403).json({ success: false, message: "Nemate dozvolu da vidite ovu belešku" });
      }*/

      res.json({ success: true, note });
    } catch (err) {
      console.error("Error fetching note by ID:", err);
      res.status(500).json({ success: false, message: "Greška pri učitavanju beleške" });
    }
  }
);

router.get(
  "/all/:movieId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      const { movieId } = req.params;

      if (!movieId) {
        return res
          .status(400)
          .json({ success: false, message: "movieId je obavezan parametar" });
      }

      const notes = await Note.find({ _film_id: movieId }).populate(
        "assignedTo createdBy"
      );

      return res.json({ success: true, notes });
    } catch (err) {
      console.error("❌ Error fetching all notes for movie:", err);
      res
        .status(500)
        .json({ success: false, message: "Greška pri učitavanju beleški" });
    }
  }
);


// Using 'module.exports' is now correct because we use 'require' for all dependencies.
module.exports = router;