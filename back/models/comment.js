const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  _beleska_id: { type: mongoose.Schema.Types.ObjectId, ref: "note" },
  _user_id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  text:String,
  createdAt: { type: Date, default: Date.now },

}, { timestamps: true });


module.exports = mongoose.model("Comment", CommentSchema);
