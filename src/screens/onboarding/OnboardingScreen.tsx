import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const onboardingSteps = [
    // Updated onboarding steps for a more compelling, actionable, and concise onboarding experience.
    {
      title: "Welcome to Your Transformation",
      content: "You’re not here to fill time—you’re here to shape it. By tapping ‘Continue,’ you trade autopilot for authorship and start compounding freedom, focus, and purpose."
    },
    {
      title: "The Seven-Phase Journey",
      content: "Seven deliberate phases carry you from first insight to everyday mastery: Recognition, Understanding, Realization, Transformation, Vision, Reality, Integration. One step at a time—no overwhelm, just momentum."
    },
    {
      title: "Daily Check-ins",
      content: "Expect two lightning‑fast reflections each day. Five minutes of micro‑journaling, anchored to an existing routine, is enough to shift habits and slash stress."
    },
    {
      title: "Ready to Begin?",
      content: "Phase 1 starts now. Spot one area on autopilot, ask ‘Why?’ five times, then choose the smallest action to rewrite that script. Your future self is already cheering."
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Main');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Main');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.stepContainer}>
          <Text style={styles.title}>{onboardingSteps[currentStep].title}</Text>
          <Text style={styles.stepContent}>{onboardingSteps[currentStep].content}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Text style={styles.skipText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentStep === onboardingSteps.length - 1 ? 'Begin Journey' : 'Next'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  scrollContent: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: '#8b5cf6',
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 36,
  },
  stepContent: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  nextButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipText: {
    color: '#6b7280',
    fontSize: 14,
  },
});