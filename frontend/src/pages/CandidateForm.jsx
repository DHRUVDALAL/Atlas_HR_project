import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Button, Typography, Container, Paper, TextField, Grid,
  CircularProgress, Alert, RadioGroup, FormControlLabel, Radio,
  FormControl, Checkbox, Divider, IconButton, Card, CardContent,
  MenuItem, Select, InputLabel, Table, TableBody, TableCell,
  TableContainer, TableRow
} from '@mui/material';

// Material Icons
import Check from '@mui/icons-material/Check';
import CloudDone from '@mui/icons-material/CloudDone';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import CloudUpload from '@mui/icons-material/CloudUpload';
import Warning from '@mui/icons-material/Warning';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FilePresent from '@mui/icons-material/FilePresent';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Person from '@mui/icons-material/Person';
import Work from '@mui/icons-material/Work';
import School from '@mui/icons-material/School';
import Assignment from '@mui/icons-material/Assignment';
import Info from '@mui/icons-material/Info';

// Shared Form Components
import { FormTextField, FormDatePicker, FormSelect } from '../components/forms';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { useSearchParams, useNavigate } from 'react-router-dom';
import { submitApplication, getApplicantById, updateApplicant } from '../api/applicantService';

const DRAFT_KEY = 'candidate_form_draft';

// Read the locally-persisted draft (plain data only — never the signature File).
const loadDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const steps = [
  'Personal', 
  'Professional', 
  'Experience', 
  'Education', 
  'Perspective', 
  'Scenarios', 
  'Essay', 
  'Declaration'
];

const perspectiveQuestions = [
  "I am comfortable presenting my point of view to people senior to me.",
  "I can usually tell when someone around me is having a difficult day, even if they haven’t said anything.",
  "When something goes wrong, my first instinct is to look for what I can fix rather than who is responsible.",
  "I am at ease making decisions when the available information is incomplete.",
  "I naturally adjust the way I speak depending on whether I’m talking to a peer, a client, or a junior colleague.",
  "I often volunteer for tasks that are outside my formal job description.",
  "If I don’t know something, I’d rather say so than risk giving an incorrect answer.",
  "During disagreements, I try to fully understand the other person’s reasoning before responding.",
  "I find it energising to receive constructive criticism because it helps me improve.",
  "I trust my ability to quickly get up to speed in unfamiliar areas.",
  "I genuinely enjoy understanding what drives the people I work with.",
  "When I face a setback, I tend to recover quickly and look for an alternative path.",
  "I am comfortable leading a group even when I am not the most experienced person in the room.",
  "I listen without interrupting, even when I strongly disagree with what is being said.",
  "I prefer to solve problems on my own before seeking help.",
  "I can work productively even when clear instructions or guidelines are not available.",
  "In a team conflict, I make it a point to hear everyone’s side before forming my opinion.",
  "I actively seek feedback rather than waiting for it to come to me."
];

const situationalQuestions = [
  {
    q: "Your team is behind on a critical deadline. A colleague responsible for a key deliverable has been struggling. When you ask about progress, they seem stressed and defensive.",
    options: [
      { key: "A", text: "Escalate the delay to your manager immediately to protect the timeline." },
      { key: "B", text: "Sit down privately with the colleague, acknowledge the pressure, and ask if there’s anything blocking them that you can help with." },
      { key: "C", text: "Take over their work yourself to make sure the deadline is met." },
      { key: "D", text: "Send a detailed status email to the team lead documenting the delay." }
    ]
  },
  {
    q: "During a client presentation, the client challenges your recommendation sharply and in front of the entire room. You believe the criticism is only partially valid.",
    options: [
      { key: "A", text: "Stay composed, acknowledge the valid parts of their concern, and suggest reviewing the specific points together after the meeting." },
      { key: "B", text: "Defend your recommendation immediately with supporting data." },
      { key: "C", text: "Apologise and offer to rework the entire recommendation." },
      { key: "D", text: "Stay quiet during the meeting and raise it with your manager later." }
    ]
  },
  {
    q: "You have been assigned a project in a domain you have little prior experience in. It starts next week and expectations are high.",
    options: [
      { key: "A", text: "Tell your manager upfront that you may not be the right person for this." },
      { key: "B", text: "Dive into research, map out your knowledge gaps, and set up conversations with people who know the domain." },
      { key: "C", text: "Accept confidently and figure things out as they come, without asking for help." },
      { key: "D", text: "Ask the project sponsor for a detailed brief and propose a short ramp-up plan before committing to deliverables." }
    ]
  },
  {
    q: "A junior colleague tells you privately that they feel ignored during team discussions. They are visibly upset but ask you not to tell anyone.",
    options: [
      { key: "A", text: "Respect their wish completely and take no further action." },
      { key: "B", text: "Listen carefully, reassure them, and gently encourage them to bring it up with the team lead — offering to go with them if it helps." },
      { key: "C", text: "Report the matter to HR immediately since it could indicate a broader culture issue." },
      { key: "D", text: "Speak to the other team members yourself about being more inclusive, without naming the person." }
    ]
  },
  {
    q: "You strongly believe a decision made by leadership will cause problems down the line, but the rest of the team has accepted it without objection.",
    options: [
      { key: "A", text: "Go along with the decision — leadership probably has information you don’t." },
      { key: "B", text: "Raise your concern constructively in the next appropriate forum, presenting your reasoning clearly while remaining open to being wrong." },
      { key: "C", text: "Discuss your concerns informally with a few trusted colleagues to test whether they share your view." },
      { key: "D", text: "Document your objection in writing so that your position is on record if things go wrong." }
    ]
  }
];

const openEndedQuestions = [
  "Tell us about a time someone gave you feedback that was hard to hear. How did you respond, and what did you take away from it?",
  "What does “taking responsibility” look like in practice? Share an example from your experience.",
  "Describe a moment when you went out of your way to help a colleague without being asked. What prompted you to act?",
  "Think of a time when your view was clearly in the minority within a group. What did you do?",
  "When you encounter someone whose working style is very different from yours, how do you typically handle it?"
];

// Validation schemas for React Hook Form steps
const personalSchema = yup.object({
  first_name: yup.string().required('First Name is required'),
  middle_name: yup.string().nullable(),
  last_name: yup.string().required('Last Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required').matches(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  alternate_phone: yup.string().nullable().test('10-digits', 'Phone number must be exactly 10 digits', val => !val || /^\d{10}$/.test(val)),
  gender: yup.string().oneOf(['MALE', 'FEMALE', 'OTHER'], 'Select a gender').required('Gender is required'),
  date_of_birth: yup.string().required('Date of Birth is required').test('past-date', 'DOB cannot be a future date', val => !val || new Date(val) <= new Date()),
  current_address: yup.string().required('Current Address is required').min(5, 'Address must be at least 5 characters'),
  permanent_address: yup.string().nullable(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  country: yup.string().required('Country is required'),
  pincode: yup.string().required('Pincode is required').min(4, 'Pincode is too short').max(10, 'Pincode is too long'),
  position_applied_for: yup.string().required('Position Applied For is required'),
  referred_by: yup.string().nullable(),
  reference_number: yup.string().nullable()
}).required();

const professionalSchema = yup.object({
  total_experience: yup.number().typeError('Must be a number').min(0, 'Experience cannot be negative').required('Total experience is required'),
  relevant_experience: yup.number().typeError('Must be a number').min(0, 'Experience cannot be negative').required('Relevant experience is required'),
  current_company: yup.string().nullable(),
  current_designation: yup.string().nullable(),
  current_ctc: yup.number().typeError('Must be a number').nullable().min(0, 'CTC cannot be negative'),
  expected_ctc: yup.number().typeError('Must be a number').nullable().min(0, 'Expected CTC cannot be negative'),
  notice_period: yup.string().nullable(),
  joining_availability: yup.string().nullable(),
  preferred_location: yup.string().nullable(),
  employment_type: yup.string().oneOf(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'], 'Select employment type').required('Employment Type is required')
}).required();

// Helper Component for Section Cards
const FormSectionCard = ({ title, description, children, icon: Icon }) => (
  <Card variant="outlined" sx={{ 
    mb: 4, 
    borderRadius: '16px', 
    borderColor: 'divider',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
    }
  }}>
    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
        {Icon && (
          <Box sx={{ 
            p: 1.2, 
            borderRadius: '10px', 
            bgcolor: 'rgba(79, 70, 229, 0.08)', 
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        )}
        <Box>
          <Typography variant="subtitle1" fontWeight="700" color="text.primary" sx={{ lineHeight: 1.3, mb: 0.5 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {description}
            </Typography>
          )}
        </Box>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {children}
    </CardContent>
  </Card>
);

const CandidateForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  // Restore the locally-persisted draft once, synchronously, so initial state is
  // seeded directly (avoids a first-render flash / overwrite race).
  const initialDraftRef = useRef(null);
  if (initialDraftRef.current === null) {
    initialDraftRef.current = loadDraft();
  }
  const draft = initialDraftRef.current;

  const [activeStep, setActiveStep] = useState(() => (isEditMode ? 0 : draft.activeStep || 0));
  const [maxStepReached, setMaxStepReached] = useState(() => (isEditMode ? 0 : Math.max(draft.maxStepReached || 0, draft.activeStep || 0)));
  const [appNumber, setAppNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Dynamic lists states (rehydrated from the local draft)
  const [employmentHistory, setEmploymentHistory] = useState(() => (isEditMode ? [] : draft.employmentHistory || []));
  const [educationList, setEducationList] = useState(() => (isEditMode ? [] : draft.educationList || []));
  const [perspectiveRatings, setPerspectiveRatings] = useState(() => (isEditMode ? {} : draft.perspectiveRatings || {}));
  const [situationalResponses, setSituationalResponses] = useState(() => (isEditMode ? {} : draft.situationalResponses || {}));
  const [writtenResponses, setWrittenResponses] = useState(() => (isEditMode ? {} : draft.writtenResponses || {}));

  // Signature is a File held in memory only — it cannot be serialized to
  // localStorage, so on a refresh it is lost and the picker is shown again.
  const [signatureFile, setSignatureFile] = useState(null);
  const [existingSignatureName, setExistingSignatureName] = useState('');

  // Local Form Config for RHF
  const currentValidationSchema = activeStep === 0 ? personalSchema : activeStep === 1 ? professionalSchema : null;

  const {
    register,
    control,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: currentValidationSchema ? yupResolver(currentValidationSchema) : undefined,
    mode: 'onChange',
    defaultValues: isEditMode ? {} : draft.formValues || {},
  });

  // Merge-write a slice of the draft to localStorage. Each writer only touches its
  // own keys, so form-value and component-state writers never clobber each other.
  const writeDraft = (patch) => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...patch }));
    } catch {
      // Ignore quota / serialization errors — persistence is best-effort.
    }
  };

  // Load candidate details when in edit mode
  useEffect(() => {
    if (!editId) return;

    const loadCandidateData = async () => {
      try {
        setIsLoadingEdit(true);
        const res = await getApplicantById(editId);
        if (res && res.success && res.data) {
          const c = res.data;

          // Determine if editing is frozen
          const PREARRIVAL = ["DRAFT", "SUBMITTED", "Submitted — awaiting reception"];
          if (!PREARRIVAL.includes(c.status)) {
            setIsReadOnly(true);
            setApiError("This application is past the pre-arrival stage and is read-only.");
          }

          // Populate RHF values
          const fields = [
            'first_name', 'middle_name', 'last_name', 'email', 'phone', 'alternate_phone',
            'gender', 'date_of_birth', 'current_address', 'permanent_address', 'city', 'state',
            'country', 'pincode', 'position_applied_for', 'referred_by', 'reference_number',
            'total_experience', 'relevant_experience', 'current_company', 'current_designation',
            'current_ctc', 'expected_ctc', 'notice_period', 'joining_availability', 'preferred_location',
            'employment_type'
          ];

          // Map professional details flattening
          const prefValues = {
            ...c,
            ...(c.professional_details || {})
          };

          fields.forEach(field => {
            if (prefValues[field] !== undefined && prefValues[field] !== null) {
              setValue(field, prefValues[field]);
            }
          });

          // Set other lists/assessments
          setEmploymentHistory(c.employment_history || []);
          setEducationList(c.education || []);

          // Parse perspective ratings
          const pRatings = {};
          (c.personality_assessment || []).forEach(pa => {
            pRatings[pa.question_number - 1] = pa.rating;
          });
          setPerspectiveRatings(pRatings);

          // Parse situational responses
          const sResponses = {};
          (c.situational_responses || []).forEach(sr => {
            sResponses[sr.question_number - 1] = sr.selected_option;
          });
          setSituationalResponses(sResponses);

          // Parse written responses
          const wResponses = {};
          (c.written_responses || []).forEach(wr => {
            wResponses[wr.question_number - 1] = wr.answer_text;
          });
          setWrittenResponses(wResponses);

          // Set max step reached to review page (7)
          setMaxStepReached(7);

          // Set existing signature file details if uploaded
          const sigDoc = (c.documents || []).find(doc => doc.document_type === 'SIGNATURE');
          if (sigDoc) {
            setExistingSignatureName(sigDoc.file_name || 'signature.pdf');
          }
        }
      } catch (err) {
        console.error("Error loading candidate for editing:", err);
        setApiError("Failed to load candidate details from server.");
      } finally {
        setIsLoadingEdit(false);
      }
    };

    loadCandidateData();
  }, [editId, setValue]);

  // Persist RHF field values on every change.
  useEffect(() => {
    if (isEditMode) return;
    const subscription = watch((value) => writeDraft({ formValues: value }));
    return () => subscription.unsubscribe();
  }, [watch, isEditMode]);

  // Persist the non-file component state (dynamic lists + assessment answers + step).
  useEffect(() => {
    if (isEditMode) return;
    writeDraft({
      employmentHistory,
      educationList,
      perspectiveRatings,
      situationalResponses,
      writtenResponses,
      activeStep,
      maxStepReached,
    });
  }, [employmentHistory, educationList, perspectiveRatings, situationalResponses, writtenResponses, activeStep, maxStepReached, isEditMode]);

  // Initial Form Data mapping helper
  const getPersonalPayload = (values) => ({
    first_name: values.first_name,
    middle_name: values.middle_name || null,
    last_name: values.last_name,
    email: values.email,
    phone: values.phone,
    alternate_phone: values.alternate_phone || null,
    gender: values.gender,
    date_of_birth: values.date_of_birth,
    current_address: values.current_address,
    permanent_address: values.permanent_address || values.current_address,
    city: values.city,
    state: values.state,
    country: values.country,
    pincode: values.pincode,
    position_applied_for: values.position_applied_for || null,
    referred_by: values.referred_by || null,
    reference_number: values.reference_number || null
  });

  const getProfessionalPayload = (values) => ({
    current_company: values.current_company || null,
    current_designation: values.current_designation || null,
    total_experience: parseFloat(values.total_experience),
    relevant_experience: parseFloat(values.relevant_experience),
    current_ctc: values.current_ctc ? parseFloat(values.current_ctc) : null,
    expected_ctc: values.expected_ctc ? parseFloat(values.expected_ctc) : null,
    notice_period: values.notice_period || null,
    joining_availability: values.joining_availability || null,
    preferred_location: values.preferred_location || null,
    employment_type: values.employment_type
  });

  // Dynamic Array Adders/Deleters
  const addEmploymentRow = () => {
    setEmploymentHistory([...employmentHistory, {
      company_name: '',
      designation: '',
      start_date: '',
      end_date: '',
      responsibilities: '',
      reason_for_leaving: ''
    }]);
  };

  const removeEmploymentRow = (index) => {
    const updated = [...employmentHistory];
    updated.splice(index, 1);
    setEmploymentHistory(updated);
  };

  const handleEmploymentChange = (index, field, value) => {
    const updated = [...employmentHistory];
    updated[index][field] = value;
    setEmploymentHistory(updated);
  };

  const addEducationRow = () => {
    setEducationList([...educationList, {
      qualification: '',
      institution_name: '',
      university: '',
      passing_year: new Date().getFullYear(),
      percentage: '',
      grade: '',
      specialization: ''
    }]);
  };

  const removeEducationRow = (index) => {
    const updated = [...educationList];
    updated.splice(index, 1);
    setEducationList(updated);
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...educationList];
    if (field === 'passing_year' || field === 'percentage') {
      updated[index][field] = value ? (field === 'passing_year' ? parseInt(value) : parseFloat(value)) : '';
    } else {
      updated[index][field] = value;
    }
    setEducationList(updated);
  };

  // Signature selection handler — validates locally and keeps the File in memory.
  const handleSignatureUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setApiError('Only PDF files are accepted for signature.');
      setSignatureFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Signature file size exceeds the maximum limit of 5 MB.');
      setSignatureFile(null);
      return;
    }

    setSignatureFile(file);
    setApiError(null);
  };

  // Assemble the COMPLETE backend payload from every step's client-side state.
  const buildPayload = (values) => ({
    personal_details: getPersonalPayload(values),
    professional_details: getProfessionalPayload(values),
    employment_history: employmentHistory.map(item => ({
      company_name: item.company_name,
      designation: item.designation,
      start_date: item.start_date,
      end_date: item.end_date || null,
      responsibilities: item.responsibilities || null,
      reason_for_leaving: item.reason_for_leaving || null
    })),
    education: educationList.map(item => ({
      qualification: item.qualification,
      institution_name: item.institution_name,
      university: item.university || null,
      passing_year: parseInt(item.passing_year),
      percentage: item.percentage ? parseFloat(item.percentage) : null,
      grade: item.grade || null,
      specialization: item.specialization || null
    })),
    personality_assessment: Object.keys(perspectiveRatings).map(key => ({
      question_number: parseInt(key) + 1,
      rating: parseInt(perspectiveRatings[key])
    })),
    situational_responses: Object.keys(situationalResponses).map(key => ({
      question_number: parseInt(key) + 1,
      selected_option: situationalResponses[key]
    })),
    written_responses: Object.keys(writtenResponses).map(key => ({
      question_number: parseInt(key) + 1,
      answer_text: writtenResponses[key]
    })),
    declaration: {
      declaration_accepted: !!values.declaration_accepted,
      consent_accepted: !!values.consent_accepted,
      signed_date: new Date().toISOString().split('T')[0]
    }
  });

  // Turn any backend error shape into a readable message.
  const extractErrorMessage = (err) => {
    const res = err.response;
    if (!res) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (res.status === 413) {
      return 'The signature file is too large (maximum 5 MB).';
    }
    const detail = res.data && res.data.detail;
    if (detail) {
      // FastAPI schema validation (422) → array of { loc, msg }
      if (Array.isArray(detail)) {
        return detail
          .map(d => {
            const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : '';
            return field ? `${field}: ${d.msg}` : d.msg;
          })
          .join('; ');
      }
      // Business error (400) → { message, errors: [...] }
      if (typeof detail === 'object') {
        const base = detail.message || 'Submission failed.';
        const errs = Array.isArray(detail.errors) ? detail.errors.join(', ') : '';
        return errs ? `${base}: ${errs}` : base;
      }
      if (typeof detail === 'string') {
        return detail;
      }
    }
    return (res.data && res.data.message) ||
      'An error occurred while submitting your application. Please review your inputs and try again.';
  };

  // Client-side validation logic
  const validateStep = (values) => {
    if (activeStep === 2) {
      const bad = employmentHistory.some(item => !item.company_name || !item.designation || !item.start_date);
      if (bad) return 'Please fill out all required fields for each employment record (Company Name, Designation, Start Date).';
    }
    if (activeStep === 3) {
      if (educationList.length === 0) return 'Please add at least one Educational Qualification.';
      const bad = educationList.some(item => !item.qualification || !item.institution_name || !item.passing_year);
      if (bad) return 'Please fill out all required fields for each educational record (Qualification, Institution, Passing Year).';
    }
    if (activeStep === 4 && Object.keys(perspectiveRatings).length < perspectiveQuestions.length) {
      return `Please rate all ${perspectiveQuestions.length} perspective statements.`;
    }
    if (activeStep === 5 && Object.keys(situationalResponses).length < situationalQuestions.length) {
      return 'Please answer all 5 situational scenarios.';
    }
    if (activeStep === 6) {
      const bad = openEndedQuestions.some((_, idx) => (writtenResponses[idx] || '').trim().length < 20);
      if (bad) return 'All descriptive answers must be at least 20 characters long.';
    }
    if (activeStep === 7) {
      if (!values.declaration_accepted || !values.consent_accepted) {
        return 'You must accept both the declaration and consent terms.';
      }
      if (!signatureFile && !existingSignatureName) {
        return 'You must upload your signature PDF before submitting.';
      }
    }
    return null;
  };

  // Custom step click navigation
  const handleStepClick = async (targetStep) => {
    if (targetStep === activeStep) return;
    
    // Allow jumping backward freely
    if (targetStep < activeStep) {
      setApiError(null);
      setActiveStep(targetStep);
      return;
    }

    // Allow jumping forward only if target step is within max reached
    if (targetStep > activeStep) {
      if (targetStep > maxStepReached && activeStep !== 7) return;

      // Validate the current step before allowing a jump forward
      if (currentValidationSchema) {
        const isStepValid = await trigger();
        if (!isStepValid) return;
      }
      const values = getValues();
      const stepError = validateStep(values);
      if (stepError) {
        setApiError(stepError);
        return;
      }

      setApiError(null);
      setActiveStep(targetStep);
    }
  };

  // Advance through steps entirely in the browser; only the final step submits.
  const handleNext = async () => {
    setApiError(null);

    // Schema validation for the RHF-backed steps (0 and 1).
    if (currentValidationSchema) {
      const isStepValid = await trigger();
      if (!isStepValid) return;
    }

    const values = getValues();
    const stepError = validateStep(values);
    if (stepError) {
      setApiError(stepError);
      return;
    }

    // Non-final steps just move forward — nothing is sent to the server.
    if (activeStep < steps.length - 1) {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      setMaxStepReached((prev) => Math.max(prev, nextStep));
      return;
    }

    // Final step — assemble the whole application and submit atomically.
    setIsSaving(true);
    try {
      const payload = buildPayload(values);
      if (isEditMode) {
        await updateApplicant(editId, payload);
        navigate('/candidates');
        return;
      }
      const res = await submitApplication(payload, signatureFile);
      const appNo = (res && res.data && res.data.application_number) || '';
      setAppNumber(appNo);
      localStorage.removeItem(DRAFT_KEY);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setApiError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setApiError(null);
    }
  };

  // Helper for rendering custom styled helper texts
  const renderHelperText = (error) => {
    if (!error) return null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <Typography variant="caption" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600 }}>
          <span>⚠</span> {error.message}
        </Typography>
      </Box>
    );
  };

  if (showSuccess) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
        <Paper elevation={4} sx={{ p: 6, borderRadius: '24px', textAlign: 'center', width: '100%', border: '1px solid rgba(0,0,0,0.05)' }}>
          <Box sx={{ width: 80, height: 80, bgcolor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Check sx={{ fontSize: 44, color: '#10B981' }} />
          </Box>
          <Typography variant="h4" fontWeight="800" color="#1e3a8a" gutterBottom>Application Submitted!</Typography>
          <Typography color="text.secondary" mb={4} lineHeight={1.6}>
            Your application has been received successfully. Please write down your application tracking number:
          </Typography>
          <Box sx={{ bgcolor: '#F3F4F6', p: 2.5, borderRadius: '12px', mb: 4, border: '1px dashed #D1D5DB' }}>
            <Typography variant="h5" fontWeight="800" color="#1e3a8a" sx={{ letterSpacing: '0.5px' }}>
              {appNumber}
            </Typography>
          </Box>
          <Typography color="text.secondary" mb={4} variant="body2">
            Thank you for applying to Abhiyanta India Solutions Pvt. Ltd. Our recruitment panel will review your profile shortly.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.href='/'}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: '8px',
              backgroundColor: '#1e3a8a',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                backgroundColor: '#172554'
              }
            }}
          >
            Return to Home
          </Button>
        </Paper>
      </Container>
    );
  }

  // Pre-calculate step validity for the checklist
  const values = getValues();
  const personalValid = personalSchema.isValidSync(values);
  const professionalValid = professionalSchema.isValidSync(values);
  const historyValid = employmentHistory.length === 0 || !employmentHistory.some(item => !item.company_name || !item.designation || !item.start_date);
  const educationValid = educationList.length > 0 && !educationList.some(item => !item.qualification || !item.institution_name || !item.passing_year);
  const perspectiveValid = Object.keys(perspectiveRatings).length === perspectiveQuestions.length;
  const scenariosValid = Object.keys(situationalResponses).length === situationalQuestions.length;
  const descriptiveValid = writtenResponses && !openEndedQuestions.some((_, idx) => (writtenResponses[idx] || '').trim().length < 20);

  const checklistStatuses = [
    { label: 'Personal Information', isValid: personalValid, index: 0 },
    { label: 'Professional Details', isValid: professionalValid, index: 1 },
    { label: 'Employment History', isValid: historyValid, index: 2 },
    { label: 'Educational Qualifications', isValid: educationValid, index: 3 },
    { label: 'Perspective Statements', isValid: perspectiveValid, index: 4 },
    { label: 'Workplace Scenarios', isValid: scenariosValid, index: 5 },
    { label: 'Descriptive Essay Answers', isValid: descriptiveValid, index: 6 }
  ];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Personal Information</Typography>
                <Typography variant="body2" color="text.secondary">Please provide your details exactly as per official documents.</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 1 of 8
              </Box>
            </Box>

            {/* Sub-section 1: Job Information */}
            <FormSectionCard title="Job Information" description="Details of the position you are applying for." icon={Work}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="position_applied_for" control={control} label="Position Applied For" required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth disabled label="Date" InputLabelProps={{ shrink: true }} value={new Date().toLocaleDateString()} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="referred_by" control={control} label="Referred By" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="reference_number" control={control} label="Reference Number" />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 2: Candidate Name */}
            <FormSectionCard title="Candidate Name" description="Your name details as listed in records." icon={Person}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <FormTextField name="first_name" control={control} label="First Name" required />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormTextField name="middle_name" control={control} label="Middle Name" />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormTextField name="last_name" control={control} label="Last Name" required />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 3: Personal Details */}
            <FormSectionCard title="Personal Details" description="Demographics and identity details." icon={Info}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormDatePicker name="date_of_birth" control={control} label="Date of Birth" required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelect name="gender" control={control} label="Gender" required options={[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }]} />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 4: Contact Information */}
            <FormSectionCard title="Contact Information" description="We will use these details for communication regarding the recruitment process." icon={Person}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="phone" control={control} label="Mobile Number" required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="alternate_phone" control={control} label="Alternate Contact / Landline" />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField name="email" control={control} label="Email Address" required />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 5: Address */}
            <FormSectionCard title="Address" description="Please fill in current and permanent address details." icon={Person}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormTextField name="current_address" control={control} label="Current Address" required multiline rows={2} />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField name="permanent_address" control={control} label="Permanent Address" placeholder="Leave empty if same as current address" multiline rows={2} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormTextField name="city" control={control} label="City" required />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormTextField name="state" control={control} label="State" required />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormTextField name="country" control={control} label="Country" required />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormTextField name="pincode" control={control} label="PIN Code" required />
                </Grid>
              </Grid>
            </FormSectionCard>
          </Box>
        );
      case 1:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Professional Info</Typography>
                <Typography variant="body2" color="text.secondary">Enter details regarding your career, current metrics, and preferences.</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 2 of 8
              </Box>
            </Box>

            {/* Sub-section 1: Experience Overview */}
            <FormSectionCard title="Experience Summary" description="Overview of your years in industry." icon={Work}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="total_experience" control={control} type="number" label="Total Experience (Years)" required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="relevant_experience" control={control} type="number" label="Relevant Experience (Years)" required />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 2: Current Job Details */}
            <FormSectionCard title="Current Employment" description="Details of your current or most recent job position." icon={Work}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="current_company" control={control} label="Current Company" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="current_designation" control={control} label="Current Designation" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="current_ctc" control={control} type="number" label="Current CTC (Annual LPA)" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormSelect name="employment_type" control={control} label="Employment Type" required options={[{ value: 'FULL_TIME', label: 'Full Time' }, { value: 'PART_TIME', label: 'Part Time' }, { value: 'CONTRACT', label: 'Contract' }, { value: 'INTERN', label: 'Intern' }]} />
                </Grid>
              </Grid>
            </FormSectionCard>

            {/* Sub-section 3: Preferences & Notice */}
            <FormSectionCard title="Preferences & Availability" description="Notice duration and career expectations." icon={Work}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="expected_ctc" control={control} type="number" label="Expected CTC (Annual LPA)" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="notice_period" control={control} label="Notice Period" placeholder="e.g. 30 days, Immediate" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="joining_availability" control={control} label="Earliest Joining / Availability" placeholder="e.g. Immediate, Within 15 days" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormTextField name="preferred_location" control={control} label="Preferred Work Location" />
                </Grid>
              </Grid>
            </FormSectionCard>
          </Box>
        );
      case 2:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Professional Experience</Typography>
                <Typography variant="body2" color="text.secondary">Please provide details of your work history (list from most recent first).</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />} 
                  onClick={addEmploymentRow}
                  sx={{ borderRadius: '8px', textTransform: 'none', px: 2, py: 0.8 }}
                >
                  Add Job Record
                </Button>
                <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                  Step 3 of 8
                </Box>
              </Box>
            </Box>

            {employmentHistory.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.01)', mb: 4 }}>
                <Work sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
                <Typography color="text.secondary" variant="body2" fontWeight="600">No work experience added.</Typography>
                <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 0.5 }}>Optional if you are a Fresher. Click "Add Job Record" to add experience.</Typography>
              </Box>
            ) : (
              employmentHistory.map((item, idx) => (
                <Card key={idx} variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                        Job Position #{idx + 1}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeEmploymentRow(idx)}>
                        <Delete />
                      </IconButton>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField required fullWidth label="Company Name" value={item.company_name} onChange={(e) => handleEmploymentChange(idx, 'company_name', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField required fullWidth label="Designation" value={item.designation} onChange={(e) => handleEmploymentChange(idx, 'designation', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Start Date"
                            value={item.start_date ? dayjs(item.start_date) : null}
                            onChange={(date) => handleEmploymentChange(idx, 'start_date', date ? date.format('YYYY-MM-DD') : '')}
                            slotProps={{
                              textField: {
                                required: true,
                                fullWidth: true,
                                variant: 'outlined',
                                size: 'medium'
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="End Date"
                            value={item.end_date ? dayjs(item.end_date) : null}
                            onChange={(date) => handleEmploymentChange(idx, 'end_date', date ? date.format('YYYY-MM-DD') : '')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                variant: 'outlined',
                                size: 'medium'
                              }
                            }}
                          />
                        </LocalizationProvider>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Responsibilities" placeholder="Brief outline of duties performed..." multiline rows={3} value={item.responsibilities} onChange={(e) => handleEmploymentChange(idx, 'responsibilities', e.target.value)} />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField fullWidth label="Reason for Leaving" value={item.reason_for_leaving} onChange={(e) => handleEmploymentChange(idx, 'reason_for_leaving', e.target.value)} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        );
      case 3:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Educational Qualifications</Typography>
                <Typography variant="body2" color="text.secondary">Please list your qualifications (at least one qualification is required).</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Add />} 
                  onClick={addEducationRow}
                  sx={{ borderRadius: '8px', textTransform: 'none', px: 2, py: 0.8 }}
                >
                  Add Qualification
                </Button>
                <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                  Step 4 of 8
                </Box>
              </Box>
            </Box>

            {educationList.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center', border: '1px dashed #D1D5DB', borderRadius: '16px', bgcolor: 'rgba(0,0,0,0.01)', mb: 4 }}>
                <School sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.4, mb: 1.5 }} />
                <Typography color="text.secondary" variant="body2" fontWeight="600">No educational credentials added.</Typography>
                <Typography color="text.secondary" variant="caption" sx={{ display: 'block', mt: 0.5 }}>At least one record is required to submit. Click "Add Qualification" to begin.</Typography>
              </Box>
            ) : (
              educationList.map((item, idx) => (
                <Card key={idx} variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="subtitle1" fontWeight="700" color="primary.main">
                        Qualification #{idx + 1}
                      </Typography>
                      <IconButton size="small" color="error" onClick={() => removeEducationRow(idx)}>
                        <Delete />
                      </IconButton>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <TextField required fullWidth label="Qualification / Degree" placeholder="e.g. B.Tech, HSC, SSC" value={item.qualification} onChange={(e) => handleEducationChange(idx, 'qualification', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField required fullWidth label="School/Institution Name" value={item.institution_name} onChange={(e) => handleEducationChange(idx, 'institution_name', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField fullWidth label="Board / University" value={item.university} onChange={(e) => handleEducationChange(idx, 'university', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField required fullWidth type="number" label="Passing Year" value={item.passing_year} onChange={(e) => handleEducationChange(idx, 'passing_year', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField fullWidth type="number" step="0.01" label="Percentage / CGPA" value={item.percentage} onChange={(e) => handleEducationChange(idx, 'percentage', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Grade / Class" placeholder="e.g. Distinction, A" value={item.grade} onChange={(e) => handleEducationChange(idx, 'grade', e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField fullWidth label="Specialization" placeholder="e.g. Computer Science" value={item.specialization} onChange={(e) => handleEducationChange(idx, 'specialization', e.target.value)} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        );
      case 4:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Your Perspective</Typography>
                <Typography variant="body2" color="text.secondary">We want to understand your mindset. Rate how statements align with you (1 = Disagree, 5 = Agree).</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 5 of 8
              </Box>
            </Box>

            {/* Subsection 1 */}
            <FormSectionCard title="Interpersonal & Communication Dynamics" description="Statements 1 to 6 covering empathy, communication, and client focus." icon={Assignment}>
              {perspectiveQuestions.slice(0, 6).map((q, rawIdx) => {
                const idx = rawIdx;
                return (
                  <Box key={idx} sx={{ 
                    mb: 3.5, 
                    p: 2.5, 
                    bgcolor: '#F9FAFB', 
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <Typography variant="body2" fontWeight="700" color="text.primary" mb={1.5}>
                      {idx + 1}. {q}
                    </Typography>
                    <RadioGroup 
                      row 
                      value={perspectiveRatings[idx] || ''} 
                      onChange={(e) => setPerspectiveRatings({ ...perspectiveRatings, [idx]: e.target.value })}
                      sx={{ gap: { xs: 1.5, sm: 3 } }}
                    >
                      <FormControlLabel value="1" control={<Radio color="primary" />} label={<Typography variant="caption">1 (Not like me)</Typography>} />
                      <FormControlLabel value="2" control={<Radio color="primary" />} label={<Typography variant="caption">2</Typography>} />
                      <FormControlLabel value="3" control={<Radio color="primary" />} label={<Typography variant="caption">3</Typography>} />
                      <FormControlLabel value="4" control={<Radio color="primary" />} label={<Typography variant="caption">4</Typography>} />
                      <FormControlLabel value="5" control={<Radio color="primary" />} label={<Typography variant="caption">5 (Like me)</Typography>} />
                    </RadioGroup>
                  </Box>
                );
              })}
            </FormSectionCard>

            {/* Subsection 2 */}
            <FormSectionCard title="Professional Drive & Learning Adaptability" description="Statements 7 to 12 covering learning curve, motivation, and growth mindset." icon={Assignment}>
              {perspectiveQuestions.slice(6, 12).map((q, rawIdx) => {
                const idx = rawIdx + 6;
                return (
                  <Box key={idx} sx={{ 
                    mb: 3.5, 
                    p: 2.5, 
                    bgcolor: '#F9FAFB', 
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <Typography variant="body2" fontWeight="700" color="text.primary" mb={1.5}>
                      {idx + 1}. {q}
                    </Typography>
                    <RadioGroup 
                      row 
                      value={perspectiveRatings[idx] || ''} 
                      onChange={(e) => setPerspectiveRatings({ ...perspectiveRatings, [idx]: e.target.value })}
                      sx={{ gap: { xs: 1.5, sm: 3 } }}
                    >
                      <FormControlLabel value="1" control={<Radio color="primary" />} label={<Typography variant="caption">1 (Not like me)</Typography>} />
                      <FormControlLabel value="2" control={<Radio color="primary" />} label={<Typography variant="caption">2</Typography>} />
                      <FormControlLabel value="3" control={<Radio color="primary" />} label={<Typography variant="caption">3</Typography>} />
                      <FormControlLabel value="4" control={<Radio color="primary" />} label={<Typography variant="caption">4</Typography>} />
                      <FormControlLabel value="5" control={<Radio color="primary" />} label={<Typography variant="caption">5 (Like me)</Typography>} />
                    </RadioGroup>
                  </Box>
                );
              })}
            </FormSectionCard>

            {/* Subsection 3 */}
            <FormSectionCard title="Leadership, Resilience & Team Collaboration" description="Statements 13 to 18 covering conflict resolution, drive, and leadership dynamics." icon={Assignment}>
              {perspectiveQuestions.slice(12, 18).map((q, rawIdx) => {
                const idx = rawIdx + 12;
                return (
                  <Box key={idx} sx={{ 
                    mb: 3.5, 
                    p: 2.5, 
                    bgcolor: '#F9FAFB', 
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <Typography variant="body2" fontWeight="700" color="text.primary" mb={1.5}>
                      {idx + 1}. {q}
                    </Typography>
                    <RadioGroup 
                      row 
                      value={perspectiveRatings[idx] || ''} 
                      onChange={(e) => setPerspectiveRatings({ ...perspectiveRatings, [idx]: e.target.value })}
                      sx={{ gap: { xs: 1.5, sm: 3 } }}
                    >
                      <FormControlLabel value="1" control={<Radio color="primary" />} label={<Typography variant="caption">1 (Not like me)</Typography>} />
                      <FormControlLabel value="2" control={<Radio color="primary" />} label={<Typography variant="caption">2</Typography>} />
                      <FormControlLabel value="3" control={<Radio color="primary" />} label={<Typography variant="caption">3</Typography>} />
                      <FormControlLabel value="4" control={<Radio color="primary" />} label={<Typography variant="caption">4</Typography>} />
                      <FormControlLabel value="5" control={<Radio color="primary" />} label={<Typography variant="caption">5 (Like me)</Typography>} />
                    </RadioGroup>
                  </Box>
                );
              })}
            </FormSectionCard>
          </Box>
        );
      case 5:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Workplace Scenarios</Typography>
                <Typography variant="body2" color="text.secondary">Select the response (A, B, C, or D) that matches how you would resolve the following scenarios.</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 6 of 8
              </Box>
            </Box>

            {situationalQuestions.map((item, idx) => (
              <Card key={idx} variant="outlined" sx={{ 
                mb: 4, 
                borderRadius: '16px', 
                borderColor: 'divider',
                borderLeft: '5px solid #4f46e5',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="subtitle1" fontWeight="800" color="#1e3a8a" mb={2.5} sx={{ lineHeight: 1.4 }}>
                    Scenario {idx + 1}: {item.q}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {item.options.map((opt) => {
                      const isSelected = situationalResponses[idx] === opt.key;
                      return (
                        <Box 
                          key={opt.key}
                          onClick={() => setSituationalResponses({ ...situationalResponses, [idx]: opt.key })}
                          sx={{
                            p: 2,
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isSelected ? 'primary.main' : 'grey.200',
                            bgcolor: isSelected ? 'rgba(79, 70, 229, 0.04)' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            '&:hover': {
                              borderColor: isSelected ? 'primary.main' : 'primary.light',
                              bgcolor: isSelected ? 'rgba(79, 70, 229, 0.06)' : 'rgba(79, 70, 229, 0.02)'
                            }
                          }}
                        >
                          <Radio 
                            checked={isSelected} 
                            value={opt.key}
                            color="primary"
                            sx={{ p: 0 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500, color: 'text.primary', flex: 1 }}>
                            <strong>{opt.key}.</strong> {opt.text}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        );
      case 6:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Descriptive Questions</Typography>
                <Typography variant="body2" color="text.secondary">Provide short descriptive answers (min 20 characters required).</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 7 of 8
              </Box>
            </Box>

            {openEndedQuestions.map((q, idx) => {
              const currentLength = (writtenResponses[idx] || '').length;
              const isLengthOk = currentLength >= 20;
              return (
                <Card key={idx} variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Typography variant="body1" fontWeight="700" mb={2} color="text.primary" sx={{ lineHeight: 1.4 }}>
                      Q{idx + 1}. {q}
                    </Typography>
                    <TextField 
                      fullWidth 
                      required
                      multiline 
                      rows={4} 
                      value={writtenResponses[idx] || ''}
                      onChange={(e) => setWrittenResponses({ ...writtenResponses, [idx]: e.target.value })}
                      placeholder="Provide your response here (minimum 20 characters)..."
                      error={currentLength > 0 && !isLengthOk}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px'
                        }
                      }}
                    />
                    <Box display="flex" justifyContent="space-between" sx={{ mt: 1, px: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Please write a concise answer.</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontWeight: 700, 
                          color: isLengthOk ? 'success.main' : 'error.main',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        {isLengthOk ? '✓' : '⚠'} {currentLength} characters
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        );
      case 7:
        return (
          <Box>
            {/* Step Banner */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="800" color="#1e3a8a">Review & Declaration</Typography>
                <Typography variant="body2" color="text.secondary">Review completeness, sign and submit your application.</Typography>
              </Box>
              <Box sx={{ px: 2, py: 0.8, borderRadius: '20px', bgcolor: 'rgba(79, 70, 229, 0.08)', color: 'primary.main', fontWeight: 700, fontSize: '0.75rem' }}>
                Step 8 of 8
              </Box>
            </Box>

            {/* Checklist Card */}
            <Card variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" mb={1}>
                  Final Application Completeness Review
                </Typography>
                <Typography variant="caption" color="text.secondary" mb={3} display="block">
                  Click any completed or flagged section below to edit the details directly.
                </Typography>
                <Grid container spacing={2}>
                  {checklistStatuses.map((item) => (
                    <Grid item xs={12} sm={6} key={item.index}>
                      <Box 
                        onClick={() => handleStepClick(item.index)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: '12px',
                          border: '1px solid',
                          borderColor: item.isValid ? 'success.light' : 'warning.light',
                          bgcolor: item.isValid ? 'rgba(16, 185, 129, 0.02)' : 'rgba(245, 158, 11, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            borderColor: item.isValid ? 'success.main' : 'warning.main'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ 
                            color: item.isValid ? 'success.main' : 'warning.main',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            {item.isValid ? <CheckCircle fontSize="small" /> : <Warning fontSize="small" />}
                          </Box>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: item.isValid ? 'success.main' : 'warning.main' }}>
                          {item.isValid ? 'Ready' : 'Action Required'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Read only summary grid */}
            <Card variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" mb={2}>
                  Personal Details Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: '220px', borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>Full Name</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>
                          {values.first_name} {values.middle_name ? values.middle_name + ' ' : ''}{values.last_name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>Email Address</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>{values.email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>Contact Number</TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(0,0,0,0.06)', py: 1.5 }}>{values.phone}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, borderBottom: 'none', py: 1.5 }}>Current Address</TableCell>
                        <TableCell sx={{ borderBottom: 'none', py: 1.5 }}>
                          {values.current_address}, {values.city}, {values.state}, {values.country} - {values.pincode}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Declaration & Consent Card */}
            <Card variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" mb={2}>
                  Declaration & Consent Terms
                </Typography>
                <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" paragraph lineHeight={1.6} sx={{ display: 'block', mb: 1.5 }}>
                    1. I hereby declare that all information provided in this form is true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation may result in disqualification from the selection process or termination of employment if discovered subsequently.
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1.6} sx={{ display: 'block' }}>
                    2. I consent to Abhiyanta India Solutions Pvt. Ltd. using this information solely for the purpose of evaluating my candidature.
                  </Typography>
                </Paper>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Controller
                    name="declaration_accepted"
                    control={control}
                    defaultValue={false}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={!!value} 
                            onChange={(e) => {
                              onChange(e.target.checked);
                              writeDraft({ formValues: { ...getValues(), declaration_accepted: e.target.checked } });
                            }} 
                            onBlur={onBlur}
                            color="primary" 
                          />
                        }
                        label={<Typography fontWeight="600" variant="body2" color="text.primary">I accept the above declaration statement (1)</Typography>}
                      />
                    )}
                  />

                  <Controller
                    name="consent_accepted"
                    control={control}
                    defaultValue={false}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={!!value} 
                            onChange={(e) => {
                              onChange(e.target.checked);
                              writeDraft({ formValues: { ...getValues(), consent_accepted: e.target.checked } });
                            }} 
                            onBlur={onBlur}
                            color="primary" 
                          />
                        }
                        label={<Typography fontWeight="600" variant="body2" color="text.primary">I accept the consent terms statement (2)</Typography>}
                      />
                    )}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Signature Upload Card */}
            <Card variant="outlined" sx={{ mb: 4, borderRadius: '16px', borderColor: 'divider', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <Typography variant="subtitle1" fontWeight="700" color="text.primary" mb={1}>
                  Digital Signature Verification
                </Typography>
                <Typography variant="caption" color="text.secondary" mb={3} display="block">
                  Please upload a PDF document containing your signed signature image or written digital signature (Max 5 MB).
                </Typography>

                {!signatureFile && !existingSignatureName ? (
                  <Box sx={{
                    p: 4,
                    borderRadius: '12px',
                    border: '2px dashed #D1D5DB',
                    bgcolor: 'rgba(0,0,0,0.01)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: isReadOnly ? 'default' : 'pointer',
                    '&:hover': {
                      borderColor: isReadOnly ? '#D1D5DB' : 'primary.main',
                      bgcolor: isReadOnly ? 'rgba(0,0,0,0.01)' : 'rgba(79, 70, 229, 0.02)'
                    }
                  }} component={isReadOnly ? 'div' : 'label'}>
                    <CloudUpload sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
                    <Typography variant="body2" fontWeight="600" color="text.primary" mb={0.5}>
                      {isReadOnly ? 'No Signature PDF Uploaded' : 'Click to upload Signature PDF'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max file size: 5 MB | Format: .pdf
                    </Typography>
                    {!isReadOnly && (
                      <input
                        type="file"
                        accept="application/pdf"
                        hidden
                        onChange={handleSignatureUpload}
                      />
                    )}
                  </Box>
                ) : signatureFile ? (
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: 'success.light',
                    bgcolor: 'rgba(16, 185, 129, 0.02)',
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    justifyContent: 'space-between',
                    gap: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FilePresent color="success" sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="700" color="success.dark">
                          {signatureFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(signatureFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Signature Ready
                        </Typography>
                      </Box>
                    </Box>
                    {!isReadOnly && (
                      <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: 'none', borderRadius: '6px' }}
                        >
                          Replace
                          <input
                            type="file"
                            accept="application/pdf"
                            hidden
                            onChange={handleSignatureUpload}
                          />
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          sx={{ textTransform: 'none', borderRadius: '6px' }}
                          onClick={() => setSignatureFile(null)}
                        >
                          Remove
                        </Button>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 2.5, 
                    borderRadius: '12px', 
                    border: '1px solid',
                    borderColor: 'success.light',
                    bgcolor: 'rgba(16, 185, 129, 0.02)',
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    justifyContent: 'space-between',
                    gap: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FilePresent color="success" sx={{ fontSize: 32 }} />
                      <Box>
                        <Typography variant="body2" fontWeight="700" color="success.dark">
                          {existingSignatureName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Pre-uploaded signature PDF
                        </Typography>
                      </Box>
                    </Box>
                    {!isReadOnly && (
                      <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          sx={{ textTransform: 'none', borderRadius: '6px' }}
                        >
                          Replace
                          <input
                            type="file"
                            accept="application/pdf"
                            hidden
                            onChange={handleSignatureUpload}
                          />
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F3F4F6', py: 6 }}>
      <Container maxWidth="md">
        
        {/* Portal Header */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="900" color="#1e3a8a" sx={{ letterSpacing: '-0.3px', mb: 0.5 }}>
            ABHIYANTA INDIA SOLUTIONS PVT. LTD.
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ letterSpacing: '1px' }}>
            TALENT ACQUISITION PORTAL
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
          
          {/* Form Header Info Banner */}
          <Box sx={{ 
            bgcolor: '#1e3a8a', 
            p: 4, 
            color: 'white', 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.8
          }}>
            <Typography variant="h6" fontWeight="800">Employment Application Form</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Confidential Screening Process • RecruitPro</Typography>
            
            {/* Draft status indicator */}
            <Box sx={{
              position: { xs: 'static', sm: 'absolute' },
              top: 24,
              right: 24,
              alignSelf: 'flex-start',
              mt: { xs: 1.5, sm: 0 },
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(255,255,255,0.12)',
              py: 0.6,
              px: 1.5,
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {isSaving ? (
                <CircularProgress size={12} sx={{ color: 'white' }} />
              ) : (
                <CloudDone fontSize="small" sx={{ fontSize: '1rem' }} />
              )}
              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                {isSaving ? 'Submitting Application...' : 'Progress saved on this device'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            
            {/* High quality custom Stepper progress indicator */}
            <Box sx={{ width: '100%', mb: 6 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: { xs: 'wrap', md: 'nowrap' },
                gap: { xs: 2, md: 0 },
                position: 'relative'
              }}>
                {steps.map((label, idx) => {
                  const isCompleted = idx < activeStep || (activeStep === 7 && idx < 7);
                  const isActive = idx === activeStep;
                  const isClickable = idx <= maxStepReached || activeStep === 7;

                  return (
                    <React.Fragment key={idx}>
                      <Box 
                        onClick={() => isClickable && handleStepClick(idx)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: isClickable ? 'pointer' : 'not-allowed',
                          opacity: isClickable ? 1 : 0.45,
                          flex: 1,
                          position: 'relative',
                          zIndex: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: isClickable ? 'translateY(-1px)' : 'none',
                          }
                        }}
                      >
                        <Box sx={{
                          width: isActive ? 38 : 32,
                          height: isActive ? 38 : 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isCompleted ? 'success.main' : isActive ? 'primary.main' : 'background.paper',
                          border: '2px solid',
                          borderColor: isCompleted ? 'success.main' : isActive ? 'primary.main' : 'grey.300',
                          boxShadow: isActive ? '0 0 10px rgba(79, 70, 229, 0.35)' : 'none',
                          color: isCompleted || isActive ? 'white' : 'text.secondary',
                          transition: 'all 0.2s ease'
                        }}>
                          {isCompleted ? (
                            <Check sx={{ fontSize: 16, strokeWidth: 3 }} />
                          ) : (
                            <Typography sx={{ fontWeight: 700, fontSize: isActive ? '0.9rem' : '0.8rem' }}>
                              {idx + 1}
                            </Typography>
                          )}
                        </Box>

                        <Typography 
                          variant="caption" 
                          sx={{ 
                            mt: 1, 
                            fontWeight: isActive ? 800 : 600, 
                            color: isActive ? 'primary.main' : isCompleted ? 'success.main' : 'text.secondary',
                            textAlign: 'center',
                            fontSize: { xs: '0.65rem', sm: '0.72rem' }
                          }}
                        >
                          {label}
                        </Typography>
                      </Box>

                      {idx < steps.length - 1 && (
                        <Box sx={{
                          display: { xs: 'none', md: 'block' },
                          height: '2px',
                          bgcolor: idx < activeStep ? 'success.main' : 'grey.300',
                          flex: 1,
                          mx: -1.5,
                          mt: -2.5,
                          position: 'relative',
                          zIndex: 1,
                          transition: 'background-color 0.2s ease'
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>

            {apiError && (
              <Alert severity="error" sx={{ mb: 4, borderRadius: '12px' }}>
                {apiError}
              </Alert>
            )}

            <form onSubmit={(e) => e.preventDefault()}>
              <fieldset disabled={isReadOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
                <Box sx={{ transition: 'opacity 0.2s ease-in-out' }}>
                  {renderStepContent(activeStep)}
                </Box>
              </fieldset>
              
              {/* Navigation Action Buttons */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mt: 5, 
                pt: 3, 
                borderTop: '1px solid', 
                borderColor: 'divider' 
              }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  sx={{ 
                    borderRadius: '8px', 
                    px: 3, 
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: 'grey.300',
                    color: 'text.primary',
                    '&:hover': {
                      borderColor: 'grey.400',
                      backgroundColor: 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSaving || (isReadOnly && activeStep === steps.length - 1)}
                  endIcon={activeStep === steps.length - 1 ? <Check /> : <ArrowForward />}
                  sx={{ 
                    borderRadius: '8px', 
                    px: 3.5, 
                    py: 1,
                    fontWeight: 700,
                    textTransform: 'none',
                    backgroundColor: '#1e3a8a',
                    '&:hover': {
                      backgroundColor: '#172554'
                    }
                  }}
                  size="large"
                >
                  {isSaving ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : activeStep === steps.length - 1 ? (
                    isEditMode ? 'Save Updates' : 'Submit Application'
                  ) : (
                    'Next Step'
                  )}
                </Button>
              </Box>
            </form>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default CandidateForm;
