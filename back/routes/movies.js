const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const passport = require("./config/config"); 

const Movie = require("../models/movie");
const UserRoleFilms = require('../models/userRoleFilms');

// 📸 Multer setup for uploading to public/users/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/users"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ 1️⃣ Add new movie (only authenticated users)
router.post(
  "/add",
  passport.authenticate("jwt", { session: false }),
  upload.single("picture"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const picturePath = req.file
        ? `/users/${req.file.filename}` // saved path in DB
        : null;

      // Create movie
      const newMovie = await Movie.create({
        name,
        description,
        picture: picturePath,
      });

      // Link creator as director (role = 1)
      await UserRoleFilms.create({
        movieId: newMovie._id,
        userId: req.user._id,
        role: 1,
      });

      return res.status(201).json({
        success: true,
        message: "Movie created successfully",
        movie: newMovie,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error creating movie" });
    }
  }
);

router.get(
  "/my-movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const roles = await UserRoleFilms.find({
        userId: req.user._id,
        role: 1,
      }).populate("movieId");

      const result = roles.map((r) => ({
        movie: r.movieId,
        role: r.role,
        character: r.CharacterIfActor || null,
      }));

      res.json({ success: true, movies: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching my movies" });
    }
  }
);


router.get(
  "/not-my-movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const roles = await UserRoleFilms.find({
        userId: req.user._id,
        role: { $ne: 1 },
      }).populate("movieId");

      const result = roles.map((r) => ({
        movie: r.movieId,
        role: r.role,
        character: r.CharacterIfActor || null,
      }));

      res.json({ success: true, movies: result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching not-my-movies" });
    }
  }
);

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        return res.status(404).json({ success: false, message: "Movie not found" });
      }

      res.json({ success: true, movie });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching movie" });
    }
  }
);

const User = require("../models/user"); // Make sure to import your User model

router.get(
  "/:id/users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userRoles = await UserRoleFilms.find({ movieId: req.params.id })
        .populate("userId", "name lastName email picture phoneNumber") // select only needed fields
        .lean();

      if (!userRoles || userRoles.length === 0) {
        return res.json({ success: true, users: [] });
      }

      const users = userRoles.map((ur) => ({
        user: ur.userId,
        role: ur.role,
        character: ur.CharacterIfActor || null,
      }));

      res.json({ success: true, users });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching users for movie" });
    }
  }
);

router.get(
  "/:id/my-role",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const userRole = await UserRoleFilms.findOne({
        movieId: req.params.id,
        userId: req.user._id,
      });

      if (!userRole) {
        return res.json({ success: true, role: null });
      }

      res.json({
        success: true,
        role: userRole.role,
        character: userRole.CharacterIfActor || null,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching user role" });
    }
  }
);

// --- add near top with other requires ---


// --- GET users not yet assigned to this movie ---
router.get(
  "/:id/available-users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movieId = req.params.id;

      // all users
      const allUsers = await User.find({}, "name lastName email picture phoneNumber").lean();

      // users already assigned to movie
      const assigned = await UserRoleFilms.find({ movieId }).select("userId").lean();
      const assignedIds = new Set(assigned.map((a) => String(a.userId)));

      // filter
      const available = allUsers.filter((u) => !assignedIds.has(String(u._id)));

      res.json({ success: true, users: available });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error fetching available users" });
    }
  }
);

// --- POST assign user to movie with role (and optional character) ---
router.post(
  "/:id/assign-role",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movieId = req.params.id;
      const { userId, role, character } = req.body;

      if (!userId || !role) {
        return res.status(400).json({ success: false, message: "userId and role are required" });
      }

      // check movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) return res.status(404).json({ success: false, message: "Movie not found" });

      // prevent duplicate assignment (optional)
      const exists = await UserRoleFilms.findOne({ movieId, userId });
      if (exists) {
        return res.status(400).json({ success: false, message: "User already assigned to this movie" });
      }

      const newUserRole = await UserRoleFilms.create({
        movieId,
        userId,
        role,
        CharacterIfActor: character || null,
      });

      res.status(201).json({ success: true, message: "User assigned", userRole: newUserRole });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Error assigning user to movie" });
    }
  }
);

module.exports = router;