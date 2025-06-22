"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, DollarSignIcon, UsersIcon } from "lucide-react";

interface CreateEventFormProps {
  clubId: string;
  isPremium: boolean;
}

export function CreateEventForm({ clubId, isPremium }: CreateEventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showChallenges, setShowChallenges] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    isPublic: true,
    entryFeeUSD: 0,
    maxAttendees: 100,
    challenges: [] as Array<{
      title: string;
      description: string;
      entryFeeUSD: number;
      bonusPoolPercentOfEventFees: number;
    }>,
  });

  const addChallenge = () => {
    setFormData({
      ...formData,
      challenges: [
        ...formData.challenges,
        {
          title: "",
          description: "",
          entryFeeUSD: 0,
          bonusPoolPercentOfEventFees: 0,
        },
      ],
    });
  };

  const updateChallenge = (index: number, field: string, value: any) => {
    const newChallenges = [...formData.challenges];
    newChallenges[index] = { ...newChallenges[index], [field]: value };
    setFormData({ ...formData, challenges: newChallenges });
  };

  const removeChallenge = (index: number) => {
    setFormData({
      ...formData,
      challenges: formData.challenges.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          clubId,
          entryFeeUSD: Number(formData.entryFeeUSD),
          maxAttendees: Number(formData.maxAttendees),
          challenges: formData.challenges.map((c) => ({
            ...c,
            entryFeeUSD: Number(c.entryFeeUSD),
            bonusPoolPercentOfEventFees: Number(c.bonusPoolPercentOfEventFees),
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      const event = await response.json();
      router.push(`/events/${event.id}`);
    } catch (error) {
      console.error("Error creating event:", error);
      alert(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Summer Performance Challenge 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your event..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPinIcon className="inline w-4 h-4 mr-1" />
              Location
            </Label>
            <Input
              id="location"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Downtown Convention Center"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDateTime">
                <CalendarIcon className="inline w-4 h-4 mr-1" />
                Start Date & Time
              </Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                required
                value={formData.startDateTime}
                onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDateTime">
                <CalendarIcon className="inline w-4 h-4 mr-1" />
                End Date & Time
              </Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                required
                value={formData.endDateTime}
                onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryFeeUSD">
                <DollarSignIcon className="inline w-4 h-4 mr-1" />
                Entry Fee (USD)
              </Label>
              <Input
                id="entryFeeUSD"
                type="number"
                min="0"
                step="0.01"
                value={formData.entryFeeUSD}
                onChange={(e) => setFormData({ ...formData, entryFeeUSD: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttendees">
                <UsersIcon className="inline w-4 h-4 mr-1" />
                Max Attendees
              </Label>
              <Input
                id="maxAttendees"
                type="number"
                min="1"
                value={formData.maxAttendees}
                onChange={(e) => setFormData({ ...formData, maxAttendees: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isPublic">Public Event (visible to non-members)</Label>
          </div>
        </CardContent>
      </Card>

      {isPremium && (
        <Card>
          <CardHeader>
            <CardTitle>Challenges (Premium Feature)</CardTitle>
            <Button
              type="button"
              onClick={() => setShowChallenges(!showChallenges)}
              variant="outline"
              size="sm"
            >
              {showChallenges ? "Hide" : "Add"} Challenges
            </Button>
          </CardHeader>
          {showChallenges && (
            <CardContent className="space-y-4">
              {formData.challenges.map((challenge, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold">Challenge {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => removeChallenge(index)}
                        variant="ghost"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>

                    <Input
                      placeholder="Challenge Title"
                      value={challenge.title}
                      onChange={(e) => updateChallenge(index, "title", e.target.value)}
                      required
                    />

                    <Textarea
                      placeholder="Challenge Description"
                      value={challenge.description}
                      onChange={(e) => updateChallenge(index, "description", e.target.value)}
                      rows={2}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Entry Fee (USD)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={challenge.entryFeeUSD}
                          onChange={(e) => updateChallenge(index, "entryFeeUSD", parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div>
                        <Label>Bonus Pool % of Event Fees</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={challenge.bonusPoolPercentOfEventFees}
                          onChange={(e) => updateChallenge(index, "bonusPoolPercentOfEventFees", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button type="button" onClick={addChallenge} variant="outline" className="w-full">
                Add Challenge
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
} 