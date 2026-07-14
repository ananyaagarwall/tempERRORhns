import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Shared fuzzy search suggestions hook.
 * - Renders dropdown via portal so overflow:hidden never clips it.
 * - Calls onFilter(val) after each debounced keystroke for real-time filtering.
 * - Calls onSelect(phrase) when user picks a suggestion or presses Enter.
 */
export function useSearchSuggestions({ onSelect, onChange, onFilter } = {}) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (!showSuggestions) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showSuggestions, updatePosition]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback((val) => {
    clearTimeout(debounceRef.current);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      onFilter?.('');
      return;
    }
    debounceRef.current = setTimeout(async () => {
      // Fire filter after debounce — prevents per-keystroke property API calls
      onFilter?.(val.trim());
      try {
        const res = await fetch(`${API_BASE}/api/search/suggest?q=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setSuggestions(list);
        if (list.length > 0) {
          updatePosition();
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, [onFilter, updatePosition]);

  const handleChange = useCallback((val) => {
    setValue(val);
    fetchSuggestions(val);
    onChange?.(val);
  }, [fetchSuggestions, onChange]);

  const handleSelect = useCallback((phrase) => {
    setValue(phrase);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect?.(phrase);
  }, [onSelect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setSuggestions([]);
      setShowSuggestions(false);
      onSelect?.(value.trim());
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [onSelect, value]);

  const SuggestionsPortal = useCallback(() => {
    if (!showSuggestions || suggestions.length === 0) return null;
    return createPortal(
      React.createElement(
        'ul',
        {
          style: {
            ...dropdownStyle,
            backgroundColor: '#fff',
            border: '1px solid #dde3ee',
            borderRadius: '8px',
            listStyle: 'none',
            padding: '4px 0',
            margin: 0,
            boxShadow: '0 8px 24px rgba(34,58,95,0.13)',
            maxHeight: '220px',
            overflowY: 'auto',
          }
        },
        suggestions.map((phrase, idx) =>
          React.createElement('li', {
            key: idx,
            onMouseDown: (e) => { e.preventDefault(); handleSelect(phrase); },
            style: {
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#223A5F',
              borderBottom: idx < suggestions.length - 1 ? '1px solid #f0f3f8' : 'none',
            },
            onMouseEnter: (e) => { e.currentTarget.style.background = '#f0f5ff'; },
            onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
          }, phrase)
        )
      ),
      document.body
    );
  }, [showSuggestions, suggestions, dropdownStyle, handleSelect]);

  return {
    value,
    setValue,
    inputRef,
    handleChange,
    handleSelect,
    handleKeyDown,
    SuggestionsPortal,
  };
}
