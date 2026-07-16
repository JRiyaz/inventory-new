import { CommonModule } from '@angular/common';
import { Component, Input, type OnDestroy, type OnInit, signal } from '@angular/core';

@Component({
  selector: 'lib-typewriter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="typewriter-container" [class]="customClass">
      <span class="typed-text">{{ displayText() }}</span>
      <span class="cursor" [class.blinking]="isCursorBlinking()"></span>
    </div>
  `,
  styles: [
    `
      .typewriter-container {
        display: inline-flex;
        align-items: center;
        font-family: inherit;
      }

      .typed-text {
        white-space: pre-wrap;
      }

      .cursor {
        display: inline-block;
        width: 2px;
        height: 1.2em;
        background-color: currentColor;
        margin-left: 2px;
        transition: opacity 0.1s;
      }

      .cursor.blinking {
        animation: blink 0.8s infinite;
      }

      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0;
        }
      }
    `,
  ],
})
export class TypewriterComponent implements OnInit, OnDestroy {
  @Input() words: string[] = ['Typewriter', 'Effect', 'Premium'];
  @Input() typeSpeed = 100;
  @Input() deleteSpeed = 50;
  @Input() delayBetweenWords = 2000;
  @Input() customClass = '';

  displayText = signal('');
  isDeleting = signal(false);
  wordIndex = signal(0);
  isCursorBlinking = signal(true);

  private timeoutId: any;

  ngOnInit() {
    this.startTyping();
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private startTyping() {
    const currentWord = this.words[this.wordIndex() % this.words.length];
    const currentText = this.displayText();

    if (this.isDeleting()) {
      // Deleting
      this.isCursorBlinking.set(false);
      this.displayText.set(currentText.substring(0, currentText.length - 1));

      if (this.displayText() === '') {
        this.isDeleting.set(false);
        this.wordIndex.update((i) => i + 1);
        this.timeoutId = setTimeout(() => this.startTyping(), 500);
      } else {
        this.timeoutId = setTimeout(() => this.startTyping(), this.deleteSpeed);
      }
    } else {
      // Typing
      this.isCursorBlinking.set(false);
      this.displayText.set(currentWord.substring(0, currentText.length + 1));

      if (this.displayText() === currentWord) {
        this.isCursorBlinking.set(true);
        this.timeoutId = setTimeout(() => {
          this.isDeleting.set(true);
          this.startTyping();
        }, this.delayBetweenWords);
      } else {
        this.timeoutId = setTimeout(() => this.startTyping(), this.typeSpeed);
      }
    }
  }
}
