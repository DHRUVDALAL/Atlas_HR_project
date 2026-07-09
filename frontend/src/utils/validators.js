import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: yup.boolean(),
});

export const personalDetailsSchema = yup.object().shape({
  fullName: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  phone: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Phone must be 10 digits')
    .required('Phone number is required'),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required'),
  gender: yup
    .string()
    .oneOf(['Male', 'Female', 'Other'], 'Please select a gender')
    .required('Gender is required'),
  address: yup
    .string()
    .min(10, 'Address must be at least 10 characters')
    .required('Address is required'),
});

export const educationSchema = yup.object().shape({
  degree: yup
    .string()
    .required('Degree is required'),
  university: yup
    .string()
    .min(3, 'University name must be at least 3 characters')
    .required('University is required'),
  yearOfPassing: yup
    .number()
    .typeError('Year must be a number')
    .min(1990, 'Year must be after 1990')
    .max(new Date().getFullYear(), 'Year cannot be in the future')
    .required('Year of passing is required'),
  cgpa: yup
    .number()
    .typeError('CGPA must be a number')
    .min(0, 'CGPA cannot be negative')
    .max(10, 'CGPA cannot exceed 10')
    .required('CGPA is required'),
  certifications: yup.string(),
});

export const familySchema = yup.object().shape({
  fatherName: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required("Father's name is required"),
  motherName: yup
    .string()
    .min(2, 'Name must be at least 2 characters')
    .required("Mother's name is required"),
  maritalStatus: yup
    .string()
    .required('Marital status is required'),
  emergencyContact: yup
    .string()
    .matches(/^[0-9]{10}$/, 'Contact must be 10 digits')
    .required('Emergency contact is required'),
});

export const professionalSchema = yup.object().shape({
  currentCompany: yup.string(),
  designation: yup.string(),
  experienceYears: yup
    .number()
    .typeError('Experience must be a number')
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience seems too high')
    .required('Experience is required'),
  skills: yup
    .string()
    .min(2, 'Please enter at least one skill')
    .required('Skills are required'),
  expectedCTC: yup
    .string()
    .required('Expected CTC is required'),
  noticePeriod: yup
    .string()
    .required('Notice period is required'),
});

export const resumeSchema = yup.object().shape({
  resume: yup.mixed(),
  coverLetter: yup.string(),
});

export const interviewRoundSchema = yup.object().shape({
  candidateId: yup
    .string()
    .required('Candidate is required'),
  round: yup
    .string()
    .required('Round is required'),
  interviewer: yup
    .string()
    .min(2, 'Interviewer name is required')
    .required('Interviewer is required'),
  date: yup
    .string()
    .required('Date is required'),
  status: yup
    .string()
    .required('Status is required'),
  remarks: yup.string(),
});

export const changePasswordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'New password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    )
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('newPassword'), null], 'Passwords must match')
    .required('Please confirm your password'),
});
