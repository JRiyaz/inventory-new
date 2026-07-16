import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InventoryDataService } from 'ui-shared';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="categories-page animate-fade-in">
      <header class="page-header">
        <h1>Explore Categories</h1>
        <p>
          Browse our curated collection of premium products across all
          departments.
        </p>
      </header>

      <div class="categories-grid">
        <div
          *ngFor="let cat of categoryData()"
          class="category-card"
          [routerLink]="['/store']"
          [queryParams]="{ category: cat.name }"
        >
          <div class="card-visual" [style.background]="cat.color">
            <span class="icon">{{ cat.icon }}</span>
          </div>
          <div class="card-info">
            <h3>{{ cat.name }}</h3>
            <p>{{ cat.count }} items</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .categories-page {
        max-width: 1000px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: 3rem;
        text-align: center;
      }
      .page-header h1 {
        font-size: 2.5rem;
        font-weight: 900;
        margin-bottom: 0.5rem;
        letter-spacing: -0.03em;
      }
      .page-header p {
        color: var(--text-muted);
        font-size: 1.1rem;
        font-weight: 500;
      }

      .categories-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 2rem;
      }

      .category-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      .category-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        border-color: var(--primary);
      }

      .card-visual {
        width: 80px;
        height: 80px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
        margin-bottom: 1.5rem;
        transition: transform 0.3s;
      }

      .category-card:hover .card-visual {
        transform: scale(1.1) rotate(5deg);
      }

      .card-info h3 {
        font-size: 1.2rem;
        font-weight: 800;
        margin-bottom: 0.25rem;
      }
      .card-info p {
        font-size: 0.9rem;
        color: var(--text-muted);
        font-weight: 600;
      }
    `,
  ],
})
export class CategoriesComponent {
  private inventory = inject(InventoryDataService);

  categoryData = computed(() => {
    const products = this.inventory.products();
    const cats = [...new Set(products.map((p) => p.category))];

    const colors = ['#fef3c7', '#dcfce7', '#dbeafe', '#f3e8ff', '#fee2e2', '#ffedd5'];
    const icons: Record<string, string> = {
      Electronics: '💻',
      Office: '📁',
      Furniture: '🪑',
      Accessories: '⌚',
      Kitchen: '🍳',
      Sports: '⚽',
    };

    return cats.map((name, i) => ({
      name,
      count: products.filter((p) => p.category === name).length,
      color: colors[i % colors.length],
      icon: icons[name] || '📦',
    }));
  });
}
