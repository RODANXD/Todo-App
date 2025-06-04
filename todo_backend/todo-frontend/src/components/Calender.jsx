"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Calendar } from "../components/ui/calendar"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"

const mockEvents = [
  {
    id: 1,
    title: "Website Redesign Review",
    date: new Date(2024, 1, 15),
    type: "meeting",
    project: "Website Redesign",
  },
  {
    id: 2,
    title: "Mobile App Wireframes Due",
    date: new Date(2024, 1, 18),
    type: "deadline",
    project: "Mobile App",
  },
  {
    id: 3,
    title: "Marketing Campaign Launch",
    date: new Date(2024, 1, 20),
    type: "milestone",
    project: "Marketing Campaign",
  },
  {
    id: 4,
    title: "Team Standup",
    date: new Date(2024, 1, 22),
    type: "meeting",
    project: "General",
  },
]

const getEventTypeColor = (type) => {
  switch (type) {
    case "meeting":
      return "bg-blue-500"
    case "deadline":
      return "bg-red-500"
    case "milestone":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const selectedDateEvents = mockEvents.filter(
    (event) => selectedDate && event.date.toDateString() === selectedDate.toDateString(),
  )

  const hasEvents = (date) => {
    return mockEvents.some((event) => event.date.toDateString() === date.toDateString())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View and manage your project deadlines and events</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {currentMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
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
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border"
              modifiers={{
                hasEvents: (date) => hasEvents(date),
              }}
              modifiersStyles={{
                hasEvents: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                  borderRadius: "6px",
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Events Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a date"}
            </CardTitle>
            <CardDescription>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""} scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                    <span className="font-medium">{event.title}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{event.project}</Badge>
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-8">No events scheduled for this date</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events and deadlines in the next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents
              .filter((event) => {
                const today = new Date()
                const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                return event.date >= today && event.date <= nextWeek
              })
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${getEventTypeColor(event.type)}`} />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{event.project}</Badge>
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}