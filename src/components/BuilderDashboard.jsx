import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BuilderDashboard = () => {
    const [builder, setBuilder] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddProject, setShowAddProject] = useState(false);
    const [newProject, setNewProject] = useState({
        title: '',
        description: '',
        location: '',
        total_units: '',
        price_range: '',
        completion_date: '',
        status: 'Under Construction',
        image_urls: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is builder
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'builder') {
            navigate('/');
            return;
        }

        // Fetch builder profile and projects
        fetchBuilderProfile();
    }, [navigate]);

    const fetchBuilderProfile = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await fetch(`http://localhost:5000/api/builders/${user.id}`);
            const data = await response.json();
            setBuilder(data);
            fetchProjects(data.id);
        } catch (error) {
            console.error('Error fetching builder profile:', error);
            setError('Failed to load builder profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async (builderId) => {
        try {
            const response = await fetch(`http://localhost:5000/api/builders/${builderId}/projects`);
            const data = await response.json();
            setProjects(data);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Failed to load projects');
        }
    };

    const handleAddProject = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/builders/${builder.id}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newProject),
            });
            const data = await response.json();
            if (response.ok) {
                setShowAddProject(false);
                setNewProject({
                    title: '',
                    description: '',
                    location: '',
                    total_units: '',
                    price_range: '',
                    completion_date: '',
                    status: 'Under Construction',
                    image_urls: ''
                });
                fetchProjects(builder.id);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert('Error creating project: ' + error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-gray-600">{error}</p>
                    <button
                        onClick={fetchBuilderProfile}
                        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Builder Dashboard</h1>
                        <p className="text-sm text-gray-500">{builder?.company_name}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Projects Section */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Projects</h2>
                        <button
                            onClick={() => setShowAddProject(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            Add New Project
                        </button>
                    </div>
                    <div className="border-t border-gray-200">
                        <div className="px-4 py-5 sm:p-6">
                            {projects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {projects.map((project) => (
                                        <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
                                            <div className="p-6">
                                                <h3 className="text-lg font-medium text-gray-900">{project.title}</h3>
                                                <p className="mt-2 text-sm text-gray-500">{project.description}</p>
                                                <div className="mt-4 space-y-2">
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Location:</span> {project.location}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Total Units:</span> {project.total_units}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Price Range:</span> {project.price_range}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <span className="font-medium">Status:</span>{' '}
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                            project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                            project.status === 'Under Construction' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {project.status}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center">No projects found</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Project Modal */}
                {showAddProject && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Project</h3>
                            <form onSubmit={handleAddProject}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Title</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProject.title}
                                            onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            required
                                            value={newProject.description}
                                            onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            rows="3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Location</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProject.location}
                                            onChange={(e) => setNewProject({...newProject, location: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Total Units</label>
                                        <input
                                            type="number"
                                            required
                                            value={newProject.total_units}
                                            onChange={(e) => setNewProject({...newProject, total_units: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Price Range</label>
                                        <input
                                            type="text"
                                            required
                                            value={newProject.price_range}
                                            onChange={(e) => setNewProject({...newProject, price_range: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Completion Date</label>
                                        <input
                                            type="date"
                                            value={newProject.completion_date}
                                            onChange={(e) => setNewProject({...newProject, completion_date: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={newProject.status}
                                            onChange={(e) => setNewProject({...newProject, status: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="Under Construction">Under Construction</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Upcoming">Upcoming</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Image URLs (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={newProject.image_urls}
                                            onChange={(e) => setNewProject({...newProject, image_urls: e.target.value})}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddProject(false)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Add Project
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BuilderDashboard; 