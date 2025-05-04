import { useState } from 'react';
import { ElementTypes } from '../hooks/useWhiteboard';
import { HexColorPicker } from 'react-colorful';
import { 
  FaPencilAlt, 
  FaSlash, 
  FaSquare, 
  FaCircle, 
  FaFont, 
  FaImage, 
  FaMousePointer,
  FaTrash,
  FaPalette,
  FaUndo,
  FaRedo,
  FaSave,
  FaPlus,
  FaMinus,
  FaDownload
} from 'react-icons/fa';

const Toolbar = ({ 
  currentTool, 
  setTool, 
  strokeColor,
  setStrokeColor,
  fillColor,
  setFillColor,
  strokeWidth,
  setStrokeWidth,
  onClear,
  onUndo,
  onRedo,
  onSave,
  onExport
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState('stroke'); // 'stroke' or 'fill'

  const tools = [
    { name: 'select', icon: <FaMousePointer />, tooltip: 'Select & Move (V)' },
    { name: ElementTypes.PENCIL, icon: <FaPencilAlt />, tooltip: 'Pencil (P)' },
    { name: ElementTypes.LINE, icon: <FaSlash />, tooltip: 'Line (L)' },
    { name: ElementTypes.RECTANGLE, icon: <FaSquare />, tooltip: 'Rectangle (R)' },
    { name: ElementTypes.ELLIPSE, icon: <FaCircle />, tooltip: 'Ellipse (E)' },
    { name: ElementTypes.TEXT, icon: <FaFont />, tooltip: 'Text (T)' },
    { name: ElementTypes.IMAGE, icon: <FaImage />, tooltip: 'Image (I)' }
  ];

  const handleStrokeWidthChange = (value) => {
    const newWidth = Math.max(1, Math.min(20, strokeWidth + value));
    setStrokeWidth(newWidth);
  };

  const handleColorClick = (type) => {
    setActiveColor(type);
    setShowColorPicker(prev => !prev);
  };

  const handleColorChange = (color) => {
    if (activeColor === 'stroke') {
      setStrokeColor(color);
    } else {
      setFillColor(color);
    }
  };

  return (
    <div className="flex flex-col bg-white border border-gray-300 rounded-lg shadow-md p-2 w-14">
      {/* Drawing Tools */}
      <div className="flex flex-col space-y-2 mb-4">
        {tools.map(tool => (
          <button
            key={tool.name}
            onClick={() => setTool(tool.name)}
            className={`p-2 rounded-lg hover:bg-gray-100 relative group ${
              currentTool === tool.name ? 'bg-blue-100 text-blue-600' : ''
            }`}
            title={tool.tooltip}
          >
            {tool.icon}
            <span className="absolute left-full ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 whitespace-nowrap">
              {tool.tooltip}
            </span>
          </button>
        ))}
      </div>

      {/* Color Selection */}
      <div className="flex flex-col space-y-2 mb-4">
        <button
          onClick={() => handleColorClick('stroke')}
          className="p-2 rounded-lg hover:bg-gray-100 relative group"
          title="Stroke Color"
        >
          <div 
            className="w-5 h-5 rounded-full border border-gray-400" 
            style={{ backgroundColor: strokeColor }}
          />
        </button>
        <button
          onClick={() => handleColorClick('fill')}
          className="p-2 rounded-lg hover:bg-gray-100 relative group"
          title="Fill Color"
        >
          <div 
            className="w-5 h-5 rounded-full border border-gray-400" 
            style={{ backgroundColor: fillColor }}
          />
        </button>
        
        {showColorPicker && (
          <div className="absolute left-16 z-10 bg-white p-2 rounded-lg shadow-lg">
            <HexColorPicker 
              color={activeColor === 'stroke' ? strokeColor : fillColor} 
              onChange={handleColorChange} 
            />
          </div>
        )}
      </div>

      {/* Stroke Width */}
      <div className="flex flex-col space-y-2 mb-4">
        <button
          onClick={() => handleStrokeWidthChange(1)}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Increase Stroke Width"
        >
          <FaPlus />
        </button>
        <div className="text-center text-xs">{strokeWidth}px</div>
        <button
          onClick={() => handleStrokeWidthChange(-1)}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Decrease Stroke Width"
        >
          <FaMinus />
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col space-y-2 mt-auto">
        <button
          onClick={onUndo}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Undo (Ctrl+Z)"
        >
          <FaUndo />
        </button>
        <button
          onClick={onRedo}
          className="p-2 rounded-lg hover:bg-gray-100"
          title="Redo (Ctrl+Y)"
        >
          <FaRedo />
        </button>
        <button
          onClick={onClear}
          className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
          title="Clear Canvas"
        >
          <FaTrash />
        </button>
        <button
          onClick={onSave}
          className="p-2 rounded-lg hover:bg-gray-100 text-green-500"
          title="Save (Ctrl+S)"
        >
          <FaSave />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-lg hover:bg-gray-100 text-blue-500"
          title="Export as PNG"
        >
          <FaDownload />
        </button>
      </div>
    </div>
  );
};

export default Toolbar; 