import React, { useState } from 'react';
import './App.css';

import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse currentUser from localStorage", e);
      return null;
    }
  });

  const handleLogin = (loggedInUser, token) => {
    localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
    localStorage.setItem("token", token);
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    setUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <>
      {user ? (
        <DashboardPage 
          user={user} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser} 
        />
      ) : (
        <AuthPage onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;