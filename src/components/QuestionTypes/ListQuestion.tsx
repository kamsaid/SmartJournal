import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface ListQuestionProps {
  question: string;
  value: string[]; // Array of list items
  onValueChange: (value: string[]) => void;
  maxItems?: number; // Maximum number of items allowed
  placeholder?: string;
  memoryContext?: string;
}

export default function ListQuestion({ 
  question, 
  value, 
  onValueChange,
  maxItems = 3,
  placeholder = "Add an item...",
  memoryContext 
}: ListQuestionProps) {
  const [currentInput, setCurrentInput] = useState('');

  // Add new item to the list
  const handleAddItem = () => {
    if (currentInput.trim() && value.length < maxItems) {
      const newItems = [...value, currentInput.trim()];
      onValueChange(newItems);
      setCurrentInput('');
    }
  };

  // Remove item from the list
  const handleRemoveItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onValueChange(newItems);
  };

  // Update item text at specific index
  const handleUpdateItem = (index: number, text: string) => {
    const newItems = [...value];
    newItems[index] = text;
    onValueChange(newItems);
  };

  // Handle Enter key press to add item
  const handleSubmitEditing = () => {
    handleAddItem();
  };

  return (
    <View style={styles.container}>
      {memoryContext && (
        <Text style={styles.memoryContext}>{memoryContext}</Text>
      )}
      
      <Text style={styles.question}>{question}</Text>
      
      {/* Display existing items */}
      {value.map((item, index) => (
        <View key={index} style={styles.listItemContainer}>
          <View style={styles.listItemContent}>
            <Text style={styles.bulletPoint}>•</Text>
            <TextInput
              style={styles.listItemInput}
              value={item}
              onChangeText={(text) => handleUpdateItem(index, text)}
              placeholder={`Item ${index + 1}`}
              placeholderTextColor="#5A4E41"
              autoCapitalize="sentences"
              autoCorrect={true}
              multiline={false}
            />
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(index)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      
      {/* Add new item input (only show if under max limit) */}
      {value.length < maxItems && (
        <View style={styles.addItemContainer}>
          <View style={styles.addItemContent}>
            <Text style={styles.bulletPoint}>•</Text>
            <TextInput
              style={styles.addItemInput}
              value={currentInput}
              onChangeText={setCurrentInput}
              onSubmitEditing={handleSubmitEditing}
              placeholder={placeholder}
              placeholderTextColor="#5A4E41"
              autoCapitalize="sentences"
              autoCorrect={true}
              multiline={false}
              returnKeyType="done"
            />
          </View>
          {currentInput.trim().length > 0 && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddItem}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {/* Item counter */}
      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {value.length} of {maxItems} items
        </Text>
        {value.length === 0 && (
          <Text style={styles.helpText}>
            Add up to {maxItems} things that would make today great
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  memoryContext: {
    fontSize: 14,
    color: '#8B7355', // Duson medium brown
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  question: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D1810', // Duson darkest brown
    marginBottom: 16,
    lineHeight: 24,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F7F5F2', // Duson lightest beige
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5DDD1', // Duson light border
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FEFEFE', // White background for new item
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#D4C4B0', // Duson medium border
    borderStyle: 'dashed',
  },
  addItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPoint: {
    fontSize: 18,
    color: '#8B7355', // Duson medium brown
    marginRight: 12,
    fontWeight: 'bold',
  },
  listItemInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D1810', // Duson darkest brown
    paddingVertical: 4,
    minHeight: 24,
  },
  addItemInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D1810', // Duson darkest brown
    paddingVertical: 4,
    minHeight: 24,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5DDD1', // Duson light border
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#8B7355', // Duson medium brown
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D4C4B0', // Duson medium border
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    fontSize: 18,
    color: '#5A4E41', // Duson dark beige-gray
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 8,
  },
  itemCount: {
    fontSize: 14,
    color: '#8B7355', // Duson medium brown
    textAlign: 'right',
  },
  helpText: {
    fontSize: 14,
    color: '#A0957F', // Duson lighter brown
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
}); 