declare module 're-resizable' {
  import * as React from 'react';

  export interface ResizableProps {
    size?: { width: number | string, height: number | string };
    onResizeStop?: (e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, d: { width: number, height: number }) => void;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    children?: React.ReactNode;
  }

  export class Resizable extends React.Component<ResizableProps> {}
}
