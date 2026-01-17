import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { submitRegistration, fetchEventQuestions } from '@/services/eventService';

// Type definitions
type Option = {
  id: number;
  optionText: string;
  displayOrder: number;
};

type Question = {
  id: number;
  questionText: string;
  displayOrder: number;
  options: Option[];
};

export default function EventRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse event data from params
  const eventId = params.eventId as string;
  const eventTitle = params.eventTitle as string;

  // User state
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);

  // Form state
  const [fullName, setFullName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // { questionId: selectedOptionId }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserAndLoadProfile();
    loadQuestions();
  }, []);

  const checkUserAndLoadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        setIsGuest(false);
        // TODO: Load user profile data from your profiles table
      } else {
        setIsGuest(true);
      }
    } catch (error) {
      console.log("Not logged in, continuing as guest");
      setIsGuest(true);
    }
  };

  const loadQuestions = async () => {
    setLoading(true);
    const data = await fetchEventQuestions(eventId);
    setQuestions(data);
    setLoading(false);
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // For guests, validate all fields
    if (isGuest) {
      if (!fullName.trim()) {
        Alert.alert("Missing Field", "Please enter your full name.");
        return;
      }
      if (!contactNumber.trim()) {
        Alert.alert("Missing Field", "Please enter your contact number.");
        return;
      }
      if (!emergencyContact.trim()) {
        Alert.alert("Missing Field", "Please enter an emergency contact number.");
        return;
      }
    }

    // Validate all questions are answered
    for (const question of questions) {
      if (!answers[question.id]) {
        Alert.alert("Missing Answer", `Please answer: "${question.questionText}"`);
        return;
      }
    }

    // Prepare answers array for backend
    const answersArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      questionId: parseInt(questionId),
      selectedOptionId
    }));

    try {
      await submitRegistration({
        eventId,
        userId: user?.id || null,
        specialRequirements: specialRequirements.trim() || undefined,
        isGuest,
        fullName: isGuest ? fullName.trim() : undefined,
        contactNumber: isGuest ? contactNumber.trim() : undefined,
        emergencyContact: isGuest ? emergencyContact.trim() : undefined,
        answers: answersArray,
      });

      Alert.alert(
        "Registration Submitted",
        "Your registration has been submitted successfully!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong.");
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color='#002C5E' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Registration</Text>
        <Text style={styles.headerSubtitle}>Fill in your details</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.formContainer}>

        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={[styles.input, !isGuest && styles.disabledInput]}
          placeholder="Enter your full name"
          placeholderTextColor="#9CA3AF"
          value={fullName}
          onChangeText={setFullName}
          editable={isGuest}
        />

        {/* Contact Number */}
        <Text style={styles.label}>Contact Number</Text>
        <TextInput
          style={[styles.input, !isGuest && styles.disabledInput]}
          placeholder="+65 XXXX XXXX"
          placeholderTextColor="#9CA3AF"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
          editable={isGuest}
        />

        {/* Emergency Contact */}
        <Text style={styles.label}>Emergency Contact</Text>
        <TextInput
          style={[styles.input, !isGuest && styles.disabledInput]}
          placeholder="Emergency contact number"
          placeholderTextColor="#9CA3AF"
          value={emergencyContact}
          onChangeText={setEmergencyContact}
          keyboardType="phone-pad"
          editable={isGuest}
        />

        {/* Dynamic Questions from Backend */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#002C5E" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        ) : (
          questions.map((question) => (
            <View key={question.id}>
              <Text style={styles.label}>{question.questionText}</Text>
              <View style={styles.optionsContainer}>
                {question.options.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionItem,
                      answers[question.id] === option.id && styles.optionSelected,
                    ]}
                    onPress={() => handleSelectOption(question.id, option.id)}
                  >
                    <View style={styles.radioContainer}>
                      <View style={[
                        styles.radioOuter,
                        answers[question.id] === option.id && styles.radioOuterSelected,
                      ]}>
                        {answers[question.id] === option.id && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.optionText}>{option.optionText}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Special Requirements */}
        <Text style={styles.label}>Special Requirements (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special needs or requirements"
          placeholderTextColor="#9CA3AF"
          value={specialRequirements}
          onChangeText={setSpecialRequirements}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit Registration</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002C5E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 15,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  optionsContainer: {
    gap: 10,
  },
  optionItem: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#002C5E',
    backgroundColor: '#F8FAFC',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: '#002C5E',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#002C5E',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#002C5E',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
