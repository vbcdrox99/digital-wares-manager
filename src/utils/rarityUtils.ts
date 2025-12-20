
export const getContrastColor = (hexColor: string) => {
  if (!hexColor || !hexColor.startsWith('#')) return 'white';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

const darkenColor = (hex: string, percent: number) => {
  if (!hex || !hex.startsWith('#')) return hex;
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.floor(r * (1 - percent));
  g = Math.floor(g * (1 - percent));
  b = Math.floor(b * (1 - percent));

  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getBadgeStyleFromColor = (color: string, additionalClass?: string) => {
  if (!color) return { className: additionalClass };
  
  // Handle Hex colors with gradient
  if (color.startsWith('#')) {
    const darkerColor = darkenColor(color, 0.4); // 40% darker for noticeable gradient
    return {
      style: {
        background: `linear-gradient(135deg, ${color} 0%, ${darkerColor} 100%)`,
        color: getContrastColor(color),
        borderColor: color,
        boxShadow: `0 2px 4px ${darkerColor}40` // Add subtle colored shadow
      },
      className: `border shadow-sm font-bold ${additionalClass || ''}`.trim()
    };
  }
  
  // Handle RGB/RGBA colors
  if (color.startsWith('rgb')) {
    return {
      style: {
        background: `linear-gradient(135deg, ${color} 0%, color-mix(in srgb, ${color}, black 30%) 100%)`,
        color: 'white', // Fallback as we can't easily calc contrast from rgb string here without parsing
        borderColor: color
      },
      className: `border shadow-sm font-bold ${additionalClass || ''}`.trim()
    };
  }
  
  return { className: `${color} ${additionalClass || ''}`.trim() };
};
