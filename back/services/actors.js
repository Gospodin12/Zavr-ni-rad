var ActorModel = require('../models/actor')

var find = function()
{
    return ActorModel.find().populate('movies')
}

var findById = function(id)
{
    return ActorModel.findById(id).populate('movies')
}

var saveActor = function(name)
{
    return ActorModel.saveActor(name);
}

module.exports = {
    find,
    findById,
    saveActor
}