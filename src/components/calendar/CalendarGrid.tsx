import { Event, CalendarView } from "@/types/calendar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor, isEventOnDay } from "@/utils/eventUtils";

interface CalendarGridProps {
  currentDate: Date;
  view: CalendarView;
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

interface EventSpan {
  event: Event;
  startCol: number;
  endCol: number;
  row: number;
}

export const CalendarGrid = ({
  currentDate,
  view,
  events,
  onDateClick,
  onEventClick
}: CalendarGridProps) => {
  // Helper function to get the day position in a week (0-6)
  const getDayPosition = (date: Date): number => {
    return date.getDay();
  };

  // Helper function to calculate event spans for a week
  const calculateEventSpans = (weekDays: Date[]): EventSpan[] => {
    const eventSpans: EventSpan[] = [];
    const processedEvents = new Set<string>();

    events.forEach((event) => {
      if (processedEvents.has(event.id)) return;

      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      // Reset time for date comparison
      const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
      const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());

      // Only process multi-day events (skip single-day events)
      const isSingleDay = eventStartDate.getTime() === eventEndDate.getTime();
      if (isSingleDay) return;

      // Find which days in this week the event spans
      let startCol = -1;
      let endCol = -1;

      weekDays.forEach((day, index) => {
        const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        
        if (dayDate >= eventStartDate && dayDate <= eventEndDate) {
          if (startCol === -1) startCol = index;
          endCol = index;
        }
      });

      if (startCol !== -1) {
        eventSpans.push({
          event,
          startCol,
          endCol,
          row: 0 // We'll calculate proper row later if we want to stack events
        });
        processedEvents.add(event.id);
      }
    });

    return eventSpans;
  };

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

    // Split days into weeks for proper event spanning
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

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

        {/* Calendar Weeks */}
        {weeks.map((weekDays, weekIndex) => {
          const eventSpans = calculateEventSpans(weekDays);
          
          return (
            <div key={weekIndex} className="relative">
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0">
                {weekDays.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  
                  // Get single-day events for this day
                  const singleDayEvents = events.filter(event => {
                    const eventStart = new Date(event.startDate);
                    const eventEnd = new Date(event.endDate);
                    const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                    const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
                    
                    // Only show single-day events that occur on this specific day
                    const isSingleDay = eventStartDate.getTime() === eventEndDate.getTime();
                    const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                    
                    return isSingleDay && dayDate.getTime() === eventStartDate.getTime();
                  });

                  return (
                    <div
                      key={dayIndex}
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
                      
                      {/* Single day events */}
                      <div className="space-y-1 mt-6">
                        {singleDayEvents.slice(0, 2).map((event) => (
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
                        {singleDayEvents.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{singleDayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-day event spans */}
              {eventSpans.map((span, spanIndex) => (
                <div
                  key={`${span.event.id}-${weekIndex}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${(span.startCol / 7) * 100}%`,
                    width: `${((span.endCol - span.startCol + 1) / 7) * 100}%`,
                    top: `${58 + spanIndex * 24}px`, // 58px for header + day number, 24px per event row
                    height: '20px',
                    zIndex: 10
                  }}
                >
                  <div
                    className={`h-full mx-2 rounded-md cursor-pointer pointer-events-auto ${getCategoryColor(span.event.category)} flex items-center px-2 shadow-sm`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(span.event);
                    }}
                  >
                    <span className="text-xs font-medium truncate">
                      {span.event.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
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
    const eventSpans = calculateEventSpans(days);

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="relative">
          {/* Day columns */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              
              // Get single-day events for this day
              const singleDayEvents = events.filter(event => {
                const eventStart = new Date(event.startDate);
                const eventEnd = new Date(event.endDate);
                const eventStartDate = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
                const eventEndDate = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
                
                // Only show single-day events that occur on this specific day
                const isSingleDay = eventStartDate.getTime() === eventEndDate.getTime();
                const dayDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                
                return isSingleDay && dayDate.getTime() === eventStartDate.getTime();
              });

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
                  
                  {/* Single day events */}
                  <div className="p-2 space-y-1 mt-8">
                    {singleDayEvents.map((event) => (
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

          {/* Multi-day event spans for week view */}
          {eventSpans.map((span, spanIndex) => (
            <div
              key={`${span.event.id}-week`}
              className="absolute pointer-events-none"
              style={{
                left: `${(span.startCol / 7) * 100}%`,
                width: `${((span.endCol - span.startCol + 1) / 7) * 100}%`,
                top: `${98 + spanIndex * 32}px`, // 98px for header, 32px per event row
                height: '28px',
                zIndex: 10
              }}
            >
              <div
                className={`h-full mx-2 rounded-md cursor-pointer pointer-events-auto ${getCategoryColor(span.event.category)} flex items-center px-3 shadow-sm`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(span.event);
                }}
              >
                <span className="text-sm font-medium truncate">
                  {span.event.title}
                </span>
              </div>
            </div>
          ))}
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
