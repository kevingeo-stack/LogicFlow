import React, { useRef } from 'react';

interface PseudocodeUIProps {
  pseudocode: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const PseudocodeUI: React.FC<PseudocodeUIProps> = ({ pseudocode, containerRef }) => {
  return (
    <div 
      ref={containerRef}
      className="w-full h-[440px] sm:h-[500px] overflow-auto bg-[#060e20] p-6"
    >
      <pre 
        className="font-['JetBrains_Mono',monospace] text-[13px] leading-relaxed text-[#dae2fd]"
      >
        {pseudocode}
      </pre>
    </div>
  );
};
