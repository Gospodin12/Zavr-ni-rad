const mongoose = require('mongoose')

var MovieSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {type: String},
    picture: {type: String},
    created_at: { type: Date, default: Date.now },

})

var MovieModel = mongoose.model('movie',MovieSchema);

module.exports = MovieModel