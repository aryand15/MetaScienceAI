import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';

import axios from "axios";
import {GoogleGenerativeAI} from "@google/generative-ai";


const FormQuestion = () => {
    let navigate = useNavigate();
    const [population, setPopulation] = useState('');
    const [intervention, setIntervention] = useState('');
    const [comparison, setComparison] = useState('');
    const [outcome, setOutcome] = useState('');
    const [researchQuestion, setResearchQuestion] = useState('');
    const [generateDisabled, setGenerateDisabled] = useState(true);
    const [submitDisabled, setSubmitDisabled] = useState(true);
    /*const [projectName, setProjectName] = useState(null);
    const [projectDescription, setProjectDescription] = useState(null);
    const [researchDomain, setResearchDomain] = useState(null);*/

    const projectId = useParams().project_id;
    console.log("PID", projectId)

    async function fetchProjectDetails() {
        const response = await axios.get(`http://127.0.0.1:5550/project/${projectId}?fields=name,description,research_domain`);
        if (response.status !== 201) {
            alert("Unable to fetch project data.")
        }
        const data = response.data.data;
        /*setProjectName(data.name);
        setProjectDescription(data.description);
        setResearchDomain(data.research_domain);*/
        console.log(data);
        return data;
    }

    // Allow user to generate question when all fields are filled, otherwise leave disabled.
    useEffect(() => {
        if ([population, intervention, comparison, outcome].every(e => e !== '')) {
            setGenerateDisabled(false);
        } else {
            setGenerateDisabled(true);
        }

        
    }, [population, intervention, comparison, outcome]);

    // Allow user to submit research question when textbox populates.
    useEffect(() => {
        if (researchQuestion !== "") {
            setSubmitDisabled(false);
        } else {
            setSubmitDisabled(true);
        }
    }, [researchQuestion]);

    /*useEffect(() => {
        fetchProjectDetails();
    }, [])*/

    

    

    
    const handleSubmit = async (e) => {  
        e.preventDefault();
        console.log("Submitting question");
        try {
            const response = await axios.put(`http://127.0.0.1:5550/project/${projectId}`, {
                research_question: researchQuestion
            });
            navigate(`/${projectId}/choose-filters`);
        } catch (error) {
            console.log(error);
        }
    }

    const generateQuestion = async (e) => {
        const genAI = new GoogleGenerativeAI("AIzaSyBLmMKWJ-MTQgMly2SnHzIjd3dqTeT7K14");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        try {
            const projectData = await fetchProjectDetails();
            console.log(projectData.name)
            const projectName = projectData.name;
            const projectDescription = projectData.description;
            const researchDomain = projectData.research_domain;
            const prompt = `Using the following PICO elements:
                \`\`\`\nPopulation:${population}
                \nIntervention:${intervention}
                \nComparison:${comparison}
                \nOutcome:${outcome}\n\n\`\`\`
                \nThe research project name is '${projectName}'.
                \nThe research project description is '${projectDescription}'.
                \nThe research domain is '${researchDomain}'.
                \nSolely output an appropriate research question based on this information. If unable to come up with a coherent, logical question, solely output 'Please fill out the fields with more relevant items.'.
            `;
            const result = await model.generateContent(prompt);
            const response = result.response.text()
            setResearchQuestion(response);

        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div>
            <h1>Formulate your research question</h1>
            <p>Fill out the PICO elements below</p>
            <form onSubmit={handleSubmit}>
                <label htmlFor="population">Population</label>
                <input name="population" id="population" type="text" value={population} onChange={(e) => setPopulation(e.target.value)} required/>
                <label htmlFor="intervention">Intervention</label>
                <input name="intervention" id="intervention" type="text" value={intervention} onChange={(e) => setIntervention(e.target.value)} required/>
                <label htmlFor="comparison">Comparison</label>
                <input name="comparison" id="comparison" type="text" value={comparison} onChange={(e) => setComparison(e.target.value)} required/>
                <label htmlFor="outcome">Outcome</label>
                <input name="outcome" id="outcome" type="text" value={outcome} onChange={(e) => setOutcome(e.target.value)} required/>
                <button type="button" id="generate-question" onClick={generateQuestion} disabled={generateDisabled}>Generate Question</button>
                <textarea required id="research-question" value={researchQuestion} onChange={(e) => setResearchQuestion(e.target.value)}></textarea>
                <button type="submit" disabled={submitDisabled}>Finalize and submit question</button>
            </form>
            
    
        </div>
    )
}

export default FormQuestion;