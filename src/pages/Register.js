import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    escuela: "",
    etnia: "",
    role: "alumno", // Valor por defecto
  });

  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    const { nombre, apellido, email, password, escuela, etnia, role } = formData;

    if (!nombre || !apellido || !email || !password || !escuela || !etnia || !role) {
      setError("Todos los campos son obligatorios");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar los datos en Firestore
      await setDoc(doc(db, "users", user.uid), {
        nombre,
        apellido,
        email,
        escuela,
        etnia,
        role,
      });

      // Guardar el rol en localStorage
      localStorage.setItem("role", role);

      navigate("/dashboard");
      window.location.reload();
    } catch (error) {
      setError("Error al registrar usuario");
      console.log(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-[500px] max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6">Registro</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-gray-300">Nombre</label>
            <input
              type="text"
              name="nombre"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="Tu nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Apellido</label>
            <input
              type="text"
              name="apellido"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="Tu apellido"
              value={formData.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="tuemail@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Contraseña</label>
            <input
              type="password"
              name="password"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Nombre de la Escuela</label>
            <input
              type="text"
              name="escuela"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="Nombre de tu escuela"
              value={formData.escuela}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Etnia</label>
            <input
              type="text"
              name="etnia"
              className="w-full p-3 rounded bg-gray-700"
              placeholder="Tu etnia"
              value={formData.etnia}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300">Rol</label>
            <select
              name="role"
              className="w-full p-3 rounded bg-gray-700"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="profesor">Profesor</option>
              <option value="alumno">Alumno</option>
              <option value="padre">Padre</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition"
          >
            Registrarse
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4">
          ¿Ya tienes una cuenta?{" "}
          <a href="/login" className="text-blue-400 hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
