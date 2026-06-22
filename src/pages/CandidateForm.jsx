import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box, Stepper, Step, StepLabel, Button, Typography,
  Container, Paper, TextField, Grid, StepConnector,
  stepConnectorClasses, styled, CircularProgress, Alert,
  RadioGroup, FormControlLabel, Radio, FormControl, FormLabel,
  Checkbox, Divider
} from '@mui/material';
import { Check, CloudDone } from '@mui/icons-material';

const steps = ['Personal', 'Professional', 'Perspective', 'Situations', 'Review & Declare'];

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
      "Escalate the delay to your manager immediately to protect the timeline.",
      "Sit down privately with the colleague, acknowledge the pressure, and ask if there’s anything blocking them that you can help with.",
      "Take over their work yourself to make sure the deadline is met.",
      "Send a detailed status email to the team lead documenting the delay."
    ]
  },
  {
    q: "During a client presentation, the client challenges your recommendation sharply and in front of the entire room. You believe the criticism is only partially valid.",
    options: [
      "Stay composed, acknowledge the valid parts of their concern, and suggest reviewing the specific points together after the meeting.",
      "Defend your recommendation immediately with supporting data.",
      "Apologise and offer to rework the entire recommendation.",
      "Stay quiet during the meeting and raise it with your manager later."
    ]
  },
  {
    q: "You have been assigned a project in a domain you have little prior experience in. It starts next week and expectations are high.",
    options: [
      "Tell your manager upfront that you may not be the right person for this.",
      "Dive into research, map out your knowledge gaps, and set up conversations with people who know the domain.",
      "Accept confidently and figure things out as they come, without asking for help.",
      "Ask the project sponsor for a detailed brief and propose a short ramp-up plan before committing to deliverables."
    ]
  },
  {
    q: "A junior colleague tells you privately that they feel ignored during team discussions. They are visibly upset but ask you not to tell anyone.",
    options: [
      "Respect their wish completely and take no further action.",
      "Listen carefully, reassure them, and gently encourage them to bring it up with the team lead — offering to go with them if it helps.",
      "Report the matter to HR immediately since it could indicate a broader culture issue.",
      "Speak to the other team members yourself about being more inclusive, without naming the person."
    ]
  },
  {
    q: "You strongly believe a decision made by leadership will cause problems down the line, but the rest of the team has accepted it without objection.",
    options: [
      "Go along with the decision — leadership probably has information you don’t.",
      "Raise your concern constructively in the next appropriate forum, presenting your reasoning clearly while remaining open to being wrong.",
      "Discuss your concerns informally with a few trusted colleagues to test whether they share your view.",
      "Document your objection in writing so that your position is on record if things go wrong."
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

// Generate validation schema dynamically based on arrays
const perspectiveSchema = perspectiveQuestions.reduce((acc, _, idx) => {
  acc[`perspective_${idx}`] = yup.string().required('Please answer this question');
  return acc;
}, {});

const situationsSchema = situationalQuestions.reduce((acc, _, idx) => {
  acc[`situational_${idx}`] = yup.string().required('Please select an option');
  return acc;
}, {});

const openEndedSchema = openEndedQuestions.reduce((acc, _, idx) => {
  acc[`openEnded_${idx}`] = yup.string().required('Please provide a brief answer');
  return acc;
}, {});

const validationSchemas = [
  yup.object({
    fullName: yup.string().required('Full Name is required'),
    dob: yup.string().required('Date of Birth is required'),
    phone: yup.string().required('Contact Number is required'),
    altPhone: yup.string(),
    email: yup.string().email('Invalid email').required('Email is required'),
    gender: yup.string().required('Gender is required'),
    currentAddress: yup.string().required('Current Address is required'),
    permanentAddress: yup.string().required('Permanent Address is required'),
  }).required(),
  yup.object({
    totalExp: yup.number().typeError('Must be a number').required('Total Exp is required'),
    relevantExp: yup.number().typeError('Must be a number').required('Relevant Exp is required'),
    currentCompany: yup.string().required('Current Company is required'),
    currentRole: yup.string().required('Current Role is required'),
    noticePeriod: yup.number().typeError('Must be a number').required('Notice Period is required'),
    currentCTC: yup.number().typeError('Must be a number').required('Current CTC is required'),
    expectedCTC: yup.number().typeError('Must be a number').required('Expected CTC is required'),
    earliestJoining: yup.string().required('Earliest Joining is required'),
  }).required(),
  yup.object(perspectiveSchema).required(),
  yup.object({
    ...situationsSchema,
    ...openEndedSchema
  }).required(),
  yup.object({
    declaration: yup.boolean().oneOf([true], 'You must accept the declaration to submit').required()
  }).required(),
];

// Custom styled connector
const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
    transition: 'border-color 0.3s ease',
  },
}));

const QontoStepIconRoot = styled('div')(({ theme, ownerState }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#eaeaf0',
  display: 'flex',
  height: 22,
  alignItems: 'center',
  ...(ownerState.active && {
    color: theme.palette.primary.main,
  }),
  '& .QontoStepIcon-completedIcon': {
    color: theme.palette.primary.main,
    zIndex: 1,
    fontSize: 24,
  },
  '& .QontoStepIcon-circle': {
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
}));

function QontoStepIcon(props) {
  const { active, completed, className } = props;
  return (
    <QontoStepIconRoot ownerState={{ active }} className={className}>
      {completed ? (
        <Check className="QontoStepIcon-completedIcon" />
      ) : (
        <div className="QontoStepIcon-circle" />
      )}
    </QontoStepIconRoot>
  );
}

const CandidateForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const currentValidationSchema = validationSchemas[activeStep];
  
  const {
    register,
    handleSubmit,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(currentValidationSchema),
    mode: 'onChange'
  });

  // Auto-save simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = async () => {
    const isStepValid = await trigger();
    if (isStepValid) {
      if (activeStep === steps.length - 1) {
        console.log("Final Submission Data:", getValues());
        setShowSuccess(true);
      } else {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (showSuccess) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 6, borderRadius: 4, textAlign: 'center' }} className="animate-scale-in">
          <Box sx={{ width: 80, height: 80, bgcolor: 'success.light', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <Check sx={{ fontSize: 40, color: 'success.dark' }} />
          </Box>
          <Typography variant="h4" fontWeight="800" gutterBottom>Application Submitted!</Typography>
          <Typography color="text.secondary" mb={4}>
            Thank you for applying to Abhiyanta India Solutions Pvt. Ltd. Our team will review your extensive profile and get back to you soon.
          </Typography>
          <Button variant="contained" onClick={() => window.location.href='/'}>Return to Home</Button>
        </Paper>
      </Container>
    );
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="700" mb={2}>Personal Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" {...register('fullName')} error={!!errors.fullName} helperText={errors.fullName?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} {...register('dob')} error={!!errors.dob} helperText={errors.dob?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Contact Number" {...register('phone')} error={!!errors.phone} helperText={errors.phone?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Alt. Contact" {...register('altPhone')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Gender" {...register('gender')} error={!!errors.gender} helperText={errors.gender?.message} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Current Address" multiline rows={2} {...register('currentAddress')} error={!!errors.currentAddress} helperText={errors.currentAddress?.message} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Permanent Address" multiline rows={2} {...register('permanentAddress')} error={!!errors.permanentAddress} helperText={errors.permanentAddress?.message} />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" fontWeight="700" mb={2}>Professional Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Total Experience (Years)" {...register('totalExp')} error={!!errors.totalExp} helperText={errors.totalExp?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Relevant Experience (Years)" {...register('relevantExp')} error={!!errors.relevantExp} helperText={errors.relevantExp?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Current Company" {...register('currentCompany')} error={!!errors.currentCompany} helperText={errors.currentCompany?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Current Role" {...register('currentRole')} error={!!errors.currentRole} helperText={errors.currentRole?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Notice Period (Days)" {...register('noticePeriod')} error={!!errors.noticePeriod} helperText={errors.noticePeriod?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="date" label="Earliest Joining Date" InputLabelProps={{ shrink: true }} {...register('earliestJoining')} error={!!errors.earliestJoining} helperText={errors.earliestJoining?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Current CTC (LPA)" {...register('currentCTC')} error={!!errors.currentCTC} helperText={errors.currentCTC?.message} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Expected CTC (LPA)" {...register('expectedCTC')} error={!!errors.expectedCTC} helperText={errors.expectedCTC?.message} />
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight="700" mb={1}>Your Perspective</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              We’d like to understand how you naturally approach work and people. Please rate how closely each statement describes you, from 1 (Not at all like me) to 5 (Very much like me). There are no right or wrong answers.
            </Typography>
            
            {perspectiveQuestions.map((q, idx) => (
              <Box key={idx} sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                <Typography variant="body1" fontWeight="600" mb={1}>{idx + 1}. {q}</Typography>
                <Controller
                  name={`perspective_${idx}`}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel value="1" control={<Radio />} label="1" />
                      <FormControlLabel value="2" control={<Radio />} label="2" />
                      <FormControlLabel value="3" control={<Radio />} label="3" />
                      <FormControlLabel value="4" control={<Radio />} label="4" />
                      <FormControlLabel value="5" control={<Radio />} label="5" />
                    </RadioGroup>
                  )}
                />
                {errors[`perspective_${idx}`] && <Typography color="error" variant="caption">{errors[`perspective_${idx}`].message}</Typography>}
              </Box>
            ))}
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" fontWeight="700" mb={1}>How Would You Respond?</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              The following are everyday workplace situations. Pick the ONE response that is closest to how you would actually act. Go with your first instinct.
            </Typography>
            
            {situationalQuestions.map((item, idx) => (
              <Box key={idx} sx={{ mb: 4, p: 2, borderLeft: '4px solid #4F46E5', bgcolor: 'action.hover', borderRadius: '0 8px 8px 0' }}>
                <Typography variant="subtitle1" fontWeight="700" mb={2}>Q{idx + 1}. {item.q}</Typography>
                <Controller
                  name={`situational_${idx}`}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      {item.options.map((opt, oIdx) => (
                        <FormControlLabel key={oIdx} value={opt} control={<Radio />} label={<Typography variant="body2">{opt}</Typography>} sx={{ mb: 1 }} />
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors[`situational_${idx}`] && <Typography color="error" variant="caption">{errors[`situational_${idx}`].message}</Typography>}
              </Box>
            ))}

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" fontWeight="700" mb={1}>In Your Own Words</Typography>
            <Typography variant="body2" color="text.secondary" mb={4}>
              Please answer briefly in 2–3 sentences. There is no expected answer — we simply want to hear how you think.
            </Typography>

            {openEndedQuestions.map((q, idx) => (
              <Box key={idx} sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="600" mb={1}>Q{idx + 1}. {q}</Typography>
                <TextField 
                  fullWidth 
                  multiline 
                  rows={3} 
                  {...register(`openEnded_${idx}`)} 
                  error={!!errors[`openEnded_${idx}`]} 
                  helperText={errors[`openEnded_${idx}`]?.message}
                />
              </Box>
            ))}
          </Box>
        );
      case 4:
        return (
          <Box>
            <Typography variant="h6" fontWeight="700" mb={2}>Review & Declaration</Typography>
            <Alert severity="info" sx={{ mb: 4 }}>
              Please ensure all details are correct before submitting. You cannot edit your application once submitted.
            </Alert>
            
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, mb: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Applicant Name</Typography>
              <Typography variant="body1" fontWeight="600" mb={2}>{getValues('fullName') || 'N/A'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Current Role</Typography>
              <Typography variant="body1" fontWeight="600" mb={2}>{getValues('currentRole')} at {getValues('currentCompany')}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>Total Experience</Typography>
              <Typography variant="body1" fontWeight="600" mb={2}>{getValues('totalExp')} Years</Typography>
            </Paper>

            <Typography variant="h6" fontWeight="700" mb={1}>Declaration & Consent</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              I hereby declare that all information provided in this form is true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation may result in disqualification from the selection process or termination of employment if discovered subsequently. I consent to Abhiyanta India Solutions Pvt. Ltd. using this information solely for the purpose of evaluating my candidature.
            </Typography>
            
            <FormControlLabel
              control={<Checkbox {...register('declaration')} color="primary" />}
              label={<Typography fontWeight="600">I agree to the Declaration & Consent</Typography>}
            />
            {errors.declaration && <Typography color="error" variant="caption" display="block">{errors.declaration.message}</Typography>}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={2} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ bgcolor: 'primary.main', p: 4, color: 'white', position: 'relative' }}>
            <Typography variant="h4" fontWeight="800" mb={1}>ABHIYANTA INDIA SOLUTIONS</Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Employment Application & Initial Screening Form</Typography>
            
            {/* Auto-saving indicator */}
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.2)', py: 0.5, px: 1.5, borderRadius: 2 }}>
              {isSaving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <CloudDone fontSize="small" />}
              <Typography variant="caption" fontWeight="600">{isSaving ? 'Saving...' : 'Saved'}</Typography>
            </Box>
          </Box>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />} sx={{ mb: 6 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={QontoStepIcon}>
                    <Typography variant="caption" fontWeight="700">{label}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <form>
              <Box className="animate-fade-in" key={activeStep}>
                {renderStepContent(activeStep)}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ borderRadius: 2, px: 4, fontWeight: '700' }}
                  size="large"
                >
                  {activeStep === steps.length - 1 ? 'Submit Application' : 'Save & Continue'}
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
