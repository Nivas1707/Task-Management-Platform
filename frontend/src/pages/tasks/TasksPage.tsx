import { TaskList } from '../../components/dashboard/TaskList';

export const TasksPage = () => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                    Tasks
                </h1>
                <p className="text-gray-400 mt-1">Manage and organize your work</p>
            </div>

            <TaskList />
        </div>
    );
};
