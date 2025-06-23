import React from 'react';

const TaskStats = ({ stats }) => {
    console.log('TaskStats stats:', stats);
    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Completed This Week</h3>
                <p className="text-3xl font-bold text-green-600">
                    {stats.completed_this_week}
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Overdue Tasks</h3>
                <p className="text-3xl font-bold text-red-600">
                    {stats.overdue_tasks}
                </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Time Spent (This Week)</h3>
                <div className="space-y-2">
                    {stats.time_per_task.slice(0, 3).map((task) => (
                        <div key={task.task__id} className="flex justify-between">
                            <span className="text-gray-600">{task.task__title}</span>
                            <span className="font-medium">
                                
                                {formatDuration(task.total_time)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Project Time</h3>
                <div className="space-y-2">
                    {stats.time_per_project.map((project) => (
                        <div key={project.task__project__id} className="flex justify-between">
                            <span className="text-gray-600">{project.task__project__name}</span>
                            <span className="font-medium">
                                {formatDuration(project.total_time)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TaskStats; 