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

// Helper function to get consistent event styles
const getEventStyles = (category: string) => {
  const colorMap = {
    work: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
    personal: { bg: '#dcfce7', text: '#166534', border: '#10b981' },
    meeting: { bg: '#f3e8ff', text: '#5b21b6', border: '#8b5cf6' },
    appointment: { bg: '#fed7aa', text: '#9a3412', border: '#f59e0b' },
    holiday: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
    default: { bg: '#f3f4f6', text: '#374151', border: '#6b7280' }
  };
  return colorMap[category as keyof typeof colorMap] || colorMap.default;
};

export const CalendarGrid = ({
  currentDate,
  view,
  events,
  onDateClick,
  onEventClick
}: CalendarGridProps) => {
  // Helper function to check if an event occurs on a specific date
  const isEventOnDate = (event: Event, date: Date) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const checkDate = new Date(date);
    
    // Set time to midnight for date comparison
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(23, 59, 59, 999);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate >= eventStart && checkDate <= eventEnd;
  };

  // Helper function to determine event position in multi-day span
  const getEventPosition = (event: Event, date: Date) => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const checkDate = new Date(date);
    
    eventStart.setHours(0, 0, 0, 0);
    eventEnd.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    
    const isStart = checkDate.getTime() === eventStart.getTime();
    const isEnd = checkDate.getTime() === eventEnd.getTime();
    const isMiddle = !isStart && !isEnd;
    
    return { isStart, isEnd, isMiddle };
  };

  // Helper function to determine if an event spans multiple days
  const isMultiDayEvent = (event: Event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return start.getTime() !== end.getTime();
  };

  // Function to create layout for single-day events only
  const createSingleDayEventLayout = (days: Date[]) => {
    const layout: { [dayKey: string]: { event: Event; row: number }[] } = {};
    
    days.forEach(day => {
      const dayKey = day.toDateString();
      layout[dayKey] = [];
      
      const singleDayEvents = events.filter(event => 
        isEventOnDate(event, day) && !isMultiDayEvent(event)
      );
      
      singleDayEvents.forEach((event, index) => {
        if (index < 3) {
          layout[dayKey].push({ event, row: index });
        }
      });
    });
    
    return layout;
  };

  // Function to create layout for multi-day events
  const createMultiDayEventLayout = (days: Date[]) => {
    const multiDayEvents = events.filter(isMultiDayEvent);
    const eventRows: { event: Event; row: number; startCol: number; span: number }[] = [];
    
    multiDayEvents.forEach(event => {
      // Find start and end positions in the grid
      const startIndex = days.findIndex(day => {
        const dayStart = new Date(day);
        const eventStart = new Date(event.startDate);
        dayStart.setHours(0, 0, 0, 0);
        eventStart.setHours(0, 0, 0, 0);
        return dayStart.getTime() === eventStart.getTime();
      });
      
      const endIndex = days.findIndex(day => {
        const dayEnd = new Date(day);
        const eventEnd = new Date(event.endDate);
        dayEnd.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        return dayEnd.getTime() === eventEnd.getTime();
      });
      
      if (startIndex !== -1 && endIndex !== -1) {
        const span = endIndex - startIndex + 1;
        
        // Find available row
        let row = 0;
        while (row < 3) {
          const hasConflict = eventRows.some(existing => 
            existing.row === row &&
            !(startIndex >= existing.startCol + existing.span || startIndex + span <= existing.startCol)
          );
          
          if (!hasConflict) break;
          row++;
        }
        
        if (row < 3) {
          eventRows.push({
            event,
            row,
            startCol: startIndex,
            span
          });
        }
      }
    });
    
    return eventRows;
  };

  // Function to create a consistent layout for events across multiple days
  const createEventLayout = (days: Date[]) => {
    const layout: { [dayKey: string]: { event: Event; position: ReturnType<typeof getEventPosition>; row: number }[] } = {};
    const eventRowMap = new Map<string, number>();
    
    // First pass: assign row numbers to multi-day events to maintain continuity
    events.forEach(event => {
      const eventDays = days.filter(day => isEventOnDate(event, day));
      if (eventDays.length > 0 && !eventRowMap.has(event.id)) {
        // Find the first available row across all days this event spans
        let row = 0;
        let rowAvailable = false;
        
        while (!rowAvailable && row < 3) {
          rowAvailable = eventDays.every(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            return !layout[dayKey].some(item => item.row === row);
          });
          
          if (!rowAvailable) row++;
        }
        
        if (row < 3) {
          eventRowMap.set(event.id, row);
          
          // Reserve this row for all days this event spans
          eventDays.forEach(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            layout[dayKey].push({
              event,
              position: getEventPosition(event, day),
              row
            });
          });
        }
      }
    });
    
    // Second pass: fill remaining slots with single-day events
    days.forEach(day => {
      const dayKey = day.toDateString();
      if (!layout[dayKey]) layout[dayKey] = [];
      
      const dayEvents = events.filter(event => 
        isEventOnDate(event, day) && !eventRowMap.has(event.id)
      );
      
      dayEvents.forEach(event => {
        // Find first available row
        let row = 0;
        while (row < 3 && layout[dayKey].some(item => item.row === row)) {
          row++;
        }
        
        if (row < 3) {
          layout[dayKey].push({
            event,
            position: getEventPosition(event, day),
            row
          });
        }
      });
      
      // Sort by row for consistent display
      layout[dayKey].sort((a, b) => a.row - b.row);
    });
    
    return layout;
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
    
    // Create layout that assigns consistent rows to multi-day events
    const layout: { [dayKey: string]: { event: Event; position: ReturnType<typeof getEventPosition>; row: number }[] } = {};
    const eventRowMap = new Map<string, number>();
    
    // First pass: assign row numbers to events to maintain continuity
    events.forEach(event => {
      const eventDays = days.filter(day => isEventOnDate(event, day));
      if (eventDays.length > 0 && !eventRowMap.has(event.id)) {
        // Find the first available row across all days this event spans
        let row = 0;
        let rowAvailable = false;
        
        while (!rowAvailable && row < 3) {
          rowAvailable = eventDays.every(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            return !layout[dayKey].some(item => item.row === row);
          });
          
          if (!rowAvailable) row++;
        }
        
        if (row < 3) {
          eventRowMap.set(event.id, row);
          
          // Reserve this row for all days this event spans
          eventDays.forEach(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            layout[dayKey].push({
              event,
              position: getEventPosition(event, day),
              row
            });
          });
        }
      }
    });

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
            const dayKey = day.toDateString();
            const dayLayout = layout[dayKey] || [];
            const totalEventsOnDay = events.filter(event => isEventOnDate(event, day)).length;

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
                  {/* Render events in their assigned rows */}
                  {[0, 1, 2].map(rowIndex => {
                    const eventInRow = dayLayout.find(item => item.row === rowIndex);
                    
                    if (eventInRow) {
                      const { event, position } = eventInRow;
                      const baseColor = getCategoryColor(event.category);
                      const eventStyles = getEventStyles(event.category);
                      
                      return (
                        <div
                          key={`${event.id}-${day.toDateString()}-${rowIndex}`}
                          className="relative"
                          style={{
                            marginLeft: position.isStart ? '0' : '-8px',
                            marginRight: position.isEnd ? '0' : '-8px',
                            zIndex: 10
                          }}
                        >
                          <Badge
                            variant="secondary"
                            className={`text-xs cursor-pointer block truncate h-5 flex items-center hover:opacity-80 transition-opacity border ${
                              position.isStart && position.isEnd ? "rounded-md" : 
                              position.isStart ? "rounded-l-md rounded-r-none" : 
                              position.isEnd ? "rounded-r-md rounded-l-none" :
                              position.isMiddle ? "rounded-none" : "rounded-md"
                            }`}
                            style={{
                              backgroundColor: eventStyles.bg,
                              color: eventStyles.text,
                              borderColor: eventStyles.border,
                              borderLeftStyle: position.isStart || (!position.isMiddle && !position.isEnd) ? 'solid' : 'none',
                              borderRightStyle: position.isEnd || (!position.isMiddle && !position.isStart) ? 'solid' : 'none',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          >
                            <span className="truncate">
                              {position.isStart || (!position.isMiddle && !position.isEnd) ? event.title : "\u00A0"}
                            </span>
                          </Badge>
                        </div>
                      );
                    }
                    
                    // Empty row placeholder to maintain spacing
                    return (
                      <div key={`empty-${rowIndex}`} className="h-5"></div>
                    );
                  })}
                  
                  {totalEventsOnDay > 3 && (
                    <div className="text-xs text-gray-500 h-5 flex items-center justify-center">
                      +{totalEventsOnDay - 3} more
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

    // Create layout that assigns consistent rows to events (same logic as month view)
    const layout: { [dayKey: string]: { event: Event; position: ReturnType<typeof getEventPosition>; row: number }[] } = {};
    const eventRowMap = new Map<string, number>();
    
    // First pass: assign row numbers to events to maintain continuity
    events.forEach(event => {
      const eventDays = days.filter(day => isEventOnDate(event, day));
      if (eventDays.length > 0 && !eventRowMap.has(event.id)) {
        // Find the first available row across all days this event spans
        let row = 0;
        let rowAvailable = false;
        
        while (!rowAvailable && row < 10) { // Allow more rows in week view
          rowAvailable = eventDays.every(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            return !layout[dayKey].some(item => item.row === row);
          });
          
          if (!rowAvailable) row++;
        }
        
        if (row < 10) {
          eventRowMap.set(event.id, row);
          
          // Reserve this row for all days this event spans
          eventDays.forEach(day => {
            const dayKey = day.toDateString();
            if (!layout[dayKey]) layout[dayKey] = [];
            layout[dayKey].push({
              event,
              position: getEventPosition(event, day),
              row
            });
          });
        }
      }
    });

    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const dayKey = day.toDateString();
            const dayLayout = layout[dayKey] || [];
            const maxRow = dayLayout.length > 0 ? Math.max(...dayLayout.map(item => item.row)) : -1;
            const totalEventsOnDay = events.filter(event => isEventOnDate(event, day)).length;

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
                  {/* Render events in their assigned rows, limited to first 5 rows */}
                  {Array.from({ length: Math.min(Math.max(maxRow + 1, 0), 5) }, (_, rowIndex) => {
                    const eventInRow = dayLayout.find(item => item.row === rowIndex);
                    
                    if (eventInRow) {
                      const { event, position } = eventInRow;
                      const baseColor = getCategoryColor(event.category);
                      const eventStyles = getEventStyles(event.category);
                      
                      return (
                        <div
                          key={`${event.id}-${day.toDateString()}-${rowIndex}`}
                          className="relative"
                          style={{
                            marginLeft: position.isStart ? '0' : '-8px',
                            marginRight: position.isEnd ? '0' : '-8px',
                            zIndex: 10
                          }}
                        >
                          <Card
                            className={`p-2 cursor-pointer hover:opacity-80 transition-opacity min-h-[4rem] flex flex-col justify-center ${
                              position.isStart && position.isEnd ? "rounded-lg" : 
                              position.isStart ? "rounded-l-lg rounded-r-none" : 
                              position.isEnd ? "rounded-r-lg rounded-l-none" :
                              position.isMiddle ? "rounded-none" : "rounded-lg"
                            }`}
                            style={{
                              backgroundColor: eventStyles.bg,
                              color: eventStyles.text,
                              borderColor: eventStyles.border,
                              borderLeftStyle: position.isStart || (!position.isMiddle && !position.isEnd) ? 'solid' : 'none',
                              borderRightStyle: position.isEnd || (!position.isMiddle && !position.isStart) ? 'solid' : 'none',
                              borderTopStyle: 'solid',
                              borderBottomStyle: 'solid',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick(event);
                            }}
                          >
                            <div className="text-sm font-medium truncate h-5 flex items-center">
                              {position.isStart || (!position.isMiddle && !position.isEnd) ? event.title : "\u00A0"}
                            </div>
                            <div className="text-xs opacity-75 h-4 flex items-center">
                              {(position.isStart || (!position.isMiddle && !position.isEnd)) ? (
                                new Date(event.startDate).toLocaleTimeString("en-US", { 
                                  hour: "numeric", 
                                  minute: "2-digit",
                                  hour12: true 
                                })
                              ) : "\u00A0"}
                            </div>
                          </Card>
                        </div>
                      );
                    }
                    
                    // Empty row placeholder to maintain spacing and alignment
                    return (
                      <div key={`empty-${rowIndex}`} className="min-h-[4rem]"></div>
                    );
                  })}
                  
                  {totalEventsOnDay > 5 && (
                    <div className="text-xs text-gray-500 h-5 flex items-center justify-center">
                      +{totalEventsOnDay - 5} more
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

  return (
    <div className="mb-0.7">
      {view === "month" ? renderMonthView() : renderWeekView()}
    </div>
  );
};