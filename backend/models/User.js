const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique:false },
    email: { type: String, required: true, unique: true},
    password: {type: String, required: true},
    preferences: {type: Object, required: false},
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: false }]
    
    
});

module.exports = mongoose.model('User', UserSchema)


