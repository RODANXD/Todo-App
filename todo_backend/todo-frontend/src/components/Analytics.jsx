"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Button } from "./ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

const weeklyData = [
  { name: "Mon", completed: 12, created: 8 },
  { name: "Tue", completed: 19, created: 15 },
  { name: "Wed", completed: 8, created: 12 },
  { name: "Thu", completed: 15, created: 10 },
  { name: "Fri", completed: 22, created: 18 },
  { name: "Sat", completed: 5, created: 3 },
  { name: "Sun", completed: 3, created: 2 },
]

const projectData = [
  { name: "Website Redesign", value: 35, color: "#8884d8" },
  { name: "Mobile App", value: 25, color: "#82ca9d" },
  { name: "Marketing Campaign", value: 20, color: "#ffc658" },
  { name: "API Development", value: 20, color: "#ff7300" },
]

const productivityData = [
  { month: "Jan", hours: 120, tasks: 45 },
  { month: "Feb", hours: 98, tasks: 38 },
  { month: "Mar", hours: 145, tasks: 52 },
  { month: "Apr", hours: 132, tasks: 48 },
  { month: "May", hours: 156, tasks: 58 },
  { month: "Jun", hours: 142, tasks: 51 },
]

const teamStats = [
  { name: "John Doe", completed: 28, inProgress: 5, overdue: 2 },
  { name: "Jane Smith", completed: 24, inProgress: 8, overdue: 1 },
  { name: "Mike Johnson", completed: 19, inProgress: 6, overdue: 3 },
  { name: "Sarah Wilson", completed: 31, inProgress: 4, overdue: 0 },
]

export default function AnalyticsPage() {
    const navigate = useNavigate()
  return (
    <div className="space-y-6">
      <div className="flex items-center flex-wrap justify-evenly">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Track your productivity and project progress</p>
        <Button onClick={() => navigate("/")}>Back to Dashboard</Button>  
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks This Week</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +12% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -8% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Efficiency</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +5% this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -3 from yesterday
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Task Activity</CardTitle>
                <CardDescription>Tasks completed vs created this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#8884d8" name="Completed" />
                    <Bar dataKey="created" fill="#82ca9d" name="Created" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productivity Trend</CardTitle>
                <CardDescription>Hours worked and tasks completed over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={productivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#8884d8" name="Hours" />
                    <Line type="monotone" dataKey="tasks" stroke="#82ca9d" name="Tasks" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Project Distribution</CardTitle>
                <CardDescription>Time allocation across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>Current status of active projects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectData.map((project) => (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{project.name}</span>
                      <span className="text-sm text-muted-foreground">{project.value}%</span>
                    </div>
                    <Progress value={project.value} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Individual team member statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamStats.map((member) => (
                  <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.completed + member.inProgress + member.overdue} total tasks
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{member.completed} completed</Badge>
                      <Badge variant="outline">{member.inProgress} in progress</Badge>
                      {member.overdue > 0 && <Badge variant="destructive">{member.overdue} overdue</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}