import React, { useState, useEffect } from "react";
import { db, auth } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ReportesPage = () => {
  const [reportes, setReportes] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroEscuela, setFiltroEscuela] = useState("");
  const [filtroAlumno, setFiltroAlumno] = useState("");
  const [escuelas, setEscuelas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("No hay usuario autenticado.");
        return;
      }

      try {
        const reportesSnapshot = await getDocs(collection(db, `profesores/${user.uid}/reportes`));
        const reportesData = reportesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setReportes(reportesData);

        const escuelasSnapshot = await getDocs(collection(db, "escuelas"));
        setEscuelas(escuelasSnapshot.docs.map(doc => doc.data().nombre));

        const alumnosSnapshot = await getDocs(collection(db, "alumnos"));
        setAlumnos(alumnosSnapshot.docs.map(doc => doc.data().nombre));
      } catch (error) {
        console.error("Error al obtener datos:", error);
      }
    };

    fetchData();
  }, []);

  const filteredReportes = reportes.filter(reporte =>
    (filtroFecha ? reporte.fecha === filtroFecha : true) &&
    (filtroEscuela ? reporte.escuela === filtroEscuela : true) &&
    (filtroAlumno ? reporte.alumno === filtroAlumno : true)
  );

  const exportToExcel = () => {
    if (filteredReportes.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(filteredReportes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes");
    XLSX.writeFile(workbook, "reportes.xlsx");
  };

  const previewPDF = () => {
    if (filteredReportes.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const doc = new jsPDF();
    doc.text("Reportes de Alumnos", 10, 10);

    autoTable(doc, {
      head: [["Alumno", "Escuela", "Fecha", "Asistencia", "Calificación"]],
      body: filteredReportes.map(r => [r.alumno, r.escuela, r.fecha, r.asistencia, r.calificacion])
    });

    // Convertir a Blob y abrir en una nueva ventana
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Reportes</h2>
      <div className="mb-4 flex gap-2">
        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} className="border rounded p-2" />
        <select value={filtroEscuela} onChange={e => setFiltroEscuela(e.target.value)} className="border rounded p-2">
          <option value="">Todas las escuelas</option>
          {escuelas.map((escuela, index) => <option key={index} value={escuela}>{escuela}</option>)}
        </select>
        <select value={filtroAlumno} onChange={e => setFiltroAlumno(e.target.value)} className="border rounded p-2">
          <option value="">Todos los alumnos</option>
          {alumnos.map((alumno, index) => <option key={index} value={alumno}>{alumno}</option>)}
        </select>
      </div>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Alumno</th>
            <th className="border p-2">Escuela</th>
            <th className="border p-2">Fecha</th>
            <th className="border p-2">Asistencia</th>
            <th className="border p-2">Calificación</th>
          </tr>
        </thead>
        <tbody>
          {filteredReportes.length > 0 ? (
            filteredReportes.map(reporte => (
              <tr key={reporte.id} className="border">
                <td className="border p-2">{reporte.alumno}</td>
                <td className="border p-2">{reporte.escuela}</td>
                <td className="border p-2">{reporte.fecha}</td>
                <td className="border p-2">{reporte.asistencia}</td>
                <td className="border p-2">{reporte.calificacion}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center p-4">No hay reportes disponibles</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4 flex gap-2">
        <button onClick={exportToExcel} className="bg-green-500 text-white px-4 py-2 rounded">Exportar a Excel</button>
        <button onClick={previewPDF} className="bg-blue-500 text-white px-4 py-2 rounded">Ver PDF</button>
      </div>
    </div>
  );
};

export default ReportesPage;
