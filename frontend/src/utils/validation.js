export const sanitizeName = (value) => value.replace(/[^A-Za-z ]/g, '');
export const sanitizeMobile = (value) => value.replace(/\D/g, '').slice(0, 10);
export const sanitizeSku = (value) => value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
export const sanitizePositiveNumber = (value) => {
  const cleaned = String(value).replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join('')}`;
};
export const sanitizePositiveInteger = (value) => String(value).replace(/\D/g, '');

export const validateName = (value) => {
  if (!value?.trim()) return 'Name is required';
  if (!/^[A-Za-z ]+$/.test(value.trim())) return 'Name must contain alphabets and spaces only';
  return '';
};

export const validateMobile = (value) => {
  if (!/^\d{10}$/.test(value || '')) return 'Mobile number must be exactly 10 digits';
  return '';
};

export const validateEmail = (value) => {
  if (!value?.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return '';
};

export const validatePrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 'Price must be a positive number';
  return '';
};

export const validateQuantity = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return 'Quantity must be a positive integer';
  return '';
};

export const validateSku = (value) => {
  if (!value?.trim()) return 'SKU is required';
  if (!/^[A-Za-z0-9-]+$/.test(value.trim())) return 'SKU must contain letters, numbers, and hyphens only';
  return '';
};

export const validatePassword = (value) => {
  if (!value || value.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(value)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(value)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(value)) return 'Password must contain a number';
  return '';
};

export const hasErrors = (errors) => Object.values(errors).some(Boolean);
