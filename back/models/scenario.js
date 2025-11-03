const mongoose = require("mongoose");

const ScenarioSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "movie",
    required: true,
  },
  title: { type: String, required: true },
  description: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Scenario", ScenarioSchema);
