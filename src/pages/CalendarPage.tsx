import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { EventSidebar } from "@/components/calendar/EventSidebar";
import { EventDialog } from "@/components/calendar/EventDialog";
import { useCalendarStore } from "@/stores/calendarStore";
import { Event, CalendarView } from "@/types/calendar";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CalendarPage = () => {
  const { calendarId } = useParams<{ calendarId: string }>();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const navigate = useNavigate();
  
  const {
    events,
    loadCalendar,
    addEvent,
    updateEvent,
    deleteEvent,
    isLoading
  } = useCalendarStore();

  useEffect(() => {
    const initCalendar = async () => {
      if (calendarId) {
        const success = await loadCalendar(calendarId);
        if (!success) {
          toast({
            title: "Calendar not found",
            description: "The calendar you're looking for doesn't exist or couldn't be loaded.",
            variant: "destructive"
          });
          navigate("/");
        }
      }
    };
    
    initCalendar();
  }, [calendarId, loadCalendar, navigate]);

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

  const handleEventSave = async (eventData: Partial<Event>) => {
    if (selectedEvent) {
      await updateEvent(selectedEvent.id, eventData);
    } else {
      await addEvent({
        id: "",  // This will be replaced by the server-generated ID
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

  const handleEventDelete = async (eventId: string) => {
    await deleteEvent(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex h-screen">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col h-full">
          <CalendarHeader
            calendarId={calendarId || ""}
            currentDate={currentDate}
            view={view}
            onDateChange={setCurrentDate}
            onViewChange={setView}
            onCreateEvent={() => handleCreateEvent()}
          />
          
          <div className="flex-1 p-4 overflow-auto">
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
