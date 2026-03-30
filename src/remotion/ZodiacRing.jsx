import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { ZODIAC_IMAGES } from './assets';

const ZODIAC_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer',
  'Leo', 'Virgo', 'Libra', 'Scorpio',
  'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const ZodiacRing = ({ 
  rotation = 0, 
  highlightedNames = [], 
  scale = 1,
  opacity = 1,
  nonHighlightOpacity = 0.4
}) => {
  const { width, height } = useVideoConfig();
  
  const radius = 450; // Matching radius from IntroFrame.js
  const iconSize = 150; // Matching iconSize from IntroFrame.js
  const totalIcons = 12;
  
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <AbsoluteFill style={{ 
      opacity, 
      transform: `scale(${scale})`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {ZODIAC_ORDER.map((name, index) => {
        // Calculate position on the circle (mirrors IntroFrame.js logic)
        const angleDeg = (360 / totalIcons) * index;
        const angleRad = (angleDeg + rotation) * (Math.PI / 180);

        const x = radius * Math.cos(angleRad);
        const y = radius * Math.sin(angleRad);

        // Determine opacity based on highlight list
        let itemOpacity = 1;
        if (highlightedNames.length > 0) {
          const isHighlighted = highlightedNames.includes(name);
          if (!isHighlighted) {
            itemOpacity = nonHighlightOpacity;
          }
        }

        const imgSrc = ZODIAC_IMAGES[name];

        return (
          <div
            key={name}
            style={{
              position: 'absolute',
              left: centerX + x - iconSize / 2,
              top: centerY + y - iconSize / 2,
              width: iconSize,
              height: iconSize,
              opacity: itemOpacity,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            
            {imgSrc ? (
              <img 
                src={imgSrc} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                alt={name}
              />
            ) : (
              <div style={{ 
                width: '100%', 
                height: '100%', 
                backgroundColor: '#333', 
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: 'white',
                fontSize: '20px'
              }}>
                {name[0]}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
