import { supabase } from "./client";
import { Event } from "@/types/calendar";

// Create a new calendar
export const createCalendar = async (calendarId: string) => {
  try {
    const { error } = await supabase
      .from("calendars")
      .insert({ calendar_id: calendarId });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error creating calendar:", error);
    return false;
  }
};

// Check if calendar exists
export const checkCalendarExists = async (calendarId: string) => {
  try {
    const { data, error } = await supabase
      .from("calendars")
      .select("calendar_id")
      .eq("calendar_id", calendarId)
      .single();
    
    if (error) return false;
    return !!data;
  } catch (error) {
    console.error("Error checking calendar:", error);
    return false;
  }
};

// Fetch events for a calendar
export const fetchEvents = async (calendarId: string): Promise<Event[]> => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("calendar_id", calendarId);
    
    if (error) throw error;
    
    return (data || []).map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      category: event.category as any,
      reminder: event.reminder as any
    }));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

// Add an event
export const addEvent = async (calendarId: string, event: Event): Promise<string | null> => {
  try {
    console.log("Attempting to add event to Supabase:", { calendarId, event });
    
    const { data, error } = await supabase
      .from("events")
      .insert({
        calendar_id: calendarId,
        title: event.title,
        description: event.description,
        start_date: event.startDate.toISOString(),
        end_date: event.endDate.toISOString(),
        category: event.category,
        reminder: event.reminder
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Supabase error adding event:", error);
      throw error;
    }
    
    console.log("Event added successfully, ID:", data.id);
    return data.id;
  } catch (error) {
    console.error("Error adding event:", error);
    return null;
  }
};

// Update an event
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<boolean> => {
  try {
    const updateData: Record<string, any> = {};
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate.toISOString();
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate.toISOString();
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.reminder !== undefined) updateData.reminder = updates.reminder;
    
    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", eventId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating event:", error);
    return false;
  }
};

// Delete an event
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    return false;
  }
};
