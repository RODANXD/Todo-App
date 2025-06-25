import { useState, useEffect } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { getCalendarEvents, createEvent, updateEvent, deleteEvent, addParticipant } from "../api/AxiosAuth"
import { getProjects } from "../api/AxiosAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Calendar } from "../components/ui/calendar"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { toast } from "react-hot-toast"
import GanttTimeline from "./GanttTimeline"
import WeekView from "./WeekView"
import { useNavigate } from "react-router-dom"
// import { Popover } from "bootstrap"


export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [view, setView] = useState("month")
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [projects, setProjects] = useState([])
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date(),
    type: "",
    project: "",
    description: ""
  })

  useEffect(() => {
    fetchEvents();
    fetchProjects();
  }, [currentMonth, view]);


  const navigate = useNavigate()
  const fetchProjects = async () => {
    try {
      const response = await getProjects();
      setProjects(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      toast.error("Failed to fetch projects");
    }
  };

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

  const handleAddEvent = async () => {
    try {
      if (!newEvent.title || !newEvent.project) {
        toast.error("Title and project are required");
        return;
      }
      const startTime = newEvent.date.toISOString();
      const endTime = new Date(newEvent.date.getTime() + 60 * 60 * 1000).toISOString();
      const formattedEvent = {
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.type,
        start_time: startTime,
        end_time: endTime,
        all_day: false,
        location: "Conference Room", // Optional: add a field for location if needed
        project: parseInt(newEvent.project)
      };
      await createEvent(formattedEvent);
      toast.success("Event created successfully");
      setIsEventModalOpen(false);
      setNewEvent({
        title: "",
        date: new Date(),
        type: "",
        project: "",
        description: ""
      });
      fetchEvents();
    } catch (error) {
      console.error("Create event error:", error);
      console.log("sended data", newEvent);
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  const handleDragEvent = async (eventId, newDate) => {
    try {
      await updateEvent(eventId, { date: format(newDate, 'yyyy-MM-dd') });
      toast.success("Event rescheduled");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to reschedule event");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteEvent(eventId);
      toast.success("Event deleted");
      alert("Event deleted successfully");
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

  // const handleAddParticipant = async (eventId, userId) => {
  //   try {
  //     await addParticipant(eventId, userId);
  //     toast.success("Participant added");
  //     fetchEvents();
  //   } catch (error) {
  //     toast.error("Failed to add participant");
  //   }
  // };

  const getDayEvents = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      if (isNaN(eventDate.getTime())) return false;
      return format(eventDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };
  

  // console.log("Fetched events:", response.data);

  

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View and manage your project deadlines and events</p>
        </div>
        <div className="flex items-center space-x-2">
        <Button onClick={() => setIsEventModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
        <Button onClick={() => navigate("/")} >Back to dashboard</Button>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="month">Month</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          {/* <TabsTrigger value="day">Day</TabsTrigger> */}
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="month" className="mt-4">
          {/* Existing Month View */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {format(currentMonth, "MMMM yyyy")}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center font-semibold py-2">
                      {day}
                    </div>
                  ))}
                  {eachDayOfInterval({
                    start: startOfMonth(currentMonth),
                    end: endOfMonth(currentMonth)
                  }).map((date) => {
                    const dayEvents = getDayEvents(date);
                    // console.log("Day events for", date, ":", dayEvents);
                    return (
                      <div
                        key={date.toISOString()}
                        className={`min-h-[100px] p-1 border rounded-md ${format(date, 'MM') !== format(currentMonth, 'MM') ? 'bg-gray-50' : ''} ${format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'border-blue-500' : ''}`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-right text-sm">{format(date, 'd')}</div>
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`text-xs text-black bg-cyan-600/35 p-1 rounded-md cursor-pointer ${event.type === 'task' ? 'bg-blue-100' : event.type === 'milestone' ? 'bg-green-100' : 'bg-purple-100'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                
                                setSelectedEvent(event);
                                setPopoverAnchor(e.currentTarget);
                                // Handle event click
                              }}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('eventId', event.id)}
                            >
                              <div>{event.title} - {event.created_by.username}</div>
                              {event.project && (
                                <div className="text-[10px] text-gray-500">
                                  {event.project.getTime || `Project #${event.project}`}{event.start_time && ` - ${format(new Date(event.start_time), 'HH:mm')}`}
                                </div>
                              )}
                            </div>
                          ))}
                          
                        </div>
                        
                      </div>
                      
                    );
                    
                  })}
                  {selectedEvent && (
                    <Dialog open={!!selectedEvent} onOpenChange={open => { if (!open) setSelectedEvent(null); }}>

        <DialogContent className="gap-0">
          <DialogHeader>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">{selectedEvent.description}</Label>
              <Input
                id="title"
                value={selectedEvent.title}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Started Date - {format(selectedEvent.start_time, "yyy-MM-dd")}</Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={format(selectedEvent.start_time, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, start_time: new Date(e.target.value).toISOString() })}
                />
                <Input
                  type="time"
                  value={format(selectedEvent.start_time, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const newDate = new Date(selectedEvent.start_time)
                    newDate.setHours(parseInt(hours), parseInt(minutes))
                    setSelectedEvent({ ...selectedEvent, start_time: newDate.toISOString() })
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">End Date - {format(selectedEvent.end_time, "yyy-MM-dd")}</Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={format(selectedEvent.end_time, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedEvent({ ...selectedEvent, end_time: new Date(e.target.value).toISOString() })}
                />
                <Input
                  type="time"
                  value={format(selectedEvent.end_time, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const newDate = new Date(selectedEvent.end_time)
                    newDate.setHours(parseInt(hours), parseInt(minutes))
                    setSelectedEvent({ ...selectedEvent, end_time: newDate.toISOString() })
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={selectedEvent.event_type}
                onValueChange={(value) => setSelectedEvent({ ...selectedEvent, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label> Event Location </Label>
            <Input
                id="location"
                value={selectedEvent.location || ""}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={selectedEvent.project}
                onValueChange={(value) => setSelectedEvent({ ...selectedEvent, project: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={selectedEvent.description}
                onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>Update Event</Button>
            <Button variant="destructive" onClick={() => handleDeleteEvent(selectedEvent.id)}>Delete Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
)}
                </div>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week" className="mt-4">
          <WeekView selectedDate={selectedDate} events={events} onEventDrag={handleDragEvent} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <GanttTimeline />
        </TabsContent>
      </Tabs>

      {/* Add Event Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <div className="flex gap-2">
                <Input
                  id="date"
                  type="date"
                  value={format(newEvent.date, "yyyy-MM-dd")}
                  onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                />
                <Input
                  type="time"
                  value={format(newEvent.date, "HH:mm")}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const newDate = new Date(newEvent.date)
                    newDate.setHours(parseInt(hours), parseInt(minutes))
                    setNewEvent({ ...newEvent, date: newDate })
                  }}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="project">Project</Label>
              <Select
                value={newEvent.project}
                onValueChange={(value) => setNewEvent({ ...newEvent, project: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Event description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}