"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useKanban } from "./kanban-provider"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command"
// import { toast } from "react-hot-toast";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from "../components/ui/label"
import { CalendarIcon,ChevronsUpDown, Check } from "lucide-react"
import { Calendar } from "../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { format } from "date-fns"
import { createTask, updateTask, createTaskList, getTasksByProject } from "../api/AxiosAuth" // Import API functions
import { createTaskWithList, getProjectMembers } from "../api/AxiosAuth";

// import { updateTask } from "../api/AxiosAuth"

export default function TaskModal({ isOpen, onClose, task, projectId, taskListId, onSuccess }) {
  const { state, addTask, updateTask: updateTaskInState } = useKanban()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("todo")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState(new Date())
  const [assignee, setAssignee] = useState("")
  const [projectMembers, setProjectMembers] = useState([]);
  const [dependency, setDependency] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectproject, setSelectProject] = useState(null)
  const [, setForceUpdate] = useState(0);
  const [allTasks, setAllTasks] = useState([])
  const [open, setOpen] = useState(false);

  // console.log("project id-----------", projectId)


  useEffect(() => {
    if (isOpen) {
      if (task) {
      // Format existing task data
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date ? new Date(task.due_date) : new Date());
      setAssignee(task.assigned_to || "");
      setDependency(task.dependencies?.[0] || "");
    } else {
      // Reset form for new task
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setDueDate(new Date());
      setAssignee("");
      setDependency("");
    }
    }
  }, [isOpen, task, state.columns])

    useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const response = await getProjectMembers(projectId);
        setProjectMembers(response.data);
      } catch (error) {
        console.error('Error fetching project members:', error);
      }
    };

    if (isOpen && projectId) {
      fetchProjectMembers();
    }
  }, [isOpen, projectId]);


  useEffect(()=>{
    const fetchAlltasks = async ()=>{
      if (!projectId) return;
      try{
        const response = await getTasksByProject(projectId)
        // console.log("project dataaaa -------", response)
        let tasks = response.data.results || response.data;
        tasks = tasks.filter(t => t.project === projectId);
        if (task && task.id){
          tasks = tasks.filter(t=> t.id!== task.id);
        }
        setAllTasks(tasks)
      } catch (error){
        toast.error("Error fetching all tasks for dependency:", error)
      }
    }
    if(isOpen) fetchAlltasks();

  },[isOpen,projectId,task])
const ensureTaskList = async (projectId) => {
    try {
      if (!selectproject?.task_lists?.length) {
        const taskListData = {
          name: "Default Task List",
          project: projectId,
          description: "Default task list for project",
        }

        const response = await createTaskList(taskListData)
        if (!response.data) {
          throw new Error("Failed to create task list - no response data")
        }

        const updatedProject = {
          ...selectproject,
          task_lists: [response.data],
        }
        setSelectProject(updatedProject)

        return response.data.id
      }

      if (!selectproject.task_lists[0]?.id) {
        throw new Error("Task list exists but has no ID")
      }

      return selectproject.task_lists[0].id
    } catch (error) {
      console.error("Error ensuring task list:", error)
      throw new Error(`Failed to create task list: ${error.message}`)
    }
  }


  const handleSubmit = async () => {
  if (!title.trim()) {
    toast.warning("Title is required");
    return;
  }

  const effectiveProjectId = projectId || selectproject?.id;
  let effectiveTaskListId = taskListId;

  if (!effectiveTaskListId) {
    try {
      effectiveTaskListId = await ensureTaskList(effectiveProjectId);
    } catch (error) {
      toast.error("Error preparing task creation: " + error.message);
      return;
    }
  }

  if (!effectiveTaskListId) {
    toast.error("No task list available. Please try again.");
    return;
  }

  const taskData = {
    title: title.trim(),
    description: description.trim(),
    status: status || "todo",
    priority: priority || "medium",
    due_date: dueDate instanceof Date ? dueDate.toISOString() : null,
    project: effectiveProjectId,
    task_list: effectiveTaskListId,
    assigned_to: assignee || null,
    dependencies: dependency ? [dependency] : []
  };

  try {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (task) {
      // Update existing task
      const updateResponse = await updateTask(task.id, taskData);
      updateTaskInState({ ...updateResponse.data });
      toast.success("Task updated successfully");
      if (typeof onSuccess === "function") onSuccess();
      if (typeof onClose === "function") onClose();
    } else {
      // Create new task
      const response = await createTaskWithList(taskData);
      if (response.data) {
        addTask(response.data);
        toast.success("Task created successfully");
        if (typeof onSuccess === "function") onSuccess();
        if (typeof onClose === "function") onClose();
      }
    }
  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.message;
    toast.error(`Error: ${errorMessage}`)
  
    console.error(`Error: ${errorMessage}`);
    console.error("Error saving task:", error);
  } finally {
    setIsSubmitting(false);
  }
};
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create New Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {state.columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignee">Assignee</Label>
                            <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Assignee name"
              />
              <div className=" grid gap-2">
                 <Label htmlFor="dependency">Dependency</Label>
                 <Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      {dependency
        ? allTasks.find((t) => t.id.toString() === dependency)?.title
        : "Select dependency"}
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-full p-0">
    <Command>
      <CommandInput placeholder="Search task..." />
      <CommandList>
        <CommandEmpty>No task found.</CommandEmpty>
        <CommandGroup>
          {allTasks.map((task) => (
            <CommandItem
              key={task.id}
              value={`${task.title} ${task.id}`} // <-- for search
              onSelect={() => {
                setDependency(task.id.toString())
                setOpen(false)
              }}
            >
              <Check
                className={
                  "mr-2 h-4 w-4 " +
                  (dependency === task.id.toString() ? "opacity-100" : "opacity-0")
                }
              />
              {task.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
              </div>

              {/* <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger id="assignee">
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {projectMembers.map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select> */}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>{task ? "Update Task" : "Create Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}