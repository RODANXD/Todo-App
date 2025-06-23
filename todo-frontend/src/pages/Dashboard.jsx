
import React, { useState, useEffect } from 'react';
import { useauth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProjects, getTasksByProject, getTaskStats, updateProject } from '../api/AxiosAuth';
import KanbanBoard from '../components/kanban-board';
import { KanbanProvider } from '../components/kanban-provider';
import TeamManagement from '../components/TeamManagement';
import TaskStats from '../components/TaskStats';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from "../components/ui/textarea"
import { createProject, deleteProject } from '../api/AxiosAuth';
import { MoreHorizontal, Plus, Users, Calendar, BarChart3, MessageSquare, LogOut, Filter, X } from 'lucide-react'
import CalendarPage from '../components/Calender';
import ChatInterface from '../components/ChatInterface';
import ChatErrorBoundary from '../components/Chat-boundary';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { createTaskList } from '../api/AxiosAuth';
import { Label } from '../components/ui/label';
import TaskModal from '../components/task-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [selectproject, setSelectProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const [task, setTask] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState("")
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState(null);
    const [organization, setorganization] = useState('');
    const [editingProject, setEditingProject] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: '',
        assignedTo: '',
        createdBy: '',
    });
    const [sortBy, setSortBy] = useState('');

    const { logout, user, auth } = useauth();
    console.log("user", user);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await getProjects();
                console.log("Projects response:", response.data);
                const projectsData = response.data.results || [];
                setProjects(projectsData);
                setError(null);
            } catch (error) {
                console.error('Error fetching projects:', error);
                setError('Failed to load projects. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchTaskLists = async () => {
            if (!selectproject) {
                setTasks([]);
                return;
            }

            try {
                setLoading(true);
                const response = await getTasksByProject(selectproject.id);
                console.log("TaskLists response:", response.data);
                const taskListsData = response.data.results || response.data;
                console.log("Processed task lists data:", taskListsData);
                const tasksArray = Array.isArray(taskListsData) ? taskListsData : [taskListsData];
                const filteredTask = tasksArray.filter(task => task.project === selectproject.id);
                console.log("Tasks array:", tasksArray);
                setTasks(filteredTask);
                setError(null);
            } catch (error) {
                console.error('Error fetching task lists:', error);
                setError('Failed to load task lists. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTaskLists();
    }, [selectproject]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getTaskStats();
                setStats(response.data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        if (selectproject) {
            console.log("Selected project task lists:", selectproject.task_lists);
            console.log("First task list ID:", selectproject?.task_lists?.[0]?.id);
        }

        fetchStats();
    }, [selectproject]);

    const onSelect = async (proj) => {
        try {
            console.log("Selecting project:", proj);
            setSelectProject(proj);
            setTasks([]);
            await new Promise(resolve => setTimeout(resolve, 0));

            if (!proj.task_lists?.length) {
                console.log("No task lists found, creating one for project", proj.id);
                const taskListId = await ensureTaskList(proj.id);
                console.log("Created task list with ID:", taskListId);

                const updatedProj = {
                    ...proj,
                    task_lists: [{
                        id: taskListId,
                        name: "Default Task List",
                        project: proj.id
                    }]
                };
                setSelectProject(updatedProj);
            }
        } catch (error) {
            console.error("Error in project selection:", error);
            setError(`Error selecting project: ${error.message}`);
            alert(`Error selecting project: ${error.message}`);
        }
    };

    const ensureTaskList = async (projectId) => {
        try {
            console.log("Current selected project:", selectproject);
            console.log("Project task lists:", selectproject?.task_lists);

            if (!selectproject?.task_lists?.length) {
                console.log("No task lists found, creating default task list");
                const taskListData = {
                    name: "Default Task List",
                    project: projectId,
                    description: "Default task list for project"
                };

                const response = await createTaskList(taskListData);
                console.log("Task list creation response:", response.data);

                if (!response.data) {
                    throw new Error("Failed to create task list - no response data");
                }

                const updatedProject = {
                    ...selectproject,
                    task_lists: [response.data]
                };
                setSelectProject(updatedProject);

                return response.data.id;
            }

            if (!selectproject.task_lists[0]?.id) {
                throw new Error("Task list exists but has no ID");
            }

            console.log("Using existing task list:", selectproject.task_lists[0]);
            return selectproject.task_lists[0].id;
        } catch (error) {
            console.error("Error ensuring task list:", error);
            throw new Error(`Failed to create task list: ${error.message}`);
        }
    };

    const handleEditProject = (project) => {
        event.stopPropagation();
        setEditingProject(project);
        setName(project.name);
        setDescription(project.description);
        setorganization(project.organization);
        setIsOpen(true);
    };

    const handleDeleteProject = async (projectId) => {
        event.stopPropagation();
        if (window.confirm(`Are you sure you want to delete this project?`)) {
            try {
                await deleteProject(projectId);
                setProjects(projects.filter((p) => p.id !== projectId));

                if (selectproject?.id == projectId) {
                    setSelectProject(null);
                    setTasks([]);
                }

                alert("Project deleted successfully")
                window.location.reload();
            } catch (error) {
                console.error("Error deleting project:", error);
            }
        }
    };

    const openCreateTaskModal = async () => {
        if (!selectproject) {
            alert("Please select a project first");
            return;
        }

        try {
            const taskListId = await ensureTaskList(selectproject.id);
            if (taskListId) {
                setEditingTask(null);
                setIsTaskModalOpen(true);
            } else {
                throw new Error("Could not create or find task list");
            }
        } catch (error) {
            alert("Error preparing task creation: " + error.message);
        }
    };

    const closeTaskModal = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert("Project name is required")
            return;
        }

        const projectData = {
            name,
            description,
            organization,
        }

        console.log("=== Project CREATION DEBUG ===")
        console.log("Project Data being sent:", projectData);
        console.log("Editing Project:", editingProject);
        console.log("==========================")

        try {
            if (editingProject) {
                await updateProject(editingProject.id, projectData)
                setProjects(
                    projects.map((p) =>
                        p.id === editingProject.id ? { ...p, ...projectData } : p
                    )
                );
                alert("project updated successfully")
            } else {
                const response = await createProject(projectData)
                setProjects([...projects, response.data]);
                alert("Project created successfully")
                setIsOpen(false);
                setEditingProject(null);
                setName('');
                setDescription('');
                setorganization('');
                window.location.reload()
            }
            onClose()
        } catch (error) {
            console.error("Error saving project:", error)
        }
    }

    if (loading && !projects.length) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
                                <p className="text-sm text-gray-500">Welcome back, {user?.username || 'User'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setIsChatOpen(true)}
                                className="flex items-center space-x-2"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>Chat</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowTeamManagement(true)}
                                className="flex items-center space-x-2"
                            >
                                <Users className="w-4 h-4" />
                                <span>Team</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate("/calender")}
                                className="flex items-center space-x-2"
                            >
                                <Calendar className="w-4 h-4" />
                                <span>Calendar</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate("/analytics")}
                                className="flex items-center space-x-2"
                            >
                                <BarChart3 className="w-4 h-4" />
                                <span>Analytics</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={logout}
                                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Stats Section */}
            {stats && (
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <TaskStats stats={stats} />
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="max-w-7xl mx-auto px-6 mb-6">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 pb-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar - Projects */}
                    <div className="col-span-12 lg:col-span-3">
                        <Card className="h-fit">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Projects</CardTitle>
                                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="w-4 h-4 mr-1" />
                                                New
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    {editingProject ? "Edit Project" : "Create New Project"}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="title">Title</Label>
                                                    <Input
                                                        id="title"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        placeholder="Project title"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={description}
                                                        onChange={(e) => setDescription(e.target.value)}
                                                        placeholder="Project description"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="organization">Organization ID</Label>
                                                    <Input
                                                        id="organization"
                                                        type="number"
                                                        value={organization}
                                                        onChange={(e) => setorganization(e.target.value)}
                                                        placeholder="Organization ID"
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline" onClick={() => {
                                                        setIsOpen(false);
                                                        setEditingProject(null);
                                                        setName('');
                                                        setDescription('');
                                                        setorganization('');
                                                    }}>
                                                        Cancel
                                                    </Button>
                                                </DialogClose>
                                                <Button onClick={handleSubmit}>
                                                    {editingProject ? "Update Project" : "Add Project"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {projects.length > 0 ? (
                                    <div className="space-y-1">
                                        {projects.map((proj) => (
                                            <div
                                                key={proj.id}
                                                className={`group relative p-4 mx-4 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                                    selectproject?.id === proj.id 
                                                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                                                        : 'hover:bg-gray-50 border border-transparent'
                                                }`}
                                                onClick={() => onSelect(proj)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-gray-900 truncate">
                                                            {proj.name}
                                                        </h3>
                                                        {proj.description && (
                                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                                {proj.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center mt-2 space-x-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {proj.task_lists?.length || 0} lists
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm" 
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0" 
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEditProject(proj)}>
                                                                Edit project
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => handleDeleteProject(proj.id)}
                                                            >
                                                                Delete project
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                            <Plus className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 mb-4">No projects yet</p>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setIsOpen(true)}
                                        >
                                            Create your first project
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-12 lg:col-span-9">
                        <Card className="min-h-[600px]">
                            <CardHeader className="border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {selectproject?.name || 'Select a Project'}
                                        </CardTitle>
                                        {selectproject?.description && (
                                            <CardDescription className="mt-1">
                                                {selectproject.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    {selectproject && (
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowFilters(!showFilters)}
                                                className="flex items-center space-x-2"
                                            >
                                                <Filter className="w-4 h-4" />
                                                <span>Filters</span>
                                            </Button>
                                            <Button 
                                                onClick={openCreateTaskModal}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add Task
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="p-6">
                                {/* Chat Interface */}
                                {isChatOpen && (
                                    <div className="mb-6">
                                        <ChatErrorBoundary>
                                            {user.username ? (
                                                <ChatInterface 
                                                    projectId={selectproject?.id} 
                                                    currentUser={user.username} 
                                                    onClose={() => setIsChatOpen(false)}
                                                />
                                            ) : (
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                                                    Please log in to access chat
                                                </div>
                                            )}
                                        </ChatErrorBoundary>
                                    </div>
                                )}

                                {/* Filters */}
                                {showFilters && selectproject && tasks.length > 0 && (
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-medium text-gray-900">Filters & Sorting</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowFilters(false)}
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            <select
                                                value={filters.status}
                                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Status</option>
                                                <option value="todo">To Do</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="done">Done</option>
                                            </select>

                                            <select
                                                value={filters.priority}
                                                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Priority</option>
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>

                                            <select
                                                value={filters.assignedTo}
                                                onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">All Assignees</option>
                                                {selectproject.members?.map(member => (
                                                    <option key={member.id} value={member.id}>
                                                        {member.name}
                                                    </option>
                                                ))}
                                            </select>

                                            <select
                                                value={sortBy}
                                                onChange={(e) => setSortBy(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">Sort By</option>
                                                <option value="dueDate">Due Date</option>
                                                <option value="priority">Priority</option>
                                                <option value="status">Status</option>
                                            </select>

                                            <Input
                                                type="date"
                                                value={filters.dueDate}
                                                onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                                                className="text-sm"
                                                placeholder="Due date"
                                            />

                                            <Button
                                                variant="outline"
                                                onClick={() => setFilters({
                                                    status: '',
                                                    priority: '',
                                                    dueDate: '',
                                                    assignedTo: '',
                                                    createdBy: '',
                                                })}
                                                className="text-sm"
                                            >
                                                Clear All
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Kanban Board or Empty State */}
                                {selectproject && tasks.length > 0 ? (
                                    <KanbanProvider 
                                        tasks={tasks}
                                        filters={filters} 
                                        sortBy={sortBy}
                                    >
                                        <KanbanBoard 
                                            projectId={selectproject.id} 
                                            taskListId={selectproject.task_lists?.[0]?.id} 
                                        />
                                    </KanbanProvider>
                                ) : selectproject ? (
                                    <div className="text-center py-16">
                                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Plus className="w-12 h-12 text-blue-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                                            Get started by creating your first task for this project.
                                        </p>
                                        <Button 
                                            onClick={openCreateTaskModal}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Your First Task
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Calendar className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a project</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto">
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
                <TaskModal 
                    isOpen={isTaskModalOpen} 
                    onClose={closeTaskModal} 
                    task={editingTask} 
                    projectId={selectproject?.id}
                    taskListId={selectproject?.task_lists?.[0]?.id} 
                    onSuccess={() => {
                        console.log("Task operation successful");
                        closeTaskModal();
                        const fetchTasks = async () => {
                            try {
                                const response = await getTasksByProject(selectproject.id);
                                setTasks(response.data.results || response.data);
                            } catch (error) {
                                console.error("Error fetching tasks:", error);
                            }
                        };
                        fetchTasks();
                    }}
                />
            )}

            {/* Team Management Modal */}
            {showTeamManagement && (
                <TeamManagement
                    project={selectproject}
                    onClose={() => setShowTeamManagement(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;