import { template } from '../src';

// Define validation message templates
const validationMessages = {
  required: template<{ field: string }>("The {field} field is required."),
  minLength: template<{ field: string; min: number }>(
    "The {field} field must be at least {min} characters."
  ),
  maxLength: template<{ field: string; max: number }>(
    "The {field} field must not exceed {max} characters."
  ),
  email: template<{ field: string }>("The {field} field must be a valid email address."),
  pattern: template<{ field: string; pattern: string }>(
    "The {field} field must match the pattern: {pattern}."
  ),
  min: template<{ field: string; min: number }>(
    "The {field} field must be at least {min}."
  ),
  max: template<{ field: string; max: number }>(
    "The {field} field must not exceed {max}."
  ),
  range: template<{ field: string; min: number; max: number }>(
    "The {field} field must be between {min} and {max}."
  ),
};

console.log('=== Form Validation Examples ===\n');

// Username validation
console.log('Username Validation:');
console.log(validationMessages.required({ field: "username" }));
console.log(validationMessages.minLength({ field: "username", min: 3 }));
console.log(validationMessages.maxLength({ field: "username", max: 20 }));

console.log('\nPassword Validation:');
console.log(validationMessages.required({ field: "password" }));
console.log(validationMessages.minLength({ field: "password", min: 8 }));
console.log(validationMessages.pattern({ 
  field: "password", 
  pattern: "at least one uppercase, one lowercase, and one number" 
}));

console.log('\nEmail Validation:');
console.log(validationMessages.required({ field: "email" }));
console.log(validationMessages.email({ field: "email" }));

console.log('\nAge Validation:');
console.log(validationMessages.required({ field: "age" }));
console.log(validationMessages.min({ field: "age", min: 18 }));
console.log(validationMessages.max({ field: "age", max: 120 }));
console.log(validationMessages.range({ field: "age", min: 18, max: 120 }));

// Advanced: Multi-field validation with context
console.log('\n=== Advanced: Dynamic Validation Messages ===\n');

const complexValidation = template<{
  field: string;
  value: any;
  rule: string;
  threshold: number;
}>(
  "Validation failed for '{field}' with value '{value}': {rule} ({threshold})"
);

console.log(complexValidation({
  field: "creditScore",
  value: 550,
  rule: "must be above",
  threshold: 600,
}));

// Localized validation messages
console.log('\n=== Localized Validation Messages ===\n');

const localizedValidation = {
  en: {
    required: template<{ field: string }>("The {field} field is required."),
    tooShort: template<{ field: string; min: number }>(
      "The {field} must be at least {min} characters long."
    ),
  },
  es: {
    required: template<{ field: string }>("El campo {field} es obligatorio."),
    tooShort: template<{ field: string; min: number }>(
      "El campo {field} debe tener al menos {min} caracteres."
    ),
  },
  de: {
    required: template<{ field: string }>("Das Feld {field} ist erforderlich."),
    tooShort: template<{ field: string; min: number }>(
      "Das Feld {field} muss mindestens {min} Zeichen lang sein."
    ),
  },
};

console.log('English:', localizedValidation.en.required({ field: "email" }));
console.log('Spanish:', localizedValidation.es.required({ field: "email" }));
console.log('German:', localizedValidation.de.required({ field: "email" }));

console.log();
console.log('English:', localizedValidation.en.tooShort({ field: "password", min: 8 }));
console.log('Spanish:', localizedValidation.es.tooShort({ field: "password", min: 8 }));
console.log('German:', localizedValidation.de.tooShort({ field: "password", min: 8 }));
