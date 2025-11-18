import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuestionSchema, type InsertQuestion } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle, Send } from "lucide-react";

export function QuestionForm() {
  const { toast } = useToast();
  const [moderationError, setModerationError] = useState<string | null>(null);

  const form = useForm<InsertQuestion>({
    resolver: zodResolver(insertQuestionSchema),
    defaultValues: {
      title: "",
      content: "",
      authorName: "",
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: InsertQuestion) => {
      return await apiRequest("POST", "/api/questions", data);
    },
    onSuccess: (createdQuestion: any) => {
      try {
        queryClient.setQueryData(['/api/questions'], (old: any) => (old ? [createdQuestion, ...old] : [createdQuestion]));
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      form.reset();
      setModerationError(null);
      toast({
        title: "Question submitted",
        description: "Your question has been posted.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("moderation") || error.message?.includes("inappropriate") || error.message?.includes("respectful")) {
        setModerationError(error.message || "Your question is being reviewed. Please ensure it's appropriate.");
      } else {
        toast({
          title: "Error",
          description: "Failed to submit question. Please try again.",
        });
      }
    },
  });

  const onSubmit = (data: InsertQuestion) => {
    setModerationError(null);
    createQuestionMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Ask a Question</CardTitle>
      </CardHeader>
      <CardContent>
        {moderationError && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{moderationError}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Short title for your question" />
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
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Ask your question here..." className="min-h-32 resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Leave blank to post anonymously" />
                  </FormControl>
                  <div className="text-sm text-muted-foreground">
                    If you don't enter a name, your question will be posted anonymously
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createQuestionMutation.isPending}>
              {createQuestionMutation.isPending ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Question
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
