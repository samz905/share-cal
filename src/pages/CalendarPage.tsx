
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { EventSidebar } from "@/components/calendar/EventSidebar";
import { EventDialog } from "@/components/calendar/EventDialog";
import { useCalendarStore } from "@/stores/calendarStore";
import { Event, CalendarView } from "@/types/calendar";

const CalendarPage = () => {
  const { calendarId } = useParams<{ calendarId: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { events, loadCalendar, addEvent, updateEvent, deleteEvent } = useCalendarStore();

  useEffect(() => {
    if (calendarId) {
      loadCalendar(calendarId);
    }
  }, [calendarId, loadCalendar]);

  const handleCreateEvent = (date?: Date) => {
    setSelectedEvent(null);
    setSelectedDate(date || null);
    setIsEventDialogOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setSelectedDate(null);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (eventData: Partial<Event>) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent({
        id: Date.now().toString(),
        title: eventData.title || "",
        description: eventData.description || "",
        startDate: eventData.startDate || selectedDate || new Date(),
        endDate: eventData.endDate || selectedDate || new Date(),
        category: eventData.category || "default",
        reminder: eventData.reminder
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleEventDelete = (eventId: string) => {
    deleteEvent(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex h-screen">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col">
          <CalendarHeader
            calendarId={calendarId || ""}
            currentDate={currentDate}
            view={view}
            onDateChange={setCurrentDate}
            onViewChange={setView}
            onCreateEvent={() => handleCreateEvent()}
          />
          
          <div className="flex-1 p-4">
            <CalendarGrid
              currentDate={currentDate}
              view={view}
              events={events}
              onDateClick={handleCreateEvent}
              onEventClick={handleEditEvent}
            />
          </div>
        </div>

        {/* Event Sidebar */}
        <EventSidebar
          events={events}
          onEventClick={handleEditEvent}
          onCreateEvent={() => handleCreateEvent()}
        />
      </div>

      {/* Event Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        event={selectedEvent}
        initialDate={selectedDate}
        onSave={handleEventSave}
        onDelete={selectedEvent ? () => handleEventDelete(selectedEvent.id) : undefined}
      />
    </div>
  );
};

export default CalendarPage;
