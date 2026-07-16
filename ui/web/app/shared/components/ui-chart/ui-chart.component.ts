import { CommonModule } from '@angular/common';
import { Component, computed, Input } from '@angular/core';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'ui-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-header" *ngIf="title">
        <h4>{{ title }}</h4>
        <span class="subtitle" *ngIf="subtitle">{{ subtitle }}</span>
      </div>

      <div class="chart-area" [style.height.px]="height">
        <!-- Bars -->
        <div class="bars-wrap" *ngIf="type === 'bar'">
          <div *ngFor="let point of data" class="bar-col group">
            <div class="bar-val-tip">{{ point.value }}</div>
            <div
              class="bar-fill"
              [style.height.%]="(point.value / maxValue()) * 100"
            >
              <div class="bar-gradient"></div>
            </div>
            <span class="bar-label">{{ point.label }}</span>
          </div>
        </div>

        <!-- Area / Line (Simplified SVG) -->
        <div class="svg-wrap" *ngIf="type === 'area'">
          <svg
            [attr.viewBox]="'0 0 100 100'"
            preserveAspectRatio="none"
            class="w-full h-full"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stop-color="var(--primary)"
                  stop-opacity="0.3"
                />
                <stop
                  offset="100%"
                  stop-color="var(--primary)"
                  stop-opacity="0"
                />
              </linearGradient>
            </defs>
            <path
              [attr.d]="areaPath()"
              fill="url(#areaGradient)"
              class="area-path"
            />
            <path
              [attr.d]="linePath()"
              fill="none"
              stroke="var(--primary)"
              stroke-width="2"
              vector-effect="non-scaling-stroke"
              class="line-path"
            />
          </svg>
          <div class="labels-row">
            <span *ngFor="let point of data">{{ point.label }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .chart-container {
        background: var(--surface);
        border-radius: 1.5rem;
        padding: 1.5rem;
      }
      .chart-header {
        margin-bottom: 2rem;
      }
      .chart-header h4 {
        font-size: 0.9rem;
        font-weight: 850;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }
      .chart-header .subtitle {
        font-size: 0.75rem;
        color: var(--text-muted);
        opacity: 0.7;
      }

      .chart-area {
        position: relative;
        width: 100%;
      }

      /* Bar Chart */
      .bars-wrap {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        height: 100%;
        gap: 1rem;
        padding-top: 2rem;
      }
      .bar-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        height: 100%;
        position: relative;
      }
      .bar-fill {
        width: 100%;
        max-width: 40px;
        background: #f1f5f9;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
      }
      :host-context(.dark) .bar-fill {
        background: rgba(255, 255, 255, 0.05);
      }
      .bar-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, var(--primary), #a855f7);
        opacity: 0.8;
      }
      .bar-label {
        font-size: 10px;
        font-weight: 800;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .bar-val-tip {
        position: absolute;
        top: -25px;
        background: var(--text);
        color: var(--bg);
        font-size: 10px;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 4px;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s;
      }
      .bar-col:hover .bar-val-tip {
        opacity: 1;
        transform: translateY(0);
      }

      /* Area Chart */
      .svg-wrap {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      .area-path {
        transform: scaleY(-1) translateY(-100%);
      }
      .line-path {
        transform: scaleY(-1) translateY(-100%);
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: draw 2s forwards;
      }
      @keyframes draw {
        to {
          stroke-dashoffset: 0;
        }
      }

      .labels-row {
        display: flex;
        justify-content: space-between;
        margin-top: 1rem;
        border-top: 1px solid var(--border);
        pt: 0.5rem;
      }
      .labels-row span {
        font-size: 10px;
        font-weight: 800;
        color: var(--text-muted);
        text-transform: uppercase;
      }
    `,
  ],
})
export class UiChartComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() data: ChartDataPoint[] = [];
  @Input() type: 'bar' | 'area' = 'bar';
  @Input() height: number = 200;

  maxValue = computed(() => {
    return Math.max(...this.data.map((d) => d.value), 1);
  });

  linePath = computed(() => {
    if (this.data.length < 2) return '';
    const points = this.data.map((p, i) => {
      const x = (i / (this.data.length - 1)) * 100;
      const y = (p.value / this.maxValue()) * 80 + 10; // Margin top/bottom
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  });

  areaPath = computed(() => {
    const lp = this.linePath();
    if (!lp) return '';
    return `${lp} L 100,0 L 0,0 Z`;
  });
}
