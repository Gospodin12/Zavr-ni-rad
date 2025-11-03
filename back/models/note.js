const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({
  text: String,
  _film_id: { type: mongoose.Schema.Types.ObjectId, ref: "movie" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  title:String,
  quote: String,
  description: String,
  page: Number,
  location: Number,
  category: String,
  priority: String, 
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }], // ← multiple users
  createdAt: { type: Date, default: Date.now },

}, { timestamps: true });


module.exports = mongoose.model("Note", NoteSchema);
