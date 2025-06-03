import React from 'react';

const TaskSorting = ({ sortBy, setSortBy }) => {
    return (
        <div className="flex gap-4 mb-4">
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border p-2 rounded"
            >
                <option value="">Sort By</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
            </select>
        </div>
    );
};

export default TaskSorting;