import { useQuery } from "@tanstack/react-query";
import { Question } from "@shared/schema";
import { CloudHeader } from "@/components/cloud-header";
import { QuestionForm } from "@/components/question-form";
import { QuestionCard } from "@/components/question-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function QA() {
  const { data: questions, isLoading } = useQuery<Question[]>({ queryKey: ['/api/questions'] });

  return (
    <div className="min-h-screen bg-background">
      <CloudHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <QuestionForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Questions & Answers</h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
          ) : questions && questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions yet. Ask the first one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
