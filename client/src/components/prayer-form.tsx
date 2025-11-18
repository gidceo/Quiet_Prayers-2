import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPrayerSchema, type InsertPrayer, type Prayer } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Send } from "lucide-react";

export function PrayerForm() {
  const { toast } = useToast();
  const [moderationError, setModerationError] = useState<string | null>(null);

  const form = useForm<InsertPrayer>({
    resolver: zodResolver(insertPrayerSchema),
    defaultValues: {
      content: "",
      isAnonymous: false,
      authorName: "",
    },
  });

  const createPrayerMutation = useMutation({
    mutationFn: async (data: InsertPrayer) => {
      return await apiRequest("POST", "/api/prayers", data);
    },
    onSuccess: (createdPrayer: any) => {
      // Normalize the created prayer to ensure required fields exist and have expected types
      const normalized = {
        id: String(createdPrayer?.id ?? `temp-${Date.now()}`),
        content: String(createdPrayer?.content ?? ""),
        createdAt: createdPrayer?.createdAt ?? new Date().toISOString(),
        isAnonymous: Boolean(createdPrayer?.isAnonymous ?? false),
        authorName: createdPrayer?.authorName ?? null,
        liftUpCount: Number(createdPrayer?.liftUpCount ?? 0),
        category: createdPrayer?.category ?? 'Other',
      } as any;

      // Immediately update the prayers query cache so the new prayer shows up
      try {
        queryClient.setQueryData<Prayer[] | undefined>(['/api/prayers'], (old) => {
          if (!old) return [normalized as Prayer];
          return [normalized as Prayer, ...old];
        });
      } catch (e) {
        // Log cache update errors to help debug blank-screen crashes
        // eslint-disable-next-line no-console
        console.error('Failed to update prayers cache on create:', e, createdPrayer);
      }

      // Also trigger a refetch to ensure consistency with server
      queryClient.invalidateQueries({ queryKey: ['/api/prayers'] });
      form.reset();
      setModerationError(null);
      // eslint-disable-next-line no-console
      console.log('Prayer created (client):', createdPrayer?.id);
      toast({
        title: "Prayer submitted",
        description: "Your prayer request has been shared with the community.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("moderation") || error.message?.includes("inappropriate") || error.message?.includes("respectful")) {
        setModerationError(error.message || "Your prayer is being reviewed. Please ensure your message is respectful and appropriate.");
      } else {
        toast({
          title: "Error",
          description: "Failed to submit prayer. Please try again.",
        });
      }
    },
  });

  const onSubmit = (data: InsertPrayer) => {
    setModerationError(null);
    createPrayerMutation.mutate(data);
  };

  const isAnonymous = form.watch("isAnonymous");

  return (
    <Card data-testid="card-prayer-form">
      <CardHeader>
        <CardTitle className="text-2xl">Share a Prayer Request</CardTitle>
      </CardHeader>
      <CardContent>
        {moderationError && (
          <Alert className="mb-4" data-testid="alert-moderation">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{moderationError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Prayer</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share what's on your heart..."
                      className="min-h-32 resize-none"
                      data-testid="textarea-prayer-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAnonymous"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Post Anonymously</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Your name will not be shown
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-anonymous"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {!isAnonymous && (
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your name"
                        data-testid="input-author-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={createPrayerMutation.isPending}
              data-testid="button-submit-prayer"
            >
              {createPrayerMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Prayer
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
