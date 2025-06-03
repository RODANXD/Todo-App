"use client"

import React from 'react';
import { useDroppable } from "@dnd-kit/core"
import TaskCard from "./task-card"

const DroppableColumn = ({ id, title, color, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: {
      type: "column",
      column: { id, title, color },
    },
  })

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="text-sm text-gray-500">
          {React.Children.count(children.props.children)} tasks
        </span>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default DroppableColumn;
