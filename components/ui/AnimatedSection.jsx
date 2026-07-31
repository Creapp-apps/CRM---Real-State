'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

/**
 * Wrapper component that animates its children when they enter the viewport.
 * 
 * @param {Object} props
 * @param {'fade-up'|'fade-left'|'fade-right'|'scale-in'|'stagger'} props.animation
 * @param {number} props.delay - Delay in ms
 * @param {number} props.threshold - IntersectionObserver threshold
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children
 */
export default function AnimatedSection({
  children,
  animation = 'fade-up',
  delay = 0,
  threshold = 0.15,
  className = '',
  as: Tag = 'div',
  ...props
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold });

  const animationClassMap = {
    'fade-up': 'reveal',
    'fade-left': 'reveal-left',
    'fade-right': 'reveal-right',
    'scale-in': 'reveal-scale',
    'stagger': 'stagger-children',
  };

  const animationClass = animationClassMap[animation] || 'reveal';

  return (
    <Tag
      ref={ref}
      className={`${animationClass} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </Tag>
  );
}
