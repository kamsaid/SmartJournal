import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { morningCheckInService } from '@/services/checkins/MorningCheckInService';
import { clarifyAndChunk, updateTaskStatus, getTodayPlanIntents } from '@/services/openai/planAssistant';
import { theme } from '@/design-system';
import { MorningCheckIn, PlanIntent, PlanTask } from '@/types/database';
import { CheckSquare, Square, Clock, Target, ChevronRight } from 'lucide-react-native';

interface IntentWithTasks extends PlanIntent {
  plan_tasks: PlanTask[];
}

export default function PlanScreen() {
  const { getCurrentUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [morningIntents, setMorningIntents] = useState<string[]>([]);
  const [existingPlans, setExistingPlans] = useState<IntentWithTasks[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [clarifying, setClarifying] = useState(false);
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<{
    clarifiedIntent: string;
    tasks: Array<{ title: string; estMinutes: number }>;
    intentId: string;
  } | null>(null);

  // Fetch today's morning check-in intents
  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) return;

      const today = new Date().toISOString().split('T')[0];

      // Fetch morning check-in
      const morningCheckIn = await morningCheckInService.getMorningCheckIn(userId, today);
      
      if (morningCheckIn?.great_day_vision) {
        // Normalize to array: DB stores as string[] per types; handle legacy string just in case
        const intents = Array.isArray(morningCheckIn.great_day_vision)
          ? morningCheckIn.great_day_vision.slice(0, 3)
          : String(morningCheckIn.great_day_vision)
              .split(/[,;.]/)
              .map(s => s.trim())
              .filter(s => s.length > 0)
              .slice(0, 3);
        setMorningIntents(intents);
      }

      // Fetch existing plans
      const plans = await getTodayPlanIntents(userId);
      setExistingPlans(plans as IntentWithTasks[]);
    } catch (error) {
      console.error('Error fetching today data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntentSelect = async (intent: string) => {
    // Check if this intent already has a plan
    const existingPlan = existingPlans.find(p => p.intent_text === intent);
    if (existingPlan) {
      Alert.alert('Plan Already Exists', 'You already have a plan for this intent.');
      return;
    }

    setSelectedIntent(intent);
    setShowClarifyModal(true);
    setClarifying(true);

    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const result = await clarifyAndChunk(intent, userId);
      setCurrentPlan(result);
      setClarifying(false);
      
      // Refresh plans list
      const plans = await getTodayPlanIntents(userId);
      setExistingPlans(plans as IntentWithTasks[]);
    } catch (error) {
      console.error('Error clarifying intent:', error);
      Alert.alert('Error', 'Failed to create plan. Please try again.');
      setShowClarifyModal(false);
      setClarifying(false);
    }
  };

  const handleTaskToggle = async (taskId: string, currentStatus: 'pending' | 'done') => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      const newStatus = currentStatus === 'pending' ? 'done' : 'pending';
      await updateTaskStatus(taskId, newStatus, userId);

      // Update local state
      setExistingPlans(prevPlans => 
        prevPlans.map(plan => ({
          ...plan,
          plan_tasks: plan.plan_tasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        }))
      );
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task status.');
    }
  };

  const renderIntent = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.intentCard}
      onPress={() => handleIntentSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.intentContent}>
        <Target size={20} color={theme.colors.crimson[500]} />
        <Text style={styles.intentText} numberOfLines={2}>{item}</Text>
        <ChevronRight size={20} color={theme.colors.dark.text.secondary} />
      </View>
    </TouchableOpacity>
  );

  const renderTask = (task: PlanTask) => (
    <Pressable
      key={task.id}
      style={styles.taskRow}
      onPress={() => handleTaskToggle(task.id, task.status)}
    >
      <View style={styles.taskContent}>
        {task.status === 'done' ? (
          <CheckSquare size={22} color={theme.colors.success[500]} />
        ) : (
          <Square size={22} color={theme.colors.dark.text.secondary} />
        )}
        <Text style={[
          styles.taskTitle,
          task.status === 'done' && styles.taskTitleDone
        ]}>
          {task.title}
        </Text>
      </View>
      <View style={styles.taskMeta}>
        <Clock size={14} color={theme.colors.dark.text.tertiary} />
        <Text style={styles.taskMinutes}>{task.est_minutes} min</Text>
      </View>
    </Pressable>
  );

  const renderPlan = ({ item }: { item: IntentWithTasks }) => {
    const completedTasks = item.plan_tasks.filter(t => t.status === 'done').length;
    const totalTasks = item.plan_tasks.length;

    return (
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.clarifiedIntent}>{item.clarified_text}</Text>
          <Text style={styles.taskProgress}>
            {completedTasks}/{totalTasks} completed
          </Text>
        </View>
        <View style={styles.tasksList}>
          {item.plan_tasks.map(renderTask)}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.crimson[500]} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Plan</Text>
        <Text style={styles.subtitle}>Turn your morning intentions into action</Text>
      </View>

      {/* Morning Intents Section */}
      {morningIntents.length > 0 && existingPlans.length < morningIntents.length && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose an intention to plan:</Text>
          <FlatList
            data={morningIntents.filter(intent => 
              !existingPlans.some(plan => plan.intent_text === intent)
            )}
            renderItem={renderIntent}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* Existing Plans Section */}
      {existingPlans.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Plans</Text>
          <FlatList
            data={existingPlans}
            renderItem={renderPlan}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {/* Empty State */}
      {morningIntents.length === 0 && existingPlans.length === 0 && (
        <View style={styles.emptyState}>
          <Target size={48} color={theme.colors.dark.text.tertiary} />
          <Text style={styles.emptyTitle}>No morning intentions found</Text>
          <Text style={styles.emptyText}>
            Complete your morning check-in to set intentions for today
          </Text>
        </View>
      )}

      {/* Clarify Modal */}
      <Modal
        visible={showClarifyModal}
        transparent
        animationType="slide"
        onRequestClose={() => !clarifying && setShowClarifyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {clarifying ? (
              <View style={styles.clarifyingContainer}>
                <ActivityIndicator size="large" color={theme.colors.crimson[500]} />
                <Text style={styles.clarifyingText}>Clarifying your intention...</Text>
              </View>
            ) : currentPlan ? (
              <>
                <Text style={styles.modalTitle}>Your Clarified Plan</Text>
                <View style={styles.clarifiedCard}>
                  <Text style={styles.clarifiedText}>{currentPlan.clarifiedIntent}</Text>
                </View>
                <Text style={styles.tasksTitle}>Breaking it down into actions:</Text>
                <View style={styles.modalTasksList}>
                  {currentPlan.tasks.map((task, index) => (
                    <View key={index} style={styles.modalTask}>
                      <View style={styles.taskNumber}>
                        <Text style={styles.taskNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.modalTaskContent}>
                        <Text style={styles.modalTaskTitle}>{task.title}</Text>
                        <Text style={styles.modalTaskTime}>{task.estMinutes} minutes</Text>
                      </View>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowClarifyModal(false)}
                >
                  <Text style={styles.modalButtonText}>Start Working</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.bg,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.bg,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.dark.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.dark.text.secondary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.dark.text.primary,
    marginBottom: 16,
  },
  separator: {
    height: 12,
  },
  // Intent Cards
  intentCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  intentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intentText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.dark.text.primary,
    marginHorizontal: 12,
  },
  // Plan Cards
  planCard: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  planHeader: {
    marginBottom: 16,
  },
  clarifiedIntent: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.dark.text.primary,
    marginBottom: 4,
  },
  taskProgress: {
    fontSize: 14,
    color: theme.colors.dark.text.secondary,
  },
  tasksList: {
    gap: 8,
  },
  // Task Rows
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.dark.bg,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: theme.colors.dark.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.dark.text.tertiary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMinutes: {
    fontSize: 14,
    color: theme.colors.dark.text.tertiary,
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.dark.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.dark.text.secondary,
    textAlign: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  clarifyingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  clarifyingText: {
    fontSize: 16,
    color: theme.colors.dark.text.secondary,
    marginTop: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark.text.primary,
    marginBottom: 16,
  },
  clarifiedCard: {
    backgroundColor: theme.colors.dark.bg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.crimson[500] + '40',
  },
  clarifiedText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.crimson[500],
    textAlign: 'center',
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.dark.text.primary,
    marginBottom: 12,
  },
  modalTasksList: {
    gap: 12,
    marginBottom: 24,
  },
  modalTask: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.bg,
    borderRadius: 12,
    padding: 16,
  },
  taskNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.crimson[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.crimson[500],
  },
  modalTaskContent: {
    flex: 1,
  },
  modalTaskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.dark.text.primary,
    marginBottom: 2,
  },
  modalTaskTime: {
    fontSize: 14,
    color: theme.colors.dark.text.secondary,
  },
  modalButton: {
    backgroundColor: theme.colors.crimson[500],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 