import { useQuery } from '@tanstack/react-query';
import { PrayerCard } from './prayer-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { PrayerRequest, Category } from '@shared/schema';
import { Heart } from 'lucide-react';

interface PrayerWallProps {
  selectedCategory: Category | 'All';
}

export function PrayerWall({ selectedCategory }: PrayerWallProps) {
  const queryUrl = selectedCategory === 'All' 
    ? '/api/prayers' 
    : `/api/prayers?category=${selectedCategory}`;
  
  const { data: prayers, isLoading } = useQuery<PrayerRequest[]>({
    queryKey: ['/api/prayers', selectedCategory],
    queryFn: async () => {
      const response = await fetch(queryUrl);
      if (!response.ok) throw new Error('Failed to fetch prayers');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 px-4" data-testid="section-loading">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!prayers || prayers.length === 0) {
    return (
      <section className="py-24 px-4" data-testid="section-empty">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-6 bg-muted rounded-full">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-foreground" data-testid="text-empty-heading">
              No prayers yet
            </h3>
            <p className="text-muted-foreground font-body" data-testid="text-empty-description">
              {selectedCategory === 'All' 
                ? 'Be the first to share a prayer request with the community.'
                : `No prayer requests in the ${selectedCategory} category yet. Be the first to share.`
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4" data-testid="section-prayer-wall">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      </div>
    </section>
  );
}
