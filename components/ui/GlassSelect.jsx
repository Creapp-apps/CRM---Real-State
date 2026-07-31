'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './GlassSelect.module.css';

export default function GlassSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = "Seleccionar...",
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8, // 8px spacing
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true); // true for capturing scroll events from any scrollable parent
      window.addEventListener('resize', updatePosition);
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedButton = containerRef.current?.contains(event.target);
      const clickedDropdown = dropdownRef.current?.contains(event.target);
      
      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const dropDownContent = (
    <div 
      ref={dropdownRef}
      className={styles.dropdown} 
      role="listbox"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            type="button"
            key={option.value}
            className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
            onClick={() => handleSelect(option.value)}
            role="option"
            aria-selected={isSelected}
          >
            {isSelected ? (
              <svg className={styles.checkIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <div className={styles.checkPlaceholder} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`${styles.button} ${isOpen ? styles.buttonOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayLabel}</span>
        <svg 
          className={`${styles.icon} ${isOpen ? styles.iconOpen : ''}`} 
          width="12" 
          height="12" 
          viewBox="0 0 12 12" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        dropDownContent,
        document.body
      )}
    </div>
  );
}
