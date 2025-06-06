import { EventCategory, Event } from "@/types/calendar";
import { 
  Briefcase, 
  User, 
  Users, 
  Calendar, 
  Gift,
  Tag
} from "lucide-react";

export const getCategoryColor = (category: EventCategory, borderOnly = false) => {
  const colors = {
    work: borderOnly ? "#3b82f6" : "bg-blue-100 text-blue-800 border-blue-200",
    personal: borderOnly ? "#10b981" : "bg-green-100 text-green-800 border-green-200",
    meeting: borderOnly ? "#8b5cf6" : "bg-purple-100 text-purple-800 border-purple-200",
    appointment: borderOnly ? "#f59e0b" : "bg-orange-100 text-orange-800 border-orange-200",
    holiday: borderOnly ? "#ef4444" : "bg-red-100 text-red-800 border-red-200",
    default: borderOnly ? "#6b7280" : "bg-gray-100 text-gray-800 border-gray-200"
  };
  
  return colors[category];
};

export const getCategoryIcon = (category: EventCategory) => {
  const icons = {
    work: Briefcase,
    personal: User,
    meeting: Users,
    appointment: Calendar,
    holiday: Gift,
    default: Tag
  };
  
  return icons[category];
};

/**
 * Check if an event occurs on a specific day (supports multi-day events)
 * @param event The event to check
 * @param day The day to check against
 * @returns true if the event occurs on the given day
 */
export const isEventOnDay = (event: Event, day: Date): boolean => {
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  
  // Reset time to compare only dates
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
  const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
  
  // Check if the day falls within the event's date range (inclusive)
  return dayStart >= eventStartDate && dayStart <= eventEndDate;
};

/**
 * Validate event date range
 * @param startDate The start date
 * @param endDate The end date
 * @returns An object with validation result and error message if invalid
 */
export const validateEventDateRange = (startDate: Date, endDate: Date): { isValid: boolean; errorMessage?: string } => {
  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      isValid: false,
      errorMessage: "Please enter valid start and end dates and times."
    };
  }

  // Check if end date is after start date
  if (endDate <= startDate) {
    return {
      isValid: false,
      errorMessage: "The end date and time must be after the start date and time."
    };
  }

  return { isValid: true };
};
