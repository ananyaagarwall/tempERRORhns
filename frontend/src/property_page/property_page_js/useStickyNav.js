import { useState, useEffect, useRef } from 'react';

/**
 * A custom hook to manage the sticky state of a navigation element.
 * @param {object} options - Configuration options for sticky behavior.
 * @param {number} [options.offset=0] - The distance from the top/bottom of the viewport where the element should become sticky.
 * @param {'top' | 'bottom'} [options.position='top'] - Whether the element should stick to the 'top' or 'bottom' of the viewport.
 * @returns {[React.RefObject, boolean]} - A ref to attach to the element and a boolean indicating if it's sticky.
 */
export const useStickyNav = (options = {}) => {
  const { offset = 0, position = 'top' } = options;
  const navRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [initialTopAbs, setInitialTopAbs] = useState(0); // Store initial absolute top position

  useEffect(() => {
    const navbar = navRef.current;
    if (!navbar) return;

    const calculateInitialTopAbs = () => {
      // Calculate the absolute top position of the navbar in the document
      setInitialTopAbs(navbar.getBoundingClientRect().top + window.scrollY);
    };

    // Calculate initial position on mount and resize
    calculateInitialTopAbs();
    window.addEventListener('resize', calculateInitialTopAbs);

    const handleScroll = () => {
      const scrollTop = window.scrollY;

      if (position === 'top') {
        if (scrollTop > initialTopAbs - offset) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      } else { // position === 'bottom'
        // For bottom-sticky on mobile: become sticky immediately when navbar's top scrolls past viewport top
        if (scrollTop >= initialTopAbs) {
          setIsSticky(true);
        } else {
          setIsSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateInitialTopAbs);
    };
  }, [offset, position, initialTopAbs]); // Add initialTopAbs to dependencies

  return [navRef, isSticky];
};