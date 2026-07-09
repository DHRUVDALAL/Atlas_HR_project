import React from 'react';
import {
  Box, Typography, Paper, Grid, Divider, Accordion, AccordionSummary, AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Rating
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Person from '@mui/icons-material/Person';
import Business from '@mui/icons-material/Business';
import Work from '@mui/icons-material/Work';
import School from '@mui/icons-material/School';
import Psychology from '@mui/icons-material/Psychology';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import Description from '@mui/icons-material/Description';
import Verified from '@mui/icons-material/Verified';

const CandidateFormReadOnly = ({ candidate }) => {
  if (!candidate) return <Typography>No candidate data available.</Typography>;

  const getInitials = (first = '', last = '') => {
    return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
  };

  const personalityStatements = [
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
      options: {
        A: "Escalate the delay to your manager immediately to protect the timeline.",
        B: "Sit down privately with the colleague, acknowledge the pressure, and ask if there’s anything blocking them that you can help with.",
        C: "Take over their work yourself to make sure the deadline is met.",
        D: "Send a detailed status email to the team lead documenting the delay."
      }
    },
    {
      q: "During a client presentation, the client challenges your recommendation sharply and in front of the entire room. You believe the criticism is only partially valid.",
      options: {
        A: "Stay composed, acknowledge the valid parts of their concern, and suggest reviewing the specific points together after the meeting.",
        B: "Defend your recommendation immediately with supporting data.",
        C: "Apologise and offer to rework the entire recommendation.",
        D: "Stay quiet during the meeting and raise it with your manager later."
      }
    },
    {
      q: "You have been assigned a project in a domain you have little prior experience in. It starts next week and expectations are high.",
      options: {
        A: "Tell your manager upfront that you may not be the right person for this.",
        B: "Dive into research, map out your knowledge gaps, and set up conversations with people who know the domain.",
        C: "Accept confidently and figure things out as they come, without asking for help.",
        D: "Ask the project sponsor for a detailed brief and propose a short ramp-up plan before committing to deliverables."
      }
    },
    {
      q: "A junior colleague tells you privately that they feel ignored during team discussions. They are visibly upset but ask you not to tell anyone.",
      options: {
        A: "Respect their wish completely and take no further action.",
        B: "Listen carefully, reassure them, and gently encourage them to bring it up with the team lead — offering to go with them if it helps.",
        C: "Report the matter to HR immediately since it could indicate a broader culture issue.",
        D: "Speak to the other team members yourself about being more inclusive, without naming the person."
      }
    },
    {
      q: "You strongly believe a decision made by leadership will cause problems down the line, but the rest of the team has accepted it without objection.",
      options: {
        A: "Go along with the decision — leadership probably has information you don’t.",
        B: "Raise your concern constructively in the next appropriate forum, presenting your reasoning clearly while remaining open to being wrong.",
        C: "Discuss your concerns informally with a few trusted colleagues to test whether they share your view.",
        D: "Document your objection in writing so that your position is on record if things go wrong."
      }
    }
  ];

  const writtenQuestions = [
    "Q1. Tell us about a time someone gave you feedback that was hard to hear. How did you respond, and what did you take away from it?",
    "Q2. What does “taking responsibility” look like in practice? Share an example from your experience.",
    "Q3. Describe a moment when you went out of your way to help a colleague without being asked. What prompted you to act?",
    "Q4. Think of a time when your view was clearly in the minority within a group. What did you do?",
    "Q5. When you encounter someone whose working style is very different from yours, how do you typically handle it?"
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      
      {/* SECTION 1: Personal Details */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Person color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 1: Personal Details & Header</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Position Applied For</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.position_applied_for || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Application Number / Ref. No</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.application_number || candidate.reference_number || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Referred By</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.referred_by || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="caption" color="text.secondary">Date Registered</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.created_at ? candidate.created_at.split('T')[0] : '—'}</Typography>
            </Grid>
            <Grid size={12}><Divider /></Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">First Name</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.first_name || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Middle Name</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.middle_name || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Last Name</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.last_name || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.email || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Phone</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.phone || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Alternate Phone</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.alternate_phone || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Gender</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.gender || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.date_of_birth || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Current Address</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.current_address || '—'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Permanent Address</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.permanent_address || 'Same as Current Address'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">City, State, Country</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.city}, {candidate.state}, {candidate.country}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">Pincode</Typography>
              <Typography variant="body2" fontWeight="600">{candidate.pincode || '—'}</Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* SECTION 2: Professional Details */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Business color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 2: Professional Details</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.professional_details ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Total Experience</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.total_experience} Years</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Relevant Experience</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.relevant_experience} Years</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Current Company</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.current_company || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Current Designation</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.current_designation || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Current CTC</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.current_ctc ? `${candidate.professional_details.current_ctc} LPA` : '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Expected CTC</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.expected_ctc ? `${candidate.professional_details.expected_ctc} LPA` : '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Notice Period</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.notice_period || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Earliest Joining</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.joining_availability || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Preferred Location</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.preferred_location || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Employment Type</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.professional_details.employment_type || '—'}</Typography>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">No professional details provided.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 3: Employment History */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Work color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 3: Employment History</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.employment_history && candidate.employment_history.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Company Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Responsibilities</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reason for Leaving</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidate.employment_history.map((eh, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{eh.company_name}</TableCell>
                      <TableCell>{eh.designation}</TableCell>
                      <TableCell>{eh.start_date} to {eh.end_date || 'Present'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'pre-line' }}>{eh.responsibilities || '—'}</TableCell>
                      <TableCell>{eh.reason_for_leaving || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">No employment history provided.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 4: Educational Qualifications */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <School color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 4: Educational Qualifications</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.education && candidate.education.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Qualification</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Specialization</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Institution/School</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>University/Board</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Passing Year</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Percentage/CGPA / Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidate.education.map((edu, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ fontWeight: 600 }}>{edu.qualification}</TableCell>
                      <TableCell>{edu.specialization || '—'}</TableCell>
                      <TableCell>{edu.institution_name}</TableCell>
                      <TableCell>{edu.university || '—'}</TableCell>
                      <TableCell>{edu.passing_year}</TableCell>
                      <TableCell>{edu.percentage ? `${edu.percentage}%` : '—'} {edu.grade ? `(${edu.grade})` : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">No education qualifications provided.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 5: Your Perspective (18 ratings) */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Psychology color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 5: Your Perspective (Likert Scale Self-Assessment)</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.personality_assessment && candidate.personality_assessment.length > 0 ? (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '40px' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statement</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '150px' }} align="center">Rating (1-5)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {personalityStatements.map((statement, idx) => {
                    const ratingObj = candidate.personality_assessment.find(pa => pa.question_number === idx + 1);
                    const score = ratingObj ? ratingObj.rating : '—';
                    return (
                      <TableRow key={idx} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell variant="body2">{statement}</TableCell>
                        <TableCell align="center">
                          {score !== '—' ? (
                            <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                              <Rating value={score} readOnly max={5} size="small" />
                              <Typography variant="body2" fontWeight="700">({score})</Typography>
                            </Box>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">No perspective details recorded.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 6: Situational Workplace Scenarios */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <QuestionAnswer color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 6: Situational Workplace Responses</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.situational_responses && candidate.situational_responses.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={3}>
              {situationalQuestions.map((sq, idx) => {
                const answerObj = candidate.situational_responses.find(sr => sr.question_number === idx + 1);
                const selectedKey = answerObj ? answerObj.selected_option : null;
                const optionText = selectedKey ? sq.options[selectedKey] : 'No answer';
                return (
                  <Paper key={idx} variant="outlined" sx={{ p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC' }}>
                    <Typography variant="body2" fontWeight="700" color="#1e3a5f" mb={1}>
                      Scenario {idx + 1}: {sq.q}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" color="success.main" fontWeight="800">
                        Response Chosen: ({selectedKey})
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        — {optionText}
                      </Typography>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No situational responses recorded.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 7: In Your Own Words */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Description color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 7: Written / Descriptive Responses</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.written_responses && candidate.written_responses.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={3}>
              {writtenQuestions.map((qText, idx) => {
                const answerObj = candidate.written_responses.find(wr => wr.question_number === idx + 1);
                const answerText = answerObj ? answerObj.answer_text : '—';
                return (
                  <Box key={idx}>
                    <Typography variant="body2" fontWeight="700" color="#1e3a5f" mb={1}>
                      {qText}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        p: 2, 
                        bgcolor: '#ffffff', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        whiteSpace: 'pre-line',
                        lineHeight: 1.6
                      }}
                    >
                      {answerText}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">No written responses recorded.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

      {/* SECTION 8: Declaration & Consent */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Verified color="primary" />
            <Typography fontWeight="700" variant="subtitle1">Section 8: Declaration & Consent</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {candidate.declaration ? (
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="body2" sx={{ p: 2, bgcolor: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)', mb: 2 }}>
                  "I hereby declare that all information provided in this form is true, complete, and accurate to the best of my knowledge. I understand that any misrepresentation may result in disqualification from the selection process or termination of employment if discovered subsequently. I consent to Abhiyanta India Solutions Pvt. Ltd. using this information solely for the purpose of evaluating my candidature."
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Declaration Accepted</Typography>
                <Typography variant="body2" fontWeight="600" color="success.main">{candidate.declaration.declaration_accepted ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Consent Accepted</Typography>
                <Typography variant="body2" fontWeight="600" color="success.main">{candidate.declaration.consent_accepted ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary">Signed Date</Typography>
                <Typography variant="body2" fontWeight="600">{candidate.declaration.signed_date || '—'}</Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">Digital Signature PDF</Typography>
                {candidate.documents && candidate.documents.some(d => d.document_type === 'SIGNATURE_PDF') ? (
                  <Typography variant="body2" color="success.main" fontWeight="600">✓ Uploaded & Verified Signature PDF File</Typography>
                ) : (
                  <Typography variant="body2" color="error.main" fontWeight="600">✗ No Signature PDF File Uploaded</Typography>
                )}
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary">No declaration data recorded.</Typography>
          )}
        </AccordionDetails>
      </Accordion>

    </Box>
  );
};

export default CandidateFormReadOnly;
