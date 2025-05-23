import { create } from 'zustand';
import { Event, CalendarState } from '@/types/calendar';
import { 
  fetchEvents, 
  addEvent as addEventToDb, 
  updateEvent as updateEventInDb,
  deleteEvent as deleteEventFromDb,
  createCalendar as createCalendarInDb,
  checkCalendarExists
} from '@/integrations/supabase/calendarApi';
import { toast } from '@/hooks/use-toast';

interface CalendarStore extends CalendarState {
  loadCalendar: (calendarId: string) => Promise<boolean>;
  createCalendarIfNeeded: (calendarId: string) => Promise<boolean>;
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventsForDate: (date: Date) => Event[];
  isLoading: boolean;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  currentCalendarId: null,
  isLoading: false,

  loadCalendar: async (calendarId: string) => {
    set({ isLoading: true });
    
    try {
      // Check if calendar exists
      const exists = await checkCalendarExists(calendarId);
      if (!exists) {
        await createCalendarInDb(calendarId);
      }
      
      // Fetch events
      const events = await fetchEvents(calendarId);
      
      set({ 
        events, 
        currentCalendarId: calendarId,
        isLoading: false 
      });
      
      return true;
    } catch (error) {
      console.error("Error loading calendar:", error);
      set({ isLoading: false });
      return false;
    }
  },

  createCalendarIfNeeded: async (calendarId: string) => {
    const exists = await checkCalendarExists(calendarId);
    if (!exists) {
      return await createCalendarInDb(calendarId);
    }
    return true;
  },

  addEvent: async (event: Event) => {
    const state = get();
    const calendarId = state.currentCalendarId;
    
    if (!calendarId) return;
    
    try {
      const eventId = await addEventToDb(calendarId, event);
      
      if (eventId) {
        const newEvent = { ...event, id: eventId };
        set({ events: [...state.events, newEvent] });
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Failed to add event",
        description: "There was an error adding your event. Please try again.",
        variant: "destructive"
      });
    }
  },

  updateEvent: async (eventId: string, updates: Partial<Event>) => {
    const state = get();
    
    try {
      const success = await updateEventInDb(eventId, updates);
      
      if (success) {
        const newEvents = state.events.map(event => 
          event.id === eventId ? { ...event, ...updates } : event
        );
        
        set({ events: newEvents });
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Failed to update event",
        description: "There was an error updating your event. Please try again.",
        variant: "destructive"
      });
    }
  },

  deleteEvent: async (eventId: string) => {
    const state = get();
    
    try {
      const success = await deleteEventFromDb(eventId);
      
      if (success) {
        const newEvents = state.events.filter(event => event.id !== eventId);
        set({ events: newEvents });
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        title: "Failed to delete event",
        description: "There was an error deleting your event. Please try again.",
        variant: "destructive"
      });
    }
  },

  getEventsForDate: (date: Date) => {
    const state = get();
    return state.events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  }
}));
