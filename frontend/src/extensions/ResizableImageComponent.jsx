import React, { useRef } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import './resizableImage.css';

const ResizableImageComponent = ({ node, updateAttributes }) => {
  const imgRef = useRef(null);

  const startResize = (e) => {
    const startX = e.clientX;
    const startWidth = imgRef.current.offsetWidth;

    const onMouseMove = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      updateAttributes({ width: `${newWidth}px` });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper className="resizable-image-wrapper">
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        style={{ width: node.attrs.width }}
        draggable={false}
      />
      <span className="resizer-handle" onMouseDown={startResize} />
      <NodeViewContent />
    </NodeViewWrapper>
  );
};

export default ResizableImageComponent;
