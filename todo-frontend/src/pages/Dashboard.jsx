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
import {MoreHorizontal} from 'lucide-react'
import CalendarPage from '../components/Calender';
import {   Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger } from "../components/ui/dialog"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"

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
    const [organization, setorganization] = useState('');
    const [editingProject, setEditingProject] = useState(null);

const navigate = useNavigate();

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
                const filteredTask = tasksArray.filter(task=> task.project === selectproject.id);
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
        
        // Set the selected project first
        setSelectProject(proj);
        setTasks([]); // clear tasks
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Ensure task list exists
        if (!proj.task_lists?.length) {
            console.log("No task lists found, creating one for project", proj.id);
            const taskListId = await ensureTaskList(proj.id);
            console.log("Created task list with ID:", taskListId);
            
            // Fetch updated project data to get the new task list
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

    // Check if project has task lists
    if (!selectproject?.task_lists?.length) {
      // Create default task list
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

      // Update the selected project with new task list
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
  if (window.confirm(`Are you sure you want to delete project "${projectId}"?`)) {
    try {
      await deleteProject(projectId);
      setProjects(projects.filter((p) => p.id !== projectId));


      if (selectproject?.id == projectId){
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
            alert("Projectname is required")
            return;
            
        }
      
        const projectData = {
          name,
          description,
          organization,
        }
      
        console.log("=== Project CREATION DEBUG ===")
        // console.log("Task Data being sent:", taskData)
        console.log("Project Data being sent:", projectData);
        console.log("Editing Project:", editingProject);
        console.log("==========================")
        
        try {
          if (editingProject) {
            // const updateResponse = await updateTask(task.id, taskData)
            await updateProject(editingProject.id, projectData)
            setProjects(
              projects.map((p) =>
                p.id === editingProject.id ? { ...p, ...projectData } : p
              )
            );
            alert("project update successfully")

            // updateTaskInState({ ...taskData, id: task.id })
          } else {
            const response = await createProject(projectData)
            setProjects([...projects, response.data]);
            // addTask({ 
            //   ...response.data, 
            //   id: response.data.id || crypto.randomUUID(),
            // //   project_id: parseInt(projectId),
            // //   task_list_id: parseInt(taskListId)
            // })
            
            alert("Task created sucessfully")
                    setIsOpen(false);
        setEditingProject(null);
        setName('');
        setDescription('');
        setorganization('');
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
        <main className="min-h-screen p-4 flex flex-col items-center gap-4">
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
                    <Button onClick={() => navigate("/calender")}>Calender</Button>
                    <Button onClick={() => navigate("/analytics")} >Anaytics</Button>
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
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button variant="outline">Add Project</Button>
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 " onClick={(e)=> e.stopPropagation()}>
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
                        {selectproject?.name || 'Select a Project'} <br />
                        <span className='text-gray-500 text-sm'>{selectproject?.description}</span>
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
                                    taskListId={selectproject.task_lists?.[0]?.id} 
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
        projectId={selectproject?.id}
        taskListId={selectproject?.task_lists?.[0]?.id} 
        onSuccess={() => {
            console.log("Task operation successful");
            closeTaskModal();
            // Refresh tasks
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