import { devtools } from '@csark0812/zustand-expo-devtools';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserProfileInfo } from '@/types';
import { createHook } from './helpers';

type OnboardingStep = 'name' | 'job-company' | 'phone' | 'credentials' | 'photo' | '';

interface OnboardingFormData {
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  password: string;
  image: string;
  currentStep: OnboardingStep;
  hasIncompleteOnboarding: boolean;
}

export interface OnboardingState {
  // Form Data
  name: string;
  jobTitle: string;
  company: string;
  phoneNumber: string;
  email: string;
  password: string;
  image: string;

  // Flow State
  currentStep: OnboardingStep;
  hasIncompleteOnboarding: boolean;

  // Actions
  setName: (name: string) => void;
  setJobTitle: (jobTitle: string) => void;
  setCompany: (company: string) => void;
  setPhoneNumber: (phoneNumber: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setImage: (image: string) => void;
  setCurrentStep: (step: OnboardingStep) => void;
  setHasIncompleteOnboarding: (hasIncompleteOnboarding: boolean) => void;
  populateFromUserProfile: (userProfile: UserProfileInfo) => void;

  // Utilities
  resetOnboarding: () => void;
  getOnboardingData: () => OnboardingFormData;
}

/**
 * Onboarding Store
 *
 * Manages user registration form data and flow state across
 * the onboarding process with persistent storage capabilities.
 * Uses Zustand persist middleware for automatic AsyncStorage sync.
 */
export const onboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        name: '',
        jobTitle: '',
        company: '',
        phoneNumber: '',
        email: '',
        password: '',
        image: '',
        currentStep: '',
        hasIncompleteOnboarding: false,

        // Actions
        setName: (name) => set({ name }, false, 'setName'),
        setJobTitle: (jobTitle) => set({ jobTitle }, false, 'setJobTitle'),
        setCompany: (company) => set({ company }, false, 'setCompany'),
        setPhoneNumber: (phoneNumber) => set({ phoneNumber }, false, 'setPhoneNumber'),
        setEmail: (email) => set({ email }, false, 'setEmail'),
        setPassword: (password) => set({ password }, false, 'setPassword'),
        setImage: (image) => set({ image }, false, 'setImage'),
        setCurrentStep: (currentStep) => set({ currentStep }, false, 'setCurrentStep'),
        setHasIncompleteOnboarding: (hasIncompleteOnboarding) =>
          set({ hasIncompleteOnboarding }, false, 'setHasIncompleteOnboarding'),

        /**
         * Populate onboarding data from user profile
         * Only sets values if they exist in the user profile
         */
        populateFromUserProfile: (userProfile) => {
          const updates: Partial<OnboardingState> = {};

          if (userProfile.name) updates.name = userProfile.name;
          if (userProfile.jobTitle) updates.jobTitle = userProfile.jobTitle;
          if (userProfile.company) updates.company = userProfile.company;
          if (userProfile.phone) updates.phoneNumber = userProfile.phone;
          if (userProfile.photo) updates.image = userProfile.photo;
          updates.currentStep = 'name';

          set(updates, false, 'populateFromUserProfile');
        },

        /**
         * Reset the onboarding store
         * Persist middleware automatically handles storage cleanup
         */
        resetOnboarding: () => {
          set(
            {
              name: '',
              jobTitle: '',
              company: '',
              phoneNumber: '',
              email: '',
              password: '',
              image: '',
              currentStep: '',
              hasIncompleteOnboarding: false,
            },
            false,
            'resetOnboarding',
          );
        },

        /**
         * Get onboarding data
         */
        getOnboardingData: () => {
          const state = get();
          return {
            name: state.name,
            jobTitle: state.jobTitle,
            company: state.company,
            phoneNumber: state.phoneNumber,
            email: state.email,
            password: state.password,
            image: state.image,
            currentStep: state.currentStep,
            hasIncompleteOnboarding: state.hasIncompleteOnboarding,
          };
        },
      }),
      {
        name: 'onboarding-storage',
        storage: createJSONStorage(() => AsyncStorage),
        
        // VERSION 1: Add version control for schema migrations
        version: 1,
        
        // MIGRATION: Handle old schema versions
        migrate: (persistedState: any, version: number) => {
          // If migrating from version 0 (or no version), remove old fields
          if (version === 0) {
            const {
              isThirdParty,
              newUserHasCredentials,
              ...validState
            } = persistedState;
            
            return validState as OnboardingState;
          }
          
          return persistedState as OnboardingState;
        },
        
        // PARTIALIZE: Only persist the data fields, not the action functions
        // This prevents stale data and ensures only valid fields are saved
        partialize: (state) => ({
          name: state.name,
          jobTitle: state.jobTitle,
          company: state.company,
          phoneNumber: state.phoneNumber,
          email: state.email,
          password: state.password,
          image: state.image,
          currentStep: state.currentStep,
          hasIncompleteOnboarding: state.hasIncompleteOnboarding,
        }),
        
        // SKIP HYDRATION: Prevent automatic hydration on mount
        // This gives you more control over when rehydration happens
        skipHydration: false,
        
        // Optional: Add merge function to handle partial state updates
        merge: (persistedState, currentState) => {
          // Ensure we only merge valid fields from persisted state
          const validFields: (keyof OnboardingFormData)[] = [
            'name',
            'jobTitle',
            'company',
            'phoneNumber',
            'email',
            'password',
            'image',
            'currentStep',
            'hasIncompleteOnboarding',
          ];
          
          const filteredPersistedState: Partial<OnboardingState> = {};
          
          validFields.forEach((field) => {
            if (field in persistedState) {
              filteredPersistedState[field] = persistedState[field as keyof typeof persistedState];
            }
          });
          
          return {
            ...currentState,
            ...filteredPersistedState,
          };
        },
      },
    ),
    { 
      name: 'onboarding-store',
      // Disable anonymous action type to make debugging easier
      anonymousActionType: '@@REHYDRATE',
    },
  ),
);
