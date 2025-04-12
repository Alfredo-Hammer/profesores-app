import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import Header from "../components/Header";

const Asistencias = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [turnos, setTurnos] = useState([]);
  const [selectedTurno, setSelectedTurno] = useState("");
  const [materiaTurno, setMateriaTurno] = useState("");
  const profesorId = auth.currentUser?.uid;

  useEffect(() => {
    fetchTurnos();
  }, []);

  useEffect(() => {
    if (turnos.length > 0 && !selectedTurno) {
      const firstTurno = turnos[0];
      setSelectedTurno(firstTurno.id);
      setMateriaTurno(firstTurno.materia || "No asignada");
      fetchAlumnosPorTurno();
      fetchAsistencias();
    }
  }, [turnos]);

  useEffect(() => {
    if (selectedTurno) {
      const turnoSeleccionado = turnos.find((turno) => turno.id === selectedTurno);
      setMateriaTurno(turnoSeleccionado?.materia || "No asignada");
      fetchAlumnosPorTurno();
      fetchAsistencias();
    }
  }, [selectedTurno]);

  const fetchTurnos = async () => {
    if (!profesorId) return;
    try {
      const q = query(collection(db, "turnos"), where("profesorId", "==", profesorId));
      const querySnapshot = await getDocs(q);
      setTurnos(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error al obtener turnos:", error);
    }
  };

  const fetchAlumnosPorTurno = async () => {
    if (!profesorId || !selectedTurno) return;
    try {
      // Obtén el turno seleccionado
      const turnoSeleccionado = turnos.find((turno) => turno.id === selectedTurno);
      if (!turnoSeleccionado) return;

      // Filtra los alumnos por los campos del turno
      const q = query(
        collection(db, "alumnos"),
        where("profesorId", "==", profesorId),
        where("grado", "==", turnoSeleccionado.grado),
        where("seccion", "==", turnoSeleccionado.seccion),
        where("escuela", "==", turnoSeleccionado.escuela)
      );

      const querySnapshot = await getDocs(q);
      setAlumnos(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error al obtener alumnos por turno:", error);
    }
  };

  const fetchAsistencias = async () => {
    if (!selectedTurno) return;
    try {
      const q = query(collection(db, "asistencias"), where("turnoId", "==", selectedTurno));
      const querySnapshot = await getDocs(q);
      const data = {};
      querySnapshot.docs.forEach((doc) => {
        data[doc.data().alumnoId] = doc.data().presente;
      });
      setAsistencias(data);
    } catch (error) {
      console.error("Error al obtener asistencias:", error);
    }
  };

  const marcarAsistencia = async (alumnoId, presente) => {
    const asistenciaRef = collection(db, "asistencias");
    const asistenciaQuery = query(asistenciaRef, where("turnoId", "==", selectedTurno), where("alumnoId", "==", alumnoId));
    const querySnapshot = await getDocs(asistenciaQuery);

    if (!querySnapshot.empty) {
      await updateDoc(doc(db, "asistencias", querySnapshot.docs[0].id), { presente });
    } else {
      await addDoc(asistenciaRef, { turnoId: selectedTurno, alumnoId, presente, fecha: new Date() });
    }

    setAsistencias({ ...asistencias, [alumnoId]: presente });
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <Header userName="Profesor" />
      <h1 className="text-3xl font-bold my-4">📅 Asistencias</h1>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2">Selecciona un turno:</label>
        <select
          className="w-full p-3 bg-gray-800 rounded text-white"
          value={selectedTurno}
          onChange={(e) => setSelectedTurno(e.target.value)}
        >
          <option value="">-- Selecciona un turno --</option>
          {turnos.map((turno) => (
            <option key={turno.id} value={turno.id}>
              {turno.materia} - {turno.dia} ({turno.horaInicio} - {turno.horaFin})
            </option>
          ))}
        </select>
      </div>

      {selectedTurno && (
        <>
          <p className="text-lg font-bold text-gray-300 mb-4 text-center">Materia: {materiaTurno}</p>
          {alumnos.length === 0 ? (
            <p className="text-center text-gray-400 mt-6">No hay alumnos inscritos en este turno.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              {alumnos.map((alumno) => (
                <div
                  key={alumno.id}
                  className={`p-4 rounded-lg shadow-lg ${asistencias[alumno.id] === true
                    ? "bg-green-700"
                    : asistencias[alumno.id] === false
                      ? "bg-red-700"
                      : "bg-gray-800"
                    }`}
                >
                  <h2 className="text-lg font-bold">{alumno.nombre} {alumno.apellido}</h2>
                  <p className="text-sm text-gray-300">Escuela: {alumno.escuela}</p>
                  <p className="text-sm text-gray-300">Grado: {alumno.grado}</p>
                  <p className="text-sm text-gray-300">Sección: {alumno.seccion}</p>
                  <div className="flex justify-between mt-4">
                    <button
                      className={`px-4 py-2 rounded ${asistencias[alumno.id] === true ? "bg-green-900" : "bg-gray-600"
                        } hover:bg-green-800`}
                      onClick={() => marcarAsistencia(alumno.id, true)}
                    >
                      ✅ Presente
                    </button>
                    <button
                      className={`px-4 py-2 rounded ${asistencias[alumno.id] === false ? "bg-red-900" : "bg-gray-600"
                        } hover:bg-red-800`}
                      onClick={() => marcarAsistencia(alumno.id, false)}
                    >
                      ❌ Ausente
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Asistencias;
