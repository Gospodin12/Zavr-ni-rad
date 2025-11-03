const express = require('express')
const app = express()
const config = require('./config')
const cors = require('cors')

var mongoose = require('mongoose')
mongoose.connect(config.dbConnection)
const authRoutes = require('./routes/auth')
const scenarioRoutes = require('./routes/scenario.js')
const movieRoutes = require('./routes/movies.js')
const notesRoutes = require('./routes/note.js')
const commentRoutes = require('./routes/comment.js')
const bookRoutes = require('./routes/book.js')

app.use(express.json())
app.use(cors())


app.use("/auth", authRoutes);
app.use("/scenarios", scenarioRoutes);
app.use("/movies", movieRoutes);
app.use("/notes", notesRoutes);
app.use("/comments", commentRoutes);
app.use("/books", bookRoutes);

app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`)
})


const path = require('path');
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Serve public folder
app.use('/users', express.static(path.join(__dirname, 'public/users')));
