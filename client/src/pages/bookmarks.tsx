import { useQuery } from "@tanstack/react-query";
import { Prayer } from "@shared/schema";
import { PrayerCard } from "@/components/prayer-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bookmark as BookmarkIcon } from "lucide-react";
import { Link } from "wouter";
import { getSessionId } from "@/lib/session";

export default function Bookmarks() {
  const sessionId = getSessionId();
  
  const { data: bookmarkedPrayers, isLoading } = useQuery<Prayer[]>({
    queryKey: ['/api/bookmarks/prayers', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/bookmarks/prayers?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch bookmarked prayers');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <BookmarkIcon className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Saved Prayers</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : bookmarkedPrayers && bookmarkedPrayers.length > 0 ? (
          <div className="space-y-4">
            {bookmarkedPrayers.map((prayer) => (
              <PrayerCard key={prayer.id} prayer={prayer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookmarkIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No saved prayers yet</h3>
            <p className="text-muted-foreground mb-6">
              Bookmark prayers to save them here for later
            </p>
            <Link href="/">
              <Button data-testid="button-browse-prayers">
                Browse Prayers
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
