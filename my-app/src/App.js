import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import './App.css';
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import OwnerDashboard from "./components/OwnerDashboard";
import ExpertDashboard from "./components/ExpertDashboard";
import Salons from "./components/Salons";
import SalonDetails from "./components/SalonDetails";
import WorkerRegister from "./components/WorkerRegister";
import WorkerLogin from "./components/WorkerLogin";
import WorkerDashboard from "./components/WorkerDashboard";
import BookingConfirmation from "./components/BookingConfirmation";
import VoucherStore from './components/VoucherStore';


const AuthCheck = () => {
  const navigate = useNavigate();
  const location = useLocation();


  const publicPaths = ['/login', '/worker-login', '/worker-register', '/salons', '/'];


  const isPublicPath = () => {
    const currentPath = location.pathname;
    return publicPaths.some(path =>
      currentPath === path ||
      currentPath.startsWith('/worker-register/') ||
      currentPath.startsWith('/salon/') ||
      currentPath.startsWith('/booking/')
    );
  };

  
  useEffect(() => {
    if (!localStorage.getItem('token') && !isPublicPath()) {
      navigate('/login'); 
    }
  }, [navigate, location.pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="App">
        <AuthCheck />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          <Route path="/expert-dashboard" element={<ExpertDashboard />} />
          <Route path="/salons" element={<Salons />} />
          <Route path="/salon/:id" element={<SalonDetails />} />
          <Route path="/booking/confirm" element={<BookingConfirmation />} />
          <Route path="/worker-register/:token" element={<WorkerRegister />} />
          <Route path="/worker-login" element={<WorkerLogin />} />
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/vouchers" element={<VoucherStore />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
