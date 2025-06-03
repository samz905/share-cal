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
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { isEventOnDay } from '@/utils/eventUtils';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface CalendarStore extends CalendarState {
  loadCalendar: (calendarId: string) => Promise<boolean>;
  createCalendarIfNeeded: (calendarId: string) => Promise<boolean>;
  addEvent: (event: Event) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventsForDate: (date: Date) => Event[];
  isLoading: boolean;
  // Real-time methods
  subscribeToEvents: (calendarId: string) => void;
  unsubscribeFromEvents: () => void;
  subscription: any;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  currentCalendarId: null,
  isLoading: false,
  subscription: null,

  loadCalendar: async (calendarId: string) => {
    set({ isLoading: true });
    
    try {
      console.log("Loading calendar:", calendarId);
      
      // Unsubscribe from previous calendar if any
      const state = get();
      if (state.subscription) {
        state.unsubscribeFromEvents();
      }
      
      // Check if calendar exists
      const exists = await checkCalendarExists(calendarId);
      console.log("Calendar exists:", exists);
      
      if (!exists) {
        console.log("Creating new calendar:", calendarId);
        const created = await createCalendarInDb(calendarId);
        if (!created) {
          throw new Error("Failed to create calendar");
        }
      }
      
      // Fetch events
      console.log("Fetching events for calendar:", calendarId);
      const events = await fetchEvents(calendarId);
      console.log("Loaded events:", events.length);
      
      set({ 
        events, 
        currentCalendarId: calendarId,
        isLoading: false 
      });
      
      // Subscribe to real-time updates
      get().subscribeToEvents(calendarId);
      
      return true;
    } catch (error) {
      console.error("Error loading calendar:", error);
      set({ isLoading: false });
      
      toast({
        title: "Failed to load calendar",
        description: "There was an error connecting to your calendar. Please check your connection and try again.",
        variant: "destructive"
      });
      
      return false;
    }
  },

  subscribeToEvents: (calendarId: string) => {
    console.log("Setting up real-time subscription for calendar:", calendarId);
    
    const subscription = supabase
      .channel(`calendar-${calendarId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `calendar_id=eq.${calendarId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log("Real-time event received:", payload);
          
          const state = get();
          
          switch (payload.eventType) {
            case 'INSERT':
              // New event added
              if (payload.new) {
                const newEvent: Event = {
                  id: payload.new.id,
                  title: payload.new.title,
                  description: payload.new.description || "",
                  startDate: new Date(payload.new.start_date),
                  endDate: new Date(payload.new.end_date),
                  category: payload.new.category as any,
                  reminder: payload.new.reminder as any
                };
                
                // Check if event already exists (to avoid duplicates from our own actions)
                const existingEvent = state.events.find(e => e.id === newEvent.id);
                if (!existingEvent) {
                  set({ events: [...state.events, newEvent] });
                  
                  // Only show notification if this seems to be from another user
                  // (We can enhance this later with user tracking)
                  console.log("New event added via real-time:", newEvent.title);
                }
              }
              break;
              
            case 'UPDATE':
              // Event updated
              if (payload.new) {
                const updatedEvent: Event = {
                  id: payload.new.id,
                  title: payload.new.title,
                  description: payload.new.description || "",
                  startDate: new Date(payload.new.start_date),
                  endDate: new Date(payload.new.end_date),
                  category: payload.new.category as any,
                  reminder: payload.new.reminder as any
                };
                
                const newEvents = state.events.map(event => 
                  event.id === updatedEvent.id ? updatedEvent : event
                );
                
                set({ events: newEvents });
                
                console.log("Event updated via real-time:", updatedEvent.title);
              }
              break;
              
            case 'DELETE':
              // Event deleted
              if (payload.old) {
                const deletedEventId = payload.old.id;
                const deletedEvent = state.events.find(e => e.id === deletedEventId);
                
                const newEvents = state.events.filter(event => event.id !== deletedEventId);
                set({ events: newEvents });
                
                if (deletedEvent) {
                  console.log("Event deleted via real-time:", deletedEvent.title);
                }
              }
              break;
          }
        }
      )
      .subscribe();
    
    set({ subscription });
  },

  unsubscribeFromEvents: () => {
    const state = get();
    if (state.subscription) {
      console.log("Unsubscribing from real-time events");
      supabase.removeChannel(state.subscription);
      set({ subscription: null });
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
    
    if (!calendarId) {
      console.error("No calendar ID available");
      toast({
        title: "Calendar not loaded",
        description: "Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Adding event to calendar:", calendarId, event);
      const eventId = await addEventToDb(calendarId, event);
      
      if (eventId) {
        // Don't add to local state here - let real-time subscription handle it
        // This prevents duplicate events when the real-time update comes in
        console.log("Event created successfully, real-time will update the UI");
      } else {
        console.error("Failed to create event - no eventId returned");
        toast({
          title: "Failed to add event",
          description: "The event could not be created. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error adding event:", error);
      toast({
        title: "Failed to add event",
        description: "There was an error adding your event. Please check your internet connection and try again.",
        variant: "destructive"
      });
    }
  },

  updateEvent: async (eventId: string, updates: Partial<Event>) => {
    try {
      const success = await updateEventInDb(eventId, updates);
      
      if (success) {
        // Don't update local state here - let real-time subscription handle it
        console.log("Event updated successfully, real-time will update the UI");
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
    try {
      const success = await deleteEventFromDb(eventId);
      
      if (success) {
        // Don't update local state here - let real-time subscription handle it
        console.log("Event deleted successfully, real-time will update the UI");
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
    return state.events.filter(event => isEventOnDay(event, date));
  }
}));
