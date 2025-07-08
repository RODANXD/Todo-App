"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useauth } from "../store/AuthContext"
import { useNavigate } from "react-router-dom"
import { getOrganization, getProjects, getProfile, getTasksByProject, getProjectMembers, getTaskStats, updateProject } from "../api/AxiosAuth"
import KanbanBoard from "../components/kanban-board"
import { KanbanProvider } from "../components/kanban-provider"
import TeamManagement from "../components/TeamManagement"
import TaskStats from "../components/TaskStats"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { Textarea } from "../components/ui/textarea"
import { createProject, deleteProject } from "../api/AxiosAuth"
// import TaskRequestsPanel from "/components/TaskReq"
import { MoreHorizontal, Plus, Users, Calendar, BarChart3, MessageSquare, LogOut, Filter, X, Search, Bell, Settings, Folder, Clock, Target, Menu } from "lucide-react"
import { toast } from "sonner";
import { Switch } from "../components/ui/switch"
import ChatInterface from "../components/ChatInterface"
import ChatErrorBoundary from "../components/Chat-boundary"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "../components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "../components/ui/dropdown-menu"
import { createTaskList, duplicateproject } from "../api/AxiosAuth"
import { Label } from "../components/ui/label"
import TaskModal from "../components/task-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Separator } from "../components/ui/separator"
import SettingsProfile from "../components/Profilesetting"
import { formatDistanceToNow } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/ui/sheet"
// import ThemeToggle from "../store/togge"
// import { useTheme } from "../store/ThemeContext"
import { Moon, Sun } from "lucide-react";
import ResponsiveNavbar from "./ResponsiveNav"





const Dashboard = () => {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectproject, setSelectProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const [task, setTask] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [organization, setorganization] = useState("")
  const [editingProject, setEditingProject] = useState(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSettings, setShowSettings] = useState(false)
  const [orgRole, setOrgRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [username, setUsername] = useState([])
  const [projectRole, setProjectRole] = useState(null);


  const navigate = useNavigate()
  // const { theme, toggleTheme } = useTheme();
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    dueDate: "",
    assignedTo: "",
    createdBy: "",
  })
  const [sortBy, setSortBy] = useState("")

  const { logout, user, auth } = useauth()

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const response = await getProjects()
        const projectsData = response.data.results || []
        setProjects(projectsData)
        setError(null)
      } catch (error) {
        console.error("Error fetching projects:", error)
        setError("Failed to load projects. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  useEffect(() => {
    const fetchTaskLists = async () => {
      if (!selectproject) {
        setTasks([])
        return
      }
      const currentProjectTasks = tasks.filter(task => task.project === selectproject.id)
      if (currentProjectTasks.length > 0 && tasks.length > 0) {
        return // Already have tasks for this project
      }

      try {
        setLoading(true)
        const response = await getTasksByProject(selectproject.id)
        const taskListsData = response.data.results || response.data
        const tasksArray = Array.isArray(taskListsData) ? taskListsData : [taskListsData]
        const filteredTask = tasksArray.filter((task) => task.project === selectproject.id)
        setTasks(filteredTask)
        setError(null)
      } catch (error) {
        console.error("Error fetching task lists:", error)
        setError("Failed to load task lists. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTaskLists()
  }, [selectproject?.id])


  const [tasksByProject, setTasksByProject] = useState({}) // Cache tasks by project ID

  const fetchTasksForProject = async (projectId) => {
    // Check cache first
    // if (tasksByProject[projectId]) {
    //   setTasks(tasksByProject[projectId])
    //   return
    // }

    try {
      setLoading(true)
      const response = await getTasksByProject(projectId)
      const taskListsData = response.data.results || response.data
      const tasksArray = Array.isArray(taskListsData) ? taskListsData : [taskListsData]
      const filteredTask = tasksArray.filter((task) => task.project === projectId)

      // Cache the tasks
      setTasksByProject(prev => ({
        ...prev,
        [projectId]: filteredTask
      }))
      setTasks(filteredTask)
      setError(null)
    } catch (error) {
      console.error("Error fetching task lists:", error)
      setError("Failed to load task lists. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getTaskStats()
        setStats(response.data)
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])


  useEffect(() => {
    const fetchOrgRole = async () => {
      try {
        const profileRes = await getProfile();
        // console.log("Profile response:", profileRes);
        const role = profileRes.data?.role;
        const uname = profileRes.data?.username
        // console.log("username", username)
        setUsername(uname)
        setOrgRole(role);
      } catch (error) {
        setOrgRole(null);
        console.error("Error fetching org role:", error);
      }
    };
    if (user) fetchOrgRole();
  }, [user]);

  useEffect(() => {
    if (projects.length > 0 && !selectproject) {
      setSelectProject(projects[0]);
    }
  }, [projects, selectproject]);

  const onSelect = async (proj) => {
    try {
      // Only proceed if it's a different project
      if (selectproject?.id === proj.id) {
        return
      }

      setSelectProject(proj)
      setTasks([])
      // Fetch tasks for the new project (will use cache if available)
      await fetchTasksForProject(proj.id)

      // Handle task list creation if needed
      if (!proj.task_lists?.length) {
        const taskListId = await ensureTaskList(proj.id)
        const updatedProj = {
          ...proj,
          task_lists: [
            {
              id: taskListId,
              name: "Default Task List",
              project: proj.id,
            },
          ],
        }
        setSelectProject(updatedProj)
      }
    } catch (error) {
      console.error("Error in project selection:", error)
      setError(`Error selecting project: ${error.message}`)
    }
  }
  const [isSelectingProject, setIsSelectingProject] = useState(false)

  const onSelectWithLoadingState = async (proj) => {
    if (isSelectingProject || selectproject?.id === proj.id) {
      return
    }

    setIsSelectingProject(true)
    try {
      await onSelectOptimized(proj)
    } finally {
      setIsSelectingProject(false)
    }
  }


  const ensureTaskList = async (projectId) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) throw new Error("Project not found");


      if (project.task_lists && project.task_lists.length > 0 && project.task_lists[0].id) {
        return project.task_lists[0].id;
      }

      const taskListData = {
        name: "Default Task List",
        project: projectId,
        description: "Default task list for project",
      };
      const response = await createTaskList(taskListData);
      if (!response.data) throw new Error("Failed to create task list - no response data");

      // Update the project in your projects state
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, task_lists: [response.data] }
            : p
        )
      );

      return response.data.id;
    } catch (error) {
      console.error("Error ensuring task list:", error);
      throw new Error(`Failed to create task list: ${error.message}`);
    }
  };


  const fetchMembers = async () => {
    if (!selectproject || !selectproject.id) return;
    try {
      const response = await getProjectMembers(selectproject.id);
      console.log("fetchmember -------------", response)
      const membersData = response.data;
      setMembers(membersData);
      console.log('Fetched members:', response.data);
      const currentMember = membersData.find((m) => m.user.username === username);
      console.log("current member " ,currentMember)
      if (currentMember) {
        setProjectRole(currentMember.role);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  };

  useEffect(() => {
    if (selectproject && selectproject.id) {
      fetchMembers();
    }
  }, [selectproject?.id]);

  const handleEditProject = (project) => {
    event.stopPropagation()
    setEditingProject(project)
    setName(project.name)
    setDescription(project.description)
    setorganization(project.organization)
    setIsOpen(true)
  }

  const handleDeleteProject = async (projectId) => {
    event.stopPropagation()
    if (window.confirm(`Are you sure you want to delete this project?`)) {
      try {
        await deleteProject(projectId)
        setProjects(projects.filter((p) => p.id !== projectId))

        if (selectproject?.id == projectId) {
          setSelectProject(null)
          setTasks([])
        }

        toast.success("Project deleted successfully")
        // alert("Project deleted successfully")
        // window.location.reload()
      } catch (error) {
        console.error("Error deleting project:", error)
      }
    }
  }

  const handleDuplicateProject = async (projectId) => {
    event.stopPropagation()
    try {
      const response = await duplicateproject(projectId)
      const newProject = response.data
      setProjects((prev) => [...prev, newProject])
      setSelectProject(newProject)
      await fetchTasksForProject(newProject)
      toast.success("Project duplicated successfully")
    } catch (error) {
      console.error("Error duplicating project:", error)
      toast.error("Failed to duplicate project: " + error.message)
      // alert("Failed to duplicate project: " + error.message)
    }
  }

  const openCreateTaskModal = async () => {
    if (!selectproject) {
      toast.warning("Please select a project first")
      return
    }

    try {
      const taskListId = await ensureTaskList(selectproject.id)
      if (taskListId) {
        setEditingTask(null)
        setIsTaskModalOpen(true)
      } else {
        throw new Error("Could not create or find task list")
      }
    } catch (error) {
      toast.error("Error preparing task creation: " + error.message)
    }
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.warning("Project name is required")
      return
    }

    const projectData = {
      name,
      description,
      organization,
    }

    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData)
        setProjects(projects.map((p) => (p.id === editingProject.id ? { ...p, ...projectData } : p)))
        toast.success("project updated successfully")
      } else {
        const response = await createProject(projectData)
        setProjects([...projects, response.data])
        toast.success("Project created successfully")
        setIsOpen(false)
        setEditingProject(null)
        setName("")
        setDescription("")
        setorganization("")
        // window.location.reload()
      }
      onClose()
    } catch (error) {
      console.error("Error saving project:", error)
    }
  }
  const sortedTasks = useMemo(() => {
    if (!sortBy || !tasks.length) return tasks;
    const sorted = [...tasks];
    if (sortBy === "dueDate") {
      sorted.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    } else if (sortBy === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3 };
      sorted.sort((a, b) => (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4));
    } else if (sortBy === "status") {
      const statusOrder = { todo: 1, in_progress: 2, done: 3 };
      sorted.sort((a, b) => (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4));
    }
    return sorted;
  }, [tasks, sortBy]);

  const onClose = () => {
    setIsOpen(false)
    setEditingProject(null)
    setName("")
    setDescription("")
    setorganization("")
  }

  // const filteredProjects = useMemo(() => {
  //   return projects.filter(
  //     (project) =>
  //       (project.name && project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
  //       (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  //   )
  // }, [projects, searchQuery])

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (project) => {
        // Assuming project.roles is an array of {user, role}
        const myRole = project.roles?.find(r => r.user === user.id)?.role;
        return myRole !== "viewer"; // Only show if not just a viewer
      }
    );
  }, [projects, user]);


  console.log("org role---------------------------", orgRole)
  if (loading && !projects.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-r-4 border-l-4 border-indigo-400 animate-spin animation-delay-150 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Loading Dashboard</h2>
            <p className="text-slate-600">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <ResponsiveNavbar setSearchQuery={setSearchQuery} user={user}
        setIsChatOpen={setIsChatOpen} navigate={navigate} setShowSettings={setShowSettings}
        logout={logout} selectproject={selectproject} setShowTeamManagement={setShowTeamManagement} />

      {/* Enhanced Stats Section */}
      {stats && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardContent className="p-6">
              <TaskStats stats={stats} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <X className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-8xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Enhanced Sidebar - Projects */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Folder className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-800">Projects</CardTitle>
                      <CardDescription>{filteredProjects.length} total projects</CardDescription>
                    </div>
                  </div>
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    {orgRole === "admin" && (
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          New
                        </Button>
                      </DialogTrigger>
                    )}
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl text-slate-800">
                          {editingProject ? "Edit Project" : "Create New Project"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingProject ? "Update your project details" : "Add a new project to your workspace"}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-slate-700">
                            Project Title
                          </Label>
                          <Input
                            id="title"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project title"
                            className="focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description" className="text-slate-700">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project"
                            rows={3}
                            className="focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="organization" className="text-slate-700">
                            Organization ID
                          </Label>
                          <Input
                            id="organization"
                            type="number"
                            value={organization}
                            onChange={(e) => setorganization(e.target.value)}
                            placeholder="Enter organization ID"
                            className="focus:border-blue-300 focus:ring-blue-200"
                          />
                        </div>
                      </div>
                      <DialogFooter className="space-x-2">
                        <DialogClose asChild>
                          <Button variant="outline" onClick={onClose}>
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          onClick={handleSubmit}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                          {editingProject ? "Update Project" : "Create Project"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                {filteredProjects.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredProjects.map((proj, index) => (
                      <Card
                        key={proj.id}
                        className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${selectproject?.id === proj.id
                            ? "ring-2 ring-blue-200 bg-blue-50/50 border-blue-200"
                            : "hover:bg-slate-50/50 border-slate-200"
                          }`}
                        onClick={() => onSelect(proj)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3 mb-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${selectproject?.id === proj.id ? "bg-blue-500" : "bg-slate-300"
                                    }`}
                                ></div>
                                <h3 className="font-semibold text-slate-800 truncate">{proj.name}</h3>
                              </div>
                              {proj.description && (
                                <p className="text-slate-600 text-sm mb-3 line-clamp-2 ml-6">#{proj.id} <br />{proj.description}</p>
                              )}


                              <div className="flex items-center justify-between ml-6">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                                  {proj.task_lists?.length || 0} lists
                                </Badge>
                                <div className="flex items-center space-x-1 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Updated {proj.updated_at ? formatDistanceToNow(new Date(proj.updated_at), { addSuffix: true }) : "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              {projectRole !== 'member' && (
                              <DropdownMenuTrigger asChild>
                                
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-1 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                
                              </DropdownMenuTrigger>
                              )}


                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditProject(proj)}>
                                  Edit project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteProject(proj.id)}
                                >
                                  Delete project
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-gray-600 focus:text-gray-600"
                                  onClick={() => handleDuplicateProject(proj.id)}
                                >
                                  Duplicate project
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Folder className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-slate-800 font-semibold mb-2">No projects yet</h3>
                    <p className="text-slate-600 mb-4 text-sm">Create your first project to get started</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsOpen(true)}
                      className="border-slate-300 text-slate-600 hover:bg-slate-50"
                      disabled={orgRole !== "admin" && orgRole !== "owner"}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Main Content Area */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm min-h-[700px]">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap max-xs:gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Target className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-800">
                        {selectproject?.name || "Select a Project"}
                      </CardTitle>
                      {selectproject?.description && (
                        <CardDescription className="mt-1">{selectproject.description}</CardDescription>
                      )}
                    </div>
                    {/* {orgRole === "admin" && <TaskRequestsPanel projectId={selectproject?.id} />} */}
                  </div>
                  {selectproject && (
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                      </Button>
                      <Button
                        onClick={openCreateTaskModal}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0">
                {/* Chat Interface */}
                {isChatOpen && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                      <Card className="mb-6 border-slate-200">
                        <CardContent className="p-4">
                          <ChatErrorBoundary>
                            {user.username ? (
                              <ChatInterface
                                projectId={selectproject?.id}
                                currentUser={user.username}
                                onClose={() => setIsChatOpen(false)}
                              />
                            ) : (
                              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                                Please log in to access chat
                              </div>
                            )}
                          </ChatErrorBoundary>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                )}

                {/* Enhanced Filters */}
                {showFilters && selectproject && tasks.length > 0 && (
                  <Card className="mb-6 border-slate-200 bg-slate-50/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-800 text-lg">Filters & Sorting</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                          className="px-3 py-2 bg-[#f7797d] border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        >
                          <option value="">All Status</option>
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>

                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                          className="px-3 py-2 bg-[#f7797d] border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        >
                          <option value="">All Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>

                        {/* <select
                          value={filters.assignedTo}
                          onChange={(e) => setFilters((prev) => ({ ...prev, assignedTo: e.target.value }))}
                          className="px-3 py-2 bg-[#f7797d] border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        >
                          <option value="">All Assignees</option>
                          {selectproject.members?.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select> */}

                        {/* <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 bg-[#f7797d] border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                        >
                          <option value="">Sort By</option>
                          <option value="dueDate">Due Date</option>
                          <option value="priority">Priority</option>
                          <option value="status">Status</option>
                        </select> */}

                        <Input
                          type="date"
                          value={filters.dueDate}
                          onChange={(e) => setFilters((prev) => ({ ...prev, dueDate: e.target.value }))}
                          className="bg-[#f7797d] text-slate-800 w-[145px] focus:border-blue-300 focus:ring-blue-200"
                          placeholder="Due date"

                        />

                        <Button
                          variant="outline"
                          onClick={() =>
                            setFilters({
                              status: "",
                              priority: "",
                              dueDate: "",
                              assignedTo: "",
                              createdBy: "",
                            })
                          }
                          className="border-slate-300 bg-[#f7797d] text-slate-800 hover:bg-slate-50 ml-3"
                        >
                          Clear All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Kanban Board or Empty State */}
                {selectproject && tasks.length > 0 ? (
                  <div className="bg-slate-50/30 rounded-xl p-4 border border-slate-200/50">
                    <KanbanProvider tasks={sortedTasks} filters={filters} sortBy={sortBy}>
                      <KanbanBoard projectId={selectproject.id} taskListId={selectproject.task_lists?.[0]?.id} />
                    </KanbanProvider>
                  </div>
                ) : selectproject ? (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-12 h-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">No tasks yet</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto">
                      Get started by creating your first task for this project.
                    </p>
                    <Button
                      onClick={openCreateTaskModal}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 shadow-sm"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Your First Task
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Folder className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-3">Select a project</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Choose a project from the sidebar to view and manage its tasks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        // <TaskModal
        //   isOpen={isTaskModalOpen}
        //   onClose={closeTaskModal}
        //   task={editingTask}
        //   projectId={selectproject?.id}
        //   taskListId={selectproject?.task_lists?.[0]?.id}
        //   onSuccess={() => {
        //     closeTaskModal()
        //     const fetchTasks = async () => {
        //       try {
        //         const response = await getTasksByProject(selectproject.id)
        //         setTasks(response.data.results || response.data)
        //       } catch (error) {
        //         console.error("Error fetching tasks:", error)
        //       }
        //     }
        //     fetchTasks()
        //   }}
        // />
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={closeTaskModal}
          task={editingTask}
          projectId={selectproject?.id}
          taskListId={selectproject?.task_lists?.[0]?.id}
          onSuccess={() => {
            closeTaskModal()
            const fetchTasks = async () => {
              try {
                const response = await getTasksByProject(selectproject.id)
                const updatedTasks = response.data.results || response.data
                setTasks(updatedTasks)
                setTasksByProject((prev) => ({
                  ...prev,
                  [selectproject.id]: updatedTasks
                }))
              } catch (error) {
                console.error("Error fetching tasks:", error)
              }
            }
            fetchTasks()
          }}

        />
      )}

      {/* Team Management Modal */}
      {showTeamManagement && <TeamManagement project={selectproject} onClose={() => setShowTeamManagement(false)} />}
      {showSettings && (
        <SettingsProfile project={selectproject} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}


export default Dashboard

