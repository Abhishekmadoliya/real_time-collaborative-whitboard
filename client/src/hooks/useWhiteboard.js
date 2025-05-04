import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket, emitDrawingUpdate, emitCursorMove, emitElementUpdate, emitElementDelete } from '../services/socketService';
// eslint-disable-next-line no-unused-vars
import { createYArray, getYDoc } from '../services/yjsService';

export const ElementTypes = {
  PENCIL: 'pencil',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  ELLIPSE: 'ellipse',
  TEXT: 'text',
  IMAGE: 'image'
};

export const useWhiteboard = (boardId) => {
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState('none'); // none, drawing, moving, resizing
  const [tool, setTool] = useState(ElementTypes.PENCIL);
  const [selectedElement, setSelectedElement] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteUserCursors, setRemoteUserCursors] = useState({});
  
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const elementsArrayRef = useRef(null);
  
  useEffect(() => {
    try {
      // Initialize Y.js elements array
      elementsArrayRef.current = createYArray('elements');
      
      // Set initial elements from Y.js array
      const initialElements = elementsArrayRef.current.toArray();
      setElements(initialElements);
      
      // Subscribe to changes in the elements array
      // eslint-disable-next-line no-unused-vars
      elementsArrayRef.current.observe(event => {
        const newElements = elementsArrayRef.current.toArray();
        setElements([...newElements]);
      });
    } catch (error) {
      console.error('Error initializing whiteboard:', error);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();
    
    // Listen for drawing updates from other users
    socket.on('drawing-update', data => {
      // eslint-disable-next-line no-unused-vars
      const { userId, element } = data;
      
      // Add the new element
      addElement(element, 'remote');
    });
    
    // Listen for cursor movement from other users
    socket.on('cursor-move', data => {
      const { userId, position } = data;
      
      setRemoteUserCursors(prev => ({
        ...prev,
        [userId]: position
      }));
    });
    
    // Listen for element updates from other users
    socket.on('element-update', data => {
      // eslint-disable-next-line no-unused-vars
      const { userId, elementId, updates } = data;
      
      updateElement(elementId, updates, 'remote');
    });
    
    // Listen for element deletion from other users
    socket.on('element-delete', data => {
      // eslint-disable-next-line no-unused-vars
      const { userId, elementId } = data;
      
      deleteElement(elementId, 'remote');
    });
    
    // Listen for user joined events
    socket.on('user-joined', data => {
      const { userId, activeUsers } = data;
      
      if (activeUsers) {
        setRemoteUsers(activeUsers.filter(id => id !== socket.id));
      } else {
        setRemoteUsers(prev => [...prev, userId]);
      }
    });
    
    // Listen for user left events
    socket.on('user-left', data => {
      const { userId, activeUsers } = data;
      
      if (activeUsers) {
        setRemoteUsers(activeUsers.filter(id => id !== socket.id));
      } else {
        setRemoteUsers(prev => prev.filter(id => id !== userId));
      }
      
      // Remove their cursor
      setRemoteUserCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[userId];
        return newCursors;
      });
    });
    
    return () => {
      // Clean up socket listeners
      socket.off('drawing-update');
      socket.off('cursor-move');
      socket.off('element-update');
      socket.off('element-delete');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [boardId]);
  
  const generateElementId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };
  
  const addElement = useCallback((element, source = 'local') => {
    if (!elementsArrayRef.current) return;
    
    // Add element to Y.js array
    // For local changes, also emit to other users
    if (source === 'local') {
      // Ensure element has an ID
      if (!element.id) {
        element.id = generateElementId();
      }
      
      // Add to Y.js array
      elementsArrayRef.current.push([element]);
      
      // Emit to other users
      emitDrawingUpdate(boardId, element);
    }
  }, [boardId]);
  
  const updateElement = useCallback((elementId, updates, source = 'local') => {
    if (!elementsArrayRef.current) return;
    
    // Find element index
    const index = elementsArrayRef.current.toArray().findIndex(el => el.id === elementId);
    
    if (index !== -1) {
      // Update in Y.js array
      const element = elementsArrayRef.current.get(index);
      const updatedElement = { ...element, ...updates };
      
      elementsArrayRef.current.delete(index);
      elementsArrayRef.current.insert(index, [updatedElement]);
      
      // Emit to other users if local change
      if (source === 'local') {
        emitElementUpdate(boardId, elementId, updates);
      }
    }
  }, [boardId]);
  
  const deleteElement = useCallback((elementId, source = 'local') => {
    if (!elementsArrayRef.current) return;
    
    // Find element index
    const index = elementsArrayRef.current.toArray().findIndex(el => el.id === elementId);
    
    if (index !== -1) {
      // Delete from Y.js array
      elementsArrayRef.current.delete(index);
      
      // Emit to other users if local change
      if (source === 'local') {
        emitElementDelete(boardId, elementId);
      }
    }
  }, [boardId]);
  
  const handleMouseDown = useCallback((event) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    isDrawingRef.current = true;
    
    // Create a new element based on the selected tool
    if (tool !== 'select') {
      const element = createNewElement(x, y);
      addElement(element);
      setSelectedElement(element);
      setAction('drawing');
    } else {
      // Check if clicked on an element
      const clickedElement = getElementAtPosition(x, y);
      if (clickedElement) {
        setSelectedElement(clickedElement);
        setAction('moving');
      } else {
        setSelectedElement(null);
        setAction('none');
      }
    }
  }, [tool, addElement]);
  
  const handleMouseMove = useCallback((event) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Emit cursor position to other users
    emitCursorMove(boardId, { x, y });
    
    if (!isDrawingRef.current) return;
    
    if (action === 'drawing') {
      // Update the element being drawn
      if (selectedElement) {
        const updatedElement = updateElementOnDraw(selectedElement, x, y);
        updateElement(selectedElement.id, updatedElement);
      }
    } else if (action === 'moving') {
      // Move the selected element
      if (selectedElement) {
        const updates = calculateMovement(selectedElement, x, y);
        updateElement(selectedElement.id, updates);
      }
    }
  }, [action, selectedElement, boardId, updateElement]);
  
  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    setAction('none');
  }, []);
  
  const createNewElement = (x, y) => {
    const id = generateElementId();
    
    switch (tool) {
      case ElementTypes.PENCIL:
        return {
          id,
          type: ElementTypes.PENCIL,
          points: [{ x, y }],
          strokeColor: '#000000',
          strokeWidth: 2
        };
      case ElementTypes.LINE:
        return {
          id,
          type: ElementTypes.LINE,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          strokeColor: '#000000',
          strokeWidth: 2
        };
      case ElementTypes.RECTANGLE:
        return {
          id,
          type: ElementTypes.RECTANGLE,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          strokeColor: '#000000',
          fillColor: 'transparent',
          strokeWidth: 2
        };
      case ElementTypes.ELLIPSE:
        return {
          id,
          type: ElementTypes.ELLIPSE,
          x1: x,
          y1: y,
          x2: x,
          y2: y,
          strokeColor: '#000000',
          fillColor: 'transparent',
          strokeWidth: 2
        };
      case ElementTypes.TEXT:
        return {
          id,
          type: ElementTypes.TEXT,
          x: x,
          y: y,
          text: 'Text',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000'
        };
      default:
        return null;
    }
  };
  
  const updateElementOnDraw = (element, x, y) => {
    switch (element.type) {
      case ElementTypes.PENCIL:
        return {
          points: [...element.points, { x, y }]
        };
      case ElementTypes.LINE:
      case ElementTypes.RECTANGLE:
      case ElementTypes.ELLIPSE:
        return {
          x2: x,
          y2: y
        };
      default:
        return {};
    }
  };
  
  const calculateMovement = (element, x, y) => {
    // Implement movement logic based on element type
    // This is a simplified example
    switch (element.type) {
      case ElementTypes.TEXT:
        return {
          x: x,
          y: y
        };
      case ElementTypes.PENCIL: {
        // Calculate movement for all points
        const offsetX = x - element.points[0].x;
        const offsetY = y - element.points[0].y;
        return {
          points: element.points.map(point => ({
            x: point.x + offsetX,
            y: point.y + offsetY
          }))
        };
      }
      case ElementTypes.LINE:
      case ElementTypes.RECTANGLE:
      case ElementTypes.ELLIPSE: {
        // Calculate movement while preserving size
        const width = element.x2 - element.x1;
        const height = element.y2 - element.y1;
        return {
          x1: x,
          y1: y,
          x2: x + width,
          y2: y + height
        };
      }
      default:
        return {};
    }
  };
  
  const getElementAtPosition = (x, y) => {
    // Find element at the click position
    // This is a simplified implementation
    return elements.find(element => {
      switch (element.type) {
        case ElementTypes.RECTANGLE:
          return (
            x >= Math.min(element.x1, element.x2) &&
            x <= Math.max(element.x1, element.x2) &&
            y >= Math.min(element.y1, element.y2) &&
            y <= Math.max(element.y1, element.y2)
          );
        // Implement other element type collision checks
        default:
          return false;
      }
    });
  };
  
  return {
    elements,
    remoteUsers,
    remoteUserCursors,
    tool,
    setTool,
    selectedElement,
    setSelectedElement,
    canvasRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    addElement,
    updateElement,
    deleteElement
  };
};
