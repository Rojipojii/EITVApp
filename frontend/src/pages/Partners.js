// src/pages/Partners.js
import React, { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { FaBold } from "react-icons/fa";
import { LiaItalicSolid } from "react-icons/lia";
import { FaUnderline } from "react-icons/fa";
import { FaAlignLeft } from "react-icons/fa";
import { FaAlignCenter } from "react-icons/fa";
import { FaAlignRight } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { FaRedo } from "react-icons/fa";
import { FaListUl } from "react-icons/fa";
import { FaListOl } from "react-icons/fa";
import { FaPalette } from "react-icons/fa"; // or use any other icon
import "./About.css";

export default function Partners() {
  const fileInputRef = useRef();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      TextStyle, // Required for color
      Color,     // Enables color support
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: "<p>Start editing your content...</p>",
  });

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({ src: reader.result }).run();
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handlePublish = () => {
    alert("Published HTML:\n\n" + editor.getHTML());
  };

  if (!editor) return null;

  return (
    <div className="editor-container">
      <div className="toolbar-top">
        <button onClick={handlePublish} className="publish-btn">Publish</button>
      </div>
      <div className="toolbar">
        {/* Formatting Buttons */}
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "active" : ""}> <FaBold /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "active" : ""}><LiaItalicSolid /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "active" : ""}><FaUnderline /></button>
        <button onClick={() => document.getElementById("text-color-picker").click()}><FaPalette /></button>
        <input
        id="text-color-picker"
        type="color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        style={{ display: "none" }}
        />
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive("strike") ? "active" : ""}>S</button>

        {/* Headings and Blocks */}
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code</button>

        {/* Lists */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}><FaListUl /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()}><FaListOl /></button>

        {/* Align */}
        <button onClick={() => editor.chain().focus().setTextAlign("left").run()}><FaAlignLeft /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("center").run()}><FaAlignCenter /></button>
        <button onClick={() => editor.chain().focus().setTextAlign("right").run()}><FaAlignRight /></button>

        {/* Undo/Redo */}
        <button onClick={() => editor.chain().focus().undo().run()}><FaUndo /></button>
        <button onClick={() => editor.chain().focus().redo().run()}><FaRedo /></button>

        {/* Image Upload */}
        <button onClick={triggerFileInput}>🖼️ Image</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </div>
      <EditorContent editor={editor} className="editor-class" />
    </div>
  );
}
