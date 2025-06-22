import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  X, 
  Send, 
  ImageIcon, 
  MapPin,
  ArrowLeft 
} from "lucide-react";

interface CreateContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => void;
  type: 'post' | 'comment' | 'reply';
  title?: string;
  placeholder?: string;
  maxLength?: number;
  allowMedia?: boolean;
  isLoading?: boolean;
  currentUser?: {
    imageUrl?: string;
    name?: string;
    firstName?: string;
  };
  replyingTo?: {
    name?: string;
    content?: string;
  };
}

export default function CreateContentModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  title,
  placeholder,
  maxLength = 280,
  allowMedia = false,
  isLoading = false,
  currentUser,
  replyingTo
}: CreateContentModalProps) {
  const [content, setContent] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
  };

  const handleClose = () => {
    setContent("");
    onClose();
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'post': return 'Create Post';
      case 'comment': return 'Add Comment';
      case 'reply': return `Reply to ${replyingTo?.name || 'comment'}`;
      default: return 'Create';
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (type) {
      case 'post': return "What's happening in your automotive world?";
      case 'comment': return "Add a comment...";
      case 'reply': return `Reply to ${replyingTo?.name || 'this comment'}...`;
      default: return "Write something...";
    }
  };

  return (
    <>
      {/* Mobile Modal (Bottom Sheet) */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom duration-300">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        {/* Modal Sheet */}
        <div className="relative bg-black border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Handle Bar */}
          <div className="flex justify-center pt-2 pb-3">
            <div className="w-12 h-1 bg-white/20 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white">{getTitle()}</h3>
            <button
              onClick={handleClose}
              className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Replying To Context (for replies) */}
          {type === 'reply' && replyingTo && (
            <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Replying to {replyingTo.name}</span>
              </div>
              {replyingTo.content && (
                <div className="text-white/50 text-sm line-clamp-2 italic pl-6">
                  &ldquo;{replyingTo.content}&rdquo;
                </div>
              )}
            </div>
          )}
          
          {/* Content Area */}
          <div className="px-4 py-4 overflow-y-auto max-h-[60vh]">
            <div className="flex gap-3 mb-4">
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <AvatarImage 
                  src={currentUser?.imageUrl || ""} 
                  alt={currentUser?.name || ""} 
                  onError={() => {
                    // Silently handle image load error
                  }}
                />
                <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white">
                  {currentUser?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <textarea
                  placeholder={getPlaceholder()}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-0 bg-transparent border-0 text-white placeholder-white/40 resize-none focus:outline-none text-base leading-relaxed min-h-[120px]"
                  rows={type === 'post' ? 6 : 4}
                  maxLength={maxLength}
                  autoFocus
                  style={{ scrollbarWidth: 'none' }}
                />
              </div>
            </div>
            
            {/* Media Options (only for posts) */}
            {allowMedia && type === 'post' && (
              <div className="flex gap-2 mb-4">
                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 rounded-xl px-4 py-2">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Photo
                </Button>
                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 rounded-xl px-4 py-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  Location
                </Button>
              </div>
            )}
          </div>
          
          {/* Action Bar */}
          <div className="px-4 py-3 border-t border-white/5 bg-black/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/40">{content.length}/{maxLength}</span>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isLoading || content.length > maxLength}
                className="bg-red-500 hover:bg-red-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-red-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>{type === 'post' ? 'Post' : type === 'comment' ? 'Comment' : 'Reply'}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
          
          {/* Safe area padding */}
          <div className="h-safe-area-inset-bottom bg-black" />
        </div>
      </div>
      
      {/* Desktop Modal (Card Style) */}
      <div className="hidden sm:block fixed inset-0 z-50">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        />
        
        {/* Modal Container - Centered */}
        <div className="flex items-center justify-center min-h-screen px-4">
          {/* Modal Card */}
          <div className="relative bg-gradient-to-br from-black via-black to-gray-900 border border-white/20 rounded-2xl shadow-2xl max-w-xl w-full max-h-[70vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.02]">
              <h3 className="text-white font-semibold text-lg">{getTitle()}</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleClose}
                className="text-white/60 hover:text-white rounded-full p-2 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Replying To Context (for replies) */}
            {type === 'reply' && replyingTo && (
              <div className="px-4 py-3 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Replying to {replyingTo.name}</span>
                </div>
                {replyingTo.content && (
                  <div className="text-white/50 text-sm line-clamp-2 italic pl-6 bg-white/5 rounded-lg p-2 border-l-2 border-red-500/30">
                    &ldquo;{replyingTo.content}&rdquo;
                  </div>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <AvatarImage 
                    src={currentUser?.imageUrl || ""} 
                    alt={currentUser?.name || ""} 
                    onError={() => {
                      // Silently handle image load error
                    }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white">
                    {currentUser?.name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <textarea
                    placeholder={getPlaceholder()}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 text-base leading-relaxed min-h-[100px]"
                    rows={type === 'post' ? 5 : 3}
                    maxLength={maxLength}
                    autoFocus
                  />
                  
                  {/* Media Options (only for posts) */}
                  {allowMedia && type === 'post' && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 rounded-xl px-3 py-2">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Photo
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10 rounded-xl px-3 py-2">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/[0.02]">
              <span className="text-white/40 text-sm">{content.length}/{maxLength}</span>
              <Button 
                onClick={handleSubmit}
                disabled={!content.trim() || isLoading || content.length > maxLength}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 text-white rounded-xl px-6 py-2.5 font-semibold transition-all duration-300 shadow-lg shadow-red-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    <span>{type === 'post' ? 'Post' : type === 'comment' ? 'Comment' : 'Reply'}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 