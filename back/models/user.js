const mongoose = require('mongoose')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

var UserSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    role: { type: Number },
    hash: { type: String},
    salt: {type: String },
    picture: { type: String }, 
    phoneNumber:{type:String}

})

UserSchema.methods.savePassword = function (password)
{
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000,64,"sha512").toString('hex')
}

UserSchema.methods.validatePassword = function (password)
{
    hash = crypto.pbkdf2Sync(password, this.salt, 1000,64,"sha512").toString('hex')
    return hash === this.hash;
}

UserSchema.methods.generateJwt = function()
{
    var expire = new Date();
    expire.setDate(expire.getDate()+7);

    return jwt.sign({
        _id: this._id,
        expire: parseInt(expire.getTime()/1000)
    }, "SECRET")
}

UserSchema.methods.getRole = function()
{
    if (this.role==1)
        return "DIRECTOR";
    return "USER";
}

var UserModel = mongoose.model('user',UserSchema);

UserModel.register = async function(email, name, password,role,phoneNumber,lastName)
{
    var user = new UserModel({
        email:email,
        name: name,
        role: role,
        phoneNumber: phoneNumber,
        lastName:lastName
    })

    user.savePassword(password)
    try
    {
        await user.save();
        console.log(user)
        console.log(user.generateJwt())
        return user.generateJwt();
    }
    catch
    {
        return null;
    }
    
    
}

module.exports = UserModel
