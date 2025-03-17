import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { db } from "../firebaseConfig";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import "./CalendarStyles.css";

const localizer = momentLocalizer(moment);

const eventColors = {
  meeting: "#1E90FF",
  exam: "#FF4500",
  reminder: "#32CD32",
  default: "#8A2BE2",
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "", type: "default" });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsCollection = await getDocs(collection(db, "events"));
        const eventsData = eventsCollection.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            start: new Date(data.start),
            end: new Date(data.end),
            type: data.type || "default",
          };
        });
        setEvents(eventsData);
      } catch (error) {
        console.error("Error al obtener eventos:", error);
      }
    };
    fetchEvents();
  }, []);

  const handleAddOrUpdateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;
    if (selectedEvent) {
      const eventRef = doc(db, "events", selectedEvent.id);
      await updateDoc(eventRef, newEvent);
      setEvents(events.map(event => (event.id === selectedEvent.id ? { ...event, ...newEvent } : event)));
    } else {
      const docRef = await addDoc(collection(db, "events"), newEvent);
      setEvents([...events, { ...newEvent, id: docRef.id }]);
    }
    setShowForm(false);
    setNewEvent({ title: "", start: "", end: "", type: "default" });
    setSelectedEvent(null);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    await deleteDoc(doc(db, "events", selectedEvent.id));
    setEvents(events.filter(event => event.id !== selectedEvent.id));
    setShowForm(false);
    setSelectedEvent(null);
  };

  const eventStyleGetter = (event) => {
    const backgroundColor = eventColors[event.type] || eventColors.default;
    return {
      style: {
        backgroundColor,
        color: "#fff",
        borderRadius: "5px",
        padding: "5px",
      },
    };
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Calendario</h2>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() => { setShowForm(true); setSelectedEvent(null); setNewEvent({ title: "", start: "", end: "", type: "default" }); }}
      >
        Agregar Evento
      </button>
      {showForm && (
        <div className="mb-4 p-4 border rounded bg-gray-100">
          <input
            type="text"
            placeholder="Título"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            className="block mb-2 p-2 border rounded w-full"
          />
          <input
            type="datetime-local"
            value={newEvent.start}
            onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
            className="block mb-2 p-2 border rounded w-full"
          />
          <input
            type="datetime-local"
            value={newEvent.end}
            onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
            className="block mb-2 p-2 border rounded w-full"
          />
          <select
            value={newEvent.type}
            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
            className="block mb-2 p-2 border rounded w-full"
          >
            <option value="default">General</option>
            <option value="meeting">Reunión</option>
            <option value="exam">Examen</option>
            <option value="reminder">Recordatorio</option>
          </select>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={handleAddOrUpdateEvent}
          >
            {selectedEvent ? "Actualizar" : "Guardar"} Evento
          </button>
          {selectedEvent && (
            <button
              className="ml-2 px-4 py-2 bg-red-500 text-white rounded"
              onClick={handleDeleteEvent}
            >
              Eliminar Evento
            </button>
          )}
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => {
          setSelectedEvent(event);
          setNewEvent(event);
          setShowForm(true);
        }}
      />
    </div>
  );
};

export default CalendarPage;
