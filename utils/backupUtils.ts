import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Platform, Share } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';

export const createBackup = async (): Promise<string | null> => {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    
    // Filter only our app's keys
    const appKeys = keys.filter(key => key.startsWith('recehan-'));
    
    // Get all data
    const keyValuePairs = await AsyncStorage.multiGet(appKeys);
    
    // Create backup object
    const backupData = {
      timestamp: Date.now(),
      data: keyValuePairs.reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, string | null>),
    };
    
    // Convert to JSON
    const backupJson = JSON.stringify(backupData);
    
    // Create filename
    const date = new Date().toISOString().split('T')[0];
    const filename = `recehan_backup_${date}.json`;
    
    if (Platform.OS === 'web') {
      // For web, create a download link
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      useSettingsStore.getState().setLastBackup(Date.now());
      return filename;
    } else {
      // For mobile, save to file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, backupJson);
      
      // Share the file
      await Share.share({
        url: fileUri,
        title: 'Backup Recehan',
        message: 'Backup data Recehan',
      });
      
      useSettingsStore.getState().setLastBackup(Date.now());
      return fileUri;
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    return null;
  }
};

export const restoreBackup = async (fileUri: string): Promise<boolean> => {
  try {
    // Read the backup file
    const backupJson = await FileSystem.readAsStringAsync(fileUri);
    const backup = JSON.parse(backupJson);
    
    // Validate backup data
    if (!backup.timestamp || !backup.data) {
      throw new Error('Invalid backup file');
    }
    
    // Clear existing data
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith('recehan-'));
    await AsyncStorage.multiRemove(appKeys);
    
    // Restore data
    const entries = Object.entries(backup.data);
    const keyValuePairs = entries.map(([key, value]) => [key, value as string]);
    await AsyncStorage.multiSet(keyValuePairs as [string, string][]);
    
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return false;
  }
};