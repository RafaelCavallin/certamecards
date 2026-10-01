import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../ui/confirm-dialog/confirm-dialog';
import { TagFilterStore } from '../../state/tag-filter-store';
import { liveQuerySignal } from '../../state/live-query';
import { TAG_INVALID_MESSAGES, deleteTag, planTagRename, renameTag } from '../../domain/tag-bulk';
import { listTagCatalog } from '../../domain/tag-catalog';
import { tagKey, type TagSummary } from '../../domain/tags';
import { TagRow } from './tag-row';

interface RowError {
  key: string;
  message: string;
}

interface PendingMerge {
  fromKey: string;
  newName: string;
  targetName: string;
  affected: number;
}

@Component({
  selector: 'app-tags',
  imports: [RouterLink, ConfirmDialog, TagRow],
  templateUrl: './tags.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tags {
  private readonly tagFilter = inject(TagFilterStore);
  private readonly mergeDialog = viewChild.required<ConfirmDialog>('mergeDialog');
  private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog');
  readonly catalog = liveQuerySignal(listTagCatalog);
  readonly editingKey = signal<string | null>(null);
  readonly rowError = signal<RowError | null>(null);
  readonly pendingMerge = signal<PendingMerge | null>(null);
  readonly pendingDelete = signal<TagSummary | null>(null);

  startEdit(key: string): void {
    this.rowError.set(null);
    this.editingKey.set(key);
  }

  cancelEdit(): void {
    this.rowError.set(null);
    this.editingKey.set(null);
  }

  errorFor(key: string): string | null {
    const error = this.rowError();
    return error?.key === key ? error.message : null;
  }

  async rename(fromKey: string, newName: string): Promise<void> {
    const plan = planTagRename(this.catalog() ?? [], { fromKey, newName });
    if (plan.kind === 'invalid') return this.rowError.set({ key: fromKey, message: TAG_INVALID_MESSAGES[plan.reason] });
    if (plan.kind === 'rename') return this.run(fromKey, newName);
    this.pendingMerge.set({ fromKey, newName, targetName: plan.target.name, affected: plan.affected });
    this.mergeDialog().open();
  }

  async confirmMerge(): Promise<void> {
    const merge = this.pendingMerge();
    if (merge) await this.run(merge.fromKey, merge.newName);
  }

  askDelete(tag: TagSummary): void {
    this.pendingDelete.set(tag);
    this.deleteDialog().open();
  }

  async confirmDelete(): Promise<void> {
    const tag = this.pendingDelete();
    if (!tag) return;
    try {
      await deleteTag(tag.key);
      this.tagFilter.applyDelete(tag.key);
    } catch (error: unknown) {
      console.error(error);
      this.rowError.set({ key: tag.key, message: 'Não foi possível excluir a etiqueta.' });
    }
  }

  private async run(fromKey: string, newName: string): Promise<void> {
    try {
      await renameTag({ fromKey, newName });
      this.tagFilter.applyRename(fromKey, tagKey(newName));
      this.cancelEdit();
    } catch (error: unknown) {
      console.error(error);
      this.rowError.set({ key: fromKey, message: 'Não foi possível renomear a etiqueta.' });
    }
  }
}
