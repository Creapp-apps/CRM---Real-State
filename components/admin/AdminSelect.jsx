'use client';

/* Dropdown estándar del admin. Reemplaza <select> nativos para poder animar
   el despliegue de forma congruente con la plataforma (navy + dorado).

   API (drop-in para la mayoría de los <select> del admin):
     <AdminSelect
       value={value}
       onChange={(value, option) => ...}   // option = objeto original de la lista
       options={[{ value, label, disabled? }]}
       placeholder="— Seleccioná —"
       disabled
       id / name / className / ariaLabel
     />

   Para los selects de geo que leían dataset.name, usar option.label en onChange. */

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import styles from './AdminSelect.module.css';

const Chevron = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const Check = () => (
  <svg className={styles.check} width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function AdminSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  id,
  name,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, up: false });
  const [activeIdx, setActiveIdx] = useState(-1);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const autoId = useId();
  const listId = `${id || autoId}-list`;

  const selectedIdx = options.findIndex(o => String(o.value) === String(value));
  const selected = selectedIdx >= 0 ? options[selectedIdx] : null;

  const place = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < 300 && r.top > spaceBelow; // abre hacia arriba si no hay lugar abajo
    setCoords({
      top: up ? r.top + window.scrollY - 6 : r.bottom + window.scrollY + 6,
      left: r.left + window.scrollX,
      width: r.width,
      up,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // Al abrir, marca activo el seleccionado y lo trae a la vista
  useEffect(() => {
    if (open) {
      setActiveIdx(selectedIdx >= 0 ? selectedIdx : 0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx];
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, activeIdx]);

  const choose = (opt) => {
    if (opt.disabled) return;
    onChange?.(opt.value, opt);
    setOpen(false);
    btnRef.current?.focus();
  };

  const nextEnabled = (from, dir) => {
    let i = from;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i]?.disabled) return i;
    }
    return from;
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    switch (e.key) {
      case 'Escape': e.preventDefault(); setOpen(false); btnRef.current?.focus(); break;
      case 'ArrowDown': e.preventDefault(); setActiveIdx(i => nextEnabled(i, 1)); break;
      case 'ArrowUp': e.preventDefault(); setActiveIdx(i => nextEnabled(i, -1)); break;
      case 'Home': e.preventDefault(); setActiveIdx(nextEnabled(-1, 1)); break;
      case 'End': e.preventDefault(); setActiveIdx(nextEnabled(0, -1)); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (options[activeIdx]) choose(options[activeIdx]);
        break;
      case 'Tab': setOpen(false); break;
      default: break;
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <button
        type="button"
        ref={btnRef}
        id={id}
        name={name}
        disabled={disabled}
        className={`${styles.button} ${open ? styles.buttonOpen : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel}
      >
        <span className={`${styles.label} ${selected ? '' : styles.placeholder}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Chevron className={`${styles.icon} ${open ? styles.iconOpen : ''}`} />
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          className={`${styles.dropdown} ${coords.up ? styles.dropdownUp : ''}`}
          onKeyDown={onKeyDown}
          style={{
            left: coords.left,
            width: coords.width,
            ...(coords.up
              ? { top: coords.top, transform: 'translateY(-100%)' }
              : { top: coords.top }),
          }}
        >
          {options.map((opt, i) => {
            const isSel = String(opt.value) === String(value);
            const isActive = i === activeIdx;
            return (
              <button
                type="button"
                key={`${opt.value}-${i}`}
                role="option"
                aria-selected={isSel}
                disabled={opt.disabled}
                className={`${styles.option} ${isActive ? styles.optionActive : ''} ${isSel ? styles.optionSelected : ''}`}
                onClick={() => choose(opt)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {isSel ? <Check /> : <span className={styles.checkSpace} />}
                <span className={styles.label}>{opt.label}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
}
