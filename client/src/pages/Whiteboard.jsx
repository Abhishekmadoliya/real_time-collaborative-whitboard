import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWhiteboard, ElementTypes } from '../hooks/useWhiteboard';
import { initializeSocket, joinBoard, leaveBoard, getSocket } from '../services/socketService';
import { initializeYDoc, applyYjsUpdate, destroyYDoc } from '../services/yjsService';
import { getBoard, updateBoardSettings } from '../services/boardService';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import UsersPanel from '../components/UsersPanel';
import { FaHome, FaSave, FaShareAlt } from 'react-icons/fa';

const Whiteboard = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [strokeWidth, setStrokeWidth] = useState(2);
  
  // Initialize the whiteboard hook
  // eslint-disable-next-line no-unused-vars
  const {
    elements,
    remoteUsers,
    remoteUserCursors,
    tool,
    setTool,
    // These variables are used by the hook internally but not directly in this component
    // eslint-disable-next-line no-unused-vars
    selectedElement,
    // eslint-disable-next-line no-unused-vars
    setSelectedElement,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    // eslint-disable-next-line no-unused-vars
    addElement,
    // eslint-disable-next-line no-unused-vars
    updateElement,
    deleteElement
  } = useWhiteboard(boardId);
  
  // Load board data when component mounts
  useEffect(() => {
    const loadBoard = async () => {
      try {
        setIsLoading(true);
        
        // Get board data
        const boardData = await getBoard(boardId);
        setBoard(boardData);
        
        // Initialize Y.js document
        initializeYDoc(boardId);
        
        // Initialize socket connection
        const token = localStorage.getItem('token');
        const socket = initializeSocket(token);
        
        // Join the board room
        joinBoard(boardId);
        
        // Setup YJS update listener
        socket.on('yjs-update', data => {
          const { update } = data;
          if (update && update.length > 0) {
            applyYjsUpdate(update);
          }
        });
        
        // Get initial sync
        socket.on('yjs-sync', data => {
          const { update } = data;
          if (update && update.length > 0) {
            applyYjsUpdate(update);
          }
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading whiteboard:', error);
        setError('Failed to load the whiteboard. Please try again later.');
        setIsLoading(false);
      }
    };
    
    loadBoard();
    
    // Cleanup function
    return () => {
      const socket = getSocket();
      if (socket) {
        // Leave the board room
        leaveBoard(boardId);
        
        // Remove socket listeners
        socket.off('yjs-update');
        socket.off('yjs-sync');
      }
      
      // Destroy Y.js document
      destroyYDoc();
    };
  }, [boardId]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Tool shortcuts
      if (e.key === 'v') setTool('select');
      else if (e.key === 'p') setTool(ElementTypes.PENCIL);
      else if (e.key === 'l') setTool(ElementTypes.LINE);
      else if (e.key === 'r') setTool(ElementTypes.RECTANGLE);
      else if (e.key === 'e') setTool(ElementTypes.ELLIPSE);
      else if (e.key === 't') setTool(ElementTypes.TEXT);
      
      // Undo/Redo
      if (e.ctrlKey && e.key === 'z') handleUndo();
      if (e.ctrlKey && e.key === 'y') handleRedo();
      
      // Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  const handleClear = () => {
    if (!window.confirm('Are you sure you want to clear the whiteboard?')) return;
    
    try {
      // Get all element IDs and delete them
      const elementIds = elements.map(el => el.id);
      elementIds.forEach(id => deleteElement(id));
      
      console.log('Whiteboard cleared');
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
      setError('Failed to clear the whiteboard. Please try again later.');
    }
  };
  
  const handleUndo = () => {
    // Implement undo functionality
    // This is a placeholder - actual implementation would require undo history
    console.log('Undo - functionality not implemented');
  };
  
  const handleRedo = () => {
    // Implement redo functionality
    // This is a placeholder - actual implementation would require redo history
    console.log('Redo - functionality not implemented');
  };
  
  const handleSave = async () => {
    try {
      // Save the board state
      console.log('Saving whiteboard...');
      
      // Update board settings
      if (board) {
        await updateBoardSettings(boardId, {
          backgroundColor: board.settings?.backgroundColor || '#ffffff',
          gridSize: board.settings?.gridSize || 20,
          showGrid: board.settings?.showGrid !== false
        });
      }
      
      console.log('Whiteboard saved successfully');
    } catch (error) {
      console.error('Error saving whiteboard:', error);
      setError('Failed to save the whiteboard. Please try again later.');
    }
  };
  
  const handleExport = () => {
    if (!canvasRef.current) return;
    
    // Create a temporary link to download the canvas as PNG
    const link = document.createElement('a');
    link.download = `whiteboard-${boardId}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleShareBoard = () => {
    // Implement share functionality
    // This could copy a shareable link to the clipboard
    const shareUrl = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Board link copied to clipboard!');
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">{error}</h2>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
            title="Back to Dashboard"
          >
            <FaHome />
          </button>
          <h1 className="text-xl font-bold">{board?.name || 'Untitled Board'}</h1>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaSave className="mr-2" /> Save
          </button>
          <button
            onClick={handleShareBoard}
            className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <FaShareAlt className="mr-2" /> Share
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <Toolbar
            currentTool={tool}
            setTool={setTool}
            strokeColor={strokeColor}
            setStrokeColor={setStrokeColor}
            fillColor={fillColor}
            setFillColor={setFillColor}
            strokeWidth={strokeWidth}
            setStrokeWidth={setStrokeWidth}
            onClear={handleClear}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSave}
            onExport={handleExport}
          />
        </div>
        
        {/* Users Panel */}
        <UsersPanel 
          users={remoteUsers} 
          currentUser={currentUser} 
        />
        
        {/* Canvas */}
        <div className="h-full w-full overflow-auto flex items-center justify-center">
          <Canvas
            canvasRef={canvasRef}
            elements={elements}
            remoteUserCursors={remoteUserCursors}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            width={board?.settings?.width || 1920}
            height={board?.settings?.height || 1080}
            backgroundColor={board?.settings?.backgroundColor || '#ffffff'}
            gridSize={board?.settings?.gridSize || 20}
            showGrid={board?.settings?.showGrid !== false}
          />
        </div>
      </div>
    </div>
  );
};

export default Whiteboard; 