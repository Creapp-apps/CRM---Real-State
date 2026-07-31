'use client';

import { useRef, useEffect, useState } from 'react';
import styles from './VideoBackground.module.css';

export default function VideoBackground() {
  const videoRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay blocked — video will remain hidden
      });
    }
  }, []);

  return (
    <div className={styles.videoBg}>
      <video
        ref={videoRef}
        className={`${styles.video} ${isLoaded ? styles.videoLoaded : ''}`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setIsLoaded(true)}
      >
        <source src="/videohero.mov" type="video/quicktime" />
        <source src="/videohero.mov" type="video/mp4" />
      </video>
      {/* 75% dark overlay */}
      <div className={styles.overlay} />
      {/* Fade edges — top and bottom */}
      <div className={styles.fadeTop} />
      <div className={styles.fadeBottom} />
    </div>
  );
}
