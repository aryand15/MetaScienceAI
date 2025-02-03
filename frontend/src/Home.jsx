import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';



function Home() {
  let navigate = useNavigate();
  const handleCreateProject = () => {
    navigate("/create-project")
  };

  return (
    <div>
      <button onClick={handleCreateProject}>Create Project</button>
    </div>
  );
}

export default Home;
