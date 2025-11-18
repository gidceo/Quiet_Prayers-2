import { Badge } from '@/components/ui/badge';
import { categories, type Category } from '@shared/schema';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

export function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const allCategories = ['All', ...categories] as const;

  return (
    <section className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b py-8 px-4" data-testid="section-filter">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-6 text-foreground" data-testid="text-filter-heading">
          Prayer Wall
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {allCategories.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'secondary'}
              className="cursor-pointer px-6 py-3 text-sm hover-elevate active-elevate-2"
              onClick={() => onSelectCategory(cat as Category | 'All')}
              data-testid={`badge-filter-${cat.toLowerCase()}`}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
