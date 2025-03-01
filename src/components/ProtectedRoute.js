import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="text-white text-center mt-10">Cargando...</div>;

  if (!user) return <Navigate to="/login" replace />;

  // Obtener el rol del usuario desde Firebase
  const userRole = localStorage.getItem("role"); // O usa un contexto/global state

  if (!userRole || (allowedRoles && !allowedRoles.includes(userRole))) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
