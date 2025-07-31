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
    backgroundColor: '#FAF5E6', // Duson Light Beige
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
    backgroundColor: '#A89379', // Duson medium gray-beige
  },
  progressDotActive: {
    backgroundColor: '#FFB000', // Duson Golden Yellow
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
    backgroundColor: '#FFB000', // Duson Golden Yellow
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextText: {
    color: '#2D2C2E', // Duson Dark Charcoal for better contrast
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  skipText: {
    color: '#5A4E41', // Duson dark beige-gray
    fontSize: 14,
  },
});