import { useQuery } from "@tanstack/react-query";
import { Question, Comment } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { CommentForm } from "./comment-form";

export function QuestionCard({ question }: { question: Question }) {
  const { data: comments } = useQuery<Comment[]>({ queryKey: [`/api/questions/${question.id}/comments`], retry: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-muted-foreground">{question.content}</p>
        <div className="mb-4">
          <strong>Comments</strong>
          {comments && comments.length > 0 ? (
            <div className="mt-2 space-y-2">
              {comments!.map((c) => (
                <div key={c.id} className="rounded border p-2">
                  <div className="text-sm text-muted-foreground">{c.authorName || (c.isAnonymous ? 'Anonymous' : '')}</div>
                  <div className="mt-1">{c.content}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-2">No comments yet. Be the first to respond.</div>
          )}
        </div>

        <CommentForm questionId={question.id} />
      </CardContent>
    </Card>
  );
}
