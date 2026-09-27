import React from 'react';
import PersistedImage from './PersistedImage';
import {
  Image,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

const MASCOT_ASSETS: Record<string, ImageSourcePropType> = {
  'asset:dallas_base': require('../../../assets/dallas/dallas_base.png'),
  'asset:dallas_feliz': require('../../../assets/dallas/dallas_feliz.png'),
  'asset:dallas_cansado': require('../../../assets/dallas/dallas_cansado.png'),
  'asset:dallas_icon': require('../../../assets/images/dallas-icon-trans.png'),
};

export const PRESET_AVATARS = [
  { id: 'dallas_base', uri: 'asset:dallas_base', label: 'Dallas Alpha' },
  { id: 'dallas_feliz', uri: 'asset:dallas_feliz', label: 'Dallas Fera' },
  { id: 'athlete_1', uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300', label: 'Foco' },
  { id: 'athlete_2', uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', label: 'Força' },
  { id: 'athlete_3', uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300', label: 'Ritmo' },
  { id: 'athlete_4', uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', label: 'Vigor' },
];

interface Props {
  avatarUrl?: string | null;
  name?: string;
  size?: number;
  showBorder?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function UserAvatar({
  avatarUrl,
  name,
  size = 48,
  showBorder = false,
  borderColor = colors.primary,
  style,
}: Props) {
  const borderRadius = size / 2;

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius,
      borderWidth: showBorder ? 2 : 0,
      borderColor: showBorder ? borderColor : 'transparent',
    },
    style,
  ];

  if (avatarUrl && MASCOT_ASSETS[avatarUrl]) {
    return (
      <View style={containerStyle}>
        <Image
          source={MASCOT_ASSETS[avatarUrl]}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (avatarUrl) {
    return (
      <View style={containerStyle}>
        <PersistedImage
          uri={avatarUrl}
          style={{ width: size, height: size, borderRadius }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : 'D';

  return (
    <View style={[containerStyle, styles.placeholder]}>
      <Text style={[styles.letter, { fontSize: Math.round(size * 0.44) }]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
  },
  placeholder: {
    backgroundColor: '#1A1A1E',
  },
  letter: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
