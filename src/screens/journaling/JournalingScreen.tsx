import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { AIAssistanceMode, JournalEntry } from '@/types/database';
import { DEMO_USER_UUID } from '@/utils/uuid';
import journalService from '@/services/journal/JournalService';
import { unifiedAIService } from '@/services/ai/unifiedAIService';
import { getCurrentUser } from '@/services/supabase/AuthService';
import { Ionicons } from '@expo/vector-icons';

interface JournalingScreenProps {
  navigation: any;
}

// Combined message type for both journal entries and AI messages
interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  isJournalEntry?: boolean; // Indicates if this is part of the journal
}

interface JournalSession {
  content: string;
  wordCount: number;
  duration: number;
  assistanceMode: AIAssistanceMode;
  messages: Message[];
  patterns: string[];
  insights: string[];
}

const assistanceModes = [
  {
    key: 'solo' as AIAssistanceMode,
    title: 'Solo Writing',
    description: 'Write freely without AI',
    icon: '✍️',
    color: '#6b7280',
  },
  {
    key: 'guided' as AIAssistanceMode,
    title: 'Guided Writing',
    description: 'AI provides gentle prompts',
    icon: '🧭',
    color: '#10b981',
  },
  {
    key: 'wisdom' as AIAssistanceMode,
    title: 'Wisdom Mode',
    description: 'Deep philosophical insights',
    icon: '🦉',
    color: '#8b5cf6',
  },
  {
    key: 'pattern' as AIAssistanceMode,
    title: 'Pattern Recognition',
    description: 'AI identifies patterns',
    icon: '🔍',
    color: '#f59e0b',
  },
];

export default function JournalingScreen({ navigation }: JournalingScreenProps) {
  const [selectedMode, setSelectedMode] = useState<AIAssistanceMode>('guided');
  const [session, setSession] = useState<JournalSession>({
    content: '',
    wordCount: 0,
    duration: 0,
    assistanceMode: 'guided',
    messages: [],
    patterns: [],
    insights: [],
  });
  const [inputText, setInputText] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Animation for mode selector
  const modeSelectorHeight = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Calculate duration
    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - sessionStartTime) / 60000);
      setSession(prev => ({ ...prev, duration }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  useEffect(() => {
    // Animate mode selector
    Animated.timing(modeSelectorHeight, {
      toValue: showModeSelector ? 150 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showModeSelector]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [session.messages]);

  useEffect(() => {
    // Send initial AI greeting if not solo mode
    if (selectedMode !== 'solo' && session.messages.length === 0) {
      const greetingMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: getInitialGreeting(selectedMode),
        timestamp: new Date().toISOString(),
      };
      setSession(prev => ({
        ...prev,
        messages: [greetingMessage],
      }));
    }
  }, [selectedMode]);

  const getInitialGreeting = (mode: AIAssistanceMode): string => {
    const greetings = {
      guided: "Hello! I'm here to help guide your journaling today. What's on your mind? Feel free to write about anything - your thoughts, feelings, or experiences.",
      wisdom: "Welcome, seeker. Let us explore the depths of your experience together. What wisdom are you carrying within you today?",
      pattern: "Hi there! I'll be watching for patterns and connections in your writing today. Start sharing your thoughts, and I'll help you see the bigger picture.",
      solo: "",
    };
    return greetings[mode];
  };

  const handleModeChange = (mode: AIAssistanceMode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
    
    // Clear AI messages when switching modes
    const journalMessages = session.messages.filter(msg => msg.isJournalEntry);
    setSession(prev => ({
      ...prev,
      assistanceMode: mode,
      messages: journalMessages,
    }));
  };

  const sendMessage = async () => {
    if (!inputText.trim() || aiThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isJournalEntry: true,
    };

    // Update session with user message
    setSession(prev => {
      const newContent = prev.content ? `${prev.content}\n\n${inputText.trim()}` : inputText.trim();
      const wordCount = newContent.split(/\s+/).filter(word => word.length > 0).length;
      
      return {
        ...prev,
        content: newContent,
        wordCount,
        messages: [...prev.messages, userMessage],
      };
    });

    setInputText('');

    // Get AI response if not in solo mode
    if (selectedMode !== 'solo') {
      setAiThinking(true);
      
      try {
        const user = await getCurrentUser();
        const userId = user?.id || DEMO_USER_UUID;
        
        // Get AI response using unified AI service
        const aiResponse = await unifiedAIService.generateResponse(
          { 
            user: { id: userId } as any,
            conversationHistory: session.messages.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content,
            })),
          },
          userMessage.content,
          {
            type: 'question',
            system: selectedMode === 'wisdom' ? 'wisdom_guide' : 
                    selectedMode === 'pattern' ? 'pattern_recognizer' : 
                    'accountability_guide',
            depth_level: 3,
          }
        );

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          patterns: aiResponse.metadata.patterns_identified || prev.patterns,
          insights: aiResponse.metadata.wisdom_insights ? 
            Object.values(aiResponse.metadata.wisdom_insights).filter(v => typeof v === 'string') as string[] : 
            prev.insights,
        }));
      } catch (error) {
        console.error('Error getting AI response:', error);
      } finally {
        setAiThinking(false);
      }
    }
  };

  const saveJournalEntry = async () => {
    if (session.content.trim().length < 50) {
      Alert.alert('Entry too short', 'Please write at least 50 characters before saving.');
      return;
    }

    setIsSaving(true);

    try {
      const user = await getCurrentUser();
      const userId = user?.id || DEMO_USER_UUID;

      // Create journal entry
      await journalService.createJournalEntry({
        user_id: userId,
        date: new Date().toISOString().split('T')[0],
        content: session.content,
        ai_assistance_used: session.assistanceMode,
        word_count: session.wordCount,
        writing_session_duration: session.duration,
        patterns_identified: session.patterns,
        ai_insights: session.insights,
        ai_conversation_thread: session.messages
          .filter(msg => !msg.isJournalEntry || msg.type === 'ai')
          .map(msg => ({
            message_id: msg.id,
            role: msg.type,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
      });

      Alert.alert(
        'Entry Saved',
        `Your ${session.wordCount}-word journal entry has been saved.`,
        [
          { text: 'Continue Writing', style: 'cancel' },
          { 
            text: 'New Entry', 
            onPress: () => {
              // Reset session
              setSession({
                content: '',
                wordCount: 0,
                duration: 0,
                assistanceMode: selectedMode,
                messages: [],
                patterns: [],
                insights: [],
              });
              setInputText('');
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.type === 'user';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Text style={styles.aiAvatarText}>
              {assistanceModes.find(m => m.key === selectedMode)?.icon || '🤖'}
            </Text>
          </View>
        )}
        
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.aiText,
          ]}>
            {message.content}
          </Text>
          
          {message.isJournalEntry && (
            <View style={styles.journalIndicator}>
              <Ionicons name="book-outline" size={12} color="#FFB000" /> {/* Duson Golden Yellow */}
              <Text style={styles.journalIndicatorText}>Journal Entry</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
                      <Ionicons name="chevron-back" size={24} color="#FFB000" /> {/* Duson Golden Yellow */}
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Journal</Text>
          <TouchableOpacity 
            style={styles.modeButton}
            onPress={() => setShowModeSelector(!showModeSelector)}
          >
            <Text style={styles.modeButtonText}>
              {assistanceModes.find(m => m.key === selectedMode)?.icon} {selectedMode}
            </Text>
            <Ionicons 
              name={showModeSelector ? "chevron-up" : "chevron-down"} 
              size={16} 
                              color="#FFB000" // Duson Golden Yellow 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
          onPress={saveJournalEntry}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Collapsible Mode Selector */}
      <Animated.View style={[styles.modeSelectorContainer, { height: modeSelectorHeight }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeSelectorContent}
        >
          {assistanceModes.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.modeCard,
                selectedMode === mode.key && { borderColor: mode.color },
              ]}
              onPress={() => handleModeChange(mode.key)}
            >
              <Text style={styles.modeIcon}>{mode.icon}</Text>
              <Text style={styles.modeTitle}>{mode.title}</Text>
              <Text style={styles.modeDescription}>{mode.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Main Chat Area */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {session.messages.length === 0 && selectedMode === 'solo' && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Start writing your thoughts...
            </Text>
          </View>
        )}

        {session.messages.map((message, index) => renderMessage(message, index))}

        {aiThinking && (
          <View style={[styles.messageContainer, styles.aiMessageContainer]}>
            <View style={styles.aiAvatar}>
                              <ActivityIndicator size="small" color="#FFB000" /> {/* Duson Golden Yellow */}
            </View>
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <Text style={styles.thinkingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputArea}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={selectedMode === 'solo' ? "Write your journal entry..." : "Write your thoughts or ask the AI..."}
                          placeholderTextColor="#5A4E41" // Duson dark beige-gray
            multiline
            maxLength={2000}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || aiThinking) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || aiThinking}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <Text style={styles.statText}>
            <Ionicons name="document-text-outline" size={12} /> {session.wordCount} words
          </Text>
          <Text style={styles.statText}>
            <Ionicons name="time-outline" size={12} /> {session.duration} min
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D2C2E', // Dark charcoal background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2D2C2E', // Dark charcoal background
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FAF5E6', // Cream text
    marginBottom: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3A3839', // Light charcoal surface
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  modeButtonText: {
    fontSize: 14,
    color: '#FD1F4A', // Crimson accent
    marginRight: 4,
  },
  saveButton: {
    backgroundColor: '#FD1F4A', // Crimson background
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(250, 245, 230, 0.3)', // Muted cream when disabled
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FAF5E6', // Cream text
    fontWeight: '600',
  },
  modeSelectorContainer: {
    overflow: 'hidden',
    backgroundColor: '#2D2C2E', // Dark charcoal background
  },
  modeSelectorContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  modeCard: {
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FAF5E6', // Cream text
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 10,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    textAlign: 'center',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: 'rgba(250, 245, 230, 0.6)', // Muted cream
    fontStyle: 'italic',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3839', // Light charcoal surface
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  aiAvatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: 16,
  },
  userBubble: {
    backgroundColor: '#FD1F4A', // Crimson background for user messages
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#3A3839', // Light charcoal surface for AI messages
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#FAF5E6', // Cream text for user messages
  },
  aiText: {
    color: '#FAF5E6', // Cream text for AI messages
  },
  journalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(253, 31, 74, 0.3)', // Crimson border with opacity
  },
  journalIndicatorText: {
    fontSize: 11,
    color: '#FD1F4A', // Crimson accent
    marginLeft: 4,
  },
  thinkingText: {
    fontSize: 14,
    color: '#FD1F4A', // Crimson accent
    fontStyle: 'italic',
  },
  inputArea: {
    backgroundColor: '#2D2C2E', // Dark charcoal background
    borderTopWidth: 1,
    borderTopColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#3A3839', // Light charcoal surface
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 245, 230, 0.2)', // Cream border with opacity
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FAF5E6', // Cream text
    maxHeight: 120,
    minHeight: 40,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 12,
    backgroundColor: '#FD1F4A', // Crimson background
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(250, 245, 230, 0.3)', // Muted cream when disabled
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    color: 'rgba(250, 245, 230, 0.8)', // Cream with opacity
    marginHorizontal: 12,
  },
});