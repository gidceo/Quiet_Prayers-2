import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommentSchema, type InsertComment } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

export function CommentForm({ questionId }: { questionId: string }) {
  const { toast } = useToast();

  const form = useForm<InsertComment>({
    resolver: zodResolver(insertCommentSchema),
    defaultValues: { content: "", authorName: "", isAnonymous: false },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: InsertComment) => {
      return await apiRequest("POST", `/api/questions/${questionId}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${questionId}/comments`] });
      form.reset();
      toast({ title: 'Comment posted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to post comment' });
    },
  });

  const onSubmit = (data: InsertComment) => {
    createCommentMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Form {...form}>
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your comment</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Share encouragement or an answer..." />
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
              <FormLabel>Name (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={createCommentMutation.isPending}>
          {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </Form>
    </form>
  );
}
