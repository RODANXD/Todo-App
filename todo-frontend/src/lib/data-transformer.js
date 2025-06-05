// Transform backend data to kanban format
export const transformBackendData = (backendData) => {
  const columns = backendData.map((taskList) => ({
    id: taskList.id.toString(),
    title: taskList.name,
    color: getRandomColor(), // You can customize this based on your needs
  }))

  const tasks = backendData.flatMap((taskList) =>
    taskList.tasks.map((task) => ({
      id: task.id.toString(),
      title: task.title,
      description: task.description,
      status: task.tasklist.toString(), // Use tasklist ID as status
      priority: task.priority,
      dueDate: task.due_date,
      assignee: `User ${task.assigned_to}`, // You might want to fetch user names
      tasklistId: task.tasklist,
      createdBy: task.created,
    })),
  )

  return { columns, tasks }
}

// Helper function to assign colors to columns
const getRandomColor = () => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

// Transform kanban data back to backend format for API calls
export const transformToBackendFormat = (task, tasklistId) => ({
  title: task.title,
  description: task.description,
  status: task.status === "todo" ? "pending" : task.status === "in-progress" ? "in_progress" : "done",
  priority: task.priority,
  due_date: task.dueDate,
  assigned_to: Number.parseInt(task.assignee.replace("User ", "")) || 1, // Extract user ID
  tasklist: Number.parseInt(tasklistId),
})
