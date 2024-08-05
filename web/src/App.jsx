import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Route, Routes } from "react-router-dom";
import { AuthenticationGuard } from "./components/AuthenticationGuard";
import Home from "./components/Home";
import LoggedIn from "./components/LoggedIn";

function App() {
  const { isLoading } = useAuth0();

  if (isLoading) {
    return (
      <div className="page-layout">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route
        path="/protected"
        element={<AuthenticationGuard element={<LoggedIn />} />}
      />
    </Routes>
  );
}

export default App;
