import { Directive, ElementRef, HostListener, input, output, Renderer2 } from '@angular/core';

@Directive({
  selector: '[uiDraggable]',
  standalone: true,
})
export class DraggableDirective {
  dragData = input<any>(undefined, { alias: 'uiDraggable' });
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {
    this.renderer.setAttribute(this.el.nativeElement, 'draggable', 'true');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
  }

  @HostListener('dragstart', ['$event'])
  onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(this.dragData()));
      event.dataTransfer.effectAllowed = 'move';
      // Adding a class for visual feedback during drag
      setTimeout(() => this.renderer.addClass(this.el.nativeElement, 'opacity-40'), 0);
    }
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(_event: DragEvent) {
    this.renderer.removeClass(this.el.nativeElement, 'opacity-40');
  }
}

@Directive({
  selector: '[uiDroppable]',
  standalone: true,
})
export class DroppableDirective {
  dropped = output<any>();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault(); // Essential to allow dropping
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.renderer.addClass(this.el.nativeElement, 'ui-drag-over');
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(_event: DragEvent) {
    this.removeStyles();
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.removeStyles();
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('application/json');
      if (data) {
        this.dropped.emit(JSON.parse(data));
      }
    }
  }

  private removeStyles() {
    this.renderer.removeClass(this.el.nativeElement, 'ui-drag-over');
  }
}
