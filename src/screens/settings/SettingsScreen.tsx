import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';

interface SettingItem {
  type: 'switch' | 'option';
  label: string;
  subtitle: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [deepModeEnabled, setDeepModeEnabled] = React.useState(false);

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Transformation Settings',
      items: [
        {
          type: 'switch',
          label: 'Deep Reflection Mode',
          subtitle: 'Enable more challenging questions for deeper insights',
          value: deepModeEnabled,
          onValueChange: setDeepModeEnabled,
        },
        {
          type: 'option',
          label: 'Question Depth Preference',
          subtitle: 'Medium',
          onPress: () => {},
        },
        {
          type: 'option',
          label: 'Reflection Reminder Time',
          subtitle: '9:00 AM',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          type: 'switch',
          label: 'Daily Notifications',
          subtitle: 'Remind me to do my daily check-in',
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          type: 'option',
          label: 'Export Data',
          subtitle: 'Download your transformation journey',
          onPress: () => {},
        },
        {
          type: 'option',
          label: 'Privacy Settings',
          subtitle: 'Manage your data and privacy preferences',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          type: 'option',
          label: 'Profile',
          subtitle: 'Update your personal information',
          onPress: () => {},
        },
        {
          type: 'option',
          label: 'Reset Journey',
          subtitle: 'Start your transformation from the beginning',
          onPress: () => {},
          danger: true,
        },
        {
          type: 'option',
          label: 'Sign Out',
          subtitle: 'Sign out of your account',
          onPress: () => {},
          danger: true,
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      {settingSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={styles.settingItem}
              onPress={item.onPress}
              disabled={item.type === 'switch'}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, item.danger && styles.dangerText]}>
                  {item.label}
                </Text>
                {item.subtitle && (
                  <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                )}
              </View>
              
              {item.type === 'switch' ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: '#374151', true: '#8b5cf6' }}
                  thumbColor={item.value ? '#ffffff' : '#9ca3af'}
                />
              ) : (
                <Text style={styles.settingArrow}>›</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Life Systems Architect</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
        <Text style={styles.appInfoSubtext}>
          Transforming reactive problem-solving into proactive life design
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b5cf6',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  settingArrow: {
    fontSize: 20,
    color: '#6b7280',
    marginLeft: 12,
  },
  dangerText: {
    color: '#ef4444',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  appInfoText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  appInfoSubtext: {
    fontSize: 12,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});