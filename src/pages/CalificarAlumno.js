import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getDocs, collection, query, where, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Header from "../components/Header";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const CalificarAlumno = () => {
  const location = useLocation();
  const alumno = location.state?.alumno;

  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calificaciones, setCalificaciones] = useState({}); // Estado para las calificaciones

  useEffect(() => {
    if (!alumno) {
      console.error("No se recibieron datos del alumno");
      toast.error("El objeto alumno no está definido");
      return;
    }

    console.log("Datos del alumno recibidos:", alumno); // Depuración
  }, [alumno]);

  // Obtener las materias asociadas al alumno desde Firebase
  useEffect(() => {
    const fetchMaterias = async () => {
      setIsLoading(true);
      try {
        if (!alumno) {
          console.error("El objeto alumno no está definido:", alumno);
          toast.error("El objeto alumno no está definido");
          return;
        }

        console.log("Datos del alumno para la consulta:", {
          escuelaId: alumno.escuelaId,
          gradoId: alumno.gradoId,
          seccion: alumno.seccion,
          turno: alumno.turno,
        });

        // Consulta para obtener el grado del alumno
        const gradoQuery = query(
          collection(db, "grados"),
          where("escuelaId", "==", alumno.escuelaId),
          where("secciones", "array-contains", alumno.seccion),
          where("turno", "==", alumno.turno)
        );

        const gradoSnapshot = await getDocs(gradoQuery);

        if (gradoSnapshot.empty) {
          console.warn(`No se encontró el grado para el alumno en la escuela ${alumno.escuelaId}`);
          setMateriasDisponibles([]);
          toast.error("No se encontraron materias para este alumno.");
          return;
        }

        // Buscar el grado que coincida con el ID del grado del alumno
        const gradoDoc = gradoSnapshot.docs.find((doc) => doc.id === alumno.gradoId);

        if (!gradoDoc) {
          console.warn(`No se encontró el grado con ID ${alumno.gradoId} para el alumno.`);
          setMateriasDisponibles([]);
          toast.error("No se encontraron materias para este alumno.");
          return;
        }

        // Obtener las materias asociadas al grado
        const gradoData = gradoDoc.data();
        const materiasIds = gradoData.materias || [];

        if (materiasIds.length === 0) {
          console.warn("El grado no tiene materias asociadas.");
          setMateriasDisponibles([]);
          toast.error("No se encontraron materias para este alumno.");
          return;
        }

        // Consultar las materias por sus IDs
        const materiasQuery = query(collection(db, "materias"));
        const materiasSnapshot = await getDocs(materiasQuery);

        // Filtrar las materias que coincidan con los IDs en el array `materiasIds`
        const materias = materiasSnapshot.docs
          .filter((doc) => materiasIds.includes(doc.id))
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

        if (materias.length === 0) {
          console.warn("No se encontraron materias que coincidan con los IDs proporcionados.");
          toast.error("No se encontraron materias para este alumno.");
        }

        console.log("Materias obtenidas:", materias); // Depuración

        setMateriasDisponibles(materias); // Guardar las materias en el estado
      } catch (error) {
        console.error("Error al obtener las materias desde Firestore:", error);
        toast.error("No se pudieron cargar las materias.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterias();
  }, [alumno]);

  useEffect(() => {
    const fetchCalificaciones = async () => {
      if (!alumno) return;

      try {
        const calificacionesQuery = query(
          collection(db, "calificaciones"),
          where("alumnoId", "==", alumno.id)
        );
        const calificacionesSnapshot = await getDocs(calificacionesQuery);

        if (!calificacionesSnapshot.empty) {
          const calificacionesData = {};
          calificacionesSnapshot.forEach((doc) => {
            const data = doc.data();
            calificacionesData[data.materiaId] = data.calificaciones; // Asociar las calificaciones por materiaId
          });
          setCalificaciones(calificacionesData); // Guardar las calificaciones en el estado
        }
      } catch (error) {
        console.error("Error al obtener las calificaciones:", error);
        toast.error("Error al cargar las calificaciones.");
      }
    };

    fetchCalificaciones();
  }, [alumno]);

  const handleCalificacionChange = (materiaId, bimestre, value) => {
    const numericValue = parseFloat(value);

    if (numericValue < 0 || numericValue > 100) {
      toast.error("El valor debe estar entre 0 y 100.");
      return;
    }

    setCalificaciones((prev) => {
      const updated = { ...prev };
      if (!updated[materiaId]) {
        updated[materiaId] = { I: 0, II: 0, III: 0, IV: 0, semestre1: 0, semestre2: 0, final: 0 };
      }
      updated[materiaId][bimestre] = numericValue || 0;
      updated[materiaId].semestre1 = (updated[materiaId].I + updated[materiaId].II) / 2;
      updated[materiaId].semestre2 = (updated[materiaId].III + updated[materiaId].IV) / 2;
      updated[materiaId].final =
        (updated[materiaId].I + updated[materiaId].II + updated[materiaId].III + updated[materiaId].IV) / 4;
      return updated;
    });
  };

  const handleGuardarCalificaciones = async () => {
    try {
      for (const materiaId in calificaciones) {
        const calificacionData = {
          alumnoId: alumno.id,
          materiaId,
          nombreMateria: materiasDisponibles.find((materia) => materia.id === materiaId)?.nombre || "Materia Desconocida",
          calificaciones: calificaciones[materiaId],
          createdAt: new Date(),
        };

        await addDoc(collection(db, "calificaciones"), calificacionData);
      }

      toast.success("Calificaciones guardadas exitosamente.");
    } catch (error) {
      console.error("Error al guardar las calificaciones:", error);
      toast.error("Error al guardar las calificaciones.");
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();

    // Título del documento
    doc.setFontSize(18);
    doc.text("Calificaciones del Alumno", 14, 20);
    doc.setFontSize(12);
    doc.text(`${alumno.nombre} ${alumno.apellido}`, 14, 30);
    doc.text(`Centro educativo: ${alumno.escuela}`, 14, 40);

    // Configuración de la tabla
    const tableColumn = [
      "Materia",
      "I Bimestre",
      "II Bimestre",
      "Semestre 1",
      "III Bimestre",
      "IV Bimestre",
      "Semestre 2",
      "Final",
    ];
    const tableRows = materiasDisponibles.map((materia) => [
      materia.nombre,
      calificaciones[materia.id]?.I || "N/A",
      calificaciones[materia.id]?.II || "N/A",
      calificaciones[materia.id]?.semestre1?.toFixed(2) || "N/A",
      calificaciones[materia.id]?.III || "N/A",
      calificaciones[materia.id]?.IV || "N/A",
      calificaciones[materia.id]?.semestre2?.toFixed(2) || "N/A",
      calificaciones[materia.id]?.final?.toFixed(2) || "N/A",
    ]);

    // Generar la tabla
    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }, // Color azul para el encabezado
    });

    // Guardar el PDF
    doc.save(`Calificaciones_${alumno.nombre}_${alumno.apellido}.pdf`);
  };

  const handleExportToExcel = () => {
    const worksheetData = [
      [
        "Materia",
        "I Bimestre",
        "II Bimestre",
        "Semestre 1",
        "III Bimestre",
        "IV Bimestre",
        "Semestre 2",
        "Final",
      ],
      ...materiasDisponibles.map((materia) => [
        materia.nombre,
        calificaciones[materia.id]?.I || "N/A",
        calificaciones[materia.id]?.II || "N/A",
        calificaciones[materia.id]?.semestre1?.toFixed(2) || "N/A",
        calificaciones[materia.id]?.III || "N/A",
        calificaciones[materia.id]?.IV || "N/A",
        calificaciones[materia.id]?.semestre2?.toFixed(2) || "N/A",
        calificaciones[materia.id]?.final?.toFixed(2) || "N/A",
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Calificaciones");

    // Exportar el archivo Excel
    XLSX.writeFile(workbook, `Calificaciones_${alumno.nombre}_${alumno.apellido}.xlsx`);
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen mt-9">
      <Header />
      <div className="flex justify-center items-center">
        <h1 className="text-2xl font-bold mt-5 mb-4 text-center">Materias del Alumno</h1>
      </div>
      <h2 className="text-xl font-semibold text-center">
        {alumno.nombre} {alumno.apellido}
      </h2>
      <h3 className="text-md text-blue-400 font-semibold mb-4 text-center">
        Centro educativo: {alumno.escuela}
      </h3>
      <p className="text-right text-sm text-gray-400 mb-4 w-fit">
        Código MINED: {alumno.codigo_mined || "No disponible"}
      </p>

      {isLoading ? (
        <p className="text-gray-400 text-center">Cargando materias...</p>
      ) : (
        <div className="mt-6 relative">
          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left text-gray-400">
              <thead className="bg-gray-800 text-gray-500 text-center">
                <tr>
                  <th className="px-4 py-2">Materia</th>
                  <th className="px-4 py-2">I Bimestre</th>
                  <th className="px-4 py-2">II Bimestre</th>
                  <th className="px-4 py-2">Semestre 1</th>
                  <th className="px-4 py-2">III Bimestre</th>
                  <th className="px-4 py-2">IV Bimestre</th>
                  <th className="px-4 py-2">Semestre 2</th>
                  <th className="px-4 py-2">Final</th>
                </tr>
              </thead>
              <tbody>
                {materiasDisponibles.map((materia) => (
                  <tr key={materia.id}>
                    <td className="border px-4 py-2">{materia.nombre}</td>
                    <td className="border px-4 py-2 text-center">
                      <input
                        type="number"
                        value={calificaciones[materia.id]?.I || ""}
                        onChange={(e) => handleCalificacionChange(materia.id, "I", e.target.value)}
                        className={`w-full bg-gray-800 text-white p-1 rounded ${calificaciones[materia.id]?.I < 60 ? "text-red-500" : ""}`}
                      />
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <input
                        type="number"
                        value={calificaciones[materia.id]?.II || ""}
                        onChange={(e) => handleCalificacionChange(materia.id, "II", e.target.value)}
                        className={`w-full bg-gray-800 text-white p-1 rounded ${calificaciones[materia.id]?.II < 60 ? "text-red-500" : ""}`}
                      />
                    </td>
                    <td
                      className={`border px-4 py-2 text-center ${calificaciones[materia.id]?.semestre1 < 60 ? "text-red-500" : "text-green-500"}`}
                    >
                      {calificaciones[materia.id]?.semestre1?.toFixed(2) || "N/A"}
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <input
                        type="number"
                        value={calificaciones[materia.id]?.III || ""}
                        onChange={(e) => handleCalificacionChange(materia.id, "III", e.target.value)}
                        className={`w-full bg-gray-800 text-white p-1 rounded ${calificaciones[materia.id]?.III < 60 ? "text-red-500" : ""}`}
                      />
                    </td>
                    <td className="border px-4 py-2 text-center">
                      <input
                        type="number"
                        value={calificaciones[materia.id]?.IV || ""}
                        onChange={(e) => handleCalificacionChange(materia.id, "IV", e.target.value)}
                        className={`w-full bg-gray-800 text-white p-1 rounded ${calificaciones[materia.id]?.IV < 60 ? "text-red-500" : ""}`}
                      />
                    </td>
                    <td
                      className={`border px-4 py-2 text-center ${calificaciones[materia.id]?.semestre2 < 60 ? "text-red-500" : "text-green-500"}`}
                    >
                      {calificaciones[materia.id]?.semestre2?.toFixed(2) || "N/A"}
                    </td>
                    <td
                      className={`border px-4 py-2 text-center ${calificaciones[materia.id]?.final < 60 ? "text-red-500" : "text-green-500"}`}
                    >
                      {calificaciones[materia.id]?.final?.toFixed(2) || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="absolute right-0 mt-4 flex gap-4">
            <button
              onClick={handleGuardarCalificaciones}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              Guardar Calificaciones
            </button>
            <button
              onClick={handleGeneratePDF}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Imprimir PDF
            </button>
            <button
              onClick={handleExportToExcel}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
            >
              Exportar a Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalificarAlumno;
//YAs8OoW0RgPpeINobz2r