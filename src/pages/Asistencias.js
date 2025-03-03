import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import Header from "../components/Header";

const Asistencias = () => {
  const [clases, setClases] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [selectedClase, setSelectedClase] = useState("");
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchClases();
  }, []);

  useEffect(() => {
    if (selectedClase) {
      fetchAlumnos();
      fetchAsistencias();
    }
  }, [selectedClase]);

  const fetchClases = async () => {
    if (!profesorId) return;
    const q = query(collection(db, "clases"), where("profesorId", "==", profesorId));
    const querySnapshot = await getDocs(q);
    setClases(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAlumnos = async () => {
    if (!profesorId || !selectedClase) return;
    const q = query(collection(db, "alumnos"), where("profesorId", "==", profesorId));
    const querySnapshot = await getDocs(q);
    setAlumnos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAsistencias = async () => {
    if (!selectedClase) return;
    const q = query(collection(db, "asistencias"), where("claseId", "==", selectedClase));
    const querySnapshot = await getDocs(q);
    const data = {};
    querySnapshot.docs.forEach(doc => {
      data[doc.data().alumnoId] = doc.data().presente;
    });
    setAsistencias(data);
  };

  const marcarAsistencia = async (alumnoId, presente) => {
    const asistenciaRef = collection(db, "asistencias");
    const asistenciaQuery = query(asistenciaRef, where("claseId", "==", selectedClase), where("alumnoId", "==", alumnoId));
    const querySnapshot = await getDocs(asistenciaQuery);

    if (!querySnapshot.empty) {
      await updateDoc(doc(db, "asistencias", querySnapshot.docs[0].id), { presente });
    } else {
      await addDoc(asistenciaRef, { claseId: selectedClase, alumnoId, presente, fecha: new Date() });
    }

    setAsistencias({ ...asistencias, [alumnoId]: presente });
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header userName="Profesor" />
      <h1 className="text-3xl font-bold my-4">📅 Asistencias</h1>

      <div className="mb-4">
        <label className="block text-gray-300">Selecciona una clase:</label>
        <select
          className="w-full p-2 bg-gray-800 rounded"
          value={selectedClase}
          onChange={(e) => setSelectedClase(e.target.value)}
        >
          <option value="">-- Selecciona una clase --</option>
          {clases.map((clase) => (
            <option key={clase.id} value={clase.id}>{clase.nombre}</option>
          ))}
        </select>
      </div>

      {selectedClase && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border border-gray-700 rounded-lg">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="p-3 text-center">Nombre</th>
                <th className="p-3 text-center">Apellido</th>
                <th className="p-3 text-center">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno) => (
                <tr key={alumno.id} className="border-b border-gray-700 text-center">
                  <td className="p-3">{alumno.nombre}</td>
                  <td className="p-3">{alumno.apellido}</td>
                  <td className="p-3">
                    <button
                      className={`px-4 py-2 rounded ${asistencias[alumno.id] ? "bg-green-600" : "bg-gray-600"}`}
                      onClick={() => marcarAsistencia(alumno.id, true)}
                    >
                      ✅ Presente
                    </button>
                    <button
                      className={`ml-2 px-4 py-2 rounded ${asistencias[alumno.id] === false ? "bg-red-600" : "bg-gray-600"}`}
                      onClick={() => marcarAsistencia(alumno.id, false)}
                    >
                      ❌ Ausente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Asistencias;
