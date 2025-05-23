
import { create } from 'zustand';
import { Event, CalendarState } from '@/types/calendar';

interface CalendarStore extends CalendarState {
  loadCalendar: (calendarId: string) => void;
  addEvent: (event: Event) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  deleteEvent: (eventId: string) => void;
  getEventsForDate: (date: Date) => Event[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  currentCalendarId: null,

  loadCalendar: (calendarId: string) => {
    // Load calendar data from localStorage or API
    const storageKey = `calendar-${calendarId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const events = parsedData.events?.map((event: any) => ({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate)
      })) || [];
      
      set({ events, currentCalendarId: calendarId });
    } else {
      set({ events: [], currentCalendarId: calendarId });
    }
  },

  addEvent: (event: Event) => {
    const state = get();
    const newEvents = [...state.events, event];
    
    set({ events: newEvents });
    
    // Save to localStorage
    if (state.currentCalendarId) {
      localStorage.setItem(`calendar-${state.currentCalendarId}`, JSON.stringify({
        events: newEvents
      }));
    }
  },

  updateEvent: (eventId: string, updates: Partial<Event>) => {
    const state = get();
    const newEvents = state.events.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    );
    
    set({ events: newEvents });
    
    // Save to localStorage
    if (state.currentCalendarId) {
      localStorage.setItem(`calendar-${state.currentCalendarId}`, JSON.stringify({
        events: newEvents
      }));
    }
  },

  deleteEvent: (eventId: string) => {
    const state = get();
    const newEvents = state.events.filter(event => event.id !== eventId);
    
    set({ events: newEvents });
    
    // Save to localStorage
    if (state.currentCalendarId) {
      localStorage.setItem(`calendar-${state.currentCalendarId}`, JSON.stringify({
        events: newEvents
      }));
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
