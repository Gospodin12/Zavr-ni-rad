var authService = require('../services/auth')
var router = require('express').Router()

var passport = require('./config/config')


const multer = require("multer");
const path = require("path");
const UserModel = require("../models/user");

// Save files in public/users
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/users")); // <-- backend public folder
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

router.post("/register", upload.single("picture"), async (req, res) => {
  try {
    const { email, name, password,role,phoneNumber,lastName } = req.body;
    const picturePath = req.file ? "http://localhost:3000/users/" + req.file.filename : null;

    const user = new UserModel({ email, name, role, picture: picturePath,phoneNumber,lastName});
    user.savePassword(password);

    await user.save();

    const token = user.generateJwt(); // <--- generate JWT
    res.status(201).json({ success: true, token: token, user: user });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Registration failed" });
  }
});



router.post('/login', 
    passport.authenticate('local', {session: false}),
    (req,res)=>{
    
    res.send(req.user.generateJwt())
})

router.post('/validate', 
    passport.authenticate('jwt', {session: false}),
    (req,res)=>{
    
    res.send(true)
})

router.post('/validate/director', 
    passport.authenticate('jwt', {session: false}),
    passport.authorizeRoles("DIRECTOR"),
    (req,res)=>{
        res.send(true)
    
})


// Get user info by ID (protected with JWT)
router.get('/', 
    passport.authenticate('jwt', { session: false }), 
    async (req, res) => {
        try {
            const user = await UserModel.findById(req.user._id).select("_id email name lastName admin picture role phoneNumber");
            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }
            res.send(user); // picture will now be included
        } catch (err) {
            res.status(500).send({ message: "Error retrieving user" });
        }
});

router.get("/all", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const users = await UserModel.find({ _id: { $ne: req.user._id } })
      .select("_id email name lastName picture role phoneNumber")
      .sort({ name: 1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
});

module.exports = router;