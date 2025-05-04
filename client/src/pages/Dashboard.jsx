import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBoards, createBoard, deleteBoard } from '../services/boardService';
import { FaPlus, FaTrash, FaSignOutAlt, FaUser, FaEdit } from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const fetchedBoards = await getBoards();
        setBoards(Array.isArray(fetchedBoards) ? fetchedBoards : []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching boards:', error);
        setError('Failed to load whiteboards. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      if (!newBoardName.trim()) {
        return;
      }

      const newBoard = await createBoard({
        name: newBoardName,
        description: newBoardDescription
      });

      setBoards([...boards, newBoard]);
      setNewBoardName('');
      setNewBoardDescription('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating board:', error);
      setError('Failed to create whiteboard. Please try again later.');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Are you sure you want to delete this whiteboard?')) {
      return;
    }

    try {
      await deleteBoard(boardId);
      setBoards(boards.filter(board => board._id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
      setError('Failed to delete whiteboard. Please try again later.');
    }
  };

  const handleOpenBoard = (boardId) => {
    navigate(`/board/${boardId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Collaborative Whiteboard</h1>
          <div className="flex items-center">
            <div className="mr-4 flex items-center">
              <FaUser className="text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {currentUser?.username || 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your Whiteboards</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaPlus className="mr-2" /> Create Whiteboard
          </button>
        </div>

        {/* Boards grid */}
        {boards.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">You don't have any whiteboards yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create your first whiteboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map(board => (
              <div
                key={board._id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div
                  className="h-40 bg-gray-200 flex items-center justify-center cursor-pointer"
                  onClick={() => handleOpenBoard(board._id)}
                  style={{ backgroundColor: board.settings?.backgroundColor || '#ffffff' }}
                >
                  <div className="text-center p-4">
                    <FaEdit className="mx-auto h-10 w-10 text-gray-400" />
                    <p className="mt-2 text-gray-600">Click to open</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{board.name}</h3>
                    <button
                      onClick={() => handleDeleteBoard(board._id)}
                      className="text-red-500 hover:text-red-700"
                      title="Delete board"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  {board.description && (
                    <p className="mt-1 text-sm text-gray-500 truncate">{board.description}</p>
                  )}
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Created: {new Date(board.createdAt).toLocaleDateString()}</span>
                    <span>{board.collaborators?.length || 1} Users</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Whiteboard</h3>
            <form onSubmit={handleCreateBoard}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter whiteboard name"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter whiteboard description"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 