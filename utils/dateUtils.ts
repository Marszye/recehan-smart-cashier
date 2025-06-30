export const formatDate = (timestamp: number): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
};

export const formatDateTime = (timestamp: number): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const formatTime = (timestamp: number): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const getCurrentDate = (): string => {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error('Error getting current date:', error);
    return '2024-01-01';
  }
};

export const getWeekRange = (): { start: string; end: string } => {
  try {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Calculate the date of Monday (start of week)
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + (day === 0 ? -6 : 1));
    
    // Calculate the date of Sunday (end of week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Ensure dates are valid before returning
    if (isNaN(monday.getTime()) || isNaN(sunday.getTime())) {
      // Fallback to current date if invalid
      const fallbackDate = new Date();
      return {
        start: fallbackDate.toISOString().split('T')[0],
        end: fallbackDate.toISOString().split('T')[0],
      };
    }
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  } catch (error) {
    console.error('Error getting week range:', error);
    const fallbackDate = new Date();
    return {
      start: fallbackDate.toISOString().split('T')[0],
      end: fallbackDate.toISOString().split('T')[0],
    };
  }
};

export const getMonthRange = (month: number, year: number): { start: string; end: string } => {
  try {
    // Validate inputs
    if (isNaN(month) || isNaN(year) || month < 0 || month > 11 || year < 1970 || year > 9999) {
      console.warn("Invalid month or year provided:", { month, year });
      // Fallback to current month if invalid inputs
      const fallbackDate = new Date();
      const fallbackStart = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
      const fallbackEnd = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth() + 1, 0);
      
      return {
        start: fallbackStart.toISOString().split('T')[0],
        end: fallbackEnd.toISOString().split('T')[0],
      };
    }
    
    // Create valid date objects for start and end of month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    // Ensure dates are valid before returning
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn("Invalid dates created:", { startDate, endDate });
      // Fallback to current month if invalid dates
      const fallbackDate = new Date();
      const fallbackStart = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
      const fallbackEnd = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth() + 1, 0);
      
      return {
        start: fallbackStart.toISOString().split('T')[0],
        end: fallbackEnd.toISOString().split('T')[0],
      };
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  } catch (error) {
    console.error("Error in getMonthRange:", error);
    // Fallback to current month if any error occurs
    const fallbackDate = new Date();
    const fallbackStart = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1);
    const fallbackEnd = new Date(fallbackDate.getFullYear(), fallbackDate.getMonth() + 1, 0);
    
    return {
      start: fallbackStart.toISOString().split('T')[0],
      end: fallbackEnd.toISOString().split('T')[0],
    };
  }
};

export const isValidDate = (timestamp: number): boolean => {
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

export const safeParseDate = (dateString: string): Date => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date();
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};