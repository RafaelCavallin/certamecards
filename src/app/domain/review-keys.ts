export type ReviewKeyAction = 'reveal' | 'again' | 'good';

const SPACE_CODE = 'Space';
const AGAIN_KEY = '1';
const GOOD_KEY = '2';

export function reviewKeyAction(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
  revealed: boolean,
): ReviewKeyAction | null {
  if (event.code === SPACE_CODE) return revealed ? 'good' : 'reveal';
  if (!revealed) return null;
  if (event.key === AGAIN_KEY) return 'again';
  return event.key === GOOD_KEY ? 'good' : null;
}
