import { useState, useEffect } from "react";
import { Prayer } from "@shared/schema";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, BookmarkCheck, Hand, Share2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { generatePrayerCardImage } from "@/lib/prayer-card-generator";
import { getSessionId } from "@/lib/session";
import { PrayerComment } from "@shared/schema";
import { PrayerCommentForm } from "./prayer-comment-form";

interface PrayerCardProps {
  prayer: Prayer;
}

export function PrayerCard({ prayer }: PrayerCardProps) {
  const { toast } = useToast();
  const sessionId = getSessionId();
  const [isLiftedUp, setIsLiftedUp] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [localLiftUpCount, setLocalLiftUpCount] = useState(prayer.liftUpCount);
  const [showComments, setShowComments] = useState(false);
  const { data: prayerComments } = useQuery<PrayerComment[]>({ queryKey: [`/api/prayers/${prayer.id}/comments`] });

  // Fetch initial status using apiRequest
  const { data: status } = useQuery<{ hasLifted: boolean; hasBookmark: boolean }>({
    queryKey: ['/api/prayers', prayer.id, 'status', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/prayers/${prayer.id}/status?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (status) {
      setIsLiftedUp(status.hasLifted);
      setIsBookmarked(status.hasBookmark);
    }
  }, [status]);

  const liftUpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/prayers/lift-up", {
        prayerId: prayer.id,
        sessionId,
      });
    },
    onSuccess: (data: any) => {
      // Use server response count
      setIsLiftedUp(true);
      setLocalLiftUpCount(data.count || localLiftUpCount + 1);
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
    },
    onError: (error: any) => {
      // Don't update state on error
      if (error.message?.includes("Already lifted")) {
        toast({
          title: "Already lifted up",
          description: "You've already lifted up this prayer.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to lift up prayer. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        const response = await fetch(`/api/bookmarks/${prayer.id}?sessionId=${sessionId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to remove bookmark');
        }
        return response.json();
      } else {
        return await apiRequest("POST", "/api/bookmarks", {
          prayerId: prayer.id,
          sessionId,
        });
      }
    },
    onSuccess: () => {
      // Only update state after successful server response
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      queryClient.invalidateQueries({ queryKey: ['/api/bookmarks/prayers', sessionId] });
      toast({
        title: newBookmarkState ? "Prayer saved" : "Removed from saved",
        description: newBookmarkState 
          ? "Prayer added to your saved prayers."
          : "Prayer removed from your saved prayers.",
      });
    },
    onError: (error: any) => {
      // Don't update state on error
      toast({
        title: "Error",
        description: error.message || "Failed to save prayer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = async () => {
    try {
      const imageDataUrl = await generatePrayerCardImage(prayer);
      
      const blob = await (await fetch(imageDataUrl)).blob();
      const file = new File([blob], 'prayer-card.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Prayer Request',
          text: 'Join me in prayer',
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.href = imageDataUrl;
        link.download = 'prayer-card.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Image downloaded",
          description: "Prayer card image has been downloaded to your device.",
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: "Failed to share prayer. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative" data-testid={`card-prayer-${prayer.id}`}>
      <Button
        variant="ghost"
        size="icon"
        className={`absolute top-4 right-4 transition-colors ${isBookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground'}`}
        onClick={() => bookmarkMutation.mutate()}
        disabled={bookmarkMutation.isPending}
        data-testid={`button-bookmark-${prayer.id}`}
      >
        {isBookmarked ? (
          <BookmarkCheck className="h-5 w-5 fill-current" />
        ) : (
          <Bookmark className="h-5 w-5" />
        )}
      </Button>

      <CardContent className="pt-6 pb-4">
        <div className="mb-4 pr-10">
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap" data-testid={`text-prayer-content-${prayer.id}`}>
            {prayer.content}
          </p>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {prayer.isAnonymous ? (
              <span className="italic">Anonymous</span>
            ) : prayer.authorName ? (
              <span className="font-medium">{prayer.authorName}</span>
            ) : (
              <span className="italic">Anonymous</span>
            )}
            <span>•</span>
            <span>{formatDistanceToNow(new Date(prayer.createdAt), { addSuffix: true })}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isLiftedUp ? "default" : "outline"}
              size="sm"
              onClick={() => !isLiftedUp && liftUpMutation.mutate()}
              disabled={isLiftedUp || liftUpMutation.isPending}
              className={`gap-2 min-w-[70px] ${isLiftedUp ? 'bg-primary shadow-sm' : ''}`}
              data-testid={`button-liftup-${prayer.id}`}
            >
              <Hand className={`h-4 w-4 ${isLiftedUp ? 'fill-current' : ''}`} />
              <span data-testid={`text-liftup-count-${prayer.id}`}>{localLiftUpCount}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComments(v => !v)}
              className="gap-2"
              data-testid={`button-comments-${prayer.id}`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{(prayerComments?.length ?? 0)}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2"
              data-testid={`button-share-${prayer.id}`}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
      {showComments && (
        <div className="px-6 pb-6">
          <div className="space-y-3 mb-3">
            {prayerComments && prayerComments.length > 0 ? (
              prayerComments.map(c => (
                <div key={c.id} className="rounded border p-2">
                  <div className="text-sm text-muted-foreground">{c.authorName || (c.isAnonymous ? 'Anonymous' : '')}</div>
                  <div className="mt-1">{c.content}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No comments yet. Be the first to encourage.</div>
            )}
          </div>

          <PrayerCommentForm prayerId={prayer.id} />
        </div>
      )}
    </Card>
  );
}
