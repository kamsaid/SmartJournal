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
} from 'react-native';
import { AIAssistanceMode, JournalEntry } from '@/types/database';
import { DEMO_USER_UUID } from '@/utils/uuid';

interface JournalingScreenProps {
  navigation: any;
}

interface AIMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: string;
}

interface JournalSession {
  content: string;
  wordCount: number;
  duration: number;
  assistanceMode: AIAssistanceMode;
  aiConversation: AIMessage[];
  patterns: string[];
  insights: string[];
}

export default function JournalingScreen({ navigation }: JournalingScreenProps) {
  const [selectedMode, setSelectedMode] = useState<AIAssistanceMode>('solo');
  const [journalContent, setJournalContent] = useState('');
  const [session, setSession] = useState<JournalSession>({
    content: '',
    wordCount: 0,
    duration: 0,
    assistanceMode: 'solo',
    aiConversation: [],
    patterns: [],
    insights: [],
  });
  const [aiThinking, setAiThinking] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [sessionStartTime] = useState(Date.now());
  const [showAIPanel, setShowAIPanel] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Update session whenever content changes
    const wordCount = journalContent.trim().split(/\s+/).filter(word => word.length > 0).length;
    const duration = Math.floor((Date.now() - sessionStartTime) / 60000); // minutes
    
    setSession(prev => ({
      ...prev,
      content: journalContent,
      wordCount,
      duration,
      assistanceMode: selectedMode,
    }));
  }, [journalContent, selectedMode, sessionStartTime]);

  useEffect(() => {
    // Show/hide AI panel based on mode
    setShowAIPanel(selectedMode !== 'solo');
  }, [selectedMode]);

  const assistanceModes = [
    {
      key: 'solo' as AIAssistanceMode,
      title: 'Solo Writing',
      description: 'Write freely without AI assistance',
      icon: '✍️',
      color: '#6b7280',
    },
    {
      key: 'guided' as AIAssistanceMode,
      title: 'Guided Writing',
      description: 'AI provides gentle prompts and questions',
      icon: '🧭',
      color: '#10b981',
    },
    {
      key: 'wisdom' as AIAssistanceMode,
      title: 'Wisdom Mode',
      description: 'Deep philosophical insights and reflections',
      icon: '🦉',
      color: '#8b5cf6',
    },
    {
      key: 'pattern' as AIAssistanceMode,
      title: 'Pattern Recognition',
      description: 'AI helps identify patterns and connections',
      icon: '🔍',
      color: '#f59e0b',
    },
  ];

  const handleModeChange = (mode: AIAssistanceMode) => {
    setSelectedMode(mode);
    
    // Initialize AI conversation based on mode
    if (mode !== 'solo' && session.aiConversation.length === 0) {
      initializeAIConversation(mode);
    }
  };

  const initializeAIConversation = async (mode: AIAssistanceMode) => {
    setAiThinking(true);
    
    try {
      // Mock AI initialization - in real app, this would call JournalingService
      let initialMessage = '';
      
      switch (mode) {
        case 'guided':
          initialMessage = "I'm here to help guide your writing. What's on your mind today? Feel free to start writing, and I'll offer gentle prompts along the way.";
          break;
        case 'wisdom':
          initialMessage = "Let's explore the deeper currents of your thoughts today. What situation or feeling would you like to examine more closely?";
          break;
        case 'pattern':
          initialMessage = "I'll help you identify patterns and connections in your thoughts. Start writing about whatever comes to mind, and I'll notice recurring themes.";
          break;
      }

      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'ai',
        content: initialMessage,
        timestamp: new Date().toISOString(),
      };

      setSession(prev => ({
        ...prev,
        aiConversation: [aiMessage],
      }));
    } catch (error) {
      console.error('Error initializing AI conversation:', error);
    } finally {
      setAiThinking(false);
    }
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInput.trim(),
      timestamp: new Date().toISOString(),
    };

    setSession(prev => ({
      ...prev,
      aiConversation: [...prev.aiConversation, userMessage],
    }));

    setAiInput('');
    setAiThinking(true);

    try {
      // Mock AI response - in real app, this would call JournalingService
      const aiResponse = await generateAIResponse(userMessage.content, selectedMode, journalContent);
      
      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      setSession(prev => ({
        ...prev,
        aiConversation: [...prev.aiConversation, aiMessage],
      }));
    } catch (error) {
      console.error('Error getting AI response:', error);
      Alert.alert('Error', 'Failed to get AI response');
    } finally {
      setAiThinking(false);
    }
  };

  const generateAIResponse = async (userInput: string, mode: AIAssistanceMode, content: string): Promise<string> => {
    // Mock AI responses based on mode
    const responses = {
      guided: [
        "That's an interesting perspective. Can you tell me more about how that made you feel?",
        "I notice you mentioned that several times. What do you think that pattern might mean?",
        "What would you say to a friend who was experiencing something similar?",
        "How do you think this situation connects to your larger goals or values?",
      ],
      wisdom: [
        "The ancient Stoics would say that our perception shapes our reality. How might this situation look different from another angle?",
        "Consider the Japanese concept of 'mono no aware' - the bittersweet awareness of impermanence. How does this lens change your view?",
        "What wisdom do you think your future self would offer about this situation?",
        "There's often a deeper truth beneath surface emotions. What might yours be trying to tell you?",
      ],
      pattern: [
        "I'm noticing a recurring theme around control in your writing. Is this something you've been thinking about lately?",
        "You've mentioned relationships in different contexts. There might be a pattern worth exploring there.",
        "Your language suggests a tension between wanting change and fearing it. Does that resonate?",
        "I see patterns of growth mindset in your reflections. That's a powerful foundation to build on.",
      ],
    };

    if (mode === 'solo') return '';
    
    const modeResponses = responses[mode] || responses.guided;
    return modeResponses[Math.floor(Math.random() * modeResponses.length)];
  };

  const saveJournalEntry = async () => {
    if (session.content.trim().length < 50) {
      Alert.alert('Entry too short', 'Please write at least 50 characters before saving.');
      return;
    }

    try {
      // Mock save - in real app, this would call JournalingService
      const entry: Partial<JournalEntry> = {
        user_id: DEMO_USER_UUID,
        date: new Date().toISOString().split('T')[0],
        content: session.content,
        ai_assistance_used: session.assistanceMode,
        word_count: session.wordCount,
        writing_session_duration: session.duration,
        patterns_identified: session.patterns,
        ai_insights: session.insights,
        ai_conversation_thread: session.aiConversation.map(msg => ({
          message_id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      };

      Alert.alert(
        'Entry Saved',
        `Your ${session.wordCount}-word journal entry has been saved with ${session.assistanceMode} assistance.`,
        [
          { text: 'Continue Writing', style: 'cancel' },
          { 
            text: 'New Entry', 
            onPress: () => {
              setJournalContent('');
              setSession(prev => ({
                ...prev,
                content: '',
                wordCount: 0,
                aiConversation: [],
                patterns: [],
                insights: [],
              }));
            }
          },
        ]
      );
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry');
    }
  };

  const renderModeSelector = () => (
    <View style={styles.modeSelector}>
      <Text style={styles.modeSelectorTitle}>Choose Your Writing Mode</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modesContainer}>
        {assistanceModes.map((mode) => (
          <TouchableOpacity
            key={mode.key}
            style={[
              styles.modeCard,
              selectedMode === mode.key && { borderColor: mode.color, borderWidth: 2 },
            ]}
            onPress={() => handleModeChange(mode.key)}
          >
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeDescription}>{mode.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAIPanel = () => {
    if (!showAIPanel) return null;

    return (
      <View style={styles.aiPanel}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiTitle}>
            {assistanceModes.find(mode => mode.key === selectedMode)?.icon} AI Assistant
          </Text>
          <TouchableOpacity onPress={() => setShowAIPanel(false)}>
            <Text style={styles.hideButton}>Hide</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.aiConversation}>
          {session.aiConversation.map((message) => (
            <View
              key={message.id}
              style={[
                styles.aiMessage,
                message.role === 'user' ? styles.userMessage : styles.assistantMessage,
              ]}
            >
              <Text style={[
                styles.aiMessageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
              ]}>
                {message.content}
              </Text>
            </View>
          ))}
          
          {aiThinking && (
            <View style={[styles.aiMessage, styles.assistantMessage]}>
              <ActivityIndicator size="small" color="#8b5cf6" />
              <Text style={styles.thinkingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.aiInputContainer}>
          <TextInput
            style={styles.aiInput}
            value={aiInput}
            onChangeText={setAiInput}
            placeholder="Ask the AI assistant..."
            placeholderTextColor="#6b7280"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !aiInput.trim() && styles.sendButtonDisabled]}
            onPress={sendAIMessage}
            disabled={!aiInput.trim() || aiThinking}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
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
          <Text style={styles.backButtonText}>‹ Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>AI-Assisted Journaling</Text>
          <Text style={styles.subtitle}>
            {session.wordCount} words • {session.duration} min
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveJournalEntry}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Mode Selector */}
      {renderModeSelector()}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Writing Area */}
        <View style={[styles.writingArea, showAIPanel && styles.writingAreaWithPanel]}>
          <TextInput
            ref={textInputRef}
            style={styles.journalInput}
            value={journalContent}
            onChangeText={setJournalContent}
            placeholder="Start writing your thoughts..."
            placeholderTextColor="#6b7280"
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>

        {/* AI Panel */}
        {renderAIPanel()}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {!showAIPanel && selectedMode !== 'solo' && (
          <TouchableOpacity
            style={styles.showAIButton}
            onPress={() => setShowAIPanel(true)}
          >
            <Text style={styles.showAIButtonText}>
              {assistanceModes.find(mode => mode.key === selectedMode)?.icon} Show AI Assistant
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.stats}>
          <Text style={styles.statText}>{session.wordCount} words</Text>
          <Text style={styles.statText}>{session.duration} min</Text>
          <Text style={styles.statText}>{selectedMode}</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {},
  backButtonText: {
    fontSize: 18,
    color: '#8b5cf6',
    fontWeight: '600',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  modeSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  modesContainer: {
    flexDirection: 'row',
  },
  modeCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 16,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  writingArea: {
    flex: 1,
    marginHorizontal: 20,
  },
  writingAreaWithPanel: {
    flex: 0.6,
    marginRight: 10,
  },
  journalInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
  },
  aiPanel: {
    flex: 0.4,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    marginRight: 20,
    marginLeft: 10,
  },
  aiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  hideButton: {
    fontSize: 14,
    color: '#8b5cf6',
  },
  aiConversation: {
    flex: 1,
    padding: 16,
  },
  aiMessage: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8b5cf6',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
  },
  aiMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#ffffff',
  },
  assistantMessageText: {
    color: '#d1d5db',
  },
  thinkingText: {
    fontSize: 14,
    color: '#8b5cf6',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  aiInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#0f1419',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#ffffff',
    maxHeight: 80,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4b5563',
  },
  sendButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showAIButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  showAIButtonText: {
    fontSize: 14,
    color: '#d1d5db',
  },
  stats: {
    flexDirection: 'row',
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 16,
  },
});