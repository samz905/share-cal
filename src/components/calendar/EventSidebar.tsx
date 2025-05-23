
import { useState } from "react";
import { Event } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock } from "lucide-react";
import { getCategoryColor, getCategoryIcon } from "@/utils/eventUtils";

interface EventSidebarProps {
  events: Event[];
  onEventClick: (event: Event) => void;
  onCreateEvent: () => void;
}

export const EventSidebar = ({ events, onEventClick, onCreateEvent }: EventSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const today = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 10);

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white/80 backdrop-blur-sm border-l border-gray-200 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="w-full"
        >
          <Calendar className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(true)}
          className="lg:hidden"
        >
          ×
        </Button>
      </div>

      <Button
        onClick={onCreateEvent}
        className="w-full mb-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Event
      </Button>

      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No upcoming events</p>
              <p className="text-xs text-gray-400 mt-1">Click + to create your first event</p>
            </CardContent>
          </Card>
        ) : (
          upcomingEvents.map((event) => {
            const Icon = getCategoryIcon(event.category);
            return (
              <Card
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
                style={{ borderLeftColor: getCategoryColor(event.category, true) }}
                onClick={() => onEventClick(event)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-lg ${getCategoryColor(event.category)}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {event.title}
                      </h4>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit"
                        })}
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <Badge
                        variant="outline"
                        className={`mt-2 text-xs ${getCategoryColor(event.category)}`}
                      >
                        {event.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
