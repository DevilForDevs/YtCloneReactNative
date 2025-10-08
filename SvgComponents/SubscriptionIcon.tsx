import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SubscriptionIconProps {
  size?: number;
  color?: string;
}

const SubscriptionIcon: React.FC<SubscriptionIconProps> = ({ size = 20, color = '#030303' }) => {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 20 18" fill={color}>
<Path d="M8 15V9L13 12L8 15ZM15 0H5V1H15V0ZM18 3H2V4H18V3ZM20 6H0V18H20V6ZM1 7H19V17H1V7Z" fill={color}/>
</Svg>
  );
};

export default SubscriptionIcon;
