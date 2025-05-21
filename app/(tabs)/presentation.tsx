import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mic, MicOff, RotateCcw, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { SavedListsModal } from '@/components/SavedListsModal';

export default function PresentationScreen() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [spokenKeywords, setSpokenKeywords] = useState<string[]>([]);
  const [currentListName, setCurrentListName] = useState<string>('');
  const [isListModalVisible, setListModalVisible] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const opacity = useSharedValue(1);
  const animatingKeywordRef = React.useRef<string | null>(null);

  const { 
    isListening,
    startListening, 
    stopListening, 
    error,
    isAvailable,
    resetRecognition
  } = useSpeechRecognition({
    onKeywordDetected: (keyword) => {
      handleKeywordDetected(keyword);
    },
    keywords
  });

  useEffect(() => {
    loadActiveList();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Speech Recognition Error', error);
    }
  }, [error]);

  const loadActiveList = async () => {
    try {
      const activeListName = await AsyncStorage.getItem('activeList');
      if (activeListName) {
        const loadedList = await AsyncStorage.getItem(`list:${activeListName}`);
        if (loadedList) {
          setKeywords(JSON.parse(loadedList));
          setCurrentListName(activeListName);
        }
      }
    } catch (error) {
      console.error('Error loading active list:', error);
    }
  };

  const handleKeywordDetected = (detectedKeyword: string) => {
    if (animatingKeywordRef.current === detectedKeyword) {
      return;
    }
    
    animatingKeywordRef.current = detectedKeyword;
    
    const keywordIndex = keywords.findIndex(k => 
      k.toLowerCase() === detectedKeyword.toLowerCase()
    );
    
    if (keywordIndex !== -1) {
      const newKeywords = [...keywords];
      const removedKeyword = newKeywords.splice(keywordIndex, 1)[0];
      
      opacity.value = withTiming(0, { duration: 300 });
      
      setTimeout(() => {
        setKeywords(newKeywords);
        setSpokenKeywords(prev => [...prev, removedKeyword]);
        opacity.value = withTiming(1, { duration: 300 });
        animatingKeywordRef.current = null;
      }, 300);
    }
  };

  const handleToggleListening = () => {
    if (!isAvailable) {
      Alert.alert(
        'Speech Recognition Unavailable',
        Platform.OS === 'web' 
          ? 'Speech recognition is not supported in this browser.'
          : 'Speech recognition is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (isListening) {
      stopListening();
    } else {
      if (keywords.length === 0) {
        Alert.alert(
          'No Keywords',
          'Please load a keyword list before starting.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Load List', onPress: () => setListModalVisible(true) }
          ]
        );
        return;
      }
      startListening();
      setIsPresentationMode(true);
    }
  };

  const handleReset = () => {
    if (isListening) {
      stopListening();
    }
    
    Alert.alert(
      'Reset Presentation',
      'Are you sure you want to reset? This will restore all keywords.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            try {
              const loadedList = await AsyncStorage.getItem(`list:${currentListName}`);
              if (loadedList) {
                setKeywords(JSON.parse(loadedList));
                setSpokenKeywords([]);
                setIsPresentationMode(false);
              }
            } catch (error) {
              console.error('Error reloading list:', error);
            }
          }
        }
      ]
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderPresentationMode = () => {
    if (keywords.length === 0 && spokenKeywords.length > 0) {
      return (
        <View style={styles.completedContainer}>
          <CheckCircle2 
            size={80} 
            color={colors.success} 
            style={styles.successIcon}
          />
          <Text style={[styles.completedText, { color: colors.text }]}>
            Great job!
          </Text>
          <Text style={[styles.completedSubText, { color: colors.textSecondary }]}>
            You covered all {spokenKeywords.length} keywords
          </Text>
        </View>
      );
    }

    return (
      <Animated.View style={[styles.keywordsContainer, animatedStyle]}>
        {keywords.length > 0 ? (
          <>
            <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
              {keywords.length} keywords remaining
            </Text>
            <Text style={[styles.keywordText, { color: colors.text }]}>
              {keywords[0]}
            </Text>
            {keywords.length > 1 && (
              <Text style={[styles.upNextText, { color: colors.textSecondary }]}>
                Up next: {keywords[1]}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.noKeywordsText, { color: colors.textSecondary }]}>
            No keywords to display
          </Text>
        )}
      </Animated.View>
    );
  };

  const renderSetupMode = () => {
    return (
      <View style={styles.setupContainer}>
        <Text style={[styles.setupTitle, { color: colors.text }]}>
          Presentation Setup
        </Text>
        
        {currentListName ? (
          <View style={styles.activeListContainer}>
            <Text style={[styles.activeListLabel, { color: colors.textSecondary }]}>
              Active List:
            </Text>
            <Text style={[styles.activeListName, { color: colors.text }]}>
              {currentListName} ({keywords.length} keywords)
            </Text>
          </View>
        ) : (
          <Text style={[styles.noListText, { color: colors.textSecondary }]}>
            No list selected
          </Text>
        )}
        
        <TouchableOpacity
          style={[styles.loadListButton, { backgroundColor: colors.primary }]}
          onPress={() => setListModalVisible(true)}
        >
          <Text style={styles.loadListButtonText}>
            {currentListName ? 'Change List' : 'Load a List'}
          </Text>
        </TouchableOpacity>
        
        {keywords.length > 0 && (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.success }]}
            onPress={handleToggleListening}
          >
            <Mic color="#fff" size={24} />
            <Text style={styles.startButtonText}>Start Presentation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isPresentationMode ? (
        renderPresentationMode()
      ) : (
        renderSetupMode()
      )}
      
      {isPresentationMode && (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              isListening 
                ? { backgroundColor: colors.error } 
                : { backgroundColor: colors.success }
            ]}
            onPress={handleToggleListening}
          >
            {isListening ? (
              <MicOff color="#fff" size={24} />
            ) : (
              <Mic color="#fff" size={24} />
            )}
            <Text style={styles.controlButtonText}>
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.warning }]}
            onPress={handleReset}
          >
            <RotateCcw color="#fff" size={24} />
            <Text style={styles.controlButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <SavedListsModal
        visible={isListModalVisible}
        onClose={() => setListModalVisible(false)}
        onSelectList={(name, list) => {
          setKeywords(list);
          setSpokenKeywords([]);
          setCurrentListName(name);
          setListModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  keywordsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  keywordText: {
    fontSize: 42,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  upNextText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  remainingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 24,
  },
  noKeywordsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    textAlign: 'center',
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  completedText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  completedSubText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.7,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
    flex: 0.28,
  },
  controlButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  setupTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  activeListContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  activeListLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginBottom: 8,
  },
  activeListName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    textAlign: 'center',
  },
  noListText: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    marginBottom: 32,
  },
  loadListButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  loadListButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 32,
  },
  startButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
});