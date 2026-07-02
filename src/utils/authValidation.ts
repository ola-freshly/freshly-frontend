const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validateLoginForm = (email: string, password: string): string | null => {
  if (!email.trim()) return 'Email is required.';
  if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
): string | null => {
  if (!name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Full name must be at least 2 characters.';
  if (!email.trim()) return 'Email is required.';
  if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};
