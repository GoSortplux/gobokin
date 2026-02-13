import { useEffect, RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | RefObject<T | null>[],
  handler: (event: AnyEvent) => void,
): void {
  useEffect(() => {
    const listener = (event: AnyEvent) => {
      const refs = Array.isArray(ref) ? ref : [ref];

      const isInside = refs.some(r => {
        const el = r?.current;
        return el && el.contains(event.target as Node);
      });

      if (isInside) {
        return;
      }

      handler(event);
    };

    document.addEventListener(`mousedown`, listener);
    document.addEventListener(`touchstart`, listener);

    return () => {
      document.removeEventListener(`mousedown`, listener);
      document.removeEventListener(`touchstart`, listener);
    };
  }, [ref, handler]); // Reload only if ref or handler changes
}

export default useOnClickOutside;
