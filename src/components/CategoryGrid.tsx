import {
  Briefcase,
  Building2,
  Car,
  Footprints,
  Hammer,
  Laptop,
  Package,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Sprout,
  Store,
  Tv,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { LISTING_CATEGORIES } from '../constants/marketplace';
import type { ListingCategory } from '../types/listing';

const CATEGORY_ICONS: Record<ListingCategory, LucideIcon> = {
  'Moda e acessórios': Sparkles,
  'Alimentos e Mercearia': ShoppingBasket,
  'Serviços técnicos': Wrench,
  'Negócios e empresas': Store,
  'Roupas e calçados': Footprints,
  'Móveis e decoração': Sofa,
  'Materiais de Construção': Hammer,
  'Carros e viaturas': Car,
  'Imóveis e terrenos': Building2,
  'Agricultura e campos': Sprout,
  'Telemóveis e acessórios': Smartphone,
  'Computador e informática': Laptop,
  'Televisor e eletrónicas': Tv,
  Empregos: Briefcase,
  Outros: Package,
};

interface CategoryGridProps {
  selectedCategory: string;
  countsByCategory: Map<string, number>;
  onSelectCategory: (category: ListingCategory) => void;
}

export function CategoryGrid({
  selectedCategory,
  countsByCategory,
  onSelectCategory,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {LISTING_CATEGORIES.map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const isActive = selectedCategory === category;
        const realCount = countsByCategory.get(category) ?? 0;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`group text-left rounded-xl p-4 border transition-all duration-150 cursor-pointer flex flex-col justify-between gap-3 hover:-translate-y-0.5 ${
              isActive
                ? 'bg-zinc-950 border-zinc-950 text-white shadow-sm'
                : 'bg-white border-zinc-200 hover:border-zinc-950 text-zinc-900'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                isActive
                  ? 'bg-yellow-400 text-zinc-950'
                  : 'bg-zinc-100 text-zinc-950 group-hover:bg-yellow-400'
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>

            <div>
              <h3 className="font-display text-sm font-bold leading-snug line-clamp-2">
                {category}
              </h3>
              <p
                className={`mt-1 text-xs tabular-nums ${
                  isActive ? 'text-yellow-400' : 'text-zinc-500'
                }`}
              >
                4.000 oportunidades
              </p>
              {realCount > 0 && (
                <p
                  className={`mt-0.5 text-[11px] font-semibold tabular-nums ${
                    isActive ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                >
                  {realCount} {realCount === 1 ? 'publicado' : 'publicados'}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
