import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { X, FileText } from 'lucide-react-native';
import Colors from '@/constants/Colors';

type SavedList = {
  name: string;
  items: string[];
  updatedAt: string;
};

interface SavedListsModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectList: (name: string, list: string[]) => void;
}

export function SavedListsModal({ visible, onClose, onSelectList }: SavedListsModalProps) {
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (visible) {
      loadSavedLists();
    }
  }, [visible]);

  const loadSavedLists = async () => {
    setLoading(true);
    try {
      const keys = await AsyncStorage.getAllKeys();
      const listKeys = keys.filter(key => key.startsWith('list:'));
      
      const listsPromises = listKeys.map(async (key) => {
        const name = key.replace('list:', '');
        const items = JSON.parse(await AsyncStorage.getItem(key) || '[]');
        
        // Get the timestamp if available or use current date
        const updatedAtStr = await AsyncStorage.getItem(`list_updated:${name}`) || new Date().toISOString();
        
        return {
          name,
          items,
          updatedAt: updatedAtStr,
        };
      });
      
      const lists = await Promise.all(listsPromises);
      
      // Sort by most recently updated
      lists.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      
      setSavedLists(lists);
    } catch (error) {
      console.error('Error loading saved lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectList = (list: SavedList) => {
    onSelectList(list.name, list.items);
    
    // Update the timestamp
    AsyncStorage.setItem(`list_updated:${list.name}`, new Date().toISOString());
  };

  const handleDeleteList = async (name: string) => {
    try {
      await AsyncStorage.removeItem(`list:${name}`);
      await AsyncStorage.removeItem(`list_updated:${name}`);
      
      // If this was the active list, clear it
      const activeList = await AsyncStorage.getItem('activeList');
      if (activeList === name) {
        await AsyncStorage.removeItem('activeList');
      }
      
      setSavedLists(prevLists => prevLists.filter(list => list.name !== name));
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View 
          style={[
            styles.modalContent, 
            { backgroundColor: colors.background }
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Saved Lists
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading lists...
              </Text>
            </View>
          ) : savedLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You don't have any saved lists yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={savedLists}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem, 
                    { backgroundColor: colors.backgroundSecondary }
                  ]}
                  onPress={() => handleSelectList(item)}
                >
                  <View style={styles.listItemContent}>
                    <FileText size={20} color={colors.primary} />
                    <View style={styles.listItemInfo}>
                      <Text style={[styles.listName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <View style={styles.listItemMeta}>
                        <Text style={[styles.listCount, { color: colors.textSecondary }]}>
                          {item.items.length} keywords
                        </Text>
                        <Text style={[styles.listDate, { color: colors.textSecondary }]}>
                          {formatDate(item.updatedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteListButton}
                    onPress={() => handleDeleteList(item.name)}
                  >
                    <X size={18} color={colors.error} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  closeButton: {
    padding: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  listDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
  },
  deleteListButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});