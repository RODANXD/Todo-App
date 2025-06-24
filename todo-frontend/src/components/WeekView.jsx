import { format, addDays, startOfWeek, isSameDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"

export default function WeekView({ selectedDate, events, onEventDrag }) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Week View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <div
              key={day.toString()}
              className="border rounded-lg p-4 min-h-[200px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm text-muted-foreground">{format(day, 'dd')}</div>
              <div className="mt-2 space-y-1">
                {getEventsForDay(day).map((event) => (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, event)}
                    className={`p-2 text-sm rounded-md cursor-move ${
                      event.type === 'task' ? 'bg-blue-100': event.event_type === 'milestone' ? 'bg-green-100':'bg-purple-100'
                    }`}
                  >
                    <div className="font-medium truncate">{event.title}- {event.created_by.username}</div>
                    <div className="text-xs text-muted-foreground">
                     timing - {
                        event.start_time ? format(new Date(event.start_time), 'HH:mm') : 
                        event.date ? format(new Date(event.date), 'dd MMM') : ''
                      }
                    </div>
                    {event.type === 'task' && (
                      <Badge variant="secondary" className="mt-1">
                        {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}