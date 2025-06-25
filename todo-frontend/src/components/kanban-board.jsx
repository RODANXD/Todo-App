"use client"

import { useState, useEffect } from "react"
import { useKanban } from "./kanban-provider"
import TaskCard from "./task-card"
import TaskModal from "./task-modal"
import ColumnModal from "./column-modal"
import { Button } from "../components/ui/button"
import { PlusCircle, Save, RotateCcw, MoreHorizontal, Plus } from "lucide-react"
import { deleteTask } from "../api/AxiosAuth"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"

export default function KanbanBoard({ projectId, taskListId }) {
  const { state, moveTask, saveData, loadData, deleteColumn } = useKanban()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editingColumn, setEditingColumn] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)


  // Debug logs
  useEffect(() => {
    console.log("KanbanBoard - Project ID:", projectId)
    console.log("KanbanBoard - Task List ID:", taskListId)
  }, [projectId, taskListId])

  const handleDragStart = (task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    setDragOverColumnId(columnId)
  }

  const handleDrop = (e, columnId) => {
    e.preventDefault()

    if (!draggedTask) return

    if (draggedTask.status !== columnId) {
      moveTask(draggedTask.id, draggedTask.status, columnId)
      console.log(`Task ${draggedTask.id} moved from ${draggedTask.status} to ${columnId}`)
    }

    setDraggedTask(null)
    setDragOverColumnId(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumnId(null)
  }

  const openCreateTaskModal = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const openEditTaskModal = (task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const closeTaskModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const openCreateColumnModal = () => {
    setEditingColumn(null)
    setIsColumnModalOpen(true)
  }

  const openEditColumnModal = (column) => {
    setEditingColumn(column)
    setIsColumnModalOpen(true)
  }

  const closeColumnModal = () => {
    setIsColumnModalOpen(false)
    setEditingColumn(null)
  }

  const handleDeleteColumn = (columnId) => {
    const tasksInColumn = state.tasks.filter((task) => task.status === columnId).length

    if (tasksInColumn > 0) {
      if (
        confirm(
          `This column contains ${tasksInColumn} tasks. Are you sure you want to delete it? All tasks in this column will be deleted.`,
        )
      ) {
        deleteColumn(columnId)
      }
    } else {
      deleteColumn(columnId)
    }
  }

  const handleTaskDelete = async(taskid)=>{
    try{
      await deleteTask(taskid);
      console.log("Task deleted successfully");
      alert("task deleted successfully")
    }
    catch(error){
      console.log("Error deleting task:", error);
      alert("Error deleting task")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={openCreateTaskModal} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Task
          </Button>
          <Button onClick={openCreateColumnModal} variant="outline" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Column
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveData} variant="outline" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Project
          </Button>
          {/* <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Load Project
          </Button> */}
        </div>
      </div>

      <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4 snap-x">
        {state.columns.map((column) => (
          <div
            key={column.id}
            className={`border rounded-lg p-3 bg-muted/30 min-w-[250px] max-w-[280px] flex-shrink-0 snap-start ${
              dragOverColumnId === column.id ? "ring-2 ring-primary/40 bg-accent/10" : ""
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            data-column-id={column.id}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full ${column.color} mr-2`}></div>
                <h2 className="font-semibold">{column.title}</h2>
                <div className="ml-2 bg-muted rounded-full px-2 py-0.5 text-xs">
                  {state.tasks.filter((task) => task.status === column.id).length}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Column actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditColumnModal(column)}>Edit Column</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteColumn(column.id)} className="text-red-600">
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className={`space-y-2 min-h-[200px] p-1.5 rounded-md transition-colors ${
                dragOverColumnId === column.id ? "bg-accent/20  outline-2 outline-dashed outline-accent/50" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              data-column-id={column.id}
            >
              {state.tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => openEditTaskModal(task)}
                    onDelete = {()=> handleTaskDelete(task.id)}
                    isDragging={draggedTask?.id === task.id}
                    onDragStart={() => handleDragStart(task)}
                    onDragEnd={handleDragEnd}
                  />
                ))}

              {state.tasks.filter((task) => task.status === column.id).length === 0 && (
                <div
                  className={`flex items-center justify-center h-40 border-2 border-dashed rounded-md ${
                    dragOverColumnId === column.id ? "bg-accent/20 border-primary/30" : "border-muted-foreground/20"
                  }`}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                  data-column-id={column.id}
                  data-empty-column="true"
                >
                  <p className="text-sm text-muted-foreground">Drop tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="border border-dashed rounded-lg p-3 flex items-center justify-center min-w-[250px] max-w-[280px] min-h-[300px] flex-shrink-0 snap-start">
          <Button variant="ghost" onClick={openCreateColumnModal} className="flex flex-col items-center p-8 h-auto">
            <Plus className="h-8 w-8 mb-2" />
            <span>Add Column</span>
          </Button>
        </div>
      </div>

      <TaskModal 
        isOpen={isTaskModalOpen} 
        onClose={closeTaskModal} 
        task={editingTask} 
        projectId={projectId}
        taskListId={taskListId} // Pass task list ID
      />
      <ColumnModal isOpen={isColumnModalOpen} onClose={closeColumnModal} column={editingColumn} />
    </div>
  )
}