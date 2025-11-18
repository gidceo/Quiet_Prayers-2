import { useState, useEffect } from "react";
import { Prayer } from "@shared/schema";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, BookmarkCheck, Hand, Share2, MessageSquare, Download, Copy } from "lucide-react";
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
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
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
      setGeneratedImageUrl(imageDataUrl);
      setShowShareDialog(true);
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Error",
        description: "Failed to generate prayer card. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `prayer-card-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded",
      description: "Prayer card saved to your device.",
    });
  };

  const handleCopyText = () => {
    const shareText = `${prayer.content}\n\n${prayer.isAnonymous || !prayer.authorName ? '— Anonymous' : `— ${prayer.authorName}`}\n\nShared from QuietPrayers`;
    navigator.clipboard.writeText(shareText);
    toast({
      title: "Copied",
      description: "Prayer text copied to clipboard.",
    });
  };

  const handleSocialShare = (platform: string) => {
    const text = encodeURIComponent(`Join me in prayer: ${prayer.content.substring(0, 100)}${prayer.content.length > 100 ? '...' : ''}`);
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${text}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <Card className="relative hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-primary/30" data-testid={`card-prayer-${prayer.id}`}>
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
        <div className="mb-5 pr-10">
          <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere font-body" data-testid={`text-prayer-content-${prayer.id}`}>
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
        <div className="border-t mt-4 pt-4 px-6 pb-6 bg-muted/20">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Encouragement & Prayers</h3>
          
          <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
            {prayerComments && prayerComments.length > 0 ? (
              prayerComments.map(c => (
                <div key={c.id} className="bg-background rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {(c.authorName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {c.authorName || 'Anonymous'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                        {c.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground italic">
                  No comments yet. Be the first to offer encouragement.
                </p>
              </div>
            )}
          </div>

          <PrayerCommentForm prayerId={prayer.id} />
        </div>
      )}

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Prayer</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share this prayer request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {generatedImageUrl && (
              <div className="flex justify-center">
                <img 
                  src={generatedImageUrl} 
                  alt="Prayer card" 
                  className="max-w-full h-auto rounded-lg border shadow-sm"
                  style={{ maxHeight: '300px' }}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Button
                onClick={handleDownloadImage}
                className="w-full gap-2"
                variant="default"
              >
                <Download className="h-4 w-4" />
                Download Image
              </Button>

              <Button
                onClick={handleCopyText}
                className="w-full gap-2"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
                Copy Prayer Text
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Share on social media
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleSocialShare('facebook')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Facebook
                </Button>
                <Button
                  onClick={() => handleSocialShare('twitter')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Twitter
                </Button>
                <Button
                  onClick={() => handleSocialShare('whatsapp')}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
