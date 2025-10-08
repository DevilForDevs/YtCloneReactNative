import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface UploadIconProps {
  size?: number;
  color?: string;
}

const UploadIcon: React.FC<UploadIconProps> = ({ size = 20, color = '#030303' }) => {
  return (
    <Svg width={size} height={(size * 18) / 20} viewBox="0 0 20 20" fill={color}>
<Path fill-rule="evenodd" clip-rule="evenodd" d="M10 18.8889C14.9092 18.8889 18.8889 14.9092 18.8889 10C18.8889 5.0908 14.9092 1.11111 10 1.11111C5.0908 1.11111 1.11111 5.0908 1.11111 10C1.11111 14.9092 5.0908 18.8889 10 18.8889ZM10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill={color}/>
<Path fill-rule="evenodd" clip-rule="evenodd" d="M16 11H4V9.5H16V11Z" fill={color}/>
<Path fill-rule="evenodd" clip-rule="evenodd" d="M9 16L9 4L10.5 4L10.5 16L9 16Z" fill={color}/>
</Svg>
  );
};

export default UploadIcon;
