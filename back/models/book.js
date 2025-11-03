const mongoose = require("mongoose");

const BookSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "movie",
    required: true,
  },
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now },

});

module.exports = mongoose.model("Book", BookSchema);
