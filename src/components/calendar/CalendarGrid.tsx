
import { Event, CalendarView } from "@/types/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor } from "@/utils/eventUtils";

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const CalendarGrid = ({
  currentDate,
  view,
  events,
  onDateClick,
  onEventClick
}: CalendarGridProps) => {
  const renderMonthView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    const days = [];
    const current = new Date(startOfWeek);
    
    // Generate 6 weeks (42 days) to ensure full month coverage
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = events.filter(event => 
              new Date(event.startDate).toDateString() === day.toDateString()
            );

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !isCurrentMonth ? "bg-gray-50/50 text-gray-400" : ""
                }`}
                onClick={() => onDateClick(day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center" : ""
                }`}>
                  {day.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Badge
                      key={event.id}
                      variant="secondary"
                      className={`text-xs cursor-pointer block truncate ${getCategoryColor(event.category)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {event.title}
                    </Badge>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = events.filter(event => 
              new Date(event.startDate).toDateString() === day.toDateString()
            );

            return (
              <div
                key={index}
                className="min-h-[400px] border-r last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onDateClick(day)}
              >
                <div className={`p-3 border-b bg-gray-50 ${isToday ? "bg-blue-50" : ""}`}>
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {dayNames[index]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday ? "bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center" : ""
                  }`}>
                    {day.getDate()}
                  </div>
                </div>
                
                <div className="p-2 space-y-1">
                  {dayEvents.map((event) => (
                    <Card
                      key={event.id}
                      className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${getCategoryColor(event.category)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="text-sm font-medium truncate">{event.title}</div>
                      <div className="text-xs text-gray-600">
                        {new Date(event.startDate).toLocaleTimeString("en-US", { 
                          hour: "numeric", 
                          minute: "2-digit",
                          hour12: true 
                        })}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {view === "month" ? renderMonthView() : renderWeekView()}
    </div>
  );
};
