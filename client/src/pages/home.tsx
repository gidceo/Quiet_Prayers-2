import { useQuery } from "@tanstack/react-query";
import { Prayer } from "@shared/schema";
import { CloudHeader } from "@/components/cloud-header";
import { DailyInspiration } from "@/components/daily-inspiration";
import { PrayerCard } from "@/components/prayer-card";
import { PrayerForm } from "@/components/prayer-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: prayers, isLoading } = useQuery<Prayer[]>({
    queryKey: ['/api/prayers'],
  });

  return (
    <div className="min-h-screen bg-background">
      <CloudHeader />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <DailyInspiration />
        
        <div className="mt-8 mb-12">
          <PrayerForm />
        </div>

        <div className="space-y-6 pb-12">
          <h2 className="text-2xl font-semibold text-foreground">Prayer Requests</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : prayers && prayers.length > 0 ? (
            <div className="space-y-4">
              {prayers.map((prayer) => (
                <PrayerCard key={prayer.id} prayer={prayer} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No prayers yet. Be the first to share a prayer request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
