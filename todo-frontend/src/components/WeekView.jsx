import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { getCalendarEvents, createEvent, updateEvent, deleteEvent, addParticipant } from "../api/AxiosAuth"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { useState } from "react"
import { toast } from "sonner"
export default function WeekView({ selectedDate, events, onEventDrag, projects = [], onUpdateEvent, onDeleteEvent }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const weekStart = startOfWeek(selectedDate)
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

  const getEventsForDay = (date) => {
    return events.filter(event =>{
      const eventDate = event.start_time? new Date(event.start_time) : new Date(event.date ? new Date(event.date) : null)
      return eventDate && isSameDay(eventDate, date)
    })
  }

  const handleDragStart = (e, event) => {
    e.dataTransfer.setData('text/plain', event.id.toString())
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, date) => {
    e.preventDefault()
    const eventId = parseInt(e.dataTransfer.getData('text/plain'))
    if (eventId) {
      onEventDrag(eventId, date)
    }
  }
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        let start, end;
        if (view === 'month') {
          start = startOfMonth(currentMonth);
          end = endOfMonth(currentMonth);
        } else if (view === 'week') {
          start = startOfWeek(selectedDate);
          end = endOfWeek(selectedDate);
        } else {
          start = selectedDate;
          end = selectedDate;
        }
        
        const response = await getCalendarEvents(
          format(start, 'yyyy-MM-dd'),
          format(end, 'yyyy-MM-dd')
        );
        setEvents(Array.isArray(response.data) ? response.data : response.data.results || []);
      } catch (err) {
        setError('Failed to fetch events');
        toast.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteEvent = async (eventId) => {
      try {
        await deleteEvent(eventId);
        toast.success("Event deleted successfully");
        // alert("Event deleted successfully");
        setSelectedEvent(null);
        fetchEvents();
      } catch (error) {
        toast.error("Failed to delete event");
      }
    };
  
  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;
    try {
      await updateEvent(selectedEvent.id, {
        title: selectedEvent.title,
        description: selectedEvent.description,
        event_type: selectedEvent.type || selectedEvent.event_type,
        start_time: selectedEvent.start_time,
        end_time: selectedEvent.end_time,
        location: selectedEvent.location,
        project: selectedEvent.project,
      });
      toast.success("Event updated");
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event");
    }
  };

  return (
    <Card className="w-full max-w-[100vw] mx-auto">
      <CardHeader>
        <CardTitle>Week View</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-4 min-w-[100%]">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="border rounded-lg p-2 sm:p-4 min-h-[150px] sm:min-h-[200px] bg-white"
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="font-medium text-sm sm:text-base">{format(day, 'EEE')}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">{format(day, 'dd')}</div>
              <div className="mt-2 space-y-1">
                {getEventsForDay(day).map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onClick={() => setSelectedEvent(event)}
                    className={`p-2 text-xs sm:text-sm rounded-md cursor-pointer ${
                      event.type === 'task' ? 'bg-blue-100' : event.event_type === 'milestone' ? 'bg-green-100' : 'bg-purple-100'
                    }`}
                  >
                    <div className="font-medium truncate">{event.title} - {event.created_by.username}</div>
                    <div className="text-xs text-muted-foreground">
                      timing - {
                        event.start_time ? format(new Date(event.start_time), 'HH:mm') :
                        event.date ? format(new Date(event.date), 'dd MMM') : ''
                      }
                    </div>
                    {event.type === 'task' && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={open => { if (!open) setSelectedEvent(null); }}>
            <DialogContent className="gap-0 max-w-[90vw] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">Title</Label>
                  <Input
                    id="title"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date" className="text-sm sm:text-base">Started Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedEvent.start_time ? format(new Date(selectedEvent.start_time), "yyyy-MM-dd") : ""}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, start_time: new Date(e.target.value).toISOString() })}
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-sm sm:text-base">Type</Label>
                  <Select
                    value={selectedEvent.event_type}
                    onValueChange={(value) => setSelectedEvent({ ...selectedEvent, event_type: value })}
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm26sm:text-base">Description</Label>
                  <Input
                    id="description"
                    value={selectedEvent.description}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    placeholder="Event description"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSelectedEvent(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateEvent}
                  className="w-full sm:w-auto"
                >
                  Update Event
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEvent}
                  className="w-full sm:w-auto"
                >
                  Delete Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}