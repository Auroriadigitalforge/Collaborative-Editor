import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Search, Plus, Globe, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  selectedDocumentId: Id<"documents"> | null;
  onSelectDocument: (id: Id<"documents"> | null) => void;
  user: any;
}

export function Sidebar({ selectedDocumentId, onSelectDocument, user }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocIsPublic, setNewDocIsPublic] = useState(false);

  const documents = useQuery(api.documents.list);
  const searchResults = useQuery(api.documents.search, { query: searchQuery });
  const createDocument = useMutation(api.documents.create);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    try {
      const id = await createDocument({
        title: newDocTitle.trim(),
        isPublic: newDocIsPublic,
      });
      onSelectDocument(id);
      setNewDocTitle("");
      setNewDocIsPublic(false);
      setShowCreateForm(false);
      toast.success("Document created successfully");
    } catch (error) {
      toast.error("Failed to create document");
    }
  };

  const handleDeleteDocument = async (id: Id<"documents">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument({ id });
      if (selectedDocumentId === id) {
        onSelectDocument(null);
      }
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const displayDocuments = searchQuery.trim() 
    ? searchResults || []
    : documents 
      ? [...documents.private, ...documents.public]
      : [];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Create Document Button */}
      <div className="p-4 border-b border-gray-200">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Document</span>
          </button>
        ) : (
          <form onSubmit={handleCreateDocument} className="space-y-3">
            <input
              type="text"
              placeholder="Document title..."
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={newDocIsPublic}
                onChange={(e) => setNewDocIsPublic(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isPublic" className="text-sm text-gray-600">
                Make public
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewDocTitle("");
                  setNewDocIsPublic(false);
                }}
                className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Documents List */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() && documents && (
          <>
            {/* Private Documents */}
            {documents.private.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Private Documents
                </h3>
                <div className="space-y-1">
                  {documents.private.map((doc) => (
                    <DocumentItem
                      key={doc._id}
                      document={doc}
                      isSelected={selectedDocumentId === doc._id}
                      onSelect={() => onSelectDocument(doc._id)}
                      onDelete={(e) => handleDeleteDocument(doc._id, e)}
                      canDelete={doc.createdBy === user?._id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Public Documents */}
            {documents.public.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Public Documents
                </h3>
                <div className="space-y-1">
                  {documents.public.map((doc) => (
                    <DocumentItem
                      key={doc._id}
                      document={doc}
                      isSelected={selectedDocumentId === doc._id}
                      onSelect={() => onSelectDocument(doc._id)}
                      onDelete={(e) => handleDeleteDocument(doc._id, e)}
                      canDelete={doc.createdBy === user?._id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Search Results */}
        {searchQuery.trim() && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Search Results ({searchResults?.length || 0})
            </h3>
            <div className="space-y-1">
              {displayDocuments.map((doc) => (
                <DocumentItem
                  key={doc._id}
                  document={doc}
                  isSelected={selectedDocumentId === doc._id}
                  onSelect={() => onSelectDocument(doc._id)}
                  onDelete={(e) => handleDeleteDocument(doc._id, e)}
                  canDelete={doc.createdBy === user?._id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {documents && documents.private.length === 0 && documents.public.length === 0 && !searchQuery.trim() && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No documents yet</p>
            <p className="text-xs mt-1">Create your first document to get started</p>
          </div>
        )}

        {searchQuery.trim() && searchResults?.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No documents found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DocumentItemProps {
  document: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  canDelete: boolean;
}

function DocumentItem({ document, isSelected, onSelect, onDelete, canDelete }: DocumentItemProps) {
  return (
    <div
      onClick={onSelect}
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 border border-blue-200"
          : "hover:bg-gray-50"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {document.isPublic ? (
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-gray-900 truncate">
            {document.title}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(document.updatedAt).toLocaleDateString()}
        </p>
      </div>
      
      {canDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
