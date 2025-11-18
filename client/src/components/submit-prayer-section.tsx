import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { categories, type InsertPrayer, insertPrayerSchema, type Prayer } from '@shared/schema';
import { Loader2, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function SubmitPrayerSection() {
  const { toast } = useToast();

  const form = useForm<InsertPrayer>({
    resolver: zodResolver(insertPrayerSchema),
    defaultValues: {
      content: '',
      category: 'Faith',
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (prayer: InsertPrayer) => {
      return apiRequest('POST', '/api/prayers', prayer);
    },
    onMutate: async (newPrayer) => {
      await queryClient.cancelQueries({ queryKey: ['/api/prayers'] });
      
      const previousAll = queryClient.getQueryData(['/api/prayers', 'All']);
      const previousList = queryClient.getQueryData<Prayer[] | undefined>(['/api/prayers']);
      const previousCategory = queryClient.getQueryData(['/api/prayers', newPrayer.category]);
      
      const optimisticPrayer = {
        id: `temp-${Date.now()}`,
        ...newPrayer,
        prayerCount: 0,
        createdAt: new Date(),
      };
      
      queryClient.setQueryData<Prayer[] | undefined>(['/api/prayers', 'All'], (old) =>
        old ? [optimisticPrayer as any, ...old] : [optimisticPrayer as any]
      );
      // Also add to the general prayers list so it appears on the home feed immediately
      queryClient.setQueryData<Prayer[] | undefined>(['/api/prayers'], (old) =>
        old ? [optimisticPrayer as any, ...old] : [optimisticPrayer as any]
      );
      queryClient.setQueryData<Prayer[] | undefined>(['/api/prayers', newPrayer.category], (old) =>
        old ? [optimisticPrayer as any, ...old] : [optimisticPrayer as any]
      );
      
      return { previousAll, previousCategory, category: newPrayer.category };
    },
    onSuccess: (createdPrayer: any, _variables, context) => {
      // Normalize server result to ensure required fields exist
      const normalized = {
        id: String(createdPrayer?.id ?? `temp-${Date.now()}`),
        content: String(createdPrayer?.content ?? ''),
        createdAt: createdPrayer?.createdAt ?? new Date().toISOString(),
        isAnonymous: Boolean(createdPrayer?.isAnonymous ?? false),
        authorName: createdPrayer?.authorName ?? null,
        liftUpCount: Number(createdPrayer?.liftUpCount ?? 0),
        category: createdPrayer?.category ?? 'Other',
      } as any;

      // Replace optimistic entries / ensure the real created prayer appears
      try {
        queryClient.setQueryData<Prayer[] | undefined>(['/api/prayers'], (old) => {
          if (!old) return [normalized as Prayer];
          // remove any temporary optimistic entries (by id prefix) then prepend created
          const filtered = old.filter((p) => !String((p as any).id).startsWith('temp-'));
          return [normalized as Prayer, ...filtered];
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to replace optimistic prayers on success:', e, createdPrayer);
      }

      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      toast({
        title: 'Prayer submitted',
        description: 'Your prayer request has been shared with the community.',
      });
    },
    onError: (error, newPrayer, context) => {
      if (context) {
        if (context.previousAll !== undefined) {
          queryClient.setQueryData(['/api/prayers', 'All'], context.previousAll);
        }
        if (context.previousCategory !== undefined) {
          queryClient.setQueryData(['/api/prayers', context.category], context.previousCategory);
        }
      }
      toast({
        title: 'Error',
        description: 'Failed to submit prayer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InsertPrayer) => {
    submitMutation.mutate(data);
  };

  return (
    <section className="py-16 px-4" data-testid="section-submit">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-semibold text-foreground" data-testid="text-submit-heading">
            Submit a Prayer Request
          </h2>
          <p className="text-muted-foreground font-body" data-testid="text-submit-description">
            Share what's on your heart. Your request is anonymous and will be seen by others who want to pray for you.
          </p>
        </div>

        <Card className="p-8 shadow-lg" data-testid="card-submit-form">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-category">Category</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant={field.value === cat ? 'default' : 'secondary'}
                            className="cursor-pointer hover-elevate active-elevate-2"
                            onClick={() => field.onChange(cat)}
                            data-testid={`badge-category-${cat.toLowerCase()}`}
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-prayer">Your Prayer Request</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Share what you need prayer for..."
                        className="min-h-40 resize-y text-base font-body leading-relaxed"
                        maxLength={500}
                        data-testid="textarea-prayer"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span data-testid="text-char-hint">Minimum 10 characters</span>
                      <span data-testid="text-char-count">{field.value.length}/500</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitMutation.isPending}
                data-testid="button-submit-prayer"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Prayer
                  </>
                )}
              </Button>
            </form>
          </Form>
        </Card>
      </div>
    </section>
  );
}
