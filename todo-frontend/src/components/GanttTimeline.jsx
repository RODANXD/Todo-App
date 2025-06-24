"use client"
import React from "react"
import { useEffect, useRef, useState } from "react"
import { Timeline, DataSet } from "vis-timeline/standalone"
import "vis-timeline/styles/vis-timeline-graph2d.css"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "../components/ui/button"
import { Checkbox } from "../components/ui/checkbox"
import { Card, CardContent } from "../components/ui/card"
import axiosinstance from "../api/AxiosAuth"
import "../assets/gantttime.css"
function GanttTimeline() {
  const timelineRef = useRef(null)
  const [timeline, setTimeline] = useState(null)
  const [showGroups, setShowGroups] = useState(true)
  const [showTooltip, setShowTooltip] = useState(true)
  const [showMajorLabel, setShowMajorLabel] = useState(true)
  const [showMinorLabel, setShowMinorLabel] = useState(true)
  const [isDraggable, setIsDraggable] = useState(true)
  const [allowZoom, setAllowZoom] = useState(true)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState([])
  const [projects, setProjects] = useState([])




useEffect(() => {
    setLoading(true)
    Promise.all([
      axiosinstance.get("/scheduling/events/"),
      axiosinstance.get("/project/")
    ])
      .then(([eventsRes, projectsRes]) => {
        setEvents(eventsRes.data.results)
        setProjects(projectsRes.data.results)
      })
      .finally(() => setLoading(false))
  }, [])






  useEffect(() => {
    if (!timelineRef.current || loading) return

    // Create groups - ensure we always have at least a default group
    const groupsArr = Array.isArray(projects) && projects.length > 0
      ? projects.map((project) => ({
          id: project.id,
          content: project.name || `Project ${project.id}`,
          className: "group-header"
        }))
      : [{
          id: 0,
          content: "Default Group",
          className: "group-header"
        }]

    // Create items - ensure all items have a valid group
    const itemsArr = Array.isArray(events) 
      ? events.map((event) => ({
          id: event.id,
          group: event.project || 0, // default to group 0 if no project
          content: `<div class="item-content">
            <span class="item-title">${event.title || 'Untitled'}</span>
            <span class="item-date">${event.start_time ? new Date(event.start_time).toLocaleDateString() : ""}</span>
            <span class="item-type">${event.event_type || ""}</span>
          </div>`,
          title: `${event.title || 'Untitled'} (${event.event_type || ""})`,
          start: event.start_time ? new Date(event.start_time) : new Date(),
          end: event.end_time ? new Date(event.end_time) : new Date(Date.now() + 86400000), // default 1 day duration
          className:
            event.event_type === "task"
              ? "timeline-item low-priority"
              : event.event_type === "milestone"
              ? "timeline-item high-priority"
              : "timeline-item urgent-priority"
        }))
      : []

    const groups = new DataSet(groupsArr)
    const items = new DataSet(itemsArr)

    const options = {
      zoomable: allowZoom,
      moveable: true,
      selectable: true,
      editable: {
        add: false,
        updateTime: isDraggable,
        updateGroup: isDraggable,
        remove: false
      },
      orientation: "top",
      stack: false,
      margin: { item: { horizontal: 0 } },
      showCurrentTime: true,
      format: { minorLabels: { day: "D" } },
      showMajorLabels: showMajorLabel,
      showMinorLabels: showMinorLabel,
      tooltip: { followMouse: showTooltip, overflowMethod: "cap" },
      groupTemplate: (group) => group 
        ? `<div class="custom-group">${group.content || group.id || 'Group'}</div>`
        : '<div class="custom-group">Unknown Group</div>',
      template: (item) => item?.content || '',
      groupOrder: "id",
      horizontalScroll: true,
      verticalScroll: true,
      timeAxis: { scale: "day", step: 1 },
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)
    }

    const newTimeline = new Timeline(timelineRef.current, items, groups, options)
    setTimeline(newTimeline)

    return () => {
      if (newTimeline) {
        newTimeline.destroy()
      }
    }
  }, [timelineRef, showGroups, showTooltip, showMajorLabel, showMinorLabel, isDraggable, allowZoom, events, projects, loading])



  const handleZoomIn = () => {
    if (timeline) {
      const currentRange = timeline.getWindow()
      const start = new Date(currentRange.start.valueOf())
      const end = new Date(currentRange.end.valueOf())
      const interval = end.getTime() - start.getTime()
      const newInterval = interval * 0.7
      const center = new Date((start.getTime() + end.getTime()) / 2)
      const newStart = new Date(center.getTime() - newInterval / 2)
      const newEnd = new Date(center.getTime() + newInterval / 2)
      timeline.setWindow(newStart, newEnd)
    }
  }

  const handleZoomOut = () => {
    if (timeline) {
      const currentRange = timeline.getWindow()
      const start = new Date(currentRange.start.valueOf())
      const end = new Date(currentRange.end.valueOf())
      const interval = end.getTime() - start.getTime()
      const newInterval = interval * 1.3
      const center = new Date((start.getTime() + end.getTime()) / 2)
      const newStart = new Date(center.getTime() - newInterval / 2)
      const newEnd = new Date(center.getTime() + newInterval / 2)
      timeline.setWindow(newStart, newEnd)
    }
  }

  const handleToday = () => {
    if (timeline) {
      const currentDate = new Date(2025, 2, 12)
      const start = new Date(currentDate)
      start.setDate(start.getDate() - 15)
      const end = new Date(currentDate)
      end.setDate(end.getDate() + 15)
      timeline.setWindow(start, end)
    }
  }

  const handleFitAll = () => {
    if (timeline) {
      timeline.fit()
    }
  }

  return (
    <Card className="gantt-timeline-container">
      <CardContent className="p-0">
        <div className="timeline-controls p-4 border-b flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (timeline) {
                const window = timeline.getWindow()
                const interval = window.end.getTime() - window.start.getTime()
                const distance = interval * 0.2
                const newStart = new Date(window.start.getTime() - distance)
                const newEnd = new Date(window.end.getTime() - distance)
                timeline.setWindow(newStart, newEnd)
              }
            }}
            title="Move Left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="text-xs">
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (timeline) {
                const window = timeline.getWindow()
                const interval = window.end.getTime() - window.start.getTime()
                const distance = interval * 0.2
                const newStart = new Date(window.start.getTime() + distance)
                const newEnd = new Date(window.end.getTime() + distance)
                timeline.setWindow(newStart, newEnd)
              }
            }}
            title="Move Right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleFitAll} className="text-xs">
            Fit All
          </Button>
        </div>

        <div className="timeline-options p-4 border-b flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="showMajorLabel" checked={showMajorLabel} onCheckedChange={setShowMajorLabel} />
            <label
              htmlFor="showMajorLabel"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Major Label
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showMinorLabel" checked={showMinorLabel} onCheckedChange={setShowMinorLabel} />
            <label
              htmlFor="showMinorLabel"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Minor Label
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showTooltip" checked={showTooltip} onCheckedChange={setShowTooltip} />
            <label
              htmlFor="showTooltip"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Tooltip
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="isDraggable" checked={isDraggable} onCheckedChange={setIsDraggable} />
            <label
              htmlFor="isDraggable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Always Draggable
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="allowZoom" checked={allowZoom} onCheckedChange={setAllowZoom} />
            <label
              htmlFor="allowZoom"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Allow Zoom
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="showGroups" checked={showGroups} onCheckedChange={setShowGroups} />
            <label
              htmlFor="showGroups"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show Groups
            </label>
          </div>
        </div>

        <div ref={timelineRef} className="timeline-container" />
      </CardContent>
    </Card>
  )
}

export default GanttTimeline