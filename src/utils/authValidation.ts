import Validator from 'validatorjs';

export const validateLoginForm = (email: string, password: string): string | null => {
  const validation = new Validator(
    { email: email.trim(), password },
    {
      email: 'required|email',
      password: 'required|min:6',
    },
    {
      'required.email': 'Email is required.',
      'email.email': 'Please enter a valid email address.',
      'required.password': 'Password is required.',
      'min.password': 'Password must be at least 6 characters.',
    },
  );

  if (validation.fails()) {
    return validation.errors.first('email') || validation.errors.first('password') || null;
  }

  return null;
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
): string | null => {
  const validation = new Validator(
    { name: name.trim(), email: email.trim(), password },
    {
      name: 'required|min:2',
      email: 'required|email',
      password: 'required|min:6',
    },
    {
      'required.name': 'Full name is required.',
      'min.name': 'Full name must be at least 2 characters.',
      'required.email': 'Email is required.',
      'email.email': 'Please enter a valid email address.',
      'required.password': 'Password is required.',
      'min.password': 'Password must be at least 6 characters.',
    },
  );

  if (validation.fails()) {
    return (
      validation.errors.first('name') ||
      validation.errors.first('email') ||
      validation.errors.first('password') ||
      null
    );
  }

  return null;
};
