const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique:false },
    description: { type: String, required: true, unique: false},
    filters: { // Add more later
        publicationTypes: { type: [String], required: true, default: ["Review", "JournalArticle", "Editorial", "Conference", "MetaAnalysis", "ClinicalTrial"] }, // Array of strings
        minCitationCount: { type: Number, required: true, default: 0
            
         }, // Single number
        yearRange: { 
            startYear: { type: Number, required: true, default: 2015 }, 
            endYear: { type: Number, required: true, default: 2025 }
        }, // Object defining a range
        paperCount: {type: Number, required: true, default: 50}
    }, 
    pooled_quantitative_stats: {type: Object, required: false, unique: false},
    pooled_qualitative_stats: { type: Object, required: false, unique: false },
    research_question: {type: String, required: false, unique: false},
    research_domain: {type: String, enum: ["Medicine","Education","Psychology","Business"], required: true, unique: false},
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }],    // required needs to be true
    
});

module.exports = mongoose.model('Project', ProjectSchema)
