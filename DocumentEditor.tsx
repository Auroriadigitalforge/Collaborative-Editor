import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useBlockNoteSync } from "@convex-dev/prosemirror-sync/blocknote";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteEditor } from "@blocknote/core";
import usePresence from "@convex-dev/presence/react";
import FacePile from "@convex-dev/presence/facepile";
import { useState, useEffect } from "react";
import { Globe, Lock, Edit3, Check, X } from "lucide-react";
import { toast } from "sonner";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface DocumentEditorProps {
  documentId: Id<"documents">;
  onTitleChange: () => void;
}

export function DocumentEditor({ documentId, onTitleChange }: DocumentEditorProps) {
  const document = useQuery(api.documents.get, { id: documentId });
  const userId = useQuery(api.presence.getUserId);
  const updateTitle = useMutation(api.documents.updateTitle);
  const updateVisibility = useMutation(api.documents.updateVisibility);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  const sync = useBlockNoteSync<BlockNoteEditor>(api.prosemirror, documentId);
  const presenceState = usePresence(api.presence, documentId, userId || "");

  useEffect(() => {
    if (document) {
      setEditedTitle(document.title);
    }
  }, [document]);

  const handleTitleSave = async () => {
    if (!editedTitle.trim() || !document) return;

    try {
      await updateTitle({
        id: documentId,
        title: editedTitle.trim(),
      });
      setIsEditingTitle(false);
      onTitleChange();
      toast.success("Title updated");
    } catch (error) {
      toast.error("Failed to update title");
      setEditedTitle(document.title);
    }
  };

  const handleTitleCancel = () => {
    setEditedTitle(document?.title || "");
    setIsEditingTitle(false);
  };

  const handleVisibilityToggle = async () => {
    if (!document) return;

    try {
      await updateVisibility({
        id: documentId,
        isPublic: !document.isPublic,
      });
      toast.success(`Document is now ${!document.isPublic ? "public" : "private"}`);
    } catch (error) {
      toast.error("Failed to update visibility");
    }
  };

  if (document === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (document === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600">This document may have been deleted or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Document Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Title */}
            <div className="flex items-center space-x-2 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") handleTitleCancel();
                    }}
                    className="flex-1 text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleTitleSave}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleTitleCancel}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-1">
                  <h1 className="text-xl font-semibold text-gray-900">{document.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Visibility Toggle */}
            <button
              onClick={handleVisibilityToggle}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors ${
                document.isPublic
                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {document.isPublic ? (
                <>
                  <Globe className="w-4 h-4" />
                  <span>Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Private</span>
                </>
              )}
            </button>
          </div>

          {/* Presence */}
          <div className="flex items-center space-x-4">
            <FacePile presenceState={presenceState ?? []} />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden bg-white">
        {sync.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : sync.editor ? (
          <div className="h-full">
            <BlockNoteView 
              editor={sync.editor} 
              className="h-full"
              theme="light"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() => sync.create({ type: "doc", content: [] })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Initialize Document
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
