const express = require("express");
const router = express.Router();
const passport = require("./config/config");
const Comment = require("../models/comment");
const User = require("../models/user");

// ✅ GET /comments/:noteId → all comments for a specific note (ordered by date)
router.get("/:noteId",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { noteId } = req.params;

      const comments = await Comment.find({ _beleska_id: noteId })
        .populate("_user_id", "name lastName picture") // only get minimal user info
        .sort({ createdAt: 1 }); // ascending by date (oldest first)
      
      res.json({ success: true, comments });
    } catch (err) {
      console.error("❌ Error fetching comments:", err);
      res.status(500).json({ success: false, message: "Greška pri učitavanju komentara" });
    }
  }
);

// ✅ POST /comments → add a new comment to a note
router.post("/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { noteId, text } = req.body;
      const user = req.user;

      if (!noteId || !text) {
        return res.status(400).json({ success: false, message: "Nedostaju podaci (noteId, text)" });
      }

      const newComment = new Comment({
        _beleska_id: noteId,
        _user_id: user._id,
        text,
      });

      await newComment.save();

      const populatedComment = await Comment.findById(newComment._id)
        .populate("_user_id", "name lastName picture");

      res.status(201).json({ success: true, comment: populatedComment });
    } catch (err) {
      console.error("❌ Error adding comment:", err);
      res.status(500).json({ success: false, message: "Greška pri dodavanju komentara" });
    }
  }
);

// ✅ DELETE /comments/:id → delete a comment (only by its owner)
router.delete("/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;

      const comment = await Comment.findById(id);

      if (!comment) {
        return res.status(404).json({ success: false, message: "Komentar nije pronađen" });
      }

      if (comment._user_id.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, message: "Nemate dozvolu da obrišete ovaj komentar" });
      }

      await comment.deleteOne();
      res.json({ success: true, message: "Komentar obrisan" });
    } catch (err) {
      console.error("❌ Error deleting comment:", err);
      res.status(500).json({ success: false, message: "Greška pri brisanju komentara" });
    }
  }
);

module.exports = router;
