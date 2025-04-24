import React, { useEffect, useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";

const ItemType = "MENU_ITEM";

const MenuItem = ({ item, index, moveItem }) => {
  const [, ref] = useDrag({
    type: ItemType,
    item: { index },
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <tr ref={(node) => ref(drop(node))} className="border-b hover:bg-gray-100 cursor-grab">
      <td className="p-5 text-xl flex items-center justify-start space-x-4">
        <span className="text-gray-400 text-2xl">⋮⋮</span>
        <span>{item.name}</span>
      </td>
    </tr>
  );
};

const MenuArrangement = () => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch("https://gallisalli.com/app/menu");
        const data = await response.json();
        setMenuItems(data); // Fix here: Use 'data' instead of 'response.data'
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };

    fetchMenuItems();
  }, []);

  const moveItem = (fromIndex, toIndex) => {
    const updatedItems = [...menuItems];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    
    console.log(`Moving item:`, movedItem);
    console.log(`From index: ${fromIndex}, To index: ${toIndex}`);
  
    updatedItems.splice(toIndex, 0, movedItem);
    setMenuItems(updatedItems);
  
    // Update positions in backend
    const updatedPositions = updatedItems.map((item, index) => ({
      id: item.menu_id,
      position: index + 1,
    }));
  
    console.log("Updated positions to be sent:", updatedPositions);
  
    axios
      .post("https://gallisalli.com/app/menu/update", updatedPositions)
      .then(() => console.log("Positions updated"))
      .catch((err) => console.error("Error updating positions:", err));
  };
  

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ width: "400px", margin: "auto", textAlign: "left" }}>
        <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Reorder Menu</h2>
          <div className="p-5 border border-gray-300 rounded-lg bg-white shadow-md w-full">
            <p className="text-gray-500 text-base mb-3">Drag items using the handle</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-5 text-left text-xl">Menu Item</th>
                </tr>
              </thead>
              <tbody>
                {menuItems.map((item, index) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    index={index}
                    moveItem={moveItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default MenuArrangement;
