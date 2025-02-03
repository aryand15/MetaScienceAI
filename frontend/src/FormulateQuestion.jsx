import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';

import axios from "axios";



const FormulateQuestion = () => {
    
    const [minCitationCount, setMinCitationCount] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [paperCount, setPaperCount] = useState('50');

    const checkboxStates = {
        "Review": true, 
        "JournalArticle": true, 
        "Editorial": true, 
        "Conference": true, 
        "MetaAnalysis": true, 
        "ClinicalTrial": true
    }

    const projectId = useParams().project_id;
    console.log("PID", projectId)
    

    function changeCheckedStatus(parameter) {
        checkboxStates[parameter] = !checkboxStates[parameter];
    }

    let navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = {
            filters: {
                publicationTypes: Object.keys(checkboxStates).filter(parameter => checkboxStates[parameter] === true),
                minCitationCount: minCitationCount,
                yearRange: {
                    startYear: startYear,
                    endYear: endYear
                },
                paperCount: paperCount
            },
            research_question: "Covid-19 Vaccine effects"
        }
        
        
        const response = await axios.post(`http://127.0.0.1:5550/select-and-save-papers/${projectId}`, data);
        if (response.status === 200) {
            alert("Successfully saved papers");
        } else {
            alert("Unsuccessful.");
        }

       

         
        
        
    }
    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input name="research-question" id="research-question" type="text" value="Covid-19 Vaccine effects"/>
                <input 
                    name="min-citation-count" 
                    id="min-citation-count" 
                    min="0" 
                    type="number" 
                    value={minCitationCount} 
                    onChange={(e) => setMinCitationCount(e.target.value)}
                    required
                />
                <input 
                    name="start-year" 
                    id="start-year" 
                    max="2025" 
                    type="number"
                    value={startYear} 
                    onChange={(e) => setStartYear(e.target.value)}
                    required
                />
                <input 
                    name="end-year" 
                    id="end-year" 
                    max="2025" 
                    type="number"
                    value={endYear} 
                    onChange={(e) => setEndYear(e.target.value)}
                    required
                />
                <input 
                    name="paper-count" 
                    id="paper-count"
                    type="number"
                    value={paperCount} 
                    onChange={(e) => setPaperCount(e.target.value)}
                    required
                />
                <label>
                <input type="checkbox" name="Review" value="Review" onChange={(e) => changeCheckedStatus("Review", e)} checked />
                Review
                </label>
                <label>
                <input type="checkbox" name="Conference" value="Conference" onChange={(e) => changeCheckedStatus("Conference")} checked />
                Conference
                </label>
                <label>
                <input type="checkbox" name="Meta-Analysis" value="Meta-Analysis" onChange={(e) => changeCheckedStatus("Meta-Analysis")} checked />
                Meta-Analysis
                </label>
                <label>
                <input type="checkbox" name="Journal Article" value="Journal Article" onChange={(e) =>changeCheckedStatus("Journal Article")} checked />
                Journal Article
                </label>
                <label>
                <input type="checkbox" name="Editorial" value="Editorial" onChange={(e) => changeCheckedStatus("Editorial")} checked/>
                Editorial
                </label>
                <label>
                <input type="checkbox" name="Clinical Trial" value="Clinical Trial" onChange={(e) =>changeCheckedStatus("Clinical Trial")} checked />
                Clinical Trial
                </label>
                <button type="submit">Submit</button>
            </form>
            
    
        </div>
    )
}

export default FormulateQuestion