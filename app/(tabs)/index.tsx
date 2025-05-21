import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
  Modal,
} from 'react-native';
import { Plus, Save, Trash2, CreditCard as Edit, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { KeywordList } from '@/components/KeywordList';
import { SavedListsModal } from '@/components/SavedListsModal';

export default function KeywordScreen() {
  const [keyword, setKeyword] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentListName, setCurrentListName] = useState('');
  const [isSavedListsModalVisible, setSavedListsModalVisible] = useState(false);
  const [isNameInputModalVisible, setNameInputModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
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
    
    loadActiveList();
  }, []);

  const handleAddKeyword = useCallback(() => {
    if (keyword.trim() !== '') {
      setKeywords(prevKeywords => [
        ...prevKeywords,
        keyword.trim()
      ]);
      setKeyword('');
    }
  }, [keyword]);

  const handleDeleteKeyword = useCallback((index: number) => {
    setKeywords(prevKeywords => prevKeywords.filter((_, i) => i !== index));
  }, []);

  const handleSaveList = useCallback(async () => {
    if (keywords.length === 0) {
      Alert.alert('Error', 'Cannot save an empty list');
      return;
    }

    if (!currentListName) {
      setNameInputModalVisible(true);
    } else {
      try {
        await AsyncStorage.setItem(`list:${currentListName}`, JSON.stringify(keywords));
        Alert.alert('Success', 'List updated successfully!');
      } catch (error) {
        console.error('Error saving list:', error);
        Alert.alert('Error', 'Failed to save list');
      }
    }
  }, [keywords, currentListName]);

  const handleSaveNewList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a name for the list');
      return;
    }

    try {
      await AsyncStorage.setItem(`list:${newListName}`, JSON.stringify(keywords));
      await AsyncStorage.setItem('activeList', newListName);
      setCurrentListName(newListName);
      setNameInputModalVisible(false);
      setNewListName('');
      Alert.alert('Success', 'List saved successfully!');
    } catch (error) {
      console.error('Error saving list:', error);
      Alert.alert('Error', 'Failed to save list');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {currentListName ? currentListName : 'New Keyword List'}
        </Text>
        {currentListName && (
          <TouchableOpacity 
            onPress={() => setSavedListsModalVisible(true)}
            style={styles.loadButton}
          >
            <Text style={[styles.loadButtonText, { color: colors.primary }]}>Load</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input, 
            { 
              color: colors.text,
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border
            }
          ]}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Enter a keyword..."
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={handleAddKeyword}
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddKeyword}
        >
          <Plus color="#fff" size={24} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.listContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Keywords ({keywords.length})
        </Text>
        
        <KeywordList 
          keywords={keywords} 
          onDelete={handleDeleteKeyword} 
        />
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveList}
        >
          <Save color="#fff" size={18} />
          <Text style={styles.actionButtonText}>
            {currentListName ? 'Update List' : 'Save List'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.error }]}
          onPress={() => {
            Alert.alert(
              'Clear All',
              'Are you sure you want to clear all keywords?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Clear', 
                  onPress: () => {
                    setKeywords([]);
                  },
                  style: 'destructive'
                }
              ]
            );
          }}
        >
          <Trash2 color="#fff" size={18} />
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isNameInputModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameInputModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Save List</Text>
            <TextInput
              style={[styles.modalInput, { 
                color: colors.text,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border
              }]}
              value={newListName}
              onChangeText={setNewListName}
              placeholder="Enter list name..."
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.error }]}
                onPress={() => {
                  setNameInputModalVisible(false);
                  setNewListName('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveNewList}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <SavedListsModal
        visible={isSavedListsModalVisible}
        onClose={() => setSavedListsModalVisible(false)}
        onSelectList={(name, list) => {
          setKeywords(list);
          setCurrentListName(name);
          setSavedListsModalVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    flex: 1,
  },
  loadButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  loadButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  actionButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 0.48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});