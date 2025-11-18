import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Quote } from 'lucide-react';
import type { DailyVerse } from '@shared/schema';

export function DailyInspirationCard() {
  const { data: verse, isLoading } = useQuery<DailyVerse>({
    queryKey: ['/api/inspiration/daily'],
  });

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto p-8 bg-white/95 backdrop-blur-sm" data-testid="card-inspiration-loading">
        <Skeleton className="h-20 w-full mb-4" />
        <Skeleton className="h-6 w-32" />
      </Card>
    );
  }

  if (!verse) return null;

  return (
    <Card 
      className="max-w-2xl mx-auto p-8 bg-white/95 backdrop-blur-sm shadow-lg border-2 border-primary/20 bg-gradient-to-br from-white/95 to-primary/5"
      data-testid="card-inspiration"
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <Quote className="w-6 h-6 text-primary" data-testid="icon-quote" />
          </div>
        </div>
        
        <blockquote className="text-center space-y-4">
          <p 
            className="text-lg md:text-xl font-serif italic leading-relaxed text-foreground"
            data-testid="text-verse"
          >
            "{verse.text}"
          </p>
          <footer>
            <cite 
              className="text-sm font-medium text-muted-foreground not-italic"
              data-testid="text-verse-reference"
            >
              — {verse.reference}
            </cite>
          </footer>
        </blockquote>
      </div>
    </Card>
  );
}
