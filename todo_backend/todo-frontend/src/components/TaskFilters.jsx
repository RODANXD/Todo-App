import React from 'react';

const TaskFilters = ({ filters, setFilters }) => {
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="flex gap-4 mb-4">
            <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="border p-2 rounded"
            >
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
            </select>

            <input
                type="date"
                value={filters.dueDate || ''}
                onChange={(e) => handleFilterChange('dueDate', e.target.value)}
                className="border p-2 rounded"
            />

            <input
                type="text"
                placeholder="Tags"
                value={filters.tags || ''}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
                className="border p-2 rounded"
            />

            <input
                type="text"
                placeholder="Assignee"
                value={filters.assignee || ''}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="border p-2 rounded"
            />
        </div>
    );
};

export default TaskFilters;