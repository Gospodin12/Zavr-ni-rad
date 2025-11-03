var MovieModel = require('../models/movie')

var find = function()
{
    return MovieModel.find().populate('actors')
}

var findById = function(id)
{
    return MovieModel.findById(id).populate('actors')
}

var getRated = function(userId)
{
    // return MovieModel.find({ratings: {user: userId}})
    return MovieModel.find({"ratings.user": userId})
}

var saveMovie = function(title, genres, actors){
    return MovieModel.saveMovie(title, genres, actors)
}

var rateMovie = function(movieId, userId, rating)
{
    return MovieModel.rateMovie(movieId, userId, rating)
}

var deleteMovie = async function(movieId)
{
    return MovieModel.deleteMovie(movieId)
    
}

module.exports = {
    find,
    findById,
    getRated,
    saveMovie,
    rateMovie,
    deleteMovie
}