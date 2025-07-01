"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useKanban } from "./kanban-provider"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
// import { toast } from "react-hot-toast";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Label } from "../components/ui/label"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { format } from "date-fns"
import { createTask, updateTask } from "../api/AxiosAuth" // Import API functions
import { createTaskWithList, getProjectMembers } from "../api/AxiosAuth";

// import { updateTask } from "../api/AxiosAuth"

export default function TaskModal({ isOpen, onClose, task, projectId, taskListId }) {
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

  //   useEffect(() => {
  //   const fetchProjectMembers = async () => {
  //     try {
  //       const response = await getProjectMembers(projectId);
  //       setProjectMembers(response.data);
  //     } catch (error) {
  //       console.error('Error fetching project members:', error);
  //     }
  //   };

  //   if (isOpen && projectId) {
  //     fetchProjectMembers();
  //   }
  // }, [isOpen, projectId]);

  const handleSubmit = async () => {
  if (!title.trim()){
     alert("Title is required");
    return;
    }

  if (!taskListId) {
    alert("No task list available. Please try again.");
    return;
  }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status: status || "todo",
      priority: priority || "medium",
      due_date: dueDate instanceof Date ? dueDate.toISOString() : null,
      project: projectId,
      task_list: taskListId,
      assigned_to: assignee || null,
      dependencies: dependency ? [dependency] : []
  }

  // console.log("=== TASK CREATION DEBUG ===")
  // console.log("Task Data being sent:", taskData)
  // console.log("Project ID:", projectId, "Type:", typeof projectId)
  // console.log("Task List ID:", taskListId, "Type:", typeof taskListId)
  // console.log("==========================")
  
try {
    if (isSubmitting) return;
      setIsSubmitting(true);
    if (task) {
      console.log("task.id: ", task.id)
      const updateResponse = await updateTask(task.id, taskData);
      onClose()
      // updateTaskInState({ ...taskData, id: task.id })
      console.log("Task updated:", updateResponse.data)
      toast.success("Task updated successfully");
      // alert("task updated successfully")
      // window.location.reload();
    } else {
      const response = await createTaskWithList(taskData)
      // addTask({ 
      //   ...response.data, 
      //   id: response.data.id || crypto.randomUUID(),
      //   // project_id: parseInt(projectId),
      //   // task_list_id: parseInt(taskListId)
      //   project: projectId,
      //   task_list: taskListId
      // })
          if (response.data) {
            addTask(response.data);
              toast.success("Task created successfully");
              // window.location.reload();
              onClose();
            }
      
      alert("Task created sucessfully")
      // window.location.reload()
    }
    onClose()
  } catch (error) {
    if (error.response?.data?.task_list) {
      // Handle invalid task list error
      alert("Invalid task list. Please refresh the page and try again.");
      console.error("Task list error:", error.response.data);
    } else {
      console.error("Error saving task:", error);
      alert("Error " + (task ? "updating" : "creating") + " task: " + 
        (error.response?.data?.detail || error.message));
    }
    const errorMessage = error.response?.data?.detail || error.message;
    toast.error(`Error: ${errorMessage}`);
    console.error("Error saving task:", error);
  }
  finally {
    setIsSubmitting(false);
  }
}
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
              <Label htmlFor="dependecy">dependecy</Label>
                            <Input
                id="dependecy"
                value={dependency}
                onChange={(e) => setDependency(e.target.value)}
                placeholder="Dependencies"
              />

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