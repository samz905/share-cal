
import { EventCategory } from "@/types/calendar";
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
