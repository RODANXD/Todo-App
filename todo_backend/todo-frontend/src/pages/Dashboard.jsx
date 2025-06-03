import React, { useState, useEffect } from 'react';
import { useauth } from '../store/AuthContext';

import { getProjects, getTasksByProject, getTaskStats } from '../api/AxiosAuth';
import KanbanBoard from '../components/kanban-board';
import { KanbanProvider } from '../components/kanban-provider';
import TeamManagement from '../components/TeamManagement';
import TaskStats from '../components/TaskStats';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from "../components/ui/textarea"
import { createProject } from '../api/AxiosAuth';
import {   Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger } from "../components/ui/dialog"

import { createTaskList } from '../api/AxiosAuth';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from '../components/ui/label';
import TaskModal from '../components/task-modal';
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



    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        dueDate: '',
        assignedTo: '',
        createdBy: '',
    });
    const [sortBy, setSortBy] = useState('');

    const { logout } = useauth();

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
                // Handle both paginated and non-paginated responses
                const taskListsData = response.data.results || response.data;
                console.log("Processed task lists data:", taskListsData);
                // Ensure taskListsData is an array
                const tasksArray = Array.isArray(taskListsData) ? taskListsData : [taskListsData];
                console.log("Tasks array:", tasksArray);
                setTasks(tasksArray);
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

        fetchStats();
    }, [selectproject]);

    const onSelect = (proj) => {
        setSelectProject(proj);
        console.log("Selected project:", proj);
    };

const ensureTaskList = async (projectId) => {
  try {
    // Check if project has task lists
    if (!selectproject?.task_lists?.length) {
      // Create default task list
      const response = await createTaskList(projectId, {
        name: "Default Task List",
        project: projectId
      });
      
      // Update the selected project with new task list
      setSelectProject(prev => ({
        ...prev,
        task_lists: [...(prev.task_lists || []), response.data]
      }));
      
      return response.data.id;
    }
    
    return selectproject.task_lists[0].id;
  } catch (error) {
    console.error("Error ensuring task list:", error);
    throw new Error("Failed to create task list");
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
        if (!name.trim()) return
      
        const taskData = {
          name,
          description,
        }
      
        console.log("=== Project CREATION DEBUG ===")
        console.log("Task Data being sent:", taskData)
        console.log("==========================")
        
        try {
          if (task) {
            // const updateResponse = await updateTask(task.id, taskData)
            updateTaskInState({ ...taskData, id: task.id })
          } else {
            const response = await createProject(taskData)
            // addTask({ 
            //   ...response.data, 
            //   id: response.data.id || crypto.randomUUID(),
            // //   project_id: parseInt(projectId),
            // //   task_list_id: parseInt(taskListId)
            // })
            
            alert("Task created sucessfully")
            window.location.reload()
          }
          onClose()
        } catch (error) {
          console.error("Error saving task:", error)
        }
      }

    if (loading && !projects.length) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 p-4 flex flex-col items-center gap-4">
            <div className="w-full flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="flex gap-4">
                    <Button 
                        onClick={() => setShowTeamManagement(true)}
                        className="bg-blue-600 px-4 py-2 rounded text-white"
                    >
                        Team Management
                    </Button>
                    <Button 
                        onClick={logout} 
                        className="bg-purple-700/80 px-4 py-2 rounded text-white"
                    >
                        Logout
                    </Button>
                </div>
            </div>

            {stats && <TaskStats stats={stats} />}

            {error && (
                <div className="w-full max-w-4xl p-4 mb-4 text-red-700 bg-red-100 rounded-md">
                    {error} 
                </div>
            )}

            <div className="w-full flex gap-4">
                <div className="w-64 border-r p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Projects</h3>
                    <Dialog >
                    <DialogTrigger asChild>
          <Button variant="outline">Add Project</Button>
        </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={name} onChange={(e) => setName(e.target.value)} placeholder="Task title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
            />
          </div>
          </div>
      <Button onClick={handleSubmit}>Add project</Button>
      </DialogContent>
      </Dialog>
      

                    
                    {projects.length > 0 ? (
                        <ul className="space-y-2">
                            {projects.map((proj) => (
                                <li
                                    key={proj.id}
                                    className={`p-2 rounded cursor-pointer transition-colors ${
                                        selectproject?.id === proj.id 
                                            ? 'bg-blue-100 text-blue-700' 
                                            : 'hover:bg-gray-100'
                                    }`}
                                    onClick={() => onSelect(proj)}
                                >
                                    {proj.name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <>
                        <p className="text-gray-500">No projects available</p>
                        
                        </>
                    
                    )}

                </div>
                
                <div className="flex-1 p-4 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-bold mb-4">
                        {selectproject?.name || 'Select a Project'}
                    </h2>
                    
                    {selectproject && tasks.length > 0 ? (
                        <>
                            <div className="w-full mb-4 flex flex-col gap-4">
                                <div className="flex gap-4 items-center flex-wrap">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className=" bg-violet-500/80 text-white p-2 rounded"
                                    >
                                        <option value="">Filter by Status</option>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="done">Done</option>
                                    </select>

                                    <select
                                        value={filters.priority}
                                        onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                        className=" bg-violet-500/80 text-white p-2 rounded"
                                    >
                                        <option value="">Filter by Priority</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>

                                    <select
                                        value={filters.assignedTo}
                                        onChange={(e) => setFilters(prev => ({ ...prev, assignedTo: e.target.value }))}
                                        className=" bg-violet-500/80 text-white p-2 rounded"
                                    >
                                        <option value="">Filter by Assignee</option>
                                        {selectproject.members?.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={filters.createdBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, createdBy: e.target.value }))}
                                        className=" bg-violet-500/80 text-white p-2 rounded"
                                    >
                                        <option value="">Filter by Creator</option>
                                        {selectproject.members?.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.name}
                                            </option>
                                        ))}
                                    </select>

                                    <Input
                                        type="date"
                                        value={filters.dueDate}
                                        onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                                        className="border p-2 bg-gray-600/80 text-white rounded max-w-24"
                                    />

                                    <Button
                                        onClick={() => setFilters({
                                            status: '',
                                            priority: '',
                                            dueDate: '',
                                            assignedTo: '',
                                            createdBy: '',
                                        })}
                                        className="bg-gray-700/80 px-4  py-2 rounded hover:bg-gray-300"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="border bg-violet-500/80 text-white p-2 rounded"
                                    >
                                        <option value="">Sort By</option>
                                        <option value="dueDate">Due Date</option>
                                        <option value="priority">Priority</option>
                                        <option value="status">Status</option>
                                        <option value="assignedTo">Assignee</option>
                                        <option value="createdBy">Creator</option>
                                    </select>
                                </div>
                            </div>

                            <KanbanProvider 
                                tasks={tasks}
                                filters={filters} 
                                sortBy={sortBy}
                            >
                                <KanbanBoard 
                                    projectId={selectproject.id} 
                                    taskListId={tasks[0].id} 
                                />
                            </KanbanProvider>
                        </>
                    ) : (
                        <>
                        {selectproject ? (
    <div className="text-center p-8">
        <p className="text-gray-500 mb-4">No tasks available for this project.</p>
        <Button 
            onClick={openCreateTaskModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
            Add Your First Task
        </Button>
        {isTaskModalOpen && (
    <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={closeTaskModal} 
        task={editingTask} 
        projectId={selectproject.id}
        taskListId={selectproject.task_lists?.[0]?.id} 
        onSuccess={() => {
            closeTaskModal();
            // Refresh tasks
            fetchTaskLists();
        }}
            />
        )}
    </div>
) : (
    <div className="text-center p-8">
        <p className="text-gray-500">Please select a project to add tasks</p>
    </div>
)}
                        </>
                    )}
                </div>
            </div>

            {showTeamManagement && (
                <TeamManagement
                    project={selectproject}
                    onClose={() => setShowTeamManagement(false)}
                />
            )}
        </main>
    );
};

export default Dashboard;