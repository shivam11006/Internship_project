/**
 * Centralized Validation Utilities
 * Contains all regex patterns and validation functions with clear error messages
 */

// ==================== REGEX PATTERNS ====================

export const VALIDATION_PATTERNS = {
  // Email - RFC 5322 compliant
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Password - At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
  
  // Name - Only letters, spaces, hyphens, and apostrophes, minimum 2 characters
  name: /^[a-zA-Z\s'-]{2,50}$/,
  
  // Phone - International format or Indian format (+91 or 10 digits starting with 6-9)
  phone: /^(\+91[\s-]?)?[6-9]\d{9}$/,
  
  // Username - Alphanumeric and underscores, 3-30 characters
  username: /^[a-zA-Z0-9_]{3,30}$/,
  
  // Bar Number - Alphanumeric, minimum 5 characters
  barNumber: /^[A-Z0-9]{5,20}$/i,
  
  // Registration Number - Alphanumeric with hyphens and slashes
  registrationNumber: /^[A-Z0-9\-\/]{5,30}$/i,
  
  // OTP - Exactly 6 digits
  otp: /^\d{6}$/,
  
  // Case Title - Letters, numbers, spaces, and basic punctuation, 10-200 characters
  caseTitle: /^[a-zA-Z0-9\s.,!?'-]{10,200}$/,
  
  // Address - Alphanumeric with common address characters
  address: /^[a-zA-Z0-9\s,.\-#\/]{5,200}$/,
  
  // URL - Basic URL validation
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  
  // Alphanumeric - Only letters and numbers
  alphanumeric: /^[a-zA-Z0-9]+$/,
  
  // Letters Only - Only letters and spaces
  lettersOnly: /^[a-zA-Z\s]+$/,
  
  // Numbers Only - Only digits
  numbersOnly: /^\d+$/,
};

// ==================== VALIDATION MESSAGES ====================

export const VALIDATION_MESSAGES = {
  // Required field messages
  required: {
    email: 'Email address is required',
    password: 'Password is required',
    confirmPassword: 'Please confirm your password',
    name: 'Full name is required',
    username: 'Username is required',
    phone: 'Phone number is required',
    role: 'Please select a role',
    barNumber: 'Bar number is required for lawyers',
    registrationNumber: 'Registration number is required for NGOs',
    organizationName: 'Organization name is required for NGOs',
    specialization: 'Specialization is required for lawyers',
    focusArea: 'Focus area is required for NGOs',
    caseTitle: 'Case title is required',
    caseDescription: 'Case description is required',
    caseType: 'Please select a case type',
    priority: 'Please select case priority',
    state: 'Please select a state',
    district: 'Please select a district',
    language: 'Please select your preferred language',
    otp: 'Please enter the OTP',
  },
  
  // Invalid format messages
  invalid: {
    email: 'Please enter a valid email address (e.g., user@example.com)',
    password: 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number & 1 special character (@$!%*?&#)',
    confirmPassword: 'Passwords do not match',
    name: 'Name must contain only letters (2-50 characters)',
    username: 'Username must be 3-30 characters (letters, numbers, underscores only)',
    phone: 'Please enter a valid phone number (10 digits or +91XXXXXXXXXX)',
    barNumber: 'Bar number must be 5-20 alphanumeric characters',
    registrationNumber: 'Registration number must be 5-30 characters (alphanumeric, hyphens, slashes)',
    otp: 'OTP must be exactly 6 digits',
    caseTitle: 'Case title must be 10-200 characters (letters, numbers, and basic punctuation)',
    caseDescription: 'Please provide at least 50 characters describing your case',
    address: 'Please enter a valid address (5-200 characters)',
    url: 'Please enter a valid URL',
  },
  
  // Length messages
  length: {
    passwordMin: 'Password must be at least 8 characters',
    titleMin: 'Title must be at least 10 characters',
    descriptionMin: 'Description must be at least 50 characters',
  },
};

// ==================== VALIDATION FUNCTIONS ====================

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.email };
  }
  if (!VALIDATION_PATTERNS.email.test(email.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.email };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a password with strong requirements
 * @param {string} password - The password to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.password };
  }
  if (password.length < 8) {
    return { isValid: false, message: VALIDATION_MESSAGES.length.passwordMin };
  }
  if (!VALIDATION_PATTERNS.password.test(password)) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.password };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates password confirmation
 * @param {string} password - The original password
 * @param {string} confirmPassword - The confirmation password
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.confirmPassword };
  }
  if (password !== confirmPassword) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.confirmPassword };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a name (full name)
 * @param {string} name - The name to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateName = (name) => {
  if (!name || !name.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.name };
  }
  if (!VALIDATION_PATTERNS.name.test(name.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.name };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a phone number (optional field)
 * @param {string} phone - The phone number to validate
 * @param {boolean} required - Whether the field is required
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePhone = (phone, required = false) => {
  if (!phone || !phone.trim()) {
    if (required) {
      return { isValid: false, message: VALIDATION_MESSAGES.required.phone };
    }
    return { isValid: true, message: '' };
  }
  const cleanPhone = phone.replace(/\s/g, '');
  if (!VALIDATION_PATTERNS.phone.test(cleanPhone)) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.phone };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a bar number (for lawyers)
 * @param {string} barNumber - The bar number to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateBarNumber = (barNumber) => {
  if (!barNumber || !barNumber.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.barNumber };
  }
  if (!VALIDATION_PATTERNS.barNumber.test(barNumber.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.barNumber };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a registration number (for NGOs)
 * @param {string} regNumber - The registration number to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRegistrationNumber = (regNumber) => {
  if (!regNumber || !regNumber.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.registrationNumber };
  }
  if (!VALIDATION_PATTERNS.registrationNumber.test(regNumber.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.registrationNumber };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates an OTP
 * @param {string} otp - The OTP to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.otp };
  }
  if (!VALIDATION_PATTERNS.otp.test(otp)) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.otp };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a case title
 * @param {string} title - The case title to validate
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateCaseTitle = (title) => {
  if (!title || !title.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.caseTitle };
  }
  if (title.trim().length < 10) {
    return { isValid: false, message: VALIDATION_MESSAGES.length.titleMin };
  }
  if (!VALIDATION_PATTERNS.caseTitle.test(title.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.caseTitle };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a case description
 * @param {string} description - The description to validate
 * @param {number} minLength - Minimum length required
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateCaseDescription = (description, minLength = 50) => {
  if (!description || !description.trim()) {
    return { isValid: false, message: VALIDATION_MESSAGES.required.caseDescription };
  }
  if (description.trim().length < minLength) {
    return { isValid: false, message: VALIDATION_MESSAGES.invalid.caseDescription };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a required selection field
 * @param {string} value - The selected value
 * @param {string} fieldName - The field name for the message
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { 
      isValid: false, 
      message: VALIDATION_MESSAGES.required[fieldName] || `${fieldName} is required` 
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Get password strength indicator
 * @param {string} password - The password to check
 * @returns {{ strength: string, color: string, percentage: number }}
 */
export const getPasswordStrength = (password) => {
  if (!password) {
    return { strength: '', color: '#ddd', percentage: 0 };
  }
  
  let score = 0;
  
  // Length checks
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Character type checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&#]/.test(password)) score += 1;
  
  const percentage = Math.min((score / 6) * 100, 100);
  
  if (score <= 2) {
    return { strength: 'Weak', color: '#ef4444', percentage };
  } else if (score <= 4) {
    return { strength: 'Medium', color: '#f59e0b', percentage };
  } else {
    return { strength: 'Strong', color: '#10b981', percentage };
  }
};

export default {
  VALIDATION_PATTERNS,
  VALIDATION_MESSAGES,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhone,
  validateBarNumber,
  validateRegistrationNumber,
  validateOTP,
  validateCaseTitle,
  validateCaseDescription,
  validateRequired,
  getPasswordStrength,
};
