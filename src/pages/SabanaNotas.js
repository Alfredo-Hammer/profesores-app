import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import Header from "../components/Header";

const SabanaNotas = () => {
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState("");
  const [gradoSeleccionado, setGradoSeleccionado] = useState("");
  const [seccionSeleccionada, setSeccionSeleccionada] = useState("");
  const [alumnos, setAlumnos] = useState([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchEscuelasGradosSecciones = async () => {
      if (!user) return;

      try {
        // Obtener escuelas
        const escuelasQuery = query(collection(db, "escuelas"), where("profesorId", "==", user.uid));
        const escuelasSnapshot = await getDocs(escuelasQuery);
        const escuelasData = escuelasSnapshot.docs.map((doc) => doc.data().nombre);
        setEscuelas(escuelasData);

        // Obtener grados y secciones desde la colección de alumnos
        const alumnosQuery = query(collection(db, "alumnos"), where("profesorId", "==", user.uid));
        const alumnosSnapshot = await getDocs(alumnosQuery);

        // Extraer grados únicos
        const gradosData = [...new Set(alumnosSnapshot.docs.map((doc) => doc.data().grado))];
        setGrados(gradosData);

        // Extraer secciones únicos
        const seccionesData = [...new Set(alumnosSnapshot.docs.map((doc) => doc.data().seccion))];
        setSecciones(seccionesData);
      } catch (error) {
        console.error("Error al obtener escuelas, grados y secciones:", error);
      }
    };

    fetchEscuelasGradosSecciones();
  }, [user]);

  const fetchAlumnos = async () => {
    if (!escuelaSeleccionada || !gradoSeleccionado || !seccionSeleccionada) {
      console.error("Faltan valores seleccionados: escuela, grado o sección");
      return;
    }

    try {
      console.log("Valores seleccionados:", {
        escuela: escuelaSeleccionada,
        grado: gradoSeleccionado,
        seccion: seccionSeleccionada,
      });

      const alumnosQuery = query(
        collection(db, "alumnos"),
        where("escuela", "==", escuelaSeleccionada),
        where("grado", "==", gradoSeleccionado),
        where("seccion", "==", seccionSeleccionada),
        where("profesorId", "==", user.uid)
      );

      const alumnosSnapshot = await getDocs(alumnosQuery);
      console.log("Documentos obtenidos de alumnos:", alumnosSnapshot.docs.length);

      const alumnosData = await Promise.all(
        alumnosSnapshot.docs.map(async (doc) => {
          const alumno = { id: doc.id, ...doc.data() };

          // Obtener materias y notas del alumno
          const materiasRef = collection(db, `alumnos/${doc.id}/materias`);

          const materiasSnapshot = await getDocs(materiasRef);
          where("profesorId", "==", user.uid) // Filtrar materias por profesorId
          const materias = materiasSnapshot.docs.map((materiaDoc) => ({
            id: materiaDoc.id,
            ...materiaDoc.data(),
          }));

          return { ...alumno, materias };
        })
      );

      console.log("Datos de alumnos procesados:", alumnosData);
      setAlumnos(alumnosData);
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
    }
  };

  return (
    <div className="p-5 bg-gray-900 text-gray-400 min-h-screen">
      <Header />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center">Sábana de Notas</h1>
        <p className="text-center text-gray-400">Selecciona una escuela, un grado y una sección para ver la lista de alumnos y sus notas.</p>
      </div>

      <div className="flex justify-center gap-4 mb-6">
        <select
          value={escuelaSeleccionada}
          onChange={(e) => setEscuelaSeleccionada(e.target.value)}
          className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
        >
          <option value="">Seleccionar Escuela</option>
          {escuelas.map((escuela) => (
            <option key={escuela} value={escuela}>{escuela}</option>
          ))}
        </select>

        <select
          value={gradoSeleccionado}
          onChange={(e) => setGradoSeleccionado(e.target.value)}
          className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
        >
          <option value="">Seleccionar Grado</option>
          {grados.map((grado) => (
            <option key={grado} value={grado}>{grado}</option>
          ))}
        </select>

        <select
          value={seccionSeleccionada}
          onChange={(e) => setSeccionSeleccionada(e.target.value)}
          className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300"
        >
          <option value="">Seleccionar Sección</option>
          {secciones.map((seccion) => (
            <option key={seccion} value={seccion}>{seccion}</option>
          ))}
        </select>

        <button
          onClick={fetchAlumnos}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Mostrar
        </button>
      </div>

      {alumnos.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Lista de Alumnos y Notas</h2>
          <table className="table-auto border-collapse border border-gray-300 w-full text-left">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Nombres y Apellidos</th>
                <th className="border border-gray-300 px-4 py-2">Código MINED</th>
                {alumnos[0]?.materias.map((materia) => (
                  <th key={materia.id} colSpan={3} className="border border-gray-300 px-4 py-2 text-center">
                    {materia.nombre}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border border-gray-300 px-4 py-2"></th>
                <th className="border border-gray-300 px-4 py-2"></th>
                {alumnos[0]?.materias.map((materia) => (
                  <>
                    <th key={`${materia.id}-ib`} className="border border-gray-300 px-4 py-2 text-center">IB</th>
                    <th key={`${materia.id}-iib`} className="border border-gray-300 px-4 py-2 text-center">IIB</th>
                    <th key={`${materia.id}-is`} className="border border-gray-300 px-4 py-2 text-center">IS</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno) => (
                <tr key={alumno.id}>
                  <td className="border border-gray-300 px-4 py-2">{alumno.nombre} {alumno.apellidos}</td>
                  <td className="border border-gray-300 px-4 py-2">{alumno.codigo_mined}</td>
                  {alumno.materias.map((materia) => (
                    <>
                      <td
                        key={`${materia.id}-ib`}
                        className={`border border-gray-300 px-4 py-2 text-center ${materia.bimestre1 < 60 ? "text-red-500 font-bold" : ""
                          }`}
                      >
                        {materia.bimestre1 || "N/A"}
                      </td>
                      <td
                        key={`${materia.id}-iib`}
                        className={`border border-gray-300 px-4 py-2 text-center ${materia.bimestre2 < 60 ? "text-red-500 font-bold" : ""
                          }`}
                      >
                        {materia.bimestre2 || "N/A"}
                      </td>
                      <td
                        key={`${materia.id}-is`}
                        className={`border border-gray-300 px-4 py-2 text-center ${materia.calificacionSemestre1 < 60 ? "text-red-500 font-bold" : ""
                          }`}
                      >
                        {materia.calificacionSemestre1 || "N/A"}
                      </td>
                    </>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SabanaNotas;