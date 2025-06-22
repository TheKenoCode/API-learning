"use client";

import { useState } from "react";
import { UserAvatar } from "@/components/ui/enhanced-avatar";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Reply,
  Flag,
  Edit,
  Trash2,
  ArrowRight
} from "lucide-react";
import { formatTimeShort } from "@/lib/utils";

// Types for the comment data structure
interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  };
  isLikedByUser: boolean;
  _count: {
    likes: number;
    replies: number;
  };
  replies?: CommentData[];
  parentId?: string | null;
}

interface CommentThreadProps {
  comments: CommentData[];
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onOpenReplyModal?: (commentId: string, authorName: string, content: string) => void;
  currentUserId: string;
  currentUser?: {
    imageUrl?: string | null;
    name?: string | null;
    firstName?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
  };
  maxDepth?: number;
}

interface SingleCommentProps {
  comment: CommentData;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onOpenReplyModal?: (commentId: string, authorName: string, content: string) => void;
  currentUserId: string;
  currentUser?: {
    imageUrl?: string | null;
    name?: string | null;
    firstName?: string | null;
    emailAddresses?: Array<{ emailAddress: string }>;
  };
  depth?: number;
  maxDepth?: number;
}

function SingleComment({
  comment,
  onLikeComment,
  onDeleteComment,
  onOpenReplyModal,
  currentUserId,
  currentUser,
  depth = 0,
  maxDepth = 5,
}: SingleCommentProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReplies, setShowReplies] = useState(depth < 1);

  const isOwner = comment.author.id === currentUserId;
  const canReply = depth < 3; // Reduced max depth for better mobile UX

  const handleReply = () => {
    if (onOpenReplyModal) {
      onOpenReplyModal(comment.id, comment.author.name || "Anonymous", comment.content);
    }
  };

  const handleLike = () => {
    onLikeComment(comment.id);
  };

  // More mobile-friendly indentation - much less aggressive
  const getMobileIndent = (depth: number) => {
    if (depth === 0) return "";
    if (depth === 1) return "ml-2 md:ml-6"; // 8px mobile, 24px desktop
    if (depth === 2) return "ml-3 md:ml-12"; // 12px mobile, 48px desktop  
    return "ml-4 md:ml-16"; // 16px mobile, 64px desktop (max)
  };

  // Better avatar sizing for mobile
  const getAvatarSize = (depth: number) => {
    if (depth === 0) return "w-9 h-9 md:w-10 md:h-10"; // Larger on mobile
    if (depth === 1) return "w-8 h-8 md:w-9 md:h-9"; // Still reasonable on mobile
    return "w-7 h-7 md:w-8 md:h-8"; // Minimum readable size
  };

  // Get mobile-optimized padding for comment cards
  const getCardPadding = (depth: number) => {
    if (depth === 0) return "p-5 md:p-5"; // Generous padding for top-level
    if (depth === 1) return "p-4 md:p-5"; // Good padding for first level
    return "p-4 md:p-4"; // Adequate padding for deep nesting
  };

  return (
    <div className={`relative ${getMobileIndent(depth)}`}>
      {/* Visual thread line for nested comments on desktop */}
      {depth > 0 && (
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px bg-white/5 -ml-3" />
      )}
      
      {/* Mobile: Show depth indicator */}
      {depth > 0 && (
        <div className="md:hidden flex items-center gap-2 mb-3 px-1">
          <ArrowRight className="w-3 h-3 text-white/40" />
          <span className="text-white/50 text-xs font-medium">Replying to {comment.author.name || "Anonymous"}</span>
        </div>
      )}

      <div className="w-full">
        <div className="group relative">
          {/* Mobile-optimized comment card */}
          <div className={`bg-white/[0.03] md:bg-gradient-to-br md:from-white/[0.04] md:to-white/[0.01] border border-white/10 rounded-xl md:rounded-2xl ${getCardPadding(depth)}`}>
            {/* Comment header with profile picture inside */}
            <div className="flex items-start justify-between mb-4 md:mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <UserAvatar 
                  user={comment.author}
                  size={depth > 2 ? 'sm' : depth > 0 ? 'md' : 'lg'}
                  className={getAvatarSize(depth)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold text-sm md:text-base truncate">
                      {comment.author.name || "Anonymous"}
                    </span>
                    <span className="text-white/40 text-xs">•</span>
                    <span className="text-white/50 text-xs md:text-sm">
                      {formatTimeShort(new Date(comment.createdAt))}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Desktop actions menu */}
              <div className="relative hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="w-8 h-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                
                {showActions && (
                  <div className="absolute right-0 top-8 bg-black/90 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl z-10 min-w-[140px]">
                    <div className="py-2">
                      {isOwner ? (
                        <>
                          <button className="w-full px-4 py-2 text-left text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 text-sm transition-colors">
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              onDeleteComment(comment.id);
                              setShowActions(false);
                            }}
                            className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 text-sm transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="w-full px-4 py-2 text-left text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 text-sm transition-colors">
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Comment content */}
            <p className="text-white/90 text-base md:text-base leading-7 md:leading-relaxed mb-5 md:mb-4 break-words whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Mobile-optimized action buttons */}
            <div className="flex items-center gap-2 md:gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 h-auto transition-all duration-300 ${
                  comment.isLikedByUser 
                    ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20' 
                    : 'text-white/60 hover:text-red-500 hover:bg-red-500/10'
                }`}
              >
                <Heart className={`w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5 ${comment.isLikedByUser ? 'fill-current' : ''}`} />
                <span className="text-xs font-medium">{comment._count.likes || ""}</span>
              </Button>

              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReply}
                  className="rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 h-auto transition-all duration-300 text-blue-500 hover:bg-blue-500/10"
                >
                  <Reply className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
                  <span className="text-xs font-medium">Reply</span>
                </Button>
              )}

              {/* Mobile actions menu */}
              <div className="md:hidden ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  className="w-8 h-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
                
                {showActions && (
                  <div className="absolute right-0 top-8 bg-black/95 border border-white/20 rounded-xl shadow-2xl backdrop-blur-xl z-20 min-w-[120px]">
                    <div className="py-1">
                      {isOwner ? (
                        <>
                          <button className="w-full px-3 py-2 text-left text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 text-sm transition-colors">
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              onDeleteComment(comment.id);
                              setShowActions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 text-sm transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </>
                      ) : (
                        <button className="w-full px-3 py-2 text-left text-white/70 hover:text-white hover:bg-white/10 flex items-center gap-2 text-sm transition-colors">
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-optimized replies toggle */}
        {comment._count.replies > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="rounded-lg md:rounded-xl px-2 md:px-3 py-1.5 h-auto text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 mt-2 text-xs md:text-sm"
          >
            <MessageCircle className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" />
            <span className="font-medium">
              {showReplies ? 'Hide' : 'Show'} {comment._count.replies} {comment._count.replies === 1 ? 'reply' : 'replies'}
            </span>
          </Button>
        )}

        {/* Nested replies with improved mobile spacing */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 md:mt-4 space-y-4 md:space-y-4">
            {comment.replies.map((reply) => (
              <SingleComment
                key={reply.id}
                comment={reply}
                onLikeComment={onLikeComment}
                onDeleteComment={onDeleteComment}
                onOpenReplyModal={onOpenReplyModal}
                currentUserId={currentUserId}
                currentUser={currentUser}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentThread({
  comments,
  onLikeComment,
  onDeleteComment,
  onOpenReplyModal,
  currentUserId,
  currentUser,
  maxDepth = 5,
}: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-white/40">
        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {comments.map((comment) => (
        <SingleComment
          key={comment.id}
          comment={comment}
          onLikeComment={onLikeComment}
          onDeleteComment={onDeleteComment}
          onOpenReplyModal={onOpenReplyModal}
          currentUserId={currentUserId}
          currentUser={currentUser}
          depth={0}
          maxDepth={maxDepth}
        />
      ))}
    </div>
  );
} 