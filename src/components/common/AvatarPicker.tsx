import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import UserAvatar from './UserAvatar';

export default function AvatarPicker({ value, name, onChange }: {
  value?: string | null; name?: string; onChange: (uri: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted && permission.accessPrivileges !== 'limited') {
          setError('Permita o acesso às fotos nos ajustes do celular para escolher sua foto.');
          return;
        }
      }
      // Android uses the system photo picker: no broad library permission is needed.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
      if (!result.canceled && result.assets[0]) onChange(result.assets[0].uri);
    } catch {
      setError('Não foi possível abrir a galeria. Tente novamente.');
    } finally { setBusy(false); }
  };
  return <View style={{ alignItems: 'center', gap: 14, paddingVertical: 16 }}>
    <UserAvatar avatarUrl={value} name={name} size={88} showBorder />
    <Pressable accessibilityRole="button" disabled={busy} onPress={pick} style={{ padding: 14, backgroundColor: '#C81922', borderRadius: 12 }}>
      {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{value ? 'Alterar foto' : 'Adicionar foto'}</Text>}
    </Pressable>
    {!!error && <Text accessibilityRole="alert" style={{ color: '#FF6970' }}>{error}</Text>}
  </View>;
}
