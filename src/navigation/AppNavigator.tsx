import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NotificationsScreen,
  ProfileScreen,
  CreateEventScreen,
  EventDetailScreen,
  MemberProfileScreen,
  ViewProfileScreen,
  AdManagementScreen,
  AdCampaignDetailScreen,
  AdInsightsScreen,
  AdCampaignEditScreen,
  CreateAdCampaignScreen,
  ContributeResourceScreen,
  PromptLibraryScreen,
  SettingsHomeScreen,
  SettingsAccountScreen,
  SettingsProfileScreen,
  SettingsMatchingScreen,
  SettingsNotificationsScreen,
  SettingsPrivacyScreen,
  SettingsBillingScreen,
  SettingsSupportScreen,
  CreateDualProfileScreen,
  EditProfileScreen,
  FeedPostDetailScreen,
} from '../screens';
import DrawerNavigator from './DrawerNavigator';
import { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * Stack above the drawer, holding the two destinations the top bar opens.
 *
 * Keeping them here rather than in the drawer means they cover the bottom bar
 * and get a back gesture, which is what a phone user expects from the bell and
 * the avatar.
 */

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Drawer" component={DrawerNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
      <Stack.Screen name="ViewProfile" component={ViewProfileScreen} />
      <Stack.Screen name="AdManagement" component={AdManagementScreen} />
      <Stack.Screen
        name="AdCampaignDetail"
        component={AdCampaignDetailScreen}
      />
      <Stack.Screen name="AdInsights" component={AdInsightsScreen} />
      <Stack.Screen name="AdCampaignEdit" component={AdCampaignEditScreen} />
      <Stack.Screen
        name="CreateAdCampaign"
        component={CreateAdCampaignScreen}
      />
      <Stack.Screen
        name="ContributeResource"
        component={ContributeResourceScreen}
      />
      <Stack.Screen name="PromptLibrary" component={PromptLibraryScreen} />
      <Stack.Screen name="SettingsHome" component={SettingsHomeScreen} />
      <Stack.Screen name="SettingsAccount" component={SettingsAccountScreen} />
      <Stack.Screen name="SettingsProfile" component={SettingsProfileScreen} />
      <Stack.Screen
        name="SettingsMatching"
        component={SettingsMatchingScreen}
      />
      <Stack.Screen
        name="SettingsNotifications"
        component={SettingsNotificationsScreen}
      />
      <Stack.Screen name="SettingsPrivacy" component={SettingsPrivacyScreen} />
      <Stack.Screen name="SettingsBilling" component={SettingsBillingScreen} />
      <Stack.Screen name="SettingsSupport" component={SettingsSupportScreen} />
      <Stack.Screen
        name="CreateDualProfile"
        component={CreateDualProfileScreen}
      />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="FeedPostDetail" component={FeedPostDetailScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
