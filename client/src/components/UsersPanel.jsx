import { useState } from 'react';
import { FaUser, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const UsersPanel = ({ users, currentUser }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Generate a color based on user ID (for avatar)
  const getUserColor = (userId) => {
    const colors = [
      '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
      '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
      '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', 
      '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'
    ];
    
    // Simple hash function to convert userId to a stable number
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md z-10">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50"
        onClick={toggleCollapse}
      >
        <div className="flex items-center">
          <span className="font-medium">Users Online ({users.length + 1})</span>
        </div>
        {isCollapsed ? <FaChevronDown /> : <FaChevronUp />}
      </div>
      
      {!isCollapsed && (
        <div className="p-2 border-t">
          {/* Current user (you) */}
          <div className="flex items-center p-2 rounded hover:bg-gray-100">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white" 
              style={{ backgroundColor: '#4CAF50' }}
            >
              <FaUser />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {currentUser?.username || 'You'} <span className="text-green-500">(You)</span>
              </span>
            </div>
          </div>
          
          {/* Remote users */}
          {users.map(userId => (
            <div key={userId} className="flex items-center p-2 rounded hover:bg-gray-100">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white" 
                style={{ backgroundColor: getUserColor(userId) }}
              >
                <FaUser />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">User {userId.substring(0, 6)}</span>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-sm text-gray-500 py-2">
              No other users online
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsersPanel; 