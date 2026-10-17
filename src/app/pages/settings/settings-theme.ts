import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { THEME_OPTIONS } from '../../domain/theme';
import { ThemeStore } from '../../state/theme-store';

@Component({
  selector: 'app-settings-theme',
  templateUrl: './settings-theme.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsTheme {
  readonly store = inject(ThemeStore);
  readonly options = THEME_OPTIONS;
}
