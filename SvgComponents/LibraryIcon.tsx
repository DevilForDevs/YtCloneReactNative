import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface LibraryIconProps {
  size?: number;
  color?: string;
}

const LibraryIcon: React.FC<LibraryIconProps> = ({ size = 20, color = '#030303' }) => {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 18 18" fill={color}>
<Path d="M8 4L14 7.5L8 11V4ZM15 17H1V3H0V18H15V17ZM18 15H3V0H18V15ZM4 14H17V1H4V14Z" fill={color}/>
</Svg>
  );
};

export default LibraryIcon;
