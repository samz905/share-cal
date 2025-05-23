
export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  category: EventCategory;
  reminder?: ReminderTime;
}

export type EventCategory = 
  | "work" 
  | "personal" 
  | "meeting" 
  | "appointment" 
  | "holiday" 
  | "default";

export type ReminderTime = 
  | "none"
  | "15min" 
  | "30min" 
  | "1hour" 
  | "1day";

export type CalendarView = "month" | "week" | "day";

export interface CalendarState {
  events: Event[];
  currentCalendarId: string | null;
}
