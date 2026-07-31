'use client';

import React, { useRef } from 'react';
import { motion } from 'motion/react';
import styles from './MovingBorderButton.module.css';

export default function MovingBorderButton({
  children,
  href,
  borderRadius = '1.75rem',
  duration = 4000,
  className = '',
  ...props
}) {
  const Tag = href ? 'a' : 'button';

  return (
    <Tag
      href={href}
      className={`${styles.wrapper} ${className}`}
      style={{ borderRadius }}
      {...props}
    >
      {/* Moving border container */}
      <div
        className={styles.borderContainer}
        style={{ borderRadius }}
      >
        <div className={styles.borderTrack} style={{ borderRadius }}>
          <motion.div
            className={styles.movingBeam}
            animate={{ rotate: 360 }}
            transition={{
              duration: duration / 1000,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* Inner content */}
      <span
        className={styles.content}
        style={{ borderRadius }}
      >
        {children}
      </span>
    </Tag>
  );
}
