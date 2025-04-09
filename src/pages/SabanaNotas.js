import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebaseConfig";
import Header from "../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Función para convertir nota numérica a cualitativa
const notaCualitativa = (nota) => {
  if (nota >= 90) return "AA";
  if (nota >= 76) return "AS";
  if (nota >= 60) return "AF";
  if (nota >= 40) return "AI";
  return "";
};

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
    const fetchData = async () => {
      if (!user) return;

      try {
        const escuelasSnapshot = await getDocs(
          query(collection(db, "escuelas"), where("profesorId", "==", user.uid))
        );
        setEscuelas(escuelasSnapshot.docs.map((doc) => doc.data().nombre));

        const alumnosSnapshot = await getDocs(
          query(collection(db, "alumnos"), where("profesorId", "==", user.uid))
        );
        setGrados([...new Set(alumnosSnapshot.docs.map((doc) => doc.data().grado))]);
        setSecciones([...new Set(alumnosSnapshot.docs.map((doc) => doc.data().seccion))]);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchData();
  }, [user]);

  const fetchAlumnos = async () => {
    if (!escuelaSeleccionada || !gradoSeleccionado || !seccionSeleccionada) return;

    try {
      const alumnosQuery = query(
        collection(db, "alumnos"),
        where("escuela", "==", escuelaSeleccionada),
        where("grado", "==", gradoSeleccionado),
        where("seccion", "==", seccionSeleccionada),
        where("profesorId", "==", user.uid)
      );
      const alumnosSnapshot = await getDocs(alumnosQuery);

      const alumnosData = await Promise.all(
        alumnosSnapshot.docs.map(async (doc) => {
          const alumno = { id: doc.id, ...doc.data() }; // Asegúrate de que `apellidos` esté incluido aquí
          const calificacionesQuery = query(
            collection(db, "calificaciones"),
            where("alumnoId", "==", doc.id)
          );
          const calificacionesSnapshot = await getDocs(calificacionesQuery);
          const materias = calificacionesSnapshot.docs.map((c) => {
            const data = c.data();
            return {
              nombre: data.nombreMateria,
              calificaciones: data.calificaciones,
            };
          });
          return { ...alumno, materias };
        })
      );

      setAlumnos(alumnosData);
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
    }
  };

  // Obtener todas las materias únicas para mostrar en columnas
  const materiasUnicas = Array.from(
    new Set(alumnos.flatMap((a) => a.materias.map((m) => m.nombre)))
  );

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Sábana de Notas", 14, 10);

    const tableColumnHeaders = [
      "N°",
      "Nombre y Apellido",
      "Código MINED",
      ...materiasUnicas.flatMap((materia) => [
        `${materia} IBIM CUAL`,
        `${materia} IBIM CUANT`,
        `${materia} IIBIM CUAL`,
        `${materia} IIBIM CUANT`,
        `${materia} ISEM CUAL`,
        `${materia} ISEM CUANT`,
      ]),
      "Promedio",
    ];

    const tableRows = alumnos.map((alumno, index) => {
      const row = [
        index + 1,
        `${alumno.nombre} ${alumno.apellido}`,
        alumno.codigo_mined,
      ];

      materiasUnicas.forEach((materia) => {
        const m = alumno.materias.find((mat) => mat.nombre === materia);
        const cal = m?.calificaciones || {};
        row.push(
          notaCualitativa(cal.I) || "N/A",
          cal.I || "N/A",
          notaCualitativa(cal.II) || "N/A",
          cal.II || "N/A",
          notaCualitativa(cal.semestre1) || "N/A",
          cal.semestre1 || "N/A"
        );
      });

      const totalNotas = alumno.materias.reduce((sum, materia) => {
        const cal = materia.calificaciones || {};
        return sum + (cal.I || 0) + (cal.II || 0) + (cal.semestre1 || 0);
      }, 0);
      const totalMaterias = alumno.materias.length * 3; // 3 notas por materia (I, II, semestre1)
      const promedio = totalMaterias > 0 ? (totalNotas / totalMaterias).toFixed(2) : "N/A";

      row.push(promedio);

      return row;
    });

    autoTable(doc, {
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    doc.save("SabanaNotas.pdf");
  };

  return (
    <div className="p-5 bg-gray-900 text-gray-200 min-h-screen">
      <Header />
      <h1 className="text-2xl font-bold mb-4 text-center">Sábana de Notas</h1>

      <div className="flex flex-wrap gap-4 justify-center mb-6">
        <select value={escuelaSeleccionada} onChange={(e) => setEscuelaSeleccionada(e.target.value)} className="p-2 bg-gray-800 border rounded">
          <option value="">Seleccionar Escuela</option>
          {escuelas.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={gradoSeleccionado} onChange={(e) => setGradoSeleccionado(e.target.value)} className="p-2 bg-gray-800 border rounded">
          <option value="">Seleccionar Grado</option>
          {grados.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={seccionSeleccionada} onChange={(e) => setSeccionSeleccionada(e.target.value)} className="p-2 bg-gray-800 border rounded">
          <option value="">Seleccionar Sección</option>
          {secciones.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchAlumnos} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Mostrar</button>
      </div>

      {alumnos.length > 0 && (
        <div className="overflow-x-auto">
          <button
            onClick={exportarPDF}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4 flex justify-end"
          >
            Imprimir a PDF
          </button>
          <table className="table-auto border-collapse w-full text-sm">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="border px-2 py-1" rowSpan={3}>N°</th>
                <th className="border px-2 py-1" rowSpan={3}>Nombre y Apellido</th>
                <th className="border px-2 py-1" rowSpan={3}>Código MINED</th>
                {materiasUnicas.map((materia) => (
                  <th key={materia} className="border px-2 py-1 text-center bg-gray-800 text-white" colSpan={6}>
                    {materia}
                  </th>
                ))}
                <th className="border px-2 py-1 text-center bg-gray-800 text-white" rowSpan={3}>Promedio</th>
              </tr>
              <tr className="bg-gray-700 text-white">
                {materiasUnicas.map((materia) => (
                  <>
                    <th key={`${materia}-IBIM`} className="border px-2 py-1 text-center bg-gray-600 text-white" colSpan={2}>IBIM</th>
                    <th key={`${materia}-IIBIM`} className="border px-2 py-1 text-center bg-gray-600 text-white" colSpan={2}>IIBIM</th>
                    <th key={`${materia}-ISEM`} className="border px-2 py-1 text-center bg-gray-600 text-white" colSpan={2}>ISEM</th>
                  </>
                ))}
              </tr>
              <tr className="bg-gray-600 text-white">
                {materiasUnicas.map((materia) => (
                  <>
                    <th key={`${materia}-IBIM-CUAL`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUAL</th>
                    <th key={`${materia}-IBIM-CUANT`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUANT</th>
                    <th key={`${materia}-IIBIM-CUAL`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUAL</th>
                    <th key={`${materia}-IIBIM-CUANT`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUANT</th>
                    <th key={`${materia}-ISEM-CUAL`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUAL</th>
                    <th key={`${materia}-ISEM-CUANT`} className="border px-2 py-1 text-center bg-gray-500 text-white">CUANT</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {alumnos.map((alumno, index) => {
                // Calcular el promedio de todas las notas del alumno
                const totalNotas = alumno.materias.reduce((sum, materia) => {
                  const cal = materia.calificaciones || {};
                  return sum + (cal.I || 0) + (cal.II || 0) + (cal.semestre1 || 0);
                }, 0);
                const totalMaterias = alumno.materias.length * 3; // 3 notas por materia (I, II, semestre1)
                const promedio = totalMaterias > 0 ? (totalNotas / totalMaterias).toFixed(2) : "N/A";

                return (
                  <tr key={alumno.id} className="bg-gray-900 hover:bg-gray-700">
                    <td className="border px-2 py-1 text-center">{index + 1}</td>
                    <td className="border px-2 py-1 whitespace-nowrap">{alumno.nombre} {alumno.apellido}</td>
                    <td className="border px-2 py-1 text-center whitespace-nowrap">{alumno.codigo_mined}</td>
                    {materiasUnicas.flatMap((materia) => {
                      const m = alumno.materias.find((mat) => mat.nombre === materia);
                      const cal = m?.calificaciones || {};
                      return [
                        <td key={`${materia}-IBIM-CUAL-${alumno.id}`} className="border px-2 py-1 text-center">{notaCualitativa(cal.I)}</td>,
                        <td key={`${materia}-IBIM-CUANT-${alumno.id}`} className={`border px-2 py-1 text-center ${cal.I < 60 ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}`}>{cal.I || "N/A"}</td>,
                        <td key={`${materia}-IIBIM-CUAL-${alumno.id}`} className="border px-2 py-1 text-center">{notaCualitativa(cal.II)}</td>,
                        <td key={`${materia}-IIBIM-CUANT-${alumno.id}`} className={`border px-2 py-1 text-center ${cal.II < 60 ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}`}>{cal.II || "N/A"}</td>,
                        <td key={`${materia}-ISEM-CUAL-${alumno.id}`} className="border px-2 py-1 text-center">{notaCualitativa(cal.semestre1)}</td>,
                        <td key={`${materia}-ISEM-CUANT-${alumno.id}`} className={`border px-2 py-1 text-center ${cal.semestre1 < 60 ? "text-red-500 font-semibold" : "text-green-500 font-semibold"}`}>{cal.semestre1 || "N/A"}</td>
                      ];
                    })}
                    <td className="border px-2 py-1 text-center font-bold">{promedio}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SabanaNotas;
