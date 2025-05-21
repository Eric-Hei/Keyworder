import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Info, Sun, Moon } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type SettingsOption = {
  key: string;
  title: string;
  description: string;
  defaultValue: boolean;
};

const SETTINGS_OPTIONS: SettingsOption[] = [
  {
    key: 'confirmKeywordRemoval',
    title: 'Confirm Keyword Removal',
    description: 'Show a confirmation dialog before removing detected keywords.',
    defaultValue: false,
  },
  {
    key: 'useAutoScrolling',
    title: 'Auto Scroll to Next Keyword',
    description: 'Automatically scroll to the next keyword when one is detected.',
    defaultValue: true,
  },
  {
    key: 'showDetectionFeedback',
    title: 'Show Detection Feedback',
    description: 'Display visual feedback when keywords are detected.',
    defaultValue: true,
  },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const systemColorScheme = useColorScheme();
  const [preferredColorScheme, setPreferredColorScheme] = useState<string | null>(null);
  const colors = Colors[preferredColorScheme || systemColorScheme || 'light'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load individual settings
      const savedSettings: Record<string, boolean> = {};
      
      for (const option of SETTINGS_OPTIONS) {
        const value = await AsyncStorage.getItem(`setting:${option.key}`);
        savedSettings[option.key] = value === null 
          ? option.defaultValue 
          : value === 'true';
      }
      
      setSettings(savedSettings);
      
      // Load color scheme preference
      const savedColorScheme = await AsyncStorage.getItem('setting:colorScheme');
      setPreferredColorScheme(savedColorScheme);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggleSetting = async (key: string) => {
    try {
      const newValue = !settings[key];
      await AsyncStorage.setItem(`setting:${key}`, String(newValue));
      
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: newValue,
      }));
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  const setColorScheme = async (scheme: string | null) => {
    try {
      if (scheme === null) {
        await AsyncStorage.removeItem('setting:colorScheme');
      } else {
        await AsyncStorage.setItem('setting:colorScheme', scheme);
      }
      setPreferredColorScheme(scheme);
    } catch (error) {
      console.error('Error saving color scheme:', error);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your saved lists and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(keys);
              loadSettings();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Appearance
      </Text>
      
      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>
          Theme
        </Text>
        
        <View style={styles.themeOptions}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              preferredColorScheme === 'light' && styles.selectedThemeOption,
              { borderColor: colors.primary }
            ]}
            onPress={() => setColorScheme('light')}
          >
            <Sun 
              size={24} 
              color={preferredColorScheme === 'light' ? colors.primary : colors.text} 
            />
            <Text 
              style={[
                styles.themeOptionText, 
                { color: preferredColorScheme === 'light' ? colors.primary : colors.text }
              ]}
            >
              Light
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              preferredColorScheme === 'dark' && styles.selectedThemeOption,
              { borderColor: colors.primary }
            ]}
            onPress={() => setColorScheme('dark')}
          >
            <Moon 
              size={24} 
              color={preferredColorScheme === 'dark' ? colors.primary : colors.text} 
            />
            <Text 
              style={[
                styles.themeOptionText, 
                { color: preferredColorScheme === 'dark' ? colors.primary : colors.text }
              ]}
            >
              Dark
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.themeOption,
              preferredColorScheme === null && styles.selectedThemeOption,
              { borderColor: colors.primary }
            ]}
            onPress={() => setColorScheme(null)}
          >
            <Text 
              style={[
                styles.themeOptionText, 
                { color: preferredColorScheme === null ? colors.primary : colors.text }
              ]}
            >
              System
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Recognition Settings
      </Text>
      
      {SETTINGS_OPTIONS.map(option => (
        <View 
          key={option.key}
          style={[
            styles.card, 
            { backgroundColor: colors.backgroundSecondary }
          ]}
        >
          <View style={styles.settingHeader}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
              {option.title}
            </Text>
            <Switch
              value={settings[option.key] ?? option.defaultValue}
              onValueChange={() => handleToggleSetting(option.key)}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={'#f4f3f4'}
            />
          </View>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {option.description}
          </Text>
        </View>
      ))}
      
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Data Management
      </Text>
      
      <TouchableOpacity 
        style={[
          styles.dangerButton, 
          { backgroundColor: colors.error }
        ]}
        onPress={handleClearAllData}
      >
        <Text style={styles.dangerButtonText}>
          Clear All Data
        </Text>
      </TouchableOpacity>
      
      <View style={styles.aboutContainer}>
        <Info size={16} color={colors.textSecondary} />
        <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
          Presentation Keyworder v1.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  themeOption: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedThemeOption: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  dangerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dangerButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  aboutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  aboutText: {
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});