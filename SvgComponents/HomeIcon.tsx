import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface HomeIconProps {
  size?: number;
  color?: string;
}

const HomeIcon: React.FC<HomeIconProps> = ({ size = 20, color = '#030303' }) => {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 16 18" fill={color}>
<Path d="M0 7V18H6V12H10V18H16V7L8 0L0 7Z" fill={color}/>
</Svg>
  );
};

export default HomeIcon;
