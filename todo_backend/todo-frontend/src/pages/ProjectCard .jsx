const ProjectCard = ({ taskList }) => {
  return (
    <div className="mb-4 p-4 border rounded bg-white shadow">
      <h4 className="font-semibold text-lg mb-2">{taskList.name}</h4>
      {taskList.tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks yet</p>
      ) : (
        <ul className="list-disc pl-5">
          {taskList.tasks.map((task) => (
            <li key={task.id}>
              <strong>{task.title}</strong> - {task.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectCard;
