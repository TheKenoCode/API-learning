"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/trpc";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UploadButton } from "@/lib/uploadthing-client";
import {
  Settings,
  Camera,
  MapPin,
  Globe,
  Lock,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Shield
} from "lucide-react";

interface ClubSettingsProps {
  clubId: string;
  isAdmin: boolean;
  isSiteAdmin?: boolean;
}

interface ClubData {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isPrivate: boolean;
  city?: string;
  territory?: string;
}

export default function ClubSettings({ clubId, isAdmin, isSiteAdmin }: ClubSettingsProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<ClubData>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Get current club data
  const { data: club, isLoading: clubLoading, refetch } = api.club.getById.useQuery(
    { id: clubId }
  );

  // Update form data when club data changes
  useEffect(() => {
    if (club) {
      setFormData({
        name: club.name,
        description: club.description || '',
        imageUrl: club.imageUrl || '',
        isPrivate: club.isPrivate,
        city: club.city || '',
        territory: club.territory || ''
      });
    }
  }, [club]);

  // Update club settings mutation
  const updateClubMutation = api.club.updateSettings.useMutation({
    onSuccess: (updatedClub) => {
      setNotification({ type: 'success', message: 'Club settings updated successfully!' });
      setHasChanges(false);
      refetch();
      
      // Update form data with the latest values
      setFormData({
        name: updatedClub.name,
        description: updatedClub.description || '',
        imageUrl: updatedClub.imageUrl || '',
        isPrivate: updatedClub.isPrivate,
        city: updatedClub.city || '',
        territory: updatedClub.territory || ''
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: `Failed to update settings: ${error.message}` });
      setTimeout(() => setNotification(null), 5000);
    }
  });

  // Delete club mutation
  const deleteClubMutation = api.club.delete.useMutation({
    onSuccess: (result) => {
      setNotification({ type: 'success', message: result.message });
      setIsDeleting(false);
      setShowDeleteModal(false);
      
      // Redirect to clubs page after successful deletion
      setTimeout(() => {
        router.push('/clubs');
      }, 2000);
    },
    onError: (error) => {
      setNotification({ type: 'error', message: `Failed to delete club: ${error.message}` });
      setIsDeleting(false);
      setTimeout(() => setNotification(null), 5000);
    }
  });

  // Upload state for UploadThing
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: keyof ClubData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleUploadComplete = (res: any) => {
    console.log("🔍 Upload complete response:", res);
    if (res?.[0]?.url) {
      // Update form data with new image URL
      handleInputChange('imageUrl', res[0].url);
      setNotification({ type: 'success', message: 'Image uploaded successfully!' });
      setTimeout(() => setNotification(null), 3000);
      
      // Refetch club data to ensure we have the latest image URL
      refetch();
    }
    setIsUploading(false);
  };

  const handleUploadError = (error: Error) => {
    setNotification({ type: 'error', message: `Upload failed: ${error.message}` });
    setTimeout(() => setNotification(null), 5000);
    setIsUploading(false);
  };

  const handleUploadBegin = () => {
    setIsUploading(true);
  };



  const handleSave = async () => {
    if (!hasChanges) return;

    const payload = {
      id: clubId,
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl,
      isPrivate: formData.isPrivate,
      city: formData.city,
      territory: formData.territory
    };

    console.log("🔍 Saving club settings with payload:", payload);
    console.log("🔍 Image URL being sent:", formData.imageUrl);

    try {
      await updateClubMutation.mutateAsync(payload);
    } catch (error) {
      // Error handling is done in the mutation onError callback
    }
  };

  const handleCancel = () => {
    if (!club) return;
    
    setFormData({
      name: club.name,
      description: club.description || '',
      imageUrl: club.imageUrl || '',
      isPrivate: club.isPrivate,
      city: club.city || '',
      territory: club.territory || ''
    });
    setHasChanges(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteConfirmation("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation !== "delete") {
      setNotification({ type: 'error', message: 'You must type "delete" to confirm' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClubMutation.mutateAsync({
        clubId,
        confirmation: deleteConfirmation,
      });
    } catch (error) {
      // Error handling is done in the mutation onError callback
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation("");
  };

  if (clubLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!club || (!isAdmin && !isSiteAdmin)) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-white/60">You don&apos;t have permission to access club settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      {notification && (
        <div className={`p-4 rounded-xl border ${
          notification.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Club Settings</h2>
          <p className="text-white/60">Manage your club&apos;s profile and privacy settings</p>
        </div>
        {hasChanges && (
          <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20">
            <Edit className="w-3 h-3 mr-1" />
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Profile Picture Section */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-red-500" />
            Club Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-red-500/30">
                <AvatarImage src={formData.imageUrl || undefined} alt={formData.name} />
                <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white text-2xl font-bold">
                  {formData.name?.charAt(0).toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="space-y-3">
                <div>
                  <h4 className="text-white font-medium mb-1">Upload New Picture</h4>
                  <p className="text-white/60 text-sm">
                    Recommended: Square image, at least 200x200px. Max 4MB.
                  </p>
                </div>
                
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <UploadButton
                      endpoint="clubProfileImage"
                      onClientUploadComplete={handleUploadComplete}
                      onUploadError={handleUploadError}
                      onUploadBegin={handleUploadBegin}
                      appearance={{
                        button: {
                          background: "#ef4444",
                          color: "white",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          fontSize: "14px",
                          fontWeight: "500",
                          border: "none",
                          cursor: "pointer",
                        },
                        container: {
                          margin: "0",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0",
                        },
                        allowedContent: {
                          display: "none",
                        },
                      }}
                      className="uploadthing-no-file-input"
                      config={{
                        mode: "auto",
                      }}
                      content={{
                        button: ({ ready, isUploading }) => {
                          if (isUploading) return (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          );
                          if (ready) return (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Upload Image
                            </>
                          );
                          return "Getting ready...";
                        },
                        allowedContent: () => "",
                      }}
                      headers={{
                        "x-club-id": clubId,
                      }}
                    />
                  </div>
                  
                  {formData.imageUrl && (
                    <Button
                      variant="outline"
                      onClick={() => handleInputChange('imageUrl', '')}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-red-500" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Club Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Club Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"
              placeholder="Enter club name"
              maxLength={100}
            />
            <div className="text-xs text-white/40">
              {formData.name?.length || 0}/100 characters
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300 resize-none"
              placeholder="Describe your club's mission and goals..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-red-500" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                City
              </label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"
                placeholder="e.g. Los Angeles"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                State/Territory
              </label>
              <input
                type="text"
                value={formData.territory || ''}
                onChange={(e) => handleInputChange('territory', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"
                placeholder="e.g. California"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {formData.isPrivate ? (
              <Lock className="w-5 h-5 text-orange-500" />
            ) : (
              <Globe className="w-5 h-5 text-green-500" />
            )}
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-3">
              <button
                onClick={() => handleInputChange('isPrivate', false)}
                className={`group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  !formData.isPrivate 
                    ? "border-green-500 bg-green-500/10" 
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    !formData.isPrivate 
                      ? "bg-green-500" 
                      : "bg-white/10"
                  }`}>
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">Public Club</div>
                    <div className="text-white/60 text-sm">
                      Anyone can discover and join your club
                    </div>
                  </div>
                  {!formData.isPrivate && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </button>

              <button
                onClick={() => handleInputChange('isPrivate', true)}
                className={`group p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  formData.isPrivate 
                    ? "border-orange-500 bg-orange-500/10" 
                    : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    formData.isPrivate 
                      ? "bg-orange-500" 
                      : "bg-white/10"
                  }`}>
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">Private Club</div>
                    <div className="text-white/60 text-sm">
                      Members must request to join and be approved
                    </div>
                  </div>
                  {formData.isPrivate && (
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save/Cancel Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateClubMutation.isLoading || !formData.name?.trim()}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
        >
          {updateClubMutation.isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        
        {hasChanges && (
          <Button
            onClick={handleCancel}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            disabled={updateClubMutation.isLoading}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Danger Zone - Delete Club */}
      {(isAdmin || isSiteAdmin) && (
        <Card className="bg-gradient-to-br from-red-500/[0.08] to-red-600/[0.02] border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Delete Club</h4>
                <p className="text-white/60 text-sm mb-4">
                  Permanently delete this club and all its content. This action cannot be undone.
                  All members, posts, events, and challenges will be permanently removed.
                </p>
              </div>
              
              <Button
                onClick={handleDeleteClick}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white border-red-500"
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Club
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Club</h3>
              <p className="text-white/60">
                Are you sure you want to delete <span className="font-semibold text-white">&ldquo;{club?.name}&rdquo;</span>?
                This action cannot be undone.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Type <span className="bg-red-500/20 px-2 py-1 rounded text-red-400 font-mono">delete</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all duration-300"
                  placeholder="Type 'delete' here"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  variant="destructive"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isDeleting || deleteConfirmation !== "delete"}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Club
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 