import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Plus, Share2, Copy, Home } from "lucide-react";
import { CalendarView } from "@/types/calendar";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface CalendarHeaderProps {
  calendarId: string;
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onCreateEvent: () => void;
}

export const CalendarHeader = ({
  calendarId,
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onCreateEvent
}: CalendarHeaderProps) => {
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/calendar/${calendarId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Calendar link has been copied to your clipboard.",
    });
  };

  const formatDateHeader = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Shared Calendar</h1>
          </div>
          
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            {calendarId.slice(0, 8)}...
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden md:flex"
          >
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              New Calendar
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            className="md:hidden"
          >
            <Link to="/">
              <Home className="w-4 h-4" />
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            className="hidden sm:flex"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyShareLink}
            className="sm:hidden"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            onClick={onCreateEvent}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          
          <h2 className="text-lg font-medium text-gray-900">
            {formatDateHeader()}
          </h2>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["month", "week"] as CalendarView[]).map((viewOption) => {
            const isActive = view === viewOption;
            return (
              <Button
                key={viewOption}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(viewOption)}
                className={
                  isActive
                    ? "bg-white text-gray-900 shadow-sm cursor-default hover:bg-white hover:text-gray-900"
                    : "hover:bg-gray-200 hover:text-gray-900"
                }
                disabled={isActive}
              >
                {viewOption.charAt(0).toUpperCase() + viewOption.slice(1)}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
