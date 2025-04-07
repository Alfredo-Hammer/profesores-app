import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard"); // Redirigir al Dashboard tras iniciar sesión
    } catch (error) {
      setError("Correo o contraseña incorrectos");
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-gray-900 text-white"
      style={{
        backgroundImage: "url('https://jpmas.com.ni/wp-content/uploads/2021/09/WhatsApp-Image-2021-09-26-at-12.44.58-PM.jpeg')", // Ruta de la imagen de fondo
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row items-center w-full max-w-5xl p-6 bg-gray-900 bg-opacity-80 rounded-lg shadow-lg">
        {/* Sección de títulos */}
        <div className="md:w-1/2 text-left mb-8 md:mb-0">
          <h2 className="text-2xl font-semibold text-orange-400">Sistema Educativo</h2>
          <h1 className="text-4xl font-bold text-blue-400 mb-4">EduHammer</h1>
          <p className="text-gray-300 text-lg">
            "Por una educación más organizada y accesible."
          </p>
        </div>

        {/* Caja de inicio de sesión */}
        <div className="md:w-1/2 bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-300">Correo Electrónico</label>
              <input
                type="email"
                className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tuemail@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300">Contraseña</label>
              <input
                type="password"
                className="w-full p-2 rounded bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-center text-gray-400 mt-4">
            ¿No tienes una cuenta?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
