export const translateError = (error: unknown): string => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  // If it's already a string, try to translate common technical phrases
  if (typeof error === 'string') {
    return translateErrorMessage(error);
  }

  // Handle Axios error structure
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response as { status: number; data: { message?: string; error?: string } };
    const status = response.status;
    const data = response.data;

    // Use backend provided message if available, but translate it
    const backendMessage = data?.message || data?.error;
    if (backendMessage && typeof backendMessage === 'string') {
      return translateErrorMessage(backendMessage);
    }

    // Fallback to status code based messages
    switch (status) {
      case 400:
        return 'Some information seems to be missing or incorrect. Please check and try again.';
      case 401:
        return 'Your session has expired or you are not logged in. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'We could not find what you were looking for.';
      case 413:
        return 'The file you are trying to upload is too large.';
      case 429:
        return 'Too many requests. Please slow down and try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Something went wrong on our end. We are working to fix it.';
      default:
        return 'An error occurred while communicating with our servers. Please try again.';
    }
  }

  // Handle network errors or other issues
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: string }).message;
    if (message === 'Network Error') {
      return 'We are having trouble connecting to the server. Please check your internet connection.';
    }
    return translateErrorMessage(message);
  }

  return 'An unexpected error occurred. Please try again.';
};

const translateErrorMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('invalid email or password')) {
    return 'The email or password you entered is incorrect.';
  }
  if (lowerMessage.includes('email already exists') || lowerMessage.includes('user already exists')) {
    return 'This email address is already registered. Try logging in instead.';
  }
  if (lowerMessage.includes('token expired') || lowerMessage.includes('jwt expired')) {
    return 'Your session has expired. Please log in again.';
  }
  if (lowerMessage.includes('not found')) {
    return 'We could not find the information you requested.';
  }
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('access denied')) {
    return 'You do not have permission to do this.';
  }
  if (lowerMessage.includes('validation failed')) {
    return 'Please check the information you entered and try again.';
  }
  if (lowerMessage.includes('enoent') || lowerMessage.includes('no such file')) {
    return 'We had trouble saving or finding a file. Please try again.';
  }

  // If no translation found, and it looks technical, return a generic friendly message
  if (lowerMessage.includes('load venues') || lowerMessage.includes('fetch venues') || lowerMessage.includes('venue')) {
    return "We're having trouble loading the venues right now. Please try again in a moment.";
  }

  if (lowerMessage.includes('30 days before the event')) {
    return message;
  }

  if (lowerMessage.includes('failed to fetch') || lowerMessage.includes('error') || lowerMessage.includes('exception')) {
     return "We're having trouble loading the information right now. Please try again in a moment.";
  }

  return message;
};
