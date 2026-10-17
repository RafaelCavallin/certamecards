import { ChangeDetectionStrategy, Component, computed, ElementRef, input, model, signal, viewChild } from '@angular/core';
import { TAGS_MAX } from '../../domain/card-limits';
import { listTagCatalog, suggestTags } from '../../domain/tag-catalog';
import { addTagInput, tagKey, tagRejectionMessage } from '../../domain/tags';
import { liveQuerySignal } from '../../state/live-query';

const COMMIT_PATTERN = /[,\n]/;
let nextInstanceId = 0;

@Component({
  selector: 'app-tag-input',
  templateUrl: './tag-input.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInput {
  readonly tags = model<string[]>([]);
  readonly label = input('Etiquetas');
  readonly instanceId = `tag-input-${nextInstanceId++}`;
  readonly text = signal('');
  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  readonly open = signal(false);
  readonly activeIndex = signal(-1);
  readonly message = signal<string | null>(null);
  private readonly catalog = liveQuerySignal(listTagCatalog);
  readonly atLimit = computed(() => this.tags().length >= TAGS_MAX);
  readonly suggestions = computed(() =>
    suggestTags({ catalog: this.catalog() ?? [], query: this.text(), exclude: this.tags() }),
  );
  readonly expanded = computed(() => this.open() && this.suggestions().length > 0);
  readonly activeId = computed(() =>
    this.expanded() && this.activeIndex() >= 0 ? `${this.instanceId}-opt-${this.activeIndex()}` : null);

  onInput(field: HTMLInputElement): void {
    this.message.set(null);
    if (COMMIT_PATTERN.test(field.value)) {
      this.add(field.value);
      return;
    }
    this.text.set(field.value);
    this.open.set(true);
    this.activeIndex.set(-1);
  }

  add(raw: string): void {
    const result = addTagInput({ raw, current: this.tags(), catalog: this.catalog() ?? [] });
    this.tags.set(result.tags);
    const first = result.rejected[0];
    this.message.set(first ? tagRejectionMessage(first.reason) : null);
    this.text.set('');
    const element = this.field()?.nativeElement;
    if (element) element.value = '';
    this.activeIndex.set(-1);
  }

  remove(tag: string): void {
    this.tags.update((current) => current.filter((item) => tagKey(item) !== tagKey(tag)));
    this.message.set(null);
  }

  commitPending(): void {
    if (this.text().trim()) this.add(this.text());
    this.open.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    this.keyHandlers[event.key]?.(event);
  }
  private readonly keyHandlers: Record<string, (event: KeyboardEvent) => void> = {
    Enter: (event) => this.onEnter(event),
    Backspace: () => this.onBackspace(),
    ArrowDown: (event) => this.moveActive(event, 1),
    ArrowUp: (event) => this.moveActive(event, -1),
    Escape: (event) => this.onEscape(event),
  };

  private onEnter(event: KeyboardEvent): void {
    event.preventDefault();
    const active = this.suggestions()[this.activeIndex()];
    this.add(this.expanded() && active ? active.name : this.text());
  }

  private onBackspace(): void {
    if (this.text() || this.tags().length === 0) return;
    this.remove(this.tags()[this.tags().length - 1]);
  }

  private moveActive(event: KeyboardEvent, step: number): void {
    const size = this.suggestions().length;
    if (size === 0) return;
    event.preventDefault();
    this.open.set(true);
    this.activeIndex.update((index) => (Math.max(index, step < 0 ? 0 : -1) + step + size) % size);
  }

  private onEscape(event: KeyboardEvent): void {
    if (!this.expanded()) return;
    event.preventDefault();
    this.open.set(false);
  }
}
