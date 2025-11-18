import { useQuery } from "@tanstack/react-query";
import { DailyInspiration as DailyInspirationType } from "@shared/schema";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

export function DailyInspiration() {
  const { data: inspiration, isLoading } = useQuery<DailyInspirationType>({
    queryKey: ['/api/daily-inspiration'],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!inspiration) {
    return null;
  }

  return (
    <div className="mt-8" data-testid="daily-inspiration">
      <Card className="relative py-8 px-6 md:py-12 md:px-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <Badge
          variant="outline"
          className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border-primary/30"
          data-testid="badge-daily"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Daily
        </Badge>

        <div className="max-w-3xl mx-auto text-center space-y-4">
          <p className="text-xl md:text-2xl font-serif text-foreground leading-relaxed italic">
            "{inspiration.content}"
          </p>
          <p className="text-sm text-muted-foreground">
            — {inspiration.attribution}
          </p>
        </div>
      </Card>
    </div>
  );
}
