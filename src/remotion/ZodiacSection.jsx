import React from 'react';
import { interpolate, useCurrentFrame, Easing } from 'remotion';
import { theme } from './theme';

export const ZodiacSection = ({ title, content, phase }) => {
  const frame = useCurrentFrame();

  // 1. Label Animation (Fade in + slight upward motion)
  const labelOpacity = interpolate(
    frame,
    [phase.start, phase.start + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const labelTranslateY = interpolate(
    frame,
    [phase.start, phase.start + 15],
    [10, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // 2. Box Animation (Starts 5 frames after label)
  const boxStartFrame = phase.start + 5;
  const boxEndFrame = phase.end;
  
  const boxScaleX = interpolate(
    frame,
    [boxStartFrame, boxEndFrame],
    [0, 1],
    { 
      extrapolateLeft: 'clamp', 
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.33, 1, 0.68, 1) // Smooth ease-out
    }
  );

  return (
    <div style={{ 
      width: '85%', 
      marginBottom: 30, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center'
    }}>
      {/* Section Title */}
      <h3 style={{
        color: theme.colors.accent,
        fontSize: '52px',
        fontWeight: 'bold',
        margin: '0 0 10px 0',
        opacity: labelOpacity,
        transform: `translateY(${labelTranslateY}px)`
      }}>{title}</h3>

      {/* Box & Content Wrapper */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 20px',
        overflow: 'hidden'
      }}>
        {/* Yellow Background Box */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.accent,
          transformOrigin: 'left',
          transform: `scaleX(${boxScaleX})`,
        }} />

        {/* Text Content (Masked by Box expansion) */}
        <p style={{
          position: 'relative',
          color: '#000',
          fontSize: '34px',
          fontWeight: '500',
          margin: 0,
          textAlign: 'center',
          // Use clip-path to reveal text with the box
          clipPath: `inset(0 ${100 - (boxScaleX * 100)}% 0 0)`
        }}>{content}</p>
      </div>
    </div>
  );
};
