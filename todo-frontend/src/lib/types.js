// Task interface
export const createTask = (id, title, description, status, priority, dueDate, assignee) => ({
  id,
  title,
  description,
  status,
  priority,
  dueDate,
  assignee,
})

// Column interface
export const createColumn = (id, title, color) => ({
  id,
  title,
  color,
})
