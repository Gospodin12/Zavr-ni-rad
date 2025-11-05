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
      const roles = await UserRoleFilms.aggregate([
        {
          // 1. Filtriraj po korisniku i ulozi: 1
          $match: {
            userId: req.user._id,
            role: 1,
          },
        },
        {
          // 2. Grupiši po movieId da bi filmovi bili jedinstveni
          $group: {
            _id: "$movieId",
            roles: {
              $push: {
                role: "$role",
                character: "$CharacterIfActor",
              },
            },
          },
        },
        {
          // 3. Poveži sa 'movies' kolekcijom
          $lookup: {
            from: Movie.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "movieDetails",
          },
        },
        {
          $unwind: "$movieDetails",
        },
        {
          // **NOVA FAZA:** Sortiranje po _id filma (opadajuće: -1)
          $sort: { "movieDetails._id": -1 } // ili 1 za rastuće, ili po nekom drugom polju (npr. "movieDetails.name": 1)
        },
        {
          // 5. Preoblikuj izlaz
          $project: {
            _id: 0,
            movie: "$movieDetails",
            role: { $arrayElemAt: ["$roles.role", 0] },
            character: { $arrayElemAt: ["$roles.character", 0] },
          },
        },
      ]);

      res.json({ success: true, movies: roles }); // 'roles' je sada već formatiran rezultat
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
      const roles = await UserRoleFilms.aggregate([
        {
          // 1. Filtriraj po korisniku i ulozi != 1
          $match: {
            userId: req.user._id,
            role: { $ne: 1 },
          },
        },
        {
          // 2. Grupiši po movieId da bi filmovi bili jedinstveni
          $group: {
            _id: "$movieId",
            roles: {
              $push: {
                role: "$role",
                character: "$CharacterIfActor",
              },
            },
          },
        },
        {
          // 3. Poveži sa 'movies' kolekcijom
          $lookup: {
            from: Movie.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "movieDetails",
          },
        },
        {
          $unwind: "$movieDetails",
        },
        {
          // **NOVA FAZA:** Sortiranje po _id filma (opadajuće: -1)
          $sort: { "movieDetails._id": -1 } // ili po nekom drugom polju
        },
        {
          // 5. Preoblikuj izlaz (vraćamo array uloga za svaki film)
          $project: {
            _id: 0,
            movie: "$movieDetails",
            roles: "$roles",
          },
        },
      ]);

      res.json({ success: true, movies: roles });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching not-my-movies" });
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


// ✅ GET users available for a specific role (can have other roles, just not this one)
router.get(
  "/:id/available-users",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movieId = req.params.id;
      const { role } = req.query; // e.g. ?role=3 or ?role=2

      const allUsers = await User.find({}, "name lastName email picture phoneNumber").lean();

      let assigned = [];
      if (role) {
        // exclude only users who already have THIS role for this movie
        assigned = await UserRoleFilms.find({ movieId, role: Number(role) }).select("userId").lean();
      } else {
        // fallback: exclude none
        assigned = [];
      }

      const assignedIds = new Set(assigned.map((a) => String(a.userId)));
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

// ✅ Get all roles a user has on a specific movie
router.get(
  "/:id/my-roles",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const roles = await UserRoleFilms.find({
        movieId: req.params.id,
        userId: req.user._id,
      });

      if (!roles || roles.length === 0) {
        return res.json({ success: true, roles: [] });
      }

      const formatted = roles.map((r) => ({
        role: r.role,
        character: r.CharacterIfActor || null,
      }));

      res.json({ success: true, roles: formatted });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching all user roles" });
    }
  }
);


// ✅ Get all roles for ANY user on a specific movie
router.get(
  "/:id/user/:userId/roles",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const { id: movieId, userId } = req.params;

      const roles = await UserRoleFilms.find({ movieId, userId });

      if (!roles || roles.length === 0) {
        return res.json({ success: true, roles: [] });
      }

      const formatted = roles.map((r) => ({
        role: r.role,
        character: r.CharacterIfActor || null,
      }));

      res.json({ success: true, roles: formatted });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Error fetching roles for specified user",
      });
    }
  }
);

// POST remove a user-role from movie (can't remove director role = 1)
router.post(
  "/:id/remove-role",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const movieId = req.params.id;
      const { userId, role } = req.body;

      if (!userId || role === undefined || role === null) {
        return res
          .status(400)
          .json({ success: false, message: "userId and role are required" });
      }

      // Prevent removing director
      if (Number(role) === 1) {
        return res
          .status(403)
          .json({ success: false, message: "Director cannot be removed" });
      }

      // check movie exists
      const movie = await Movie.findById(movieId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }

      // Delete matching role document(s). If multiple entries exist, remove all that match movie+user+role.
      const deleteResult = await UserRoleFilms.deleteMany({
        movieId,
        userId,
        role: Number(role),
      });

      if (deleteResult.deletedCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Role not found for that user" });
      }

      // Optionally return updated user list
      const userRoles = await UserRoleFilms.find({ movieId })
        .populate("userId", "name lastName email picture phoneNumber")
        .lean();
      const users = userRoles.map((ur) => ({
        user: ur.userId,
        role: ur.role,
        character: ur.CharacterIfActor || null,
      }));

      res.json({
        success: true,
        message: "User role(s) removed",
        removedCount: deleteResult.deletedCount,
        users,
      });
    } catch (error) {
      console.error("Error in remove-role:", error);
      res
        .status(500)
        .json({ success: false, message: "Error removing user role" });
    }
  }
);


module.exports = router;