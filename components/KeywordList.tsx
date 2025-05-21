import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface KeywordListProps {
  keywords: string[];
  onDelete: (index: number) => void;
}

export function KeywordList({ keywords, onDelete }: KeywordListProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  if (keywords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No keywords added yet. Add some keywords to get started.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>{
      keywords.map((keyword, index) => (
        <View 
          key={`${keyword}-${index}`}
          style={[
            styles.keywordItem, 
            { 
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border
            }
          ]}
        >
          <Text 
            style={[styles.keywordText, { color: colors.text }]}
            numberOfLines={1}
          >
            {keyword}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => onDelete(index)}
          >
            <X size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      ))
    }</ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keywordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  keywordText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});