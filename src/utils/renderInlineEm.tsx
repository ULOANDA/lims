import React from "react";

export function renderInlineEm(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*([^*]+)\*/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = re.lastIndex;

    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    parts.push(<em key={`${start}-${end}`}>{match[1]}</em>);
    lastIndex = end;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return <>{parts}</>;
}
