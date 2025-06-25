"use client";
import { useRef } from "react";
import { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getTaskLists } from "../api/AxiosAuth";

const defaultColumns = [
  { id: "todo", title: "To Do", color: "bg-blue-500" },
  { id: "in_progress", title: "In Progress", color: "bg-yellow-500" },
  { id: "done", title: "Done", color: "bg-green-500" },
];

const initialState = {
  tasks: [],
  columns: defaultColumns,
};

const KanbanContext = createContext(undefined);

function kanbanReducer(state, action) {
  switch (action.type) {
    case "SET_TASKS":
      return {
        ...state,
        tasks: action.tasks,
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, action.task],
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.task.id ? action.task : task
        ),
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.taskId),
      };
    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id === action.taskId) {
            return { ...task, status: action.destinationColumn };
          }
          return task;
        }),
      };
    case "ADD_COLUMN":
      return {
        ...state,
        columns: [...state.columns, action.column],
      };
    case "UPDATE_COLUMN":
      return {
        ...state,
        columns: state.columns.map((column) =>
          column.id === action.column.id ? action.column : column
        ),
      };
    case "DELETE_COLUMN":
      return {
        ...state,
        columns: state.columns.filter((column) => column.id !== action.columnId),
        tasks: state.tasks.filter((task) => task.status !== action.columnId),
      };
    case "LOAD_DATA":
      return action.data;
    default:
      return state;
  }
}

const transformTaskStatus = (task) => {
  // Transform backend status to match frontend column IDs if needed
  const statusMap = {
    todo: "todo",
    in_progress: "in_progress",
    done: "done",
  };

  return {
    ...task,
    status: statusMap[task.status] || task.status,
  };
};

export function KanbanProvider({ children, tasks=[], filters, sortBy }) {
  const [state, dispatch] = useReducer(kanbanReducer, initialState);
  const lastTasksRef = useRef([]);


  const filterTasks = (tasks) => {
    return tasks.filter((task) => {
      const matchesStatus = !filters.status || task.status === filters.status;
      const matchesPriority =
        !filters.priority || task.priority === filters.priority;
      const matchesDueDate =
        !filters.dueDate ||
        new Date(task.due_date).toISOString().split("T")[0] === filters.dueDate;

      return matchesStatus && matchesPriority && matchesDueDate;
    });
  };

  const sortTasks = (tasks) => {
    if (!sortBy) return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return new Date(a.due_date) - new Date(b.due_date);
        case "priority": {
          const priorityOrder = { low: 1, medium: 2, high: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        case "status": {
          const statusOrder = { todo: 1, in_progress: 2, done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    // if (taskListId) {
    //   getTaskLists(taskListId)
    //     .then((response) => {
    //       console.log("Task list response:", response.data);
    //       // Handle both single task and array of tasks
    //       const tasksData = Array.isArray(response.data) ? response.data : [response.data];
    //       console.log("Processed tasks data:", tasksData);
          
    //       if (tasksData.length > 0) {
    //         let transformedTasks = tasksData.map(transformTaskStatus);
    //         transformedTasks = filterTasks(transformedTasks);
    //         transformedTasks = sortTasks(transformedTasks);
    //         dispatch({ type: "SET_TASKS", tasks: transformedTasks });
    //         toast.success("Tasks loaded successfully");
    //       } else {
    //         toast.error("No tasks found");
    //       }
    //     })
    //     .catch((error) => {
    //       console.error("Error loading tasks:", error);
    //       toast.error(
    //         "Failed to load tasks: " +
    //           (error.response?.data?.detail || error.message)
    //       );
    //     });
    // }
    const transformed = tasks.map(transformTaskStatus);
    const filtered = filterTasks(transformed);
    const sorted = sortTasks(filtered);

    const tasksChanged = JSON.stringify(sorted) !== JSON.stringify(lastTasksRef.current);

    if (tasksChanged) {
      dispatch({ type: "SET_TASKS", tasks: sorted });
      lastTasksRef.current = sorted;
    }

  }, [tasks, filters, sortBy]);

  const addTask = (taskData) => {
    const newTask = {
      id: getUUID(),
      ...taskData,
    };
    dispatch({ type: "ADD_TASK", task: newTask });
    toast.success("Task added successfully");
  };

  const updateTask = (task) => {
    dispatch({ type: "UPDATE_TASK", task });
    toast.success("Task updated successfully");
  };

  const deleteTask = (taskId) => {
    dispatch({ type: "DELETE_TASK", taskId });
    toast.success("Task deleted successfully");
  };

  const moveTask = (taskId, sourceColumn, destinationColumn) => {
    const destinationColumnExists = state.columns.some(
      (col) => col.id === destinationColumn
    );

    if (!destinationColumnExists) {
      toast.error(`Column "${destinationColumn}" does not exist`);
      return;
    }

    dispatch({ type: "MOVE_TASK", taskId, sourceColumn, destinationColumn });

    const columnTitle =
      state.columns.find((c) => c.id === destinationColumn)?.title ||
      destinationColumn;
    toast.success(`Task moved to ${columnTitle}`);
  };

  const addColumn = (columnData) => {
    const id = columnData.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (state.columns.some((col) => col.id === id)) {
      toast.error("A column with a similar name already exists");
      return;
    }

    const newColumn = {
      id,
      ...columnData,
    };
    dispatch({ type: "ADD_COLUMN", column: newColumn });
    toast.success("Column added successfully");
  };

  const updateColumn = (column) => {
    dispatch({ type: "UPDATE_COLUMN", column });
    toast.success("Column updated successfully");
  };

  const deleteColumn = (columnId) => {
    dispatch({ type: "DELETE_COLUMN", columnId });
    toast.success("Column deleted successfully");
  };

  const saveData = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kanban-data", JSON.stringify(state));
      toast.success("Project data saved successfully");
    }
  };

  const loadData = () => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("kanban-data");
      if (savedData) {
        dispatch({ type: "LOAD_DATA", data: JSON.parse(savedData) });
        toast.success("Project data loaded successfully");
      } else {
        toast.error("No saved data found");
      }
    }
  };

  return (
    <KanbanContext.Provider
      value={{
        state,
        addTask,
        updateTask,
        deleteTask,
        moveTask,
        addColumn,
        updateColumn,
        deleteColumn,
        saveData,
        loadData,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
}

export function useKanban() {
  const context = useContext(KanbanContext);
  if (context === undefined) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
}

function getUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
