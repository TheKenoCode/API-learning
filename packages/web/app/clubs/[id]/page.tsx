"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/trpc";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/enhanced-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  Users, 
  MapPin, 
  Calendar, 
  Target, 
  Plus, 
  Share2,
  Settings,
  Globe,
  Lock,
  Trophy,
  Activity,
  MessageSquare,
  Heart,
  Eye,
  UserPlus,
  UserMinus,
  ArrowLeft,
  ThumbsUp,
  CalendarDays,
  Zap,
  Clock,
  Shield,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTimeShort } from "@/lib/utils";
import CommentThread from "@/components/CommentThread";
import CreateContentModal from "@/components/CreateContentModal";
import AdminDashboard from "@/components/club/AdminDashboard";

// Create Club Form Component
function CreateClubForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    city: "",
    territory: "",
    isPrivate: false,
    imageUrl: "",
  });
  
  const createClubMutation = api.club.create.useMutation({
    onSuccess: (club) => {
      router.push(`/clubs/${club.id}`);
    },
    onError: () => {
      // Error will be handled by tRPC error boundary
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    try {
      await createClubMutation.mutateAsync(formData);
    } catch (error) {
      // Error handling is done in onError callback
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-black to-red-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.1),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-full border border-red-500/20 mb-4">
              <Crown className="w-4 h-4 text-red-500" />
              <span className="text-red-400 text-sm font-medium">CREATE CLUB</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Start Your <span className="text-red-500">Elite Community</span>
            </h1>
            <p className="text-white/70 text-lg">
              Build the ultimate automotive club and lead your community to victory
            </p>
          </div>
        </div>
      </div>

      {/* Create Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-red-500" />
              Club Details
            </CardTitle>
            <CardDescription className="text-white/60">
              Configure your club settings and make it stand out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Club Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-white font-medium text-sm">
                  Club Name *
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Elite Street Legends"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-white font-medium text-sm">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your club's mission, values, and what makes it special..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 min-h-[100px]"
                  rows={4}
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-white font-medium text-sm">
                    City
                  </label>
                  <input
                    id="city"
                    type="text"
                    placeholder="e.g. Los Angeles"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="territory" className="block text-white font-medium text-sm">
                    State/Territory
                  </label>
                  <input
                    id="territory"
                    type="text"
                    placeholder="e.g. California"
                    value={formData.territory}
                    onChange={(e) => handleInputChange("territory", e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <label htmlFor="imageUrl" className="block text-white font-medium text-sm">
                  Club Image URL
                </label>
                <input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/your-club-logo.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10"
                />
              </div>

              {/* Privacy Setting */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {formData.isPrivate ? (
                      <Lock className="w-4 h-4 text-orange-400" />
                    ) : (
                      <Globe className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-white font-medium">
                      {formData.isPrivate ? "Private Club" : "Public Club"}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    {formData.isPrivate 
                      ? "Only members can see posts and join by invite" 
                      : "Anyone can see and join your club"
                    }
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => handleInputChange("isPrivate", e.target.checked)}
                  className="w-4 h-4 text-red-500 bg-white/5 border-white/20 rounded focus:ring-red-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!formData.name.trim() || createClubMutation.isLoading}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3"
                >
                  {createClubMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating Club...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Create Club
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * Club Page Component
 * 
 * Displays a single club's details, posts, events, challenges, and members.
 * Handles club management for admins and moderators.
 * 
 * Features:
 * - Public/Private club viewing based on membership
 * - Post creation and interaction (likes, comments)
 * - Event management and attendance tracking
 * - Challenge participation
 * - Member management for admins
 * - Join/Leave functionality
 * 
 * TODO: Add real-time updates for posts/comments
 * TODO: Implement image upload for posts
 * TODO: Add notification system for club activities
 */
export default function ClubPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  
  // Tab management
  const [activeTab, setActiveTab] = useState("overview");
  const [adminDefaultTab, setAdminDefaultTab] = useState("members");
  
  // Modal state for creating/viewing content
  const [modalState, setModalState] = useState<{
    type: 'post' | 'comment' | 'reply' | 'postDetail' | null;
    isOpen: boolean;
    postId?: string;
    parentCommentId?: string;
    replyingTo?: { name: string; content: string };
    postData?: any; // For post detail modal
  }>({
    type: null,
    isOpen: false
  });

  // Separate modal state for nested comment creation (when post detail is open)
  const [commentModalState, setCommentModalState] = useState<{
    isOpen: boolean;
    postId?: string;
    parentCommentId?: string;
    replyingTo?: { name: string; content: string };
  }>({
    isOpen: false
  });




  // Only fetch club data for actual club IDs (not route words)
  const { data: club, isLoading: clubLoading, error: clubError } = api.club.getById.useQuery(
    { id: clubId },
    {
      enabled: !['create', 'edit', 'new', 'add', 'settings', 'admin'].includes(clubId.toLowerCase()),
      retry: (failureCount, error) => {
        // Don't retry on 404 or BAD_REQUEST errors
        if (error?.data?.code === 'NOT_FOUND' || error?.data?.code === 'BAD_REQUEST') {
          return false;
        }
        return failureCount < 3;
      }
    }
  );

  
  // Determine if user can view posts based on club privacy and membership
  const canViewPosts = club && (club.isUserMember || !club.isPrivate);
  
  // Fetch club posts - Enable if user has access to the club
  // Public clubs: anyone can view posts
  // Private clubs: only members and site admins can view posts
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = api.clubPost.getClubPosts.useQuery(
    { clubId, limit: 20 },
    { 
      enabled: Boolean(canViewPosts)
    }
  );


  
  // Fetch club events - Always enable for any club (private or public)
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents } = api.clubEvent.getClubEvents.useQuery(
    { clubId },
    { 
      enabled: !!club // Enable for all clubs regardless of privacy or membership
    }
  );
  
  // Fetch club challenges - Always enable for any club (private or public)
  const { data: challenges, isLoading: challengesLoading } = api.challenge.getClubChallenges.useQuery(
    { clubId },
    { 
      enabled: !!club // Enable for all clubs regardless of privacy or membership
    }
  );

  // Fetch club members with enriched Clerk data
  const { data: membersData, isLoading: membersLoading } = api.club.getClubMembers.useQuery(
    { clubId },
    { 
      enabled: !!club && (club.isUserMember || !club.isPrivate) // Only fetch if user can view members
    }
  );

  // Get tRPC utils for query invalidation
  const utils = api.useUtils();

  // Mutations
  const joinClubMutation = api.club.join.useMutation({
    onSuccess: () => {
      // Invalidate club data to update membership status
      utils.club.getById.invalidate({ id: clubId });
    }
  });
  
  const leaveClubMutation = api.club.leave.useMutation({
    onSuccess: () => {
      // Invalidate club data to update membership status
      utils.club.getById.invalidate({ id: clubId });
    }
  });
  
  const requestToJoinMutation = api.club.requestToJoin.useMutation({
    onSuccess: () => {
      // Invalidate club data to update join request status
      utils.club.getById.invalidate({ id: clubId });
    }
  });
  
  const cancelJoinRequestMutation = api.club.cancelJoinRequest.useMutation({
    onSuccess: () => {
      // Invalidate club data to update join request status
      utils.club.getById.invalidate({ id: clubId });
    }
  });

  const createPostMutation = api.clubPost.create.useMutation({
    onSuccess: () => {
      // Refetch posts to show new post
      refetchPosts();
      // Also update club post count
      utils.club.getById.invalidate({ id: clubId });
      // Close modal
      setModalState({ type: null, isOpen: false });
    }
  });
  
  const toggleLikeMutation = api.clubPost.toggleLike.useMutation({
    onMutate: async ({ postId }) => {
      // Cancel any outgoing refetches
      await utils.clubPost.getClubPosts.cancel();
      
      // Snapshot the previous value
      const previousData = utils.clubPost.getClubPosts.getData({ clubId, limit: 20 });
      
      // Optimistically update
      utils.clubPost.getClubPosts.setData({ clubId, limit: 20 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((post) => {
            if (post.id === postId) {
              const isLiked = post.isLikedByUser;
              return {
                ...post,
                isLikedByUser: !isLiked,
                _count: {
                  ...post._count,
                  likes: isLiked ? post._count.likes - 1 : post._count.likes + 1,
                },
              };
            }
            return post;
          }),
        };
      });
      
      return { previousData };
    },
    onError: (err, newPost, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        utils.clubPost.getClubPosts.setData({ clubId, limit: 20 }, context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server once mutation is settled
      utils.clubPost.getClubPosts.invalidate({ clubId });
    },
  });
  
  const addCommentMutation = api.clubPost.addComment.useMutation({
    onSuccess: () => {
      // Invalidate to get the latest comments with proper nesting
      utils.clubPost.getClubPosts.invalidate({ clubId });
      
      // Close the appropriate modal
      if (commentModalState.isOpen) {
        // Only close comment modal, keep post detail modal open
        setCommentModalState({ isOpen: false });
      } else {
        // Close the main modal
        setModalState({ type: null, isOpen: false });
      }
    },
    onError: () => {
      // Error will be handled by tRPC error boundary
    }
  });
  
  const toggleCommentLikeMutation = api.clubPost.toggleCommentLike.useMutation({
    onMutate: async ({ commentId }) => {
      // Cancel any outgoing refetches
      await utils.clubPost.getClubPosts.cancel();
      
      // Get current data
      const previousData = utils.clubPost.getClubPosts.getData({ clubId, limit: 20 });
      
      // Optimistically update the comment like status
      utils.clubPost.getClubPosts.setData({ clubId, limit: 20 }, (old) => {
        if (!old) return old;
        
        return {
          ...old,
          posts: old.posts.map((post) => {
            return {
              ...post,
              comments: updateCommentLikes(post.comments || [], commentId, user?.id || ''),
            };
          }),
        };
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.clubPost.getClubPosts.setData({ clubId, limit: 20 }, context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      utils.clubPost.getClubPosts.invalidate({ clubId });
    },
  });
  
  // Helper function to recursively update comment likes
  function updateCommentLikes(comments: any[], targetCommentId: string, userId: string): any[] {
    return comments.map((comment) => {
      if (comment.id === targetCommentId) {
        const isLiked = comment.likes?.some((like: any) => like.userId === userId) || false;
        return {
          ...comment,
          likes: isLiked 
            ? comment.likes.filter((like: any) => like.userId !== userId)
            : [...(comment.likes || []), { userId }],
          _count: {
            ...comment._count,
            likes: isLiked ? (comment._count?.likes || 1) - 1 : (comment._count?.likes || 0) + 1,
          },
        };
      }
      
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentLikes(comment.replies, targetCommentId, userId),
        };
      }
      
      return comment;
    });
  }
  
  const updateAttendanceMutation = api.clubEvent.updateAttendance.useMutation({
    onSuccess: () => {
      // Refetch events to update attendance status
      refetchEvents();
    }
  });

  // Handle special route words - show create form instead of fetching club data
  if (clubId === 'create') {
    return <CreateClubForm />;
  }

  if (clubLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (clubError || !club) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-center">
          <Crown className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Club Not Found</h1>
          <p className="text-white/60 mb-6">This club doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Button onClick={() => router.back()} variant="outline" className="border-white/20 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // New role hierarchy logic
  const isSiteAdmin = club.isSiteAdmin;
  const isMember = club.isUserMember; // This now includes site admins
  
  // Derived permissions
  const canModerate = club.canModerate;
  const canAdminister = club.canAdminister;
  const canLeave = club.canLeave;
  
  // Legacy compatibility for existing code

  const handleJoinClub = async () => {
    // Check if user is signed in first
    if (!isSignedIn) {
      // Redirect to sign-in page with return URL
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!club.isPrivate) {
      joinClubMutation.mutate({ clubId });
    } else {
      requestToJoinMutation.mutate({ clubId });
    }
  };



  const handleLeaveClub = async () => {
    leaveClubMutation.mutate({ clubId });
  };

  const handleCreatePost = async (content: string) => {
    createPostMutation.mutate({
      clubId,
      content,
      images: []
    });
  };

  const handleCreateComment = async (content: string) => {
    // Check if comment is being created from post detail modal or regular modal
    const postId = commentModalState.isOpen ? commentModalState.postId : modalState.postId;
    const parentId = commentModalState.isOpen ? commentModalState.parentCommentId : modalState.parentCommentId;
    
    if (!postId) return;
    
    addCommentMutation.mutate({
      postId,
      content,
      parentId
    });
  };

  const handleToggleLike = async (postId: string) => {
    toggleLikeMutation.mutate({ postId });
  };

  const openModal = (type: 'post' | 'comment' | 'reply' | 'postDetail', options?: {
    postId?: string;
    parentCommentId?: string;
    replyingTo?: { name: string; content: string };
    postData?: any;
  }) => {
    // If opening comment/reply modal while post detail modal is open, use separate comment modal
    if ((type === 'comment' || type === 'reply') && modalState.type === 'postDetail' && modalState.isOpen) {
      setCommentModalState({
        isOpen: true,
        postId: options?.postId,
        parentCommentId: options?.parentCommentId,
        replyingTo: options?.replyingTo
      });
    } else {
      setModalState({
        type,
        isOpen: true,
        ...options
      });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, isOpen: false });
    setCommentModalState({ isOpen: false });
  };

  const handleAttendanceUpdate = async (eventId: string, status: "ATTENDING" | "NOT_ATTENDING" | "PENDING") => {
    updateAttendanceMutation.mutate({ eventId, status });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0707] via-[#0f0a0a] to-[#0a0707]">
      {/* Mobile-First Club Header */}
      <div className="relative  overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/30 via-[#0f0a0a] to-[#0a0707]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(127,29,29,0.15),transparent_70%)]" />
        
        {/* Mobile Header Bar */}
        <div className="md:hidden sticky top-0  bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            
        
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveTab("members")}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active:scale-95 ${
                  activeTab === "members" 
                    ? "bg-blue-500/20 text-blue-400" 
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
              {(canModerate || isSiteAdmin) && (
                <button 
                  onClick={() => setActiveTab("admin")}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors active:scale-95 ${
                    activeTab === "admin" 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <Crown className="w-5 h-5" />
                </button>
              )}
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors active:scale-95">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block relative  max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveTab("members")}
                className={`transition-all duration-300 ${
                  activeTab === "members" 
                    ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 hover:text-blue-300" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Users className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                <Share2 className="w-4 h-4" />
              </Button>
              {(canModerate || isSiteAdmin) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab("admin")}
                  className={`transition-all duration-300 ${
                    activeTab === "admin" 
                      ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                </Button>
              )}
              {canAdminister && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setAdminDefaultTab("settings");
                    setActiveTab("admin");
                  }}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Club Profile Section - Mobile Optimized */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-6 sm:pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Club Avatar */}
            <div className="relative">
              <UserAvatar 
                user={{
                  id: club.id,
                  name: club.name,
                  imageUrl: club.imageUrl
                }}
                size="xl"
                className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-red-500/30 shadow-2xl shadow-red-500/20"
              />

            </div>

            {/* Club Info */}
            <div className="flex-1 text-center sm:text-left space-y-3 sm:space-y-4">
              {/* Title and Badges */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                  {club.name}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Badge className={`
                    border-0 text-xs font-semibold px-3 py-1 rounded-lg
                    ${!club.isPrivate 
                      ? "bg-green-500/15 text-green-400" 
                      : "bg-orange-500/15 text-orange-400"
                    }
                  `}>
                    {!club.isPrivate ? (
                      <><Globe className="w-3 h-3 mr-1" /> Public Club</>
                    ) : (
                      <><Lock className="w-3 h-3 mr-1" /> Private Club</>
                    )}
                  </Badge>
                  
                  {isSiteAdmin && (
                    <Badge className="border-0 bg-purple-500/15 text-purple-400 text-xs font-semibold px-3 py-1 rounded-lg">
                      <Shield className="w-3 h-3 mr-1" />
                      Site Admin
                    </Badge>
                  )}
                  
                  {club.userMembership?.role === "ADMIN" && (
                    <Badge className="border-0 bg-red-500/15 text-red-400 text-xs font-semibold px-3 py-1 rounded-lg">
                      <Crown className="w-3 h-3 mr-1" />
                      Club Admin
                    </Badge>
                  )}
                  
                  {club.userMembership?.role === "MODERATOR" && (
                    <Badge className="border-0 bg-blue-500/15 text-blue-400 text-xs font-semibold px-3 py-1 rounded-lg">
                      <Shield className="w-3 h-3 mr-1" />
                      Moderator
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {club.description && (
                <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-2xl">
                  {club.description}
                </p>
              )}

              {/* Location */}
              {(club.city || club.territory) && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-white/60">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {[club.city, club.territory].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {!isMember ? (
                // User is not a member, check join request status
                club.userJoinRequest ? (
                  // Has pending join request - show cancel button
                  <Button
                    onClick={() => {
                      if (!isSignedIn) {
                        window.location.href = '/sign-in';
                        return;
                      }
                      cancelJoinRequestMutation.mutate({ clubId });
                    }}
                    variant="outline"
                    disabled={cancelJoinRequestMutation.isLoading}
                    className="w-full sm:w-auto border-yellow-500/30 bg-yellow-500/10 hover:bg-red-500/20 text-yellow-400 hover:text-red-400 px-6 py-3 rounded-xl transition-all duration-300 active:scale-95"
                  >
                    {cancelJoinRequestMutation.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Cancel Request
                      </>
                    )}
                  </Button>
                ) : (
                  // No join request - show join/request button
                  <Button
                    onClick={handleJoinClub}
                    disabled={joinClubMutation.isLoading || requestToJoinMutation.isLoading}
                    className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 active:scale-95"
                  >
                    {(joinClubMutation.isLoading || requestToJoinMutation.isLoading) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        {club.isPrivate ? "Requesting..." : "Joining..."}
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {club.isPrivate ? "Request to Join" : "Join Club"}
                      </>
                    )}
                  </Button>
                )
              ) : canLeave ? (
                <Button
                  onClick={handleLeaveClub}
                  variant="outline"
                  disabled={leaveClubMutation.isLoading}
                  className="w-full sm:w-auto border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-6 py-3 rounded-xl transition-all duration-300 active:scale-95"
                >
                  {leaveClubMutation.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Leaving...
                    </>
                  ) : (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Leave Club
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>

          {/* Stats Grid - Minimal Design */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-6 sm:mt-8">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">{membersData?.members?.length || club.members?.length || 0}</span>
              <span className="text-white/60 text-xs">Members</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-white font-medium text-sm">{club._count?.challenges || 0}</span>
              <span className="text-white/60 text-xs">Challenges</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <Calendar className="w-4 h-4 text-green-400" />
              <span className="text-white font-medium text-sm">{club._count?.events || 0}</span>
              <span className="text-white/60 text-xs">Events</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
              <Activity className="w-4 h-4 text-yellow-400" />
              <span className="text-green-400 font-medium text-sm">Active</span>
              <span className="text-white/60 text-xs">Status</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 md:pb-8 pt-4 md:pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-Optimized Tab Navigation */}
          <div className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-4 h-auto bg-[#0f0909]/60 border border-red-950/30 rounded-2xl p-1.5 backdrop-blur-sm">
              <TabsTrigger 
                value="overview" 
                className="flex-col gap-1.5 min-h-[52px] px-3 py-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:shadow-lg data-[state=active]:shadow-red-900/50 rounded-xl transition-all duration-300 hover:text-white/80 hover:bg-[#1a0c0c]/40 data-[state=active]:hover:from-red-700 data-[state=active]:hover:to-red-800 font-medium"
              >
                <Eye className="w-4 h-4" />
                <span className="text-xs">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="feed" 
                className="flex-col gap-1.5 min-h-[52px] px-3 py-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:shadow-lg data-[state=active]:shadow-red-900/50 rounded-xl transition-all duration-300 hover:text-white/80 hover:bg-[#1a0c0c]/40 data-[state=active]:hover:from-red-700 data-[state=active]:hover:to-red-800 font-medium"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs">Feed</span>
              </TabsTrigger>
              <TabsTrigger 
                value="events" 
                className="flex-col gap-1.5 min-h-[52px] px-3 py-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:shadow-lg data-[state=active]:shadow-red-900/50 rounded-xl transition-all duration-300 hover:text-white/80 hover:bg-[#1a0c0c]/40 data-[state=active]:hover:from-red-700 data-[state=active]:hover:to-red-800 font-medium"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs">Events</span>
              </TabsTrigger>
              <TabsTrigger 
                value="challenges" 
                className="flex-col gap-1.5 min-h-[52px] px-3 py-2 text-white/60 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:shadow-lg data-[state=active]:shadow-red-900/50 rounded-xl transition-all duration-300 hover:text-white/80 hover:bg-[#1a0c0c]/40 data-[state=active]:hover:from-red-700 data-[state=active]:hover:to-red-800 font-medium"
              >
                <Zap className="w-4 h-4" />
                <span className="text-xs">Challenges</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {!canViewPosts ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                  <Lock className="w-10 h-10 text-yellow-500/50" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Private Club</h3>
                <p className="text-white/60 mb-6 max-w-md mx-auto leading-relaxed">
                  This is a private club with exclusive content for members only. Join to access the full overview, activity feed, and member discussions.
                </p>
                <Button 
                  onClick={() => {
                    if (!isSignedIn) {
                      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
                    } else {
                      handleJoinClub();
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-8 py-3 font-semibold shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  {!isSignedIn ? "Sign in to join" : club?.isPrivate ? "Request to join" : "Join club"}
                </Button>
                <p className="text-white/40 text-sm mt-4">
                  You can still view public events and challenges in their respective tabs
                </p>
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">No recent activity</p>
                    <p className="text-white/40 text-sm mt-2">Activity will appear here as members interact</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Club Members</h2>
                <p className="text-white/60">
                  {membersData?.members ? `${membersData.members.length} member${membersData.members.length !== 1 ? 's' : ''} in this club` : 'Manage your club community'}
                </p>
              </div>
            </div>



            {/* Members List */}
            <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" />
                  Member Directory
                </CardTitle>
                <p className="text-white/60">
                  {membersData?.members ? `${membersData.members.length} member${membersData.members.length !== 1 ? 's' : ''}` : 'Manage your club community'}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {membersLoading ? (
                    // Loading state
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                      <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-white/10 rounded w-24"></div>
                              <div className="h-3 bg-white/5 rounded w-16"></div>
                            </div>
                          </div>
                          <div className="w-16 h-6 bg-white/5 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : !club?.isUserMember && club?.isPrivate ? (
                    // Private club, not a member
                    <div className="text-center py-8 border border-white/10 rounded-xl bg-white/5">
                      <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60">Join the club to see other members</p>
                    </div>
                  ) : membersData?.members && membersData.members.length > 0 ? (
                    // Show actual members
                    membersData.members.map((member) => {
                      const isCreator = member.user.id === club?.creator?.id;
                      const getRoleDisplay = (role: string) => {
                        switch (role) {
                          case 'ADMIN':
                            return isCreator ? 'Founder & Admin' : 'Admin';
                          case 'MODERATOR':
                            return 'Moderator';
                          case 'MEMBER':
                            return 'Member';
                          default:
                            return 'Member';
                        }
                      };

                      const getRoleBadge = (role: string) => {
                        switch (role) {
                          case 'ADMIN':
                            return (
                              <Badge className="bg-red-500/15 text-red-400 border-0">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            );
                          case 'MODERATOR':
                            return (
                              <Badge className="bg-blue-500/15 text-blue-400 border-0">
                                <Shield className="w-3 h-3 mr-1" />
                                Moderator
                              </Badge>
                            );
                          default:
                            return null;
                        }
                      };

                      return (
                        <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              user={member.user}
                              size="lg"
                              className={`w-12 h-12 ${isCreator ? 'ring-2 ring-red-500/30' : 'ring-1 ring-white/20'}`}
                            />
                        <div>
                          <div className="font-semibold text-white">
                                {member.user.name || "Unknown Member"}
                          </div>
                          <div className="text-white/60 text-sm">
                                {getRoleDisplay(member.role)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                            {getRoleBadge(member.role)}
                            {canAdminister && member.role !== 'ADMIN' && member.user.id !== user?.id && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-white/40 hover:text-red-400 hover:bg-red-500/10"
                                  title="Remove member"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                                {member.role === 'MEMBER' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-white/40 hover:text-blue-400 hover:bg-blue-500/10"
                                    title="Promote to moderator"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                )}
                    </div>
                  )}
                            <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
                    </div>
                        </div>
                      );
                    })
                  ) : (
                    // No members (shouldn't happen since creator should always be a member)
                    <div className="text-center py-8 border border-white/10 rounded-xl bg-white/5">
                      <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60">No members found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


          </TabsContent>

          {/* Modern Social Feed - Instagram/Twitter Style */}
          <TabsContent value="feed" className="space-y-0 mt-0">
            {/* Mobile-Optimized Create Post Header */}
            {isSignedIn && club?.isUserMember ? (
              <div className="sticky top-[4rem] md:top-0 backdrop-blur-xl z-40 border-b border-white/5">
                <div className="p-3 md:p-4">
                  <Button 
                    size="lg"
                    onClick={() => openModal('post')}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl h-12 md:h-14 font-semibold text-base shadow-lg shadow-red-500/25"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Share something with the club
                  </Button>
                </div>
              </div>
            ) : (
              <div className="sticky top-[4rem] md:top-0  backdrop-blur-xl z-40 border-b border-white/5">
                <div className="p-3 md:p-4">
                  <Button 
                    size="lg"
                    onClick={() => {
                      if (!isSignedIn) {
                        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
                      } else {
                        handleJoinClub();
                      }
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-2xl h-12 md:h-14 font-semibold text-base shadow-lg shadow-red-500/25"
                  >
                    {!isSignedIn ? (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Sign in to join and post
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Join club to post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Mobile-Optimized Social Feed */}
            <div className="pb-24 md:pb-8">
              {!canViewPosts ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-yellow-500/50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Members Only Content</h3>
                  <p className="text-white/60 mb-6 max-w-sm mx-auto">
                    {club?.isPrivate ? "This is a private club. " : ""}
                    Join the club to see posts and interact with members
                  </p>
                  <Button 
                    onClick={() => {
                      if (!isSignedIn) {
                        window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
                      } else {
                        handleJoinClub();
                      }
                    }}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {!isSignedIn ? "Sign in to join" : club?.isPrivate ? "Request to join" : "Join club"}
                  </Button>
                </div>
              ) : postsLoading ? (
                <div className="space-y-3 p-3 md:p-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                      <div className="flex gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-white/10 rounded w-1/3"></div>
                          <div className="h-3 bg-white/5 rounded w-1/4"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-white/5 rounded w-full"></div>
                        <div className="h-4 bg-white/5 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : postsData?.posts.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-red-500/50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Start the conversation!</h3>
                  <p className="text-white/60 mb-6 max-w-sm mx-auto">Be the first to share something with your club members</p>
                  {isSignedIn && club?.isUserMember ? (
                    <Button 
                      onClick={() => openModal('post')}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Post
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => {
                        if (!isSignedIn) {
                          window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
                        } else {
                          handleJoinClub();
                        }
                      }}
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      {!isSignedIn ? "Sign in to join" : "Join to post"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1 md:space-y-4">
                  {postsData?.posts.map((post: any) => (
                    <div 
                      key={post.id} 
                      className="bg-white/[0.02] md:bg-gradient-to-br md:from-white/[0.08] md:to-white/[0.02] border border-white/5 md:border-white/10 md:rounded-2xl overflow-hidden backdrop-blur-sm cursor-pointer hover:bg-white/[0.04] transition-all duration-200 active:scale-[0.99]"
                      onClick={() => openModal('postDetail', { postData: post })}
                    >
                      <div className="p-3 md:p-6">
                        {/* Mobile-Optimized Post Header */}
                        <div className="flex items-start gap-3 mb-3 md:mb-4">
                          <UserAvatar 
                            user={{
                              ...post.author,
                              imageUrl: post.author.id === user?.id ? user?.imageUrl : post.author.imageUrl
                            }}
                            size="md"
                            className="w-9 h-9 md:w-12 md:h-12"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-semibold text-sm md:text-base truncate">
                                {post.author.name || "Anonymous"}
                              </span>
                              <span className="text-white/40 text-xs">·</span>
                              <span className="text-white/50 text-xs md:text-sm">
                                {formatTimeShort(new Date(post.createdAt))}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile-Optimized Post Content */}
                        <div className="mb-3 md:mb-4">
                          <p className="text-white/90 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                            {post.content}
                          </p>
                        </div>
                        
                        {/* Mobile-Optimized Post Images */}
                        {post.images && post.images.length > 0 && (
                          <div className="mb-3 -mx-3 md:mb-4 md:-mx-6">
                            <div className={`grid gap-0.5 ${
                              post.images.length === 1 ? 'grid-cols-1' : 
                              post.images.length === 2 ? 'grid-cols-2' : 
                              'grid-cols-2'
                            }`}>
                              {post.images.slice(0, 4).map((image: string, imgIndex: number) => (
                                <div key={imgIndex} className="relative aspect-square overflow-hidden">
                                  <img 
                                    src={image} 
                                    alt={`Post image ${imgIndex + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {imgIndex === 3 && post.images.length > 4 && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="text-white font-bold text-sm md:text-lg">+{post.images.length - 4}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Mobile-Optimized Social Actions */}
                        <div className="flex items-center justify-between pt-2 md:pt-3">
                          <div className="flex items-center gap-0">
                            {/* Like Button - Mobile Optimized */}
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent post modal from opening
                                  handleToggleLike(post.id);
                                }}
                                disabled={toggleLikeMutation.isLoading}
                                className={`group p-2 md:p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                                  post.isLikedByUser 
                                    ? 'text-red-500 hover:bg-red-500/10' 
                                    : 'text-white/60 hover:text-red-500 hover:bg-red-500/10'
                                }`}
                              >
                                <Heart className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ${
                                  post.isLikedByUser 
                                    ? 'fill-current scale-110' 
                                    : 'group-hover:scale-110'
                                }`} />
                              </Button>
                              {post._count.likes > 0 && (
                                <span className={`text-xs md:text-sm min-w-[16px] md:min-w-[20px] ${
                                  post.isLikedByUser ? 'text-red-500' : 'text-white/60'
                                }`}>
                                  {post._count.likes}
                                </span>
                              )}
                            </div>
                            
                            {/* Comment Button - Mobile Optimized */}
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent post modal from opening
                                  openModal('postDetail', { postData: post });
                                }}
                                className="group p-2 md:p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 text-white/60 hover:text-blue-400 hover:bg-blue-400/10"
                              >
                                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 transition-all duration-300 group-hover:scale-110" />
                              </Button>
                              {post._count.comments > 0 && (
                                <span className="text-xs md:text-sm min-w-[16px] md:min-w-[20px] text-white/60">
                                  {post._count.comments}
                                </span>
                              )}
                            </div>
                            
                            {/* Share Button - Mobile Optimized */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent post modal from opening
                                // Handle share functionality here
                              }}
                              className="group p-2 md:p-3 text-white/60 hover:text-green-400 hover:bg-green-400/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                              <Share2 className="w-4 h-4 md:w-5 md:h-5 transition-all duration-300 group-hover:scale-110" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Mobile-Optimized Load More */}
            {postsData?.posts && postsData.posts.length > 0 && (
              <div className="p-4 text-center">
                <Button 
                  variant="ghost" 
                  className="w-full md:w-auto text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl py-3"
                >
                  Load more posts
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Club Events</h2>
                <p className="text-white/60">Discover and join upcoming events</p>
              </div>
              {canModerate && (
                <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Button>
              )}
            </div>

            {/* Event Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">{events?.length || 0}</div>
                  <div className="text-white/60 text-xs sm:text-sm">Total Events</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-xl">
                    <Clock className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">0</div>
                  <div className="text-white/60 text-xs sm:text-sm">This Week</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-yellow-500/20 rounded-xl">
                    <Users className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">0</div>
                  <div className="text-white/60 text-xs sm:text-sm">Attendees</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">Active</div>
                  <div className="text-white/60 text-xs sm:text-sm">Status</div>
                </CardContent>
              </Card>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {eventsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                    <div className="p-6 animate-pulse">
                      <div className="h-4 bg-white/10 rounded mb-4"></div>
                      <div className="h-3 bg-white/5 rounded mb-2"></div>
                      <div className="h-3 bg-white/5 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))
              ) : events?.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-blue-500/60" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No events scheduled</h3>
                  <p className="text-white/60 mb-6">Be the first to organize an event for the club!</p>
                  {canModerate && (
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Event
                    </Button>
                  )}
                </div>
              ) : (
                events?.map((event: any) => (
                  <Card key={event.id} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg mb-2">{event.title}</CardTitle>
                          <CardDescription className="text-white/60 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-500/15 text-blue-400 border-0">
                          {event._count?.attendees || 0} attending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {event.description && (
                        <p className="text-white/80 mb-4 line-clamp-2 leading-relaxed">{event.description}</p>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-white/50 mb-4 p-3 bg-white/5 rounded-xl">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{event.location}</span>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleAttendanceUpdate(event.id, "ATTENDING")}
                          className="flex-1 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 hover:border-green-500/50 transition-all duration-300"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Attend
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAttendanceUpdate(event.id, "PENDING")}
                          className="flex-1 bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/30 hover:border-yellow-500/50 transition-all duration-300"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Maybe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Load More */}
            {events && events.length > 0 && (
              <div className="text-center">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Load More Events
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Challenges Tab */}
          <TabsContent value="challenges" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Club Challenges</h2>
                <p className="text-white/60">Test your skills and compete with members</p>
              </div>
              {canModerate && (
                <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Challenge
                </Button>
              )}
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-red-500/20 rounded-xl">
                    <Target className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">{challenges?.length || 0}</div>
                  <div className="text-white/60 text-xs sm:text-sm">Active</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-yellow-500/20 rounded-xl">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">0</div>
                  <div className="text-white/60 text-xs sm:text-sm">Completed</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-xl">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">0</div>
                  <div className="text-white/60 text-xs sm:text-sm">Participants</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-xl">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-white">Active</div>
                  <div className="text-white/60 text-xs sm:text-sm">Status</div>
                </CardContent>
              </Card>
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {challengesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 h-48">
                    <div className="p-6 animate-pulse h-full">
                      <div className="h-4 bg-white/10 rounded mb-4"></div>
                      <div className="h-3 bg-white/5 rounded mb-2"></div>
                      <div className="h-3 bg-white/5 rounded w-2/3 mb-4"></div>
                      <div className="h-2 bg-white/5 rounded w-1/2"></div>
                    </div>
                  </Card>
                ))
              ) : challenges?.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <Target className="w-10 h-10 text-red-500/60" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No challenges yet</h3>
                  <p className="text-white/60 mb-6">Create the first challenge to get the competition started!</p>
                  {canModerate && (
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Challenge
                    </Button>
                  )}
                </div>
              ) : (
                challenges?.map((challenge: any) => (
                  <Link key={challenge.id} href={`/challenges/${challenge.id}`}>
                    <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer h-full hover:shadow-xl hover:shadow-red-500/10 hover:scale-[1.02]">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                              <Target className="w-4 h-4 text-red-400" />
                            </div>
                            <Badge className={`border-0 text-xs font-semibold px-2 py-1 rounded-lg ${
                              challenge.difficulty === 'EASY' ? 'bg-green-500/15 text-green-400' : 
                              challenge.difficulty === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400' :
                              'bg-red-500/15 text-red-400'
                            }`}>
                              {challenge.difficulty}
                            </Badge>
                          </div>
                          <div className="text-white/40">
                            <Target className="w-4 h-4" />
                          </div>
                        </div>
                        <CardTitle className="text-white text-lg line-clamp-2 leading-tight mb-2">
                          {challenge.title}
                        </CardTitle>
                        <CardDescription className="text-white/60 line-clamp-2 text-sm leading-relaxed">
                          {challenge.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-white/50 text-sm">Participants</span>
                            <span className="text-white font-semibold">{challenge._count?.participants || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white/50 text-sm">Type</span>
                            <span className="text-white/80 text-sm capitalize">{challenge.type?.replace('_', ' ').toLowerCase()}</span>
                          </div>
                          {challenge.endDate && (
                            <div className="flex justify-between items-center">
                              <span className="text-white/50 text-sm">Ends</span>
                              <span className="text-white/80 text-sm">
                                {new Date(challenge.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>

            {/* Load More */}
            {challenges && challenges.length > 0 && (
              <div className="text-center">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Load More Challenges
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Admin Tab - Only visible to admins/moderators */}
          {(canModerate || isSiteAdmin) && (
            <TabsContent value="admin" className="space-y-6">
              <AdminDashboard 
                clubId={clubId}
                isAdmin={canAdminister}
                isModerator={canModerate}
                isSiteAdmin={isSiteAdmin}
                defaultTab={adminDefaultTab}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Unified Content Creation Modal */}
      <CreateContentModal
        isOpen={modalState.isOpen && ['post', 'comment', 'reply'].includes(modalState.type || '')}
        onClose={closeModal}
        onSubmit={modalState.type === 'post' ? handleCreatePost : handleCreateComment}
        type={(modalState.type === 'postDetail' ? 'post' : modalState.type) || 'post'}
        allowMedia={modalState.type === 'post'}
        maxLength={modalState.type === 'post' ? 280 : 500}
        isLoading={modalState.type === 'post' ? createPostMutation.isLoading : addCommentMutation.isLoading}
        currentUser={user ? {
          imageUrl: user.imageUrl || undefined,
          name: user.fullName || user.firstName || user.username || undefined,
          firstName: user.firstName || undefined
        } : undefined}
        replyingTo={modalState.replyingTo}
      />

      {/* Post Detail Modal */}
      {modalState.type === 'postDetail' && modalState.isOpen && modalState.postData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          
          {/* Modal Content */}
          <div className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl bg-black md:border md:border-white/10 overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/95 backdrop-blur-xl border-b border-white/10 p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={closeModal}
                  className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h2 className="text-lg font-semibold text-white">Post</h2>
                <div className="w-8" />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(100vh-4rem)] md:max-h-[calc(90vh-4rem)]">
              {/* Post Content */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-start gap-3 mb-4">
                  <UserAvatar 
                    user={{
                      ...modalState.postData.author,
                      imageUrl: modalState.postData.author.id === user?.id ? user?.imageUrl : modalState.postData.author.imageUrl
                    }}
                    size="lg"
                    className="w-12 h-12"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-semibold">
                        {modalState.postData.author.name || "Anonymous"}
                      </span>
                      <span className="text-white/40 text-xs">·</span>
                      <span className="text-white/50 text-sm">
                        {formatTimeShort(new Date(modalState.postData.createdAt))}
                      </span>
                    </div>
                    <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap break-words">
                      {modalState.postData.content}
                    </p>
                  </div>
                </div>

                {/* Post Images */}
                {modalState.postData.images && modalState.postData.images.length > 0 && (
                  <div className="mb-4 -mx-4">
                    <div className={`grid gap-0.5 ${
                      modalState.postData.images.length === 1 ? 'grid-cols-1' : 
                      modalState.postData.images.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-2'
                    }`}>
                      {modalState.postData.images.slice(0, 4).map((image: string, imgIndex: number) => (
                        <div key={imgIndex} className="relative aspect-square overflow-hidden">
                          <img 
                            src={image} 
                            alt={`Post image ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {imgIndex === 3 && modalState.postData.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white font-bold text-lg">+{modalState.postData.images.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-0">
                    {/* Like Button */}
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLike(modalState.postData.id)}
                        className={`group p-3 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                          modalState.postData.isLikedByUser 
                            ? 'text-red-500 hover:bg-red-500/10' 
                            : 'text-white/60 hover:text-red-500 hover:bg-red-500/10'
                        }`}
                      >
                        <Heart className={`w-5 h-5 transition-all duration-300 ${
                          modalState.postData.isLikedByUser 
                            ? 'fill-current scale-110' 
                            : 'group-hover:scale-110'
                        }`} />
                      </Button>
                      {modalState.postData._count.likes > 0 && (
                        <span className={`text-sm min-w-[20px] ${
                          modalState.postData.isLikedByUser ? 'text-red-500' : 'text-white/60'
                        }`}>
                          {modalState.postData._count.likes}
                        </span>
                      )}
                    </div>
                    
                    {/* Comment Button */}
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal('comment', { postId: modalState.postData.id })}
                        className="group p-3 text-white/60 hover:text-blue-400 hover:bg-blue-400/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <MessageCircle className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                      </Button>
                      {modalState.postData._count.comments > 0 && (
                        <span className="text-white/60 text-sm min-w-[20px]">
                          {modalState.postData._count.comments}
                        </span>
                      )}
                    </div>
                    
                    {/* Share Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="group p-3 text-white/60 hover:text-green-400 hover:bg-green-400/10 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Share2 className="w-5 h-5 transition-all duration-300 group-hover:scale-110" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-4">
                {/* Quick Comment Input - Only show for signed in users */}
                {isSignedIn && user && (
                  <div className="mb-6">
                    <Button
                      onClick={() => openModal('comment', { postId: modalState.postData.id })}
                      variant="ghost"
                      className="w-full justify-start text-left p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 hover:border-red-500/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar 
                          user={{
                            id: user?.id || '',
                            name: user?.fullName || user?.firstName || '',
                            imageUrl: user?.imageUrl || null
                          }}
                          size="sm"
                          className="w-8 h-8"
                        />
                        <span>Add a comment...</span>
                      </div>
                    </Button>
                  </div>
                )}

                {/* Comments List */}
                <CommentThread
                  comments={(() => {
                    const transformComment = (comment: any): any => {
                      return {
                        ...comment,
                        createdAt: typeof comment.createdAt === 'string' ? comment.createdAt : comment.createdAt.toString(),
                        isLikedByUser: comment.likes?.length > 0,
                        _count: {
                          likes: comment._count?.likes || 0,
                          replies: comment.replies?.length || 0,
                        },
                        replies: comment.replies?.map(transformComment) || [],
                      };
                    };
                    
                    return (modalState.postData.comments || []).map(transformComment);
                  })()} 
                  onLikeComment={(commentId) => {
                    toggleCommentLikeMutation.mutate({ commentId });
                  }}
                  onOpenReplyModal={(commentId, authorName, content) => {
                    openModal('reply', {
                      postId: modalState.postData.id,
                      parentCommentId: commentId,
                      replyingTo: { name: authorName, content }
                    });
                  }}
                  onDeleteComment={() => {
                    // TODO: Implement comment deletion
                  }}
                  currentUserId={user?.id || ""}
                  currentUser={user ? {
                    imageUrl: user.imageUrl || undefined,
                    name: user.fullName || user.firstName || user.username || undefined,
                    firstName: user.firstName || undefined,
                    emailAddresses: user.emailAddresses || undefined
                  } : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal (when opened from post detail) */}
      {commentModalState.isOpen && (
        <CreateContentModal
          isOpen={commentModalState.isOpen}
          onClose={() => setCommentModalState({ isOpen: false })}
          onSubmit={handleCreateComment}
          type={commentModalState.parentCommentId ? 'reply' : 'comment'}
          allowMedia={false}
          maxLength={500}
          isLoading={addCommentMutation.isLoading}
          currentUser={user ? {
            imageUrl: user.imageUrl || undefined,
            name: user.fullName || user.firstName || user.username || undefined,
            firstName: user.firstName || undefined
          } : undefined}
          replyingTo={commentModalState.replyingTo}
        />
      )}
    </div>
  );
}