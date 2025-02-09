import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from "./Home.jsx";
import FormQuestion from "./FormQuestion.jsx";
import CreateProject from "./CreateProject.jsx";
import ChooseFilters from "./ChooseFilters.jsx";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-project" element={<CreateProject/>} />
          <Route path="/:project_id/formulate-question" element={<FormQuestion/>} />
          <Route path="/:project_id/choose-filters" element={<ChooseFilters/>} />
      </Routes>
    </BrowserRouter>
  );
}
