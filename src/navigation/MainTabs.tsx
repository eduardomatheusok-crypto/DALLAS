import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import EvolutionScreen from '../screens/EvolutionScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors, appIcons } from '../theme';
import { Icon, type IconName } from '../theme/icons';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  focused: boolean;
  icons: { active: IconName; inactive: IconName };
}

function TabIcon({ focused, icons }: TabIconProps) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon
        name={focused ? icons.active : icons.inactive}
        size="sm"
        color={focused ? colors.primary : colors.textMuted}
      />
    </View>
  );
}

const tabConfig: {
  key: keyof MainTabParamList;
  label: string;
  icons: { active: IconName; inactive: IconName };
}[] = [
  {
    key: 'Home',
    label: 'Início',
    icons: { active: appIcons.homeActive, inactive: appIcons.home },
  },
  {
    key: 'Workouts',
    label: 'Treinos',
    icons: { active: appIcons.workoutActive, inactive: appIcons.workout },
  },
  {
    key: 'Community',
    label: 'Comunidade',
    icons: { active: appIcons.communityActive, inactive: appIcons.community },
  },
  {
    key: 'Evolution',
    label: 'Evolução',
    icons: { active: appIcons.evolutionActive, inactive: appIcons.evolution },
  },
  {
    key: 'Profile',
    label: 'Perfil',
    icons: { active: appIcons.profileActive, inactive: appIcons.profile },
  },
];

const screenByKey: Record<keyof MainTabParamList, React.ComponentType<any>> = {
  Home: HomeScreen,
  Workouts: WorkoutsScreen,
  Community: CommunityScreen,
  Evolution: EvolutionScreen,
  Profile: ProfileScreen,
};

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: [styles.tabBar, { height: 58 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarLabelPosition: 'below-icon',
        tabBarIconStyle: styles.tabIcon,
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabConfig.map(({ key, label, icons }) => (
        <Tab.Screen
          key={key}
          name={key}
          component={screenByKey[key]}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ focused }) => <TabIcon focused={focused} icons={icons} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabIcon: {
    marginTop: 4,
  },
  iconWrap: {
    width: 40,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: colors.scrim,
  },
});