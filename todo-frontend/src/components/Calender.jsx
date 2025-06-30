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
import { toast } from "sonner";
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
  const downloadTimesheetCSV = () => {
  if (!events.length) {
    toast.error("No events to export");
    return;
  }
  const headers = [
    "Title",
    "Type",
    "Project",
    "Start Time",
    "End Time",
    "Description",
    "Created By"
  ];
  const rows = events.map(event => [
    `"${event.title || ""}"`,
    `"${event.event_type || event.type || ""}"`,
    `"${projects.find(p => p.id === (event.project?.id || event.project))?.name || event.project || ""}"`,
    `"${event.start_time ? format(new Date(event.start_time), "yyyy-MM-dd HH:mm") : ""}"`,
    `"${event.end_time ? format(new Date(event.end_time), "yyyy-MM-dd HH:mm") : ""}"`,
    `"${event.description || ""}"`,
    `"${event.created_by?.username || ""}"`
  ]);
  const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "timesheet.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    <div className="min-h-screen  p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section - Fully Responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl text-white font-bold tracking-tight">Calendar</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              View and manage your project deadlines and events
            </p>
          </div>
          
          {/* Action Buttons - Responsive Stack */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button 
              onClick={() => setIsEventModalOpen(true)}
              className="w-full sm:w-auto flex-shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
            <Button 
              onClick={downloadTimesheetCSV} 
              variant="outline"
              className="w-full sm:w-auto flex-shrink-0"
            >
              Download CSV
            </Button>
            <Button 
              onClick={() => navigate("/")}
              className="w-full sm:w-auto flex-shrink-0"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs Section - Responsive */}
        <Tabs value={view} onValueChange={setView} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto sm:mx-0">
            <TabsTrigger value="month" className="text-xs sm:text-sm">Month</TabsTrigger>
            <TabsTrigger value="week" className="text-xs sm:text-sm">Week</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs sm:text-sm">Timeline</TabsTrigger>
          </TabsList>

          {/* Month View - Fully Responsive Calendar */}
          <TabsContent value="month" className="mt-4">
            <Card className="w-full overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="text-lg sm:text-xl text-center sm:text-left">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex justify-center sm:justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="flex-shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="flex-shrink-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-2 sm:p-6">
                {loading ? (
                  <div className="flex justify-center items-center h-64 sm:h-96">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-8">{error}</div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-full">
                      {/* Calendar Grid - Responsive */}
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[280px]">
                        {/* Day Headers */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center font-semibold py-2 text-xs sm:text-sm">
                            <span className="hidden sm:inline">{day}</span>
                            <span className="sm:hidden">{day.slice(0, 1)}</span>
                          </div>
                        ))}
                        
                        {/* Calendar Days */}
                        {eachDayOfInterval({
                          start: startOfMonth(currentMonth),
                          end: endOfMonth(currentMonth)
                        }).map((date) => {
                          const dayEvents = getDayEvents(date);
                          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                          const isCurrentMonth = format(date, 'MM') === format(currentMonth, 'MM');
                          
                          return (
                            <div
                              key={date.toISOString()}
                              className={`
                                min-h-[60px] sm:min-h-[100px] lg:min-h-[120px] 
                                p-1 sm:p-2 border rounded-md cursor-pointer
                                transition-all duration-200 hover:shadow-md
                                ${!isCurrentMonth ? 'bg-gray-50 opacity-50' : 'bg-white'}
                                ${isToday ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200'}
                                hover:border-blue-300
                              `}
                              onClick={() => setSelectedDate(date)}
                            >
                              {/* Date Number */}
                              <div className={`
                                text-right text-xs sm:text-sm font-medium mb-1
                                ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}
                              `}>
                                {format(date, 'd')}
                              </div>
                              
                              {/* Events Container */}
                              <div className="space-y-1 overflow-y-scroll scrollbar-hide">
                                {dayEvents.slice(0, 50).map((event) => (
                                  <div
                                    key={event.id}
                                    className={`
                                      text-xs p-1 rounded-sm cursor-pointer
                                      transition-all duration-150 hover:shadow-sm
                                      ${event.event_type === 'task' ? 'bg-blue-100 text-blue-800' : 
                                        event.event_type === 'milestone' ? 'bg-green-100 text-green-800' : 
                                        'bg-purple-100 text-purple-800'}
                                      truncate
                                    `}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                    }}
                                    title={`${event.title} - ${event.created_by.username}`}
                                  >
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="text-[10px] opacity-75 hidden sm:block">
                                      {event.created_by.username}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* More events indicator */}
                                {/* {dayEvents.length > 2 && (
                                  <div className="text-[10px] text-gray-500 text-center py-1">
                                    +{dayEvents.length - 2} more
                                  </div>
                                )} */}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Week View Placeholder */}
          <TabsContent value="week" className="mt-4">
            <WeekView
  selectedDate={selectedDate}
  events={events}
  onEventDrag={handleDragEvent}
  projects={projects}
  onUpdateEvent={handleUpdateEvent}
  onDeleteEvent={handleDeleteEvent}
/>
          </TabsContent>

          {/* Timeline View Placeholder */}
          <TabsContent value="timeline" className="mt-4">
            <GanttTimeline />
          </TabsContent>
        </Tabs>

        {/* Event Detail Modal - Responsive */}
        {selectedEvent && (
          <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
            <DialogContent className="w-full max-w-md sm:max-w-lg mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="event-title">Title</Label>
                  <Input
                    id="event-title"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Start Date - {format(new Date(selectedEvent.start_time), "yyyy-MM-dd")}</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="date"
                      value={format(new Date(selectedEvent.start_time), "yyyy-MM-dd")}
                      onChange={(e) => setSelectedEvent({ 
                        ...selectedEvent, 
                        start_time: new Date(e.target.value).toISOString() 
                      })}
                    />
                    <Input
                      type="time"
                      value={format(new Date(selectedEvent.start_time), "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = new Date(selectedEvent.start_time);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedEvent({ ...selectedEvent, start_time: newDate.toISOString() });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>End Date - {format(new Date(selectedEvent.end_time), "yyyy-MM-dd")}</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="date"
                      value={format(new Date(selectedEvent.end_time), "yyyy-MM-dd")}
                      onChange={(e) => setSelectedEvent({ 
                        ...selectedEvent, 
                        end_time: new Date(e.target.value).toISOString() 
                      })}
                    />
                    <Input
                      type="time"
                      value={format(new Date(selectedEvent.end_time), "HH:mm")}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(":");
                        const newDate = new Date(selectedEvent.end_time);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        setSelectedEvent({ ...selectedEvent, end_time: newDate.toISOString() });
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={selectedEvent.event_type}
                    onValueChange={(value) => setSelectedEvent({ ...selectedEvent, event_type: value })}
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
                  <Label>Event Location</Label>
                  <Input
                    value={selectedEvent.location || ""}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                    placeholder="Event location"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Project</Label>
                  <Select
                    value={selectedEvent.project?.toString()}
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
                  <Label>Description</Label>
                  <Input
                    value={selectedEvent.description}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setSelectedEvent(null)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleUpdateEvent} className="w-full sm:w-auto">
                  Update Event
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="w-full sm:w-auto"
                >
                  Delete Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Event Modal - Responsive */}
        <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
          <DialogContent className="w-full max-w-md sm:max-w-lg mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-title">Title</Label>
                <Input
                  id="new-title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label>Date</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="date"
                    value={format(newEvent.date, "yyyy-MM-dd")}
                    onChange={(e) => setNewEvent({ ...newEvent, date: new Date(e.target.value) })}
                  />
                  <Input
                    type="time"
                    value={format(newEvent.date, "HH:mm")}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":");
                      const newDate = new Date(newEvent.date);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      setNewEvent({ ...newEvent, date: newDate });
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Type</Label>
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
                <Label>Project</Label>
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
                <Label>Description</Label>
                <Input
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEventModalOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddEvent} className="w-full sm:w-auto">
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}