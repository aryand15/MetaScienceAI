import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Home from "./Home.jsx";
import FormulateQuestion from "./FormulateQuestion.jsx";
import CreateProject from "./CreateProject.jsx";
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-project" element={<CreateProject />} />
          <Route path="/:project_id/formulate-question" element={<FormulateQuestion/>} />
      </Routes>
    </BrowserRouter>
  );
}
