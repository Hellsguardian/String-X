import type { Page25QuickReply } from '../types';

export interface ResolvedQuickReply {
  key: string;
  label: string;
  message: string;
}

export function resolveQuickReplies(items: Page25QuickReply[]): ResolvedQuickReply[] {
  return items.map((item, index) => {
    if (typeof item === 'string') {
      return { key: `${index}-${item}`, label: item, message: item };
    }
    return {
      key: item.id ?? `${index}-${item.label}`,
      label: item.label,
      message: item.message ?? item.label,
    };
  });
}

/** "A", "A and B", "A, B and C" */
export function joinWithAnd(items: string[]): Array<[string, string]> {
  // Returns [text, separatorAfter] pairs so the view can bold each item.
  return items.map((item, index) => {
    let separator = '';
    if (index < items.length - 2) separator = ', ';
    else if (index === items.length - 2) separator = ' and ';
    return [item, separator] as [string, string];
  });
}

export function createPage25Id(): string {
  return `p25-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
