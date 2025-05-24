import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import {
  useCount,
  useCountActions,
  useTodos,
  useTodoActions,
  usePreferences,
  useUpdatePreferences,
} from '@/store';

export default function HomeScreen() {
  const [newTodoText, setNewTodoText] = useState('');

  // Zustand state and actions
  const count = useCount();
  const { increment, decrement, reset } = useCountActions();
  const todos = useTodos();
  const { addTodo, toggleTodo, removeTodo } = useTodoActions();
  const preferences = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const handleAddTodo = () => {
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim());
      setNewTodoText('');
    }
  };

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'auto'] as const;
    const currentIndex = themes.indexOf(preferences.theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updatePreferences({ theme: nextTheme });
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Zustand + Immer + MMKV Demo!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Counter Demo */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Counter (Persisted)</ThemedText>
        <ThemedView style={styles.counterContainer}>
          <TouchableOpacity style={styles.button} onPress={decrement}>
            <ThemedText style={styles.buttonText}>-</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.countText}>{count}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={increment}>
            <ThemedText style={styles.buttonText}>+</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={reset}>
            <ThemedText style={styles.buttonText}>Reset</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Preferences Demo */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Preferences (Persisted)</ThemedText>
        <ThemedView style={styles.preferencesContainer}>
          <ThemedText>Theme: {preferences.theme}</ThemedText>
          <TouchableOpacity style={styles.button} onPress={toggleTheme}>
            <ThemedText style={styles.buttonText}>Toggle Theme</ThemedText>
          </TouchableOpacity>
          <ThemedView style={styles.switchContainer}>
            <ThemedText>Notifications: {preferences.notifications ? 'On' : 'Off'}</ThemedText>
            <TouchableOpacity
              style={styles.button}
              onPress={() => updatePreferences({ notifications: !preferences.notifications })}
            >
              <ThemedText style={styles.buttonText}>Toggle</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Todo Demo */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Todos (Persisted with Immer)</ThemedText>
        <ThemedView style={styles.todoInputContainer}>
          <TextInput
            style={styles.todoInput}
            placeholder="Add a new todo..."
            placeholderTextColor="#666"
            value={newTodoText}
            onChangeText={setNewTodoText}
            onSubmitEditing={handleAddTodo}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddTodo}>
            <ThemedText style={styles.buttonText}>Add</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        {todos.map(todo => (
          <ThemedView key={todo.id} style={styles.todoItem}>
            <TouchableOpacity style={styles.todoToggle} onPress={() => toggleTodo(todo.id)}>
              <ThemedText style={[styles.todoText, todo.completed && styles.todoCompleted]}>
                {todo.completed ? '✓ ' : '○ '}
                {todo.text}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => removeTodo(todo.id)}>
              <ThemedText style={styles.buttonText}>Delete</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ))}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">How it works</ThemedText>
        <ThemedText>
          This demo uses Zustand with Immer middleware for immutable updates and persist middleware
          with react-native-mmkv for fast, synchronous storage. All state changes are automatically
          persisted and will survive app restarts!
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  countText: {
    fontSize: 24,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  preferencesContainer: {
    gap: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todoInputContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  todoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  todoToggle: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
