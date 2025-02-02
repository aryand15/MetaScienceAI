const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique:false },
    description: { type: String, required: true, unique: false},
    filters: { // Add more later
        publicationTypes: { type: [String], required: true }, // Array of strings
        citationCount: { type: Number, required: true, default: 50 }, // Single number
        yearRange: { 
            startYear: { type: Number, required: true }, 
            endYear: { type: Number, required: true }
        }, // Object defining a range
    }, 
    pooled_quantitative_stats: {type: Object, required: false, unique: false},
    pooled_qualitative_stats: { type: Object, required: false, unique: false },
    research_question: {type: String, required: false, unique: false},
    research_domain: {type: String, enum: ["Healthcare & Medicine","Education","Psychology & Behavior","Social Sciences","Business & Economics"], required: true, unique: false},
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    papers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Paper' }]
    
});

module.exports = mongoose.model('Project', ProjectSchema)
