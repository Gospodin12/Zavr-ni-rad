// models/UserRoleFilms.js
const mongoose = require("mongoose");

const UserRoleSchema = new mongoose.Schema({
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "movie",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  role: Number, 
  CharacterIfActor: String,
});

module.exports = mongoose.model("UserRoleFilms", UserRoleSchema);
