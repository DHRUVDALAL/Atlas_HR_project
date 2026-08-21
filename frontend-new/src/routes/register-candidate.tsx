import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { PhoneInput } from "@/components/phone-input";
import { LocationSelect } from "@/components/location-select";
import type { CandidateDetail } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import SignatureCanvas from "react-signature-canvas";

export const Route = createFileRoute("/register-candidate")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      edit: search.edit as string | undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Candidate Application — Atlas HR" },
      {
        name: "description",
        content: "Apply to open positions at Atlas HR. Complete the multi-step application.",
      },
    ],
  }),
  component: RegisterCandidate,
});

const DRAFT_KEY = "candidate_form_draft";

const PERSONALITY_QUESTIONS = [
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
  "I actively seek feedback rather than waiting for it to come to me.",
];

const SITUATIONAL_QUESTIONS = [
  {
    prompt:
      "Your team is behind on a critical deadline. A colleague responsible for a key deliverable has been struggling. When you ask about progress, they seem stressed and defensive.",
    options: [
      "Escalate the delay to your manager immediately to protect the timeline.",
      "Sit down privately with the colleague, acknowledge the pressure, and ask if there’s anything blocking them that you can help with.",
      "Take over their work yourself to make sure the deadline is met.",
      "Send a detailed status email to the team lead documenting the delay.",
    ],
  },
  {
    prompt:
      "During a client presentation, the client challenges your recommendation sharply and in front of the entire room. You believe the criticism is only partially valid.",
    options: [
      "Stay composed, acknowledge the valid parts of their concern, and suggest reviewing the specific points together after the meeting.",
      "Defend your recommendation immediately with supporting data.",
      "Apologise and offer to rework the entire recommendation.",
      "Stay quiet during the meeting and raise it with your manager later.",
    ],
  },
  {
    prompt:
      "You have been assigned a project in a domain you have little prior experience in. It starts next week and expectations are high.",
    options: [
      "Tell your manager upfront that you may not be the right person for this.",
      "Dive into research, map out your knowledge gaps, and set up conversations with people who know the domain.",
      "Accept confidently and figure things out as they come, without asking for help.",
      "Ask the project sponsor for a detailed brief and propose a short ramp-up plan before committing to deliverables.",
    ],
  },
  {
    prompt:
      "A junior colleague tells you privately that they feel ignored during team discussions. They are visibly upset but ask you not to tell anyone.",
    options: [
      "Respect their wish completely and take no further action.",
      "Listen carefully, reassure them, and gently encourage them to bring it up with the team lead — offering to go with them if it helps.",
      "Report the matter to HR immediately since it could indicate a broader culture issue.",
      "Speak to the other team members yourself about being more inclusive, without naming the person.",
    ],
  },
  {
    prompt:
      "You strongly believe a decision made by leadership will cause problems down the line, but the rest of the team has accepted it without objection.",
    options: [
      "Go along with the decision — leadership probably has information you don’t.",
      "Raise your concern constructively in the next appropriate forum, presenting your reasoning clearly while remaining open to being wrong.",
      "Discuss your concerns informally with a few trusted colleagues to test whether they share your view.",
      "Document your objection in writing so that your position is on record if things go wrong.",
    ],
  },
];

const WRITTEN_QUESTIONS = [
  "Tell us about a time someone gave you feedback that was hard to hear. How did you respond, and what did you take away from it?",
  "What does “taking responsibility” look like in practice? Share an example from your experience.",
  "Describe a moment when you went out of your way to help a colleague without being asked. What prompted you to act?",
  "Think of a time when your view was clearly in the minority within a group. What did you do?",
  "When you encounter someone whose working style is very different from yours, how do you typically handle it?",
];

interface EmploymentRow {
  company_name: string;
  designation: string;
  start_date: string;
  end_date: string;
  responsibilities: string;
  reason_for_leaving: string;
}

interface EducationRow {
  qualification: string;
  specialization: string;
  institution_name: string;
  university: string;
  passing_year: string;
  percentage: string;
  grade: string;
}

function RegisterCandidate() {
  const navigate = useNavigate();
  const { edit: editId } = Route.useSearch();
  const isEditMode = !!editId;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [submitted, setSubmitted] = useState<null | {
    application_number: string;
    candidate_id: string;
  }>(null);

  const [file, setFile] = useState<File | null>(null);
  const [existingSignatureName, setExistingSignatureName] = useState("");
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const [personal, setPersonal] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    gender: "",
    date_of_birth: "",
    current_address: "",
    permanent_address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    position_applied_for: "",
    applied_from: "",
    source_name: "",
    reference_number: "",
  });

  const [phoneCountryCode, setPhoneCountryCode] = useState("+91");
  const [altPhoneCountryCode, setAltPhoneCountryCode] = useState("+91");
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  const [prof, setProf] = useState({
    total_experience: "",
    relevant_experience: "",
    current_company: "",
    current_designation: "",
    current_ctc: "",
    expected_ctc: "",
    notice_period: "",
    joining_availability: "",
    preferred_location: "",
    employment_type: "FULL_TIME",
  });

  const [employment, setEmployment] = useState<EmploymentRow[]>([blankEmployment()]);
  const [education, setEducation] = useState<EducationRow[]>([blankEducation()]);
  const [personality, setPersonality] = useState<number[]>(
    Array(PERSONALITY_QUESTIONS.length).fill(0),
  );
  const [situational, setSituational] = useState<string[]>(
    Array(SITUATIONAL_QUESTIONS.length).fill(""),
  );
  const [written, setWritten] = useState<string[]>(Array(WRITTEN_QUESTIONS.length).fill(""));
  const [declaration, setDeclaration] = useState(false);
  const [consent, setConsent] = useState(false);

  const steps = [
    "Personal Information",
    "Professional Details",
    "Employment History",
    "Education",
    "Perspective Assessment",
    "Workplace Scenarios",
    "Descriptive Questions",
    "Declaration & Submit",
  ];

  // Load draft from localStorage on mount (only for non-edit mode)
  useEffect(() => {
    if (isEditMode) return;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.step !== undefined) setStep(draft.step);
          if (draft.personal) setPersonal(draft.personal);
          if (draft.prof) setProf(draft.prof);
          if (draft.employment) setEmployment(draft.employment);
          if (draft.education) setEducation(draft.education);
          if (draft.personality) setPersonality(draft.personality);
          if (draft.situational) setSituational(draft.situational);
          if (draft.written) setWritten(draft.written);
          if (draft.declaration !== undefined) setDeclaration(draft.declaration);
          if (draft.consent !== undefined) setConsent(draft.consent);
          if (draft.phoneCountryCode) setPhoneCountryCode(draft.phoneCountryCode);
          if (draft.altPhoneCountryCode) setAltPhoneCountryCode(draft.altPhoneCountryCode);
          if (draft.sameAsCurrent !== undefined) setSameAsCurrent(draft.sameAsCurrent);
        }
    } catch (e) {
      console.warn("Failed to load form draft", e);
    }
  }, [isEditMode]);

  // Auto-sync permanent address when "same as current" is checked
  useEffect(() => {
    if (sameAsCurrent) {
      setPersonal((prev) => ({ ...prev, permanent_address: prev.current_address }));
    }
  }, [sameAsCurrent, personal.current_address]);

  // Save draft to localStorage on state changes
  useEffect(() => {
    if (isEditMode) return;
    try {
      const draft = {
        step,
        personal,
        prof,
        employment,
        education,
        personality,
        situational,
        written,
        declaration,
        consent,
        phoneCountryCode,
        altPhoneCountryCode,
        sameAsCurrent,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      // ignore
    }
  }, [
    step,
    personal,
    prof,
    employment,
    education,
    personality,
    situational,
    written,
    declaration,
    consent,
    phoneCountryCode,
    altPhoneCountryCode,
    sameAsCurrent,
    isEditMode,
  ]);

  // Load candidate details when in edit mode
  useEffect(() => {
    if (!editId) return;

    async function loadCandidateData() {
      try {
        const res = await api<{ success: boolean; data: CandidateDetail }>(
          `/api/applicants/${editId}`,
        );
        if (res && res.success && res.data) {
          const c = res.data;

          const PREARRIVAL = ["DRAFT", "SUBMITTED", "Submitted — awaiting reception"];
          if (!PREARRIVAL.includes(c.status)) {
            setIsReadOnly(true);
            toast.error("This application is past the pre-arrival stage and is read-only.");
          }

          setPersonal({
            first_name: c.first_name || "",
            middle_name: c.middle_name || "",
            last_name: c.last_name || "",
            email: c.email || "",
            phone: c.phone || "",
            alternate_phone: c.alternate_phone || "",
            gender: c.gender || "",
            date_of_birth: c.date_of_birth || "",
            current_address: c.current_address || "",
            permanent_address: c.permanent_address || "",
            city: c.city || "",
            state: c.state || "",
            country: c.country || "India",
            pincode: c.pincode || "",
            position_applied_for: c.position_applied_for || "",
            applied_from: c.applied_from || "",
            source_name: c.source_name || "",
            reference_number: c.reference_number || "",
          });

          if (
            c.permanent_address &&
            c.current_address &&
            c.permanent_address === c.current_address
          ) {
            setSameAsCurrent(true);
          }

          if (c.professional_details) {
            setProf({
              total_experience: c.professional_details.total_experience?.toString() || "",
              relevant_experience: c.professional_details.relevant_experience?.toString() || "",
              current_company: c.professional_details.current_company || "",
              current_designation: c.professional_details.current_designation || "",
              current_ctc: c.professional_details.current_ctc?.toString() || "",
              expected_ctc: c.professional_details.expected_ctc?.toString() || "",
              notice_period: c.professional_details.notice_period || "",
              joining_availability: c.professional_details.joining_availability || "",
              preferred_location: c.professional_details.preferred_location || "",
              employment_type: c.professional_details.employment_type || "FULL_TIME",
            });
          }

          if (c.employment_history && c.employment_history.length > 0) {
            setEmployment(c.employment_history);
          }

          if (c.education && c.education.length > 0) {
            setEducation(
              c.education.map((e) => ({
                qualification: e.qualification || "",
                specialization: e.specialization || "",
                institution_name: e.institution_name || "",
                university: e.university || "",
                passing_year: e.passing_year?.toString() || "",
                percentage: e.percentage?.toString() || "",
                grade: e.grade || "",
              })),
            );
          }

          if (c.personality_assessment) {
            const arr = Array(PERSONALITY_QUESTIONS.length).fill(0);
            c.personality_assessment.forEach((pa) => {
              if (pa.question_number >= 1 && pa.question_number <= arr.length) {
                arr[pa.question_number - 1] = pa.rating;
              }
            });
            setPersonality(arr);
          }

          if (c.situational_responses) {
            const arr = Array(SITUATIONAL_QUESTIONS.length).fill("");
            c.situational_responses.forEach((sr) => {
              if (sr.question_number >= 1 && sr.question_number <= arr.length) {
                arr[sr.question_number - 1] = sr.selected_option;
              }
            });
            setSituational(arr);
          }

          if (c.written_responses) {
            const arr = Array(WRITTEN_QUESTIONS.length).fill("");
            c.written_responses.forEach((wr) => {
              if (wr.question_number >= 1 && wr.question_number <= arr.length) {
                arr[wr.question_number - 1] = wr.answer_text;
              }
            });
            setWritten(arr);
          }

          setDeclaration(c.declaration?.declaration_accepted ?? false);
          setConsent(c.declaration?.consent_accepted ?? false);

          const sigDoc = (c.documents || []).find((d) => d.document_type === "SIGNATURE_PDF");
          if (sigDoc) {
            setExistingSignatureName(sigDoc.file_name || "Uploaded Signature PDF");
          }
        }
      } catch (e) {
        toast.error("Failed to load candidate details for editing");
      }
    }

    loadCandidateData();
  }, [editId]);

  const validateStep = (s: number) => {
    if (s === 0) {
      if (!personal.first_name) return "First name is required.";
      if (!personal.last_name) return "Last name is required.";
      if (!personal.email) return "Email address is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal.email))
        return "Invalid email address format.";
      if (!personal.phone) return "Phone number is required.";
      const phoneDigits = personal.phone.replace(/[^\d]/g, "");
      if (phoneDigits.length !== 10)
        return "Please enter a valid phone number. Phone number must be exactly 10 digits.";
      if (personal.alternate_phone) {
        const altDigits = personal.alternate_phone.replace(/[^\d]/g, "");
        if (altDigits.length !== 10)
          return "Please enter a valid alternate phone number. Phone number must be exactly 10 digits.";
      }
      if (!personal.gender) return "Select a gender.";
      if (!personal.date_of_birth) return "Date of birth is required.";
      if (new Date(personal.date_of_birth) > new Date())
        return "Date of birth cannot be a future date.";
      if (!personal.current_address) return "Current address is required.";
      if (personal.current_address.length < 5)
        return "Current address must be at least 5 characters.";
      if (!personal.country) return "Please select your country.";
      if (!personal.state) return "Please select your state.";
      if (!personal.city) return "Please select your city.";
      if (!personal.pincode) return "Please select your pincode.";
      if (personal.pincode.length < 4 || personal.pincode.length > 10) {
        return "Pincode must be between 4 and 10 characters.";
      }
      if (!personal.position_applied_for) return "Position applied for is required.";
      if (!personal.applied_from) return "Please select how you applied.";
    }

    if (s === 1) {
      if (prof.total_experience === "") return "Total experience is required.";
      if (isNaN(Number(prof.total_experience)) || Number(prof.total_experience) < 0) {
        return "Total experience must be a non-negative number.";
      }
      if (prof.relevant_experience === "") return "Relevant experience is required.";
      if (isNaN(Number(prof.relevant_experience)) || Number(prof.relevant_experience) < 0) {
        return "Relevant experience must be a non-negative number.";
      }
      if (
        prof.current_ctc !== "" &&
        (isNaN(Number(prof.current_ctc)) || Number(prof.current_ctc) < 0)
      ) {
        return "Current CTC must be a non-negative number.";
      }
      if (
        prof.expected_ctc !== "" &&
        (isNaN(Number(prof.expected_ctc)) || Number(prof.expected_ctc) < 0)
      ) {
        return "Expected CTC must be a non-negative number.";
      }
      if (!prof.employment_type) return "Employment type is required.";
    }

    if (s === 2) {
      for (let i = 0; i < employment.length; i++) {
        const item = employment[i];
        const hasData =
          item.company_name ||
          item.designation ||
          item.start_date ||
          item.end_date ||
          item.responsibilities ||
          item.reason_for_leaving;
        if (hasData) {
          if (!item.company_name || !item.designation || !item.start_date) {
            return `Please fill out all required fields (Company, Designation, Start Date) for Employment #${i + 1}.`;
          }
          if (item.end_date && new Date(item.end_date) < new Date(item.start_date)) {
            return `End date cannot be before start date for Employment #${i + 1}.`;
          }
        }
      }
    }

    if (s === 3) {
      if (education.length === 0) return "Please add at least one Educational Qualification.";
      for (let i = 0; i < education.length; i++) {
        const item = education[i];
        if (!item.qualification || !item.institution_name || !item.passing_year) {
          return `Please fill out all required fields (Qualification, Institution, Passing Year) for Education #${i + 1}.`;
        }
        const pYear = Number(item.passing_year);
        const curYear = new Date().getFullYear();
        if (isNaN(pYear) || pYear < 1900 || pYear > curYear) {
          return `Passing year must be between 1900 and ${curYear} for Education #${i + 1}.`;
        }
        if (item.percentage !== "") {
          const pct = Number(item.percentage);
          if (isNaN(pct) || pct < 0 || pct > 100) {
            return `Percentage must be between 0 and 100 for Education #${i + 1}.`;
          }
        }
      }
    }

    if (s === 4) {
      const ratedCount = personality.filter((v) => v > 0).length;
      if (ratedCount < PERSONALITY_QUESTIONS.length) {
        return `Please rate all ${PERSONALITY_QUESTIONS.length} perspective statements.`;
      }
    }

    if (s === 5) {
      const answeredCount = situational.filter((v) => v !== "").length;
      if (answeredCount < SITUATIONAL_QUESTIONS.length) {
        return `Please answer all ${SITUATIONAL_QUESTIONS.length} workplace scenarios.`;
      }
    }

    if (s === 6) {
      for (let i = 0; i < written.length; i++) {
        if (!written[i] || written[i].trim().length < 20) {
          return `Descriptive Question #${i + 1} must be at least 20 characters long.`;
        }
      }
    }

    if (s === 7) {
      if (!declaration || !consent) {
        return "You must accept both the declaration and consent terms.";
      }
      if (!file && !existingSignatureName) {
        return "You must upload your signature PDF before submitting.";
      }
    }

    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep(step + 1);
  };

  const handleStepJump = (target: number) => {
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    // Jumping forward: validate steps sequentially
    for (let i = step; i < target; i++) {
      const err = validateStep(i);
      if (err) {
        toast.error(`Please complete previous steps first: ${err}`);
        return;
      }
    }
    setStep(target);
  };

  const buildPayload = () => ({
    personal_details: {
      first_name: personal.first_name,
      middle_name: personal.middle_name || null,
      last_name: personal.last_name,
      email: personal.email,
      phone: personal.phone.replace(/[^\d]/g, ""),
      alternate_phone: personal.alternate_phone
        ? personal.alternate_phone.replace(/[^\d]/g, "")
        : null,
      gender: personal.gender,
      date_of_birth: personal.date_of_birth,
      current_address: personal.current_address,
      permanent_address: sameAsCurrent
        ? personal.current_address
        : personal.permanent_address || personal.current_address,
      city: personal.city,
      state: personal.state,
      country: personal.country,
      pincode: personal.pincode,
      position_applied_for: personal.position_applied_for || null,
      applied_from: personal.applied_from || null,
      source_name: personal.source_name || null,
      reference_number: personal.reference_number || null,
    },
    professional_details: {
      current_company: prof.current_company || null,
      current_designation: prof.current_designation || null,
      total_experience: prof.total_experience ? parseFloat(prof.total_experience) : 0,
      relevant_experience: prof.relevant_experience ? parseFloat(prof.relevant_experience) : 0,
      current_ctc: prof.current_ctc ? parseFloat(prof.current_ctc) : null,
      expected_ctc: prof.expected_ctc ? parseFloat(prof.expected_ctc) : null,
      notice_period: prof.notice_period || null,
      joining_availability: prof.joining_availability || null,
      preferred_location: prof.preferred_location || null,
      employment_type: prof.employment_type || "FULL_TIME",
    },
    employment_history: employment
      .filter((e) => e.company_name)
      .map((e) => ({
        company_name: e.company_name,
        designation: e.designation,
        start_date: e.start_date,
        end_date: e.end_date || null,
        responsibilities: e.responsibilities || null,
        reason_for_leaving: e.reason_for_leaving || null,
      })),
    education: education
      .filter((e) => e.qualification)
      .map((e) => ({
        qualification: e.qualification,
        institution_name: e.institution_name,
        university: e.university || null,
        passing_year: parseInt(e.passing_year),
        percentage: e.percentage ? parseFloat(e.percentage) : null,
        grade: e.grade || null,
        specialization: e.specialization || null,
      })),
    personality_assessment: personality.map((rating, i) => ({
      question_number: i + 1,
      rating,
    })),
    situational_responses: situational.map((selected_option, i) => ({
      question_number: i + 1,
      selected_option,
    })),
    written_responses: written.map((answer_text, i) => ({
      question_number: i + 1,
      answer_text,
    })),
    declaration: {
      declaration_accepted: !!declaration,
      consent_accepted: !!consent,
      signed_date: new Date().toISOString().split("T")[0],
    },
  });

  const handleSaveSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error("Please provide a signature first.");
      return;
    }
    
    try {
      const rawCanvas = sigCanvas.current.getCanvas();
      if (!rawCanvas) {
        toast.error("Failed to process signature.");
        return;
      }
      
      const dataUrl = rawCanvas.toDataURL("image/png");
      if (!dataUrl) return;

      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [100, 50],
      });
      pdf.addImage(dataUrl, "PNG", 5, 5, 90, 40);
      const pdfBlob = pdf.output("blob");
      const sigFile = new File([pdfBlob], "signature.pdf", { type: "application/pdf" });
      setFile(sigFile);
      setShowSignaturePad(false);
      toast.success("Signature saved successfully!");
    } catch (err: any) {
      console.error("Signature save error:", err);
      toast.error(`Failed: ${err?.message || "Unknown error"}`);
    }
  };

  async function submit() {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      const payload = buildPayload();

      if (isEditMode) {
        await api(`/api/applicant/${editId}`, {
          method: "PUT",
          body: payload,
        });
        toast.success("Application updated successfully");
        navigate({ to: "/candidates" });
        return;
      }

      if (!file) {
        toast.error("Signature file is required for new submissions");
        setSubmitting(false);
        return;
      }

      const fd = new FormData();
      fd.append("payload", JSON.stringify(payload));
      fd.append("signature", file);

      const res = await api<{
        success: boolean;
        data: {
          candidate_id: string;
          application_number: string;
        };
      }>("/api/applicant", {
        method: "POST",
        body: fd,
        raw: true,
        auth: false,
      });

      setSubmitted({
        application_number: res.data.application_number,
        candidate_id: res.data.candidate_id,
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Application submitted successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-[#fbfbfd]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full bg-white p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 rounded-[2rem]"
        >
          <div className="mx-auto h-16 w-16 rounded-full bg-green-50 grid place-items-center text-green-600 mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-[#1d1d1f]">
            Application Submitted
          </h1>
          <p className="text-sm text-[#86868b] mt-3">
            Thank you for applying to Atlas HR. Please save your application reference number below:
          </p>
          <div className="mt-8 rounded-2xl bg-[#f5f5f7] py-5 px-6 font-mono text-2xl font-semibold tracking-widest text-[#1d1d1f]">
            {submitted.application_number}
          </div>
          <p className="text-xs text-[#86868b] mt-6 leading-relaxed">
            Please carry a printout or digital copy of this reference number on your interview day.
          </p>
          <div className="mt-8 pt-8 border-t border-gray-100">
            <Button asChild className="w-full rounded-full h-12 bg-[#1d1d1f] hover:bg-black text-white text-base font-medium shadow-sm transition-all active:scale-[0.98]">
              <Link to="/">Return to Home</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] font-sans text-[#1d1d1f]">
      <header className="bg-white/70 text-[#1d1d1f] border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Atlas Logo" className="h-8 w-auto" />
            <div>
              <div className="font-bold text-lg tracking-tight">
                Atlas HR Portal
              </div>
              <div className="text-xs text-[#86868b]">
                Recruitment Candidate Application Wizard
              </div>
            </div>
          </div>
          <Button variant="ghost" asChild size="sm" className="rounded-full font-medium hover:bg-gray-100">
            <Link to="/login" className="text-sm">
              Staff Portal
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid lg:grid-cols-4 gap-10">
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-transparent p-0 space-y-1">
            <div className="text-xs font-bold text-[#86868b] uppercase tracking-wider px-3 mb-4">
              Application Steps
            </div>
            {steps.map((label, idx) => {
              const isCurrent = step === idx;
              const isPast = step > idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleStepJump(idx)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-between ${
                    isCurrent
                      ? "bg-gray-100 text-[#1d1d1f] font-semibold"
                      : isPast
                        ? "text-[#0066cc] hover:bg-blue-50/50"
                        : "text-[#86868b] hover:bg-gray-50"
                  }`}
                  disabled={isReadOnly}
                >
                  <span className="truncate">
                    {idx + 1}. {label}
                  </span>
                  {isPast && <CheckCircle className="h-4 w-4 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
          {isReadOnly && (
            <div className="p-4 rounded-xl border bg-orange-50 border-orange-100 text-orange-600 flex items-start gap-2 text-xs mt-6">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>This record is read-only and cannot be modified.</span>
            </div>
          )}
        </div>

        {/* Form Wizard Window */}
        <div className="lg:col-span-3 space-y-8">
          <div>
            <div className="flex justify-between text-xs text-[#86868b] mb-3">
              <span>
                Step {step + 1} of {steps.length}: <b className="text-[#1d1d1f]">{steps[step]}</b>
              </span>
              <span className="font-medium">{Math.round(((step + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#0066cc] transition-all duration-500 ease-out" 
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Personal Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Provide your contact details and application headers.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField
                    label="First name *"
                    value={personal.first_name}
                    onChange={(v) => setPersonal({ ...personal, first_name: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Middle name"
                    value={personal.middle_name}
                    onChange={(v) => setPersonal({ ...personal, middle_name: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Last name *"
                    value={personal.last_name}
                    onChange={(v) => setPersonal({ ...personal, last_name: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Email address *"
                    type="email"
                    value={personal.email}
                    onChange={(v) => setPersonal({ ...personal, email: v })}
                    disabled={isReadOnly}
                  />
                  <div className="sm:col-span-2">
                    <PhoneInput
                      label="Primary contact number"
                      value={personal.phone}
                      onChange={(v) => setPersonal({ ...personal, phone: v })}
                      countryCode={phoneCountryCode}
                      onCountryCodeChange={setPhoneCountryCode}
                      disabled={isReadOnly}
                      required
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <PhoneInput
                      label="Alternate contact number"
                      value={personal.alternate_phone}
                      onChange={(v) => setPersonal({ ...personal, alternate_phone: v })}
                      countryCode={altPhoneCountryCode}
                      onCountryCodeChange={setAltPhoneCountryCode}
                      disabled={isReadOnly}
                      placeholder="Enter alternate phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender *</Label>
                    <Select
                      value={personal.gender}
                      onValueChange={(v) => setPersonal({ ...personal, gender: v })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHERS">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField
                    label="Date of birth *"
                    type="date"
                    value={personal.date_of_birth}
                    onChange={(v) => setPersonal({ ...personal, date_of_birth: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Position applied for *"
                    value={personal.position_applied_for}
                    onChange={(v) => setPersonal({ ...personal, position_applied_for: v })}
                    disabled={isReadOnly}
                  />
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">
                      Applied From <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={personal.applied_from}
                      onValueChange={(v) => setPersonal((prev) => ({ ...prev, applied_from: v }))}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger className="h-9 rounded-lg">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        <SelectItem value="NAUKRI">Naukri</SelectItem>
                        <SelectItem value="VENDOR">Vendor</SelectItem>
                        <SelectItem value="REFERRAL">Referral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {personal.applied_from === "VENDOR" && (
                    <TextField
                      label="Vendor Name"
                      value={personal.source_name}
                      onChange={(v) => setPersonal((prev) => ({ ...prev, source_name: v }))}
                      disabled={isReadOnly}
                    />
                  )}
                  {personal.applied_from === "REFERRAL" && (
                    <>
                      <TextField
                        label="Referred By"
                        value={personal.source_name}
                        onChange={(v) => setPersonal((prev) => ({ ...prev, source_name: v }))}
                        disabled={isReadOnly}
                      />
                      <TextField
                        label="Reference Number"
                        value={personal.reference_number}
                        onChange={(v) => setPersonal((prev) => ({ ...prev, reference_number: v }))}
                        disabled={isReadOnly}
                      />
                    </>
                  )}
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Current address *</Label>
                    <Textarea
                      value={personal.current_address}
                      onChange={(e) =>
                        setPersonal({ ...personal, current_address: e.target.value })
                      }
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <LocationSelect
                      country={personal.country}
                      state={personal.state}
                      city={personal.city}
                      pincode={personal.pincode}
                      onCountryChange={(v) => setPersonal((prev) => ({ ...prev, country: v }))}
                      onStateChange={(v) => setPersonal((prev) => ({ ...prev, state: v }))}
                      onCityChange={(v) => setPersonal((prev) => ({ ...prev, city: v }))}
                      onPincodeChange={(v) => setPersonal((prev) => ({ ...prev, pincode: v }))}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-4">
                    <div className="flex items-center gap-3 pb-3">
                      <Checkbox
                        id="sameAddress"
                        checked={sameAsCurrent}
                        onCheckedChange={(v) => {
                          if (isReadOnly) return;
                          const checked = !!v;
                          setSameAsCurrent(checked);
                          if (checked) {
                            setPersonal({
                              ...personal,
                              permanent_address: personal.current_address,
                            });
                          }
                        }}
                        disabled={isReadOnly}
                      />
                      <Label
                        htmlFor="sameAddress"
                        className="font-semibold text-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Same as Current Address
                      </Label>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Permanent address</Label>
                    <Textarea
                      value={
                        sameAsCurrent ? personal.current_address : personal.permanent_address
                      }
                      onChange={(e) =>
                        setPersonal({ ...personal, permanent_address: e.target.value })
                      }
                      disabled={isReadOnly || sameAsCurrent}
                      placeholder={
                        sameAsCurrent
                          ? "Auto-copied from current address"
                          : "Enter permanent address (if different)"
                      }
                      className={sameAsCurrent ? "bg-muted/50" : ""}
                    />
                    {sameAsCurrent && (
                      <p className="text-xs text-muted-foreground">
                        Permanent address mirrors current address. Uncheck to edit separately.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Professional Details</h2>
                  <p className="text-sm text-muted-foreground">
                    Provide summary CTC, notices, and location choices.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextField
                    label="Total experience (yrs) *"
                    type="number"
                    value={prof.total_experience}
                    onChange={(v) => setProf({ ...prof, total_experience: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Relevant experience (yrs) *"
                    type="number"
                    value={prof.relevant_experience}
                    onChange={(v) => setProf({ ...prof, relevant_experience: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Current company name"
                    value={prof.current_company}
                    onChange={(v) => setProf({ ...prof, current_company: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Current designation"
                    value={prof.current_designation}
                    onChange={(v) => setProf({ ...prof, current_designation: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Current CTC (LPA)"
                    type="number"
                    value={prof.current_ctc}
                    onChange={(v) => setProf({ ...prof, current_ctc: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Expected CTC (LPA)"
                    type="number"
                    value={prof.expected_ctc}
                    onChange={(v) => setProf({ ...prof, expected_ctc: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Notice period (e.g. 30 days)"
                    value={prof.notice_period}
                    onChange={(v) => setProf({ ...prof, notice_period: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Joining availability"
                    value={prof.joining_availability}
                    onChange={(v) => setProf({ ...prof, joining_availability: v })}
                    disabled={isReadOnly}
                  />
                  <TextField
                    label="Preferred job location"
                    value={prof.preferred_location}
                    onChange={(v) => setProf({ ...prof, preferred_location: v })}
                    disabled={isReadOnly}
                  />
                  <div className="space-y-2">
                    <Label>Employment type *</Label>
                    <Select
                      value={prof.employment_type}
                      onValueChange={(v) => setProf({ ...prof, employment_type: v })}
                      disabled={isReadOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full time</SelectItem>
                        <SelectItem value="PART_TIME">Part time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERN">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Employment History</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    List previous employment records chronologically.
                  </p>
                </div>
                <div className="space-y-4">
                  {employment.map((row, i) => (
                    <Card key={i} className="p-5 space-y-3 bg-muted/10 border relative">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-sm text-primary">Position #{i + 1}</div>
                        {employment.length > 1 && !isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEmployment(employment.filter((_, x) => x !== i))}
                            className="text-error hover:text-error/95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <TextField
                          label="Company name"
                          value={row.company_name}
                          onChange={(v) =>
                            patchArr(setEmployment, employment, i, { company_name: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Designation"
                          value={row.designation}
                          onChange={(v) =>
                            patchArr(setEmployment, employment, i, { designation: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Start date"
                          type="date"
                          value={row.start_date}
                          onChange={(v) =>
                            patchArr(setEmployment, employment, i, { start_date: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="End date"
                          type="date"
                          value={row.end_date}
                          onChange={(v) => patchArr(setEmployment, employment, i, { end_date: v })}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Key responsibilities</Label>
                        <Textarea
                          value={row.responsibilities}
                          onChange={(e) =>
                            patchArr(setEmployment, employment, i, {
                              responsibilities: e.target.value,
                            })
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Reason for leaving</Label>
                        <Textarea
                          value={row.reason_for_leaving}
                          onChange={(e) =>
                            patchArr(setEmployment, employment, i, {
                              reason_for_leaving: e.target.value,
                            })
                          }
                          disabled={isReadOnly}
                        />
                      </div>
                    </Card>
                  ))}
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      onClick={() => setEmployment([...employment, blankEmployment()])}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add employment row
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">
                    Educational Qualifications
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Provide details of your degrees and institution credentials.
                  </p>
                </div>
                <div className="space-y-4">
                  {education.map((row, i) => (
                    <Card key={i} className="p-5 space-y-3 bg-muted/10 border">
                      <div className="flex justify-between items-center mb-1">
                        <div className="font-semibold text-sm text-primary">
                          Qualification #{i + 1}
                        </div>
                        {education.length > 1 && !isReadOnly && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEducation(education.filter((_, x) => x !== i))}
                            className="text-error hover:text-error/95"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <TextField
                          label="Qualification (e.g. B.Tech, SSC)"
                          value={row.qualification}
                          onChange={(v) =>
                            patchArr(setEducation, education, i, { qualification: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Specialization (e.g. CSE)"
                          value={row.specialization}
                          onChange={(v) =>
                            patchArr(setEducation, education, i, { specialization: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Institution name"
                          value={row.institution_name}
                          onChange={(v) =>
                            patchArr(setEducation, education, i, { institution_name: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="University / Board"
                          value={row.university}
                          onChange={(v) => patchArr(setEducation, education, i, { university: v })}
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Passing year"
                          type="number"
                          value={row.passing_year}
                          onChange={(v) =>
                            patchArr(setEducation, education, i, { passing_year: v })
                          }
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Percentage / CGPA"
                          type="number"
                          value={row.percentage}
                          onChange={(v) => patchArr(setEducation, education, i, { percentage: v })}
                          disabled={isReadOnly}
                        />
                        <TextField
                          label="Grade / Class (e.g. Distinction)"
                          value={row.grade}
                          onChange={(v) => patchArr(setEducation, education, i, { grade: v })}
                          disabled={isReadOnly}
                        />
                      </div>
                    </Card>
                  ))}
                  {!isReadOnly && (
                    <Button
                      variant="outline"
                      onClick={() => setEducation([...education, blankEducation()])}
                      className="w-full border-dashed"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add education row
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Your Perspective</h2>
                  <p className="text-sm text-muted-foreground">
                    Rate how much each statement describes you: 1 = Disagree, 5 = Agree.
                  </p>
                </div>
                <div className="space-y-4">
                  {PERSONALITY_QUESTIONS.map((q, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border bg-muted/5 flex items-center justify-between gap-4 flex-wrap hover:bg-muted/10 transition"
                    >
                      <div className="text-sm font-medium flex-1 min-w-[200px]">
                        <span className="text-muted-foreground mr-2 font-mono">{i + 1}.</span> {q}
                      </div>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const isSelected = personality[i] === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => {
                                if (isReadOnly) return;
                                setPersonality(personality.map((v, x) => (x === i ? n : v)));
                              }}
                              className={`h-9 w-9 rounded-lg border text-sm font-semibold transition ${
                                isSelected
                                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                  : "bg-card text-foreground hover:bg-accent border-muted-foreground/20"
                              }`}
                              disabled={isReadOnly}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Workplace Scenarios</h2>
                  <p className="text-sm text-muted-foreground">
                    Select the option that matches how you would resolve the following scenarios.
                  </p>
                </div>
                <div className="space-y-6">
                  {SITUATIONAL_QUESTIONS.map((q, i) => (
                    <Card key={i} className="p-5 space-y-4 border-l-4 border-l-primary">
                      <div className="text-sm font-bold leading-relaxed">
                        <span className="text-primary font-mono mr-2">Scenario {i + 1}:</span>
                        {q.prompt}
                      </div>
                      <RadioGroup
                        value={situational[i]}
                        onValueChange={(v) => {
                          if (isReadOnly) return;
                          setSituational(situational.map((x, idx) => (idx === i ? v : x)));
                        }}
                        disabled={isReadOnly}
                        className="space-y-2.5"
                      >
                        {q.options.map((opt, oi) => {
                          const letter = String.fromCharCode(65 + oi);
                          return (
                            <div
                              key={letter}
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/10 transition ${
                                situational[i] === letter
                                  ? "bg-primary/5 border-primary"
                                  : "border-muted/40"
                              }`}
                              onClick={() => {
                                if (isReadOnly) return;
                                setSituational(
                                  situational.map((x, idx) => (idx === i ? letter : x)),
                                );
                              }}
                            >
                              <RadioGroupItem
                                value={letter}
                                id={`q${i}-${letter}`}
                                className="mt-0.5"
                              />
                              <Label
                                htmlFor={`q${i}-${letter}`}
                                className="font-medium text-sm leading-normal flex-1 cursor-pointer"
                              >
                                <b className="font-mono text-primary mr-1">{letter}.</b> {opt}
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Descriptive Questions</h2>
                  <p className="text-sm text-muted-foreground">
                    Provide descriptive answers (minimum 20 characters required).
                  </p>
                </div>
                <div className="space-y-6">
                  {WRITTEN_QUESTIONS.map((q, i) => {
                    const currentLength = (written[i] || "").trim().length;
                    const isLengthOk = currentLength >= 20;
                    return (
                      <div key={i} className="space-y-2.5">
                        <Label className="text-sm font-bold leading-relaxed">
                          Q{i + 1}. {q}
                        </Label>
                        <Textarea
                          className="min-h-[120px] rounded-xl"
                          value={written[i]}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            setWritten(written.map((v, x) => (x === i ? e.target.value : v)));
                          }}
                          placeholder="Provide your response here (minimum 20 characters)..."
                          disabled={isReadOnly}
                        />
                        <div className="flex justify-between items-center text-xs mt-1">
                          <span className="text-muted-foreground">
                            Please write a concise answer.
                          </span>
                          <span
                            className={`font-bold ${isLengthOk ? "text-success" : "text-destructive"}`}
                          >
                            {currentLength} / 20+ characters {isLengthOk ? "✓" : "⚠"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-1">Review & Declaration</h2>
                  <p className="text-sm text-muted-foreground">
                    Sign your consent terms and submit the application.
                  </p>
                </div>

                {/* Digital Signature PDF upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold">
                    Digital Signature Verification Document *
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Please upload a PDF document containing your signed signature image or written
                    digital signature (Max 5 MB).
                  </p>

                  {!file && !existingSignatureName ? (
                    showSignaturePad ? (
                      <div className="border rounded-2xl p-6 bg-[#fbfbfd] flex flex-col items-center">
                        <p className="text-sm text-[#86868b] mb-4 font-medium">Draw your signature inside the box below:</p>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm w-full max-w-sm">
                          <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                              className: "w-full h-48 cursor-crosshair",
                            }}
                          />
                        </div>
                        <div className="flex gap-3 mt-6 w-full max-w-sm">
                          <Button
                            variant="outline"
                            type="button"
                            onClick={() => sigCanvas.current?.clear()}
                            className="flex-1 rounded-full h-10 font-medium"
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSaveSignature}
                            className="flex-1 rounded-full h-10 bg-[#0066cc] text-white hover:bg-[#005bb5] font-medium"
                          >
                            Save Signature
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => !isReadOnly && setShowSignaturePad(true)}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-10 transition ${isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50 hover:border-[#0066cc]/50"}`}
                      >
                        <FileText className="h-10 w-10 text-[#0066cc] mb-3 opacity-80" />
                        <span className="text-base font-semibold text-[#1d1d1f]">Click to draw your signature</span>
                        <span className="text-xs text-[#86868b] mt-2">
                          A digital PDF signature will be generated automatically and attached to your application.
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-3 border rounded-xl p-4 bg-success/5 border-success/20">
                      <FileText className="h-8 w-8 text-success" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate text-success-foreground">
                          {file ? file.name : existingSignatureName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {file
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Signature Ready`
                            : "Pre-uploaded signature PDF"}
                        </div>
                      </div>
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setExistingSignatureName("");
                          }}
                          className="text-destructive hover:bg-destructive/5"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border p-4 text-xs leading-relaxed text-muted-foreground bg-muted/20">
                  <b className="text-foreground block mb-2">Declaration terms statement:</b>
                  1. I hereby declare that all information provided in this form is true, complete,
                  and accurate to the best of my knowledge. I understand that any misrepresentation
                  may result in disqualification from the selection process or termination of
                  employment if discovered subsequently.
                  <br />
                  <br />
                  2. I consent to Abhiyanta India Solutions Pvt. Ltd. using this information solely
                  for the purpose of evaluating my candidature.
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="decl"
                      checked={declaration}
                      onCheckedChange={(v) => {
                        if (isReadOnly) return;
                        setDeclaration(!!v);
                      }}
                      disabled={isReadOnly}
                    />
                    <Label
                      htmlFor="decl"
                      className="font-semibold text-sm cursor-pointer leading-normal"
                    >
                      I accept the declaration terms statement (1).
                    </Label>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="consent"
                      checked={consent}
                      onCheckedChange={(v) => {
                        if (isReadOnly) return;
                        setConsent(!!v);
                      }}
                      disabled={isReadOnly}
                    />
                    <Label
                      htmlFor="consent"
                      className="font-semibold text-sm cursor-pointer leading-normal"
                    >
                      I accept the consent terms statement (2).
                    </Label>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="rounded-full px-6 h-11"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="rounded-full px-6 h-11 bg-[#0066cc] hover:bg-[#005bb5] text-white">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting || isReadOnly} className="rounded-full px-8 h-11 bg-[#1d1d1f] hover:bg-black text-white">
                {submitting ? "Submitting…" : "Submit Application"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg"
      />
    </div>
  );
}

function blankEmployment(): EmploymentRow {
  return {
    company_name: "",
    designation: "",
    start_date: "",
    end_date: "",
    responsibilities: "",
    reason_for_leaving: "",
  };
}

function blankEducation(): EducationRow {
  return {
    qualification: "",
    specialization: "",
    institution_name: "",
    university: "",
    passing_year: "",
    percentage: "",
    grade: "",
  };
}

function patchArr<T>(setter: (v: T[]) => void, arr: T[], i: number, patch: Partial<T>) {
  setter(arr.map((row, x) => (x === i ? { ...row, ...patch } : row)));
}
