export const validatePantryItem = (values: {
  name: string;
  quantity: string;
  unit: string;
  expiryDate: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (!values.quantity.trim()) errors.quantity = 'Quantity is required';
  else if (isNaN(Number(values.quantity)) || Number(values.quantity) < 0)
    errors.quantity = 'Must be a positive number';
  if (!values.unit.trim()) errors.unit = 'Unit is required';
  if (values.expiryDate.trim() && isNaN(Date.parse(values.expiryDate)))
    errors.expiryDate = 'Invalid date (YYYY-MM-DD)';
  return errors;
};
