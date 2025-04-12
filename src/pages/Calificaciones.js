import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Calificaciones = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [filteredAlumnos, setFilteredAlumnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const alumnosQuery = query(collection(db, "alumnos"), where("profesorId", "==", user.uid));
        const alumnosSnapshot = await getDocs(alumnosQuery);
        const alumnosData = await Promise.all(
          alumnosSnapshot.docs.map(async (doc) => {
            const alumno = doc.data();

            // Consulta para obtener las materias asociadas al alumno
            const materiasQuery = query(
              collection(db, "materias"),
              where("gradoId", "==", alumno.gradoId),
              where("escuelaId", "==", alumno.escuelaId),
              where("seccion", "==", alumno.seccion),
              where("turno", "==", alumno.turno)
            );
            const materiasSnapshot = await getDocs(materiasQuery);
            const materias = materiasSnapshot.docs.map((materiaDoc) => materiaDoc.data());

            return {
              id: doc.id,
              ...alumno,
              materias, // Incluir las materias en los datos del alumno
            };
          })
        );

        console.log("Datos de los alumnos:", alumnosData);

        setAlumnos(alumnosData);
        setFilteredAlumnos(alumnosData);
        setLoading(false);
      } catch (error) {
        toast.error("Error al obtener los datos");
      }
    };

    fetchData();
  }, [user]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    const filtered = alumnos.filter(
      (alumno) =>
        alumno.nombre.toLowerCase().includes(term) ||
        alumno.seccion.toLowerCase().includes(term) ||
        alumno.escuela.toLowerCase().includes(term) ||
        alumno.turno.toLowerCase().includes(term) ||
        alumno.grado.toLowerCase().includes(term)
    );
    setFilteredAlumnos(filtered);
  };

  const handleCalificar = async (alumno) => {
    try {
      console.log("Datos del alumno enviados:", alumno); // Depuración

      // Navegar al componente CalificarAlumno con los datos necesarios
      navigate(`/calificar/${alumno.id}`, {
        state: {
          alumno: {
            id: alumno.id,
            nombre: alumno.nombre,
            apellidos: alumno.apellidos,
            escuelaId: alumno.escuelaId,
            gradoId: alumno.gradoId,
            seccion: alumno.seccion,
            turno: alumno.turno,
            codigo_mined: alumno.codigo_mined,
            escuela: alumno.escuela,
            materias: alumno.materias, // Pasar las materias del alumno
          },
        },
      });
    } catch (error) {
      console.error("Error al navegar a la página de calificación:", error);
      toast.error("Error al navegar a la página de calificación.");
    }
  };

  const fetchMaterias = async () => {
    try {
      const materiasSnapshot = await getDocs(collection(db, "materias"));
      const materiasData = materiasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return materiasData;
    } catch (error) {
      console.error("Error al obtener las materias:", error);
      toast.error("Error al obtener las materias.");
      return [];
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();

    // Título del PDF
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Lista de Alumnos", 105, 20, { align: "center" });

    // Subtítulos
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Tabla de calificaciones.", 105, 30, { align: "center" });

    // Datos de la tabla
    const tableData = filteredAlumnos.map((alumno) => [
      alumno.nombre + " " + alumno.apellido,
      alumno.codigo_mined,
      alumno.grado,
      alumno.seccion,
      alumno.escuela,
      alumno.turno,
    ]);

    // Configuración de la tabla
    autoTable(doc, {
      startY: 50, // Posición inicial de la tabla
      head: [["Nombre", "Código MINED", "Grado", "Sección", "Escuela"]],
      body: tableData,
      styles: {
        font: "helvetica",
        fontSize: 10,
        textColor: [0, 0, 0], // Color negro
      },
      headStyles: {
        fillColor: [41, 128, 185], // Azul bonito para el encabezado
        textColor: [255, 255, 255], // Texto blanco
        fontSize: 12,
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Color gris claro para filas alternas
        padding: [2, 2, 2, 2], // Espacio entre celdas
        fontSize: 10,
        textColor: [0, 0, 0], // Color negro
      },
    });

    // Descargar el PDF
    doc.save("calificaciones.pdf");
  };

  if (loading) {
    return <div className="text-center text-lg">Cargando datos...</div>;
  }

  return (
    <div className="p-5 bg-gray-900 text-gray-400 min-h-screen transition-opacity duration-300">
      <Header />

      <div className="overflow-x-auto mb-8">
        <div className="flex flex-col items-center justify-center mb-9">
          <h1 className="text-3xl font-bold">Calificaciones de Alumnos</h1>
          <p className="text-gray-400 text-md">Aquí puedes calificar a tus alumnos.</p>
          <p className="text-gray-400">Selecciona un alumno para calificar.</p>
        </div>

        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, sección o escuela..."
            value={searchTerm}
            onChange={handleSearch}
            className="p-2 border border-gray-500 rounded-lg bg-gray-800 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full max-w-md"
          />

          <button
            onClick={generatePDF}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Descargar PDF
          </button>
        </div>

        <div id="table-container">
          {filteredAlumnos.length === 0 ? (
            <div className="text-center text-gray-400 mt-6">
              No se encontraron resultados para "{searchTerm}".
            </div>
          ) : (
            <table className="table-auto border-collapse border border-gray-300 w-full text-left">
              <thead className="bg-gray-800 text-gray-500">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">N°</th> {/* Nueva columna */}
                  <th className="border border-gray-300 px-4 py-2">Nombres y Apellidos</th>
                  <th className="border border-gray-300 px-4 py-2">Código MINED</th>
                  <th className="border border-gray-300 px-4 py-2">Grado</th>
                  <th className="border border-gray-300 px-4 py-2">Sección</th>
                  <th className="border border-gray-300 px-4 py-2">Escuela</th>
                  <th className="border border-gray-300 px-4 py-2">Turno</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlumnos.map((alumno, index) => (
                  <tr key={alumno.id}>
                    <td className="border border-gray-300 px-4 py-2 text-center">{index + 1}</td> {/* Número de fila */}
                    <td className="border border-gray-300 px-4 py-2">
                      {alumno.nombre} {alumno.apellido}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{alumno.codigo_mined}</td>
                    <td className="border border-gray-300 px-4 py-2">{alumno.grado}</td>
                    <td className="border border-gray-300 px-4 py-2">{alumno.seccion}</td>
                    <td className="border border-gray-300 px-4 py-2">{alumno.escuela}</td>
                    <td className="border border-gray-300 px-4 py-2">{alumno.turno || "Sin turno"}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handleCalificar(alumno)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Calificar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Calificaciones;