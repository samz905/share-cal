
import { useState, useEffect } from "react";
import { Event, EventCategory, ReminderTime } from "@/types/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Tag, Bell, Trash2 } from "lucide-react";

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  initialDate?: Date | null;
  onSave: (event: Partial<Event>) => void;
  onDelete?: () => void;
}

export const EventDialog = ({
  isOpen,
  onClose,
  event,
  initialDate,
  onSave,
  onDelete
}: EventDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory>("default");
  const [reminder, setReminder] = useState<ReminderTime>("none");

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || "");
      setStartDate(new Date(event.startDate).toISOString().split("T")[0]);
      setStartTime(new Date(event.startDate).toTimeString().slice(0, 5));
      setEndDate(new Date(event.endDate).toISOString().split("T")[0]);
      setEndTime(new Date(event.endDate).toTimeString().slice(0, 5));
      setCategory(event.category);
      setReminder(event.reminder || "none");
    } else if (initialDate) {
      const date = initialDate.toISOString().split("T")[0];
      setStartDate(date);
      setEndDate(date);
      setStartTime("09:00");
      setEndTime("10:00");
      setTitle("");
      setDescription("");
      setCategory("default");
      setReminder("none");
    } else {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      setStartDate(date);
      setEndDate(date);
      setStartTime("09:00");
      setEndTime("10:00");
      setTitle("");
      setDescription("");
      setCategory("default");
      setReminder("none");
    }
  }, [event, initialDate, isOpen]);

  const handleSave = () => {
    if (!title.trim()) return;

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    onSave({
      title: title.trim(),
      description: description.trim(),
      startDate: startDateTime,
      endDate: endDateTime,
      category,
      reminder
    });
  };

  const categoryOptions: { value: EventCategory; label: string; color: string }[] = [
    { value: "work", label: "Work", color: "bg-blue-100 text-blue-800" },
    { value: "personal", label: "Personal", color: "bg-green-100 text-green-800" },
    { value: "meeting", label: "Meeting", color: "bg-purple-100 text-purple-800" },
    { value: "appointment", label: "Appointment", color: "bg-orange-100 text-orange-800" },
    { value: "holiday", label: "Holiday", color: "bg-red-100 text-red-800" },
    { value: "default", label: "Other", color: "bg-gray-100 text-gray-800" }
  ];

  const reminderOptions: { value: ReminderTime; label: string }[] = [
    { value: "none", label: "No reminder" },
    { value: "15min", label: "15 minutes before" },
    { value: "30min", label: "30 minutes before" },
    { value: "1hour", label: "1 hour before" },
    { value: "1day", label: "1 day before" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>{event ? "Edit Event" : "Create Event"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add event description"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date & Time</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>End Date & Time</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Category</span>
              </Label>
              <Select value={category} onValueChange={(value: EventCategory) => setCategory(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${option.color}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Reminder</span>
              </Label>
              <Select value={reminder} onValueChange={(value: ReminderTime) => setReminder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reminderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {event && onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {event ? "Update" : "Create"} Event
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
