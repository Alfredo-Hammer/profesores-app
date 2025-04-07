import React, { useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BookOpen, CheckCircle, School } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Dashboard = () => {
  const [totalAlumnos, setTotalAlumnos] = useState(0);
  const [totalClases, setTotalClases] = useState(0);
  const [asistencias, setAsistencias] = useState(0);
  const [escuelas, setEscuelas] = useState(0);
  const [loading, setLoading] = useState(true);
  const profesorId = auth.currentUser?.uid;
  const navigate = useNavigate();

  useEffect(() => {
    if (profesorId) {
      fetchDashboardData();
    }
  }, [profesorId]);

  const fetchAsistencias = async () => {
    try {
      const clasesQuery = query(collection(db, "clases"), where("profesorId", "==", profesorId));
      const clasesSnapshot = await getDocs(clasesQuery);
      const claseIds = clasesSnapshot.docs.map(doc => doc.id);

      let totalAsistencias = 0;
      for (const claseId of claseIds) {
        const asistenciasQuery = query(collection(db, "asistencias"), where("claseId", "==", claseId));
        const asistenciasSnapshot = await getDocs(asistenciasQuery);
        totalAsistencias += asistenciasSnapshot.size;
      }

      setAsistencias(totalAsistencias);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const alumnosQuery = query(collection(db, "alumnos"), where("profesorId", "==", profesorId));
      const alumnosSnapshot = await getDocs(alumnosQuery);
      setTotalAlumnos(alumnosSnapshot.size);

      const clasesQuery = query(collection(db, "clases"), where("profesorId", "==", profesorId));
      const clasesSnapshot = await getDocs(clasesQuery);
      setTotalClases(clasesSnapshot.size);

      const escuelasQuery = query(collection(db, "escuelas"), where("profesorId", "==", profesorId));
      const escuelasSnapshot = await getDocs(escuelasQuery);
      setEscuelas(escuelasSnapshot.size);

      await fetchAsistencias();

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos del Dashboard:", error);
      setLoading(false);
    }
  };


  const data = [
    { name: "Alumnos", value: totalAlumnos },
    { name: "Clases", value: totalClases },
    { name: "Asistencias", value: asistencias },
    { name: "Escuelas", value: escuelas },
  ];

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header />
      {/* Título principal */}
      <h1 className="text-2xl font-bold text-center text-blue-400">Sistema de Educación</h1>
      <h2 className="text-xl font-bold text-center text-orange-400 mb-6">EduHammer</h2>
      <p className="text-gray-400 text-center">"Por una educación más organizada y accesible."</p>
      {loading ? (
        <p className="text-center">Cargando datos...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
          <div onClick={() => navigate("/alumnos")} className="bg-gray-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:bg-gray-700 transition border-blue-100 border-2">
            <Users size={40} className="text-blue-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Total de Alumnos</h2>
            <p className="text-3xl font-bold">{totalAlumnos}</p>
          </div>
          <div onClick={() => navigate("/clases")} className="bg-gray-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:bg-gray-700 transition border-green-100 border-2">
            <BookOpen size={40} className="text-green-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Total de Clases</h2>
            <p className="text-3xl font-bold">{totalClases}</p>
          </div>
          <div onClick={() => navigate("/asistencias")} className="bg-gray-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:bg-gray-700 transition border-yellow-100 border-2">
            <CheckCircle size={40} className="text-yellow-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Total de Asistencias</h2>
            <p className="text-3xl font-bold">{asistencias}</p>
          </div>

          <div onClick={() => navigate("/escuelas")} className="bg-gray-800 p-6 rounded-lg shadow-lg text-center cursor-pointer hover:bg-gray-700 transition border-purple-100 border-2">
            <School size={40} className="text-purple-500 mx-auto mb-2" />
            <h2 className="text-xl font-bold">Total de Escuelas</h2>
            <p className="text-3xl font-bold">{escuelas}</p>
          </div>

        </div>
      )}

      <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Resumen Visual</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Bar dataKey="value" fill="#4F46E5" barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
