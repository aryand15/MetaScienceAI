import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from "axios";




const CreateProject = () => {
  let navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [domain, setDomain] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('http://127.0.0.1:5550/project', {
            name: projectName,
            description: projectDescription,
            research_domain: domain
        });
        console.log(response.data);
        console.log(typeof response);
        const projectId = response.data.projectId;
        navigate(`/${projectId}/formulate-question`);
    } catch (e){
        console.log(e)
        alert("Something went wrong.");
    }
    
    console.log('Project Name:', projectName);
    console.log('Project Description:', projectDescription);
    console.log('Selected Domain:', domain);
  };

  return (
    <div className="create-project-form">
      <h2>Create New Project</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="project-name">Project Name</label>
          <input
            type="text"
            id="project-name"
            name="projectName"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="project-description">Project Description</label>
          <textarea
            id="project-description"
            name="projectDescription"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="domain">Select Domain</label>
          <select
            id="domain"
            name="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
          >
            <option value="">Select Domain</option>
            <option value="Medicine">Medicine</option>
            <option value="Education">Education</option>
            <option value="Psychology">Psychology</option>
            <option value="Business">Business</option>
          </select>
        </div>

        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
