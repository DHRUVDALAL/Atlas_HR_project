import { API_BASE_URL } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Briefcase, ClipboardCheck, ExternalLink, Download, MapPin, Building, Calendar, Phone, Mail, GraduationCap, Clock, FileText, CheckCircle2, ChevronRight, Star } from "lucide-react";
import { format } from "date-fns";
import type { CandidateDetail } from "@/lib/types";

function Field({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#86868b] flex items-center gap-1.5 mb-1.5">
        {icon} {label}
      </div>
      <div className="font-bold text-[#1d1d1f]">{value}</div>
    </div>
  );
}

export function CandidateProfileTabs({ data }: { data: any }) {
  if (!data) return null;
  return (
    <Tabs defaultValue="profile" className="w-full">
            <TabsList className="w-full flex overflow-x-auto bg-[#f5f5f7] rounded-2xl p-1 h-auto no-scrollbar justify-start mb-6">
              <TabsTrigger value="profile" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Profile</TabsTrigger>
              <TabsTrigger value="professional" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Professional</TabsTrigger>
              <TabsTrigger value="experience" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Experience</TabsTrigger>
              <TabsTrigger value="education" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Education</TabsTrigger>
              <TabsTrigger value="rounds" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Rounds ({data.interview_rounds?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="documents" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Docs ({data.documents?.length ?? 0})</TabsTrigger>
              <TabsTrigger value="timeline" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Activity Log</TabsTrigger>
            
                <TabsTrigger value="perspective" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Perspective</TabsTrigger>
                <TabsTrigger value="scenarios" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Scenarios</TabsTrigger>
                <TabsTrigger value="descriptive" className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#86868b] data-[state=active]:bg-white data-[state=active]:text-[#1d1d1f] data-[state=active]:shadow-sm transition-all">Descriptive</TabsTrigger>
</TabsList>

            {/* Personal Information */}
            <TabsContent value="profile" className="outline-none">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <Field label="Full Name" value={`${data.first_name} ${data.middle_name ?? ""} ${data.last_name}`.trim()} icon={<User className="h-4 w-4" />} />
                  <Field label="Email" value={data.email} />
                  <Field label="Phone" value={data.phone} />
                  {data.alternate_phone && <Field label="Alternate Phone" value={data.alternate_phone} />}
                  <Field label="Gender" value={data.gender} icon={<User className="h-4 w-4" />} />
                  <Field label="Date of Birth" value={data.date_of_birth} icon={<Calendar className="h-4 w-4" />} />
                  <Field
                    label="Current Address"
                    value={[data.current_address, data.city, data.state, data.pincode].filter(Boolean).join(", ")}
                    icon={<MapPin className="h-4 w-4" />}
                  />
                  {data.permanent_address && (
                    <Field label="Permanent Address" value={data.permanent_address} icon={<MapPin className="h-4 w-4" />} />
                  )}
                  <Field label="Country" value={data.country} />
                  <div className="sm:col-span-2 h-px bg-gray-100 my-2" />
                  <Field label="Position Applied For" value={data.position_applied_for} icon={<Briefcase className="h-4 w-4" />} />
                  {data.applied_from && <Field label="Applied From" value={data.applied_from} />}
                  {data.applied_from === "REFERRAL" && data.source_name && <Field label="Referred By" value={data.source_name} />}
                  {data.applied_from === "VENDOR" && data.source_name && <Field label="Vendor Name" value={data.source_name} />}
                  {data.reference_number && <Field label="Reference Number" value={data.reference_number} />}
                </div>
              </div>
            </TabsContent>

            {/* Professional Information */}
            <TabsContent value="professional" className="outline-none">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Professional Details</h3>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <Field label="Current Company" value={data.professional_details?.current_company} icon={<Briefcase className="h-4 w-4" />} />
                  <Field label="Current Designation" value={data.professional_details?.current_designation} />
                  <Field
                    label="Total Experience"
                    value={data.professional_details?.total_experience ? `${data.professional_details.total_experience} yrs` : "—"}
                  />
                  <Field
                    label="Relevant Experience"
                    value={data.professional_details?.relevant_experience ? `${data.professional_details.relevant_experience} yrs` : "—"}
                  />
                  <Field
                    label="Current CTC"
                    value={data.professional_details?.current_ctc ? `₹${data.professional_details.current_ctc} LPA` : "—"}
                  />
                  <Field
                    label="Expected CTC"
                    value={data.professional_details?.expected_ctc ? `₹${data.professional_details.expected_ctc} LPA` : "—"}
                  />
                  <Field label="Notice Period" value={data.professional_details?.notice_period} />
                  <Field label="Joining Availability" value={data.professional_details?.joining_availability} />
                  <Field label="Preferred Location" value={data.professional_details?.preferred_location} />
                  <Field label="Employment Type" value={data.professional_details?.employment_type} />
                </div>
              </div>
            </TabsContent>

            {/* Experience */}
            <TabsContent value="experience" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Employment History</h3>
              {(data.employment_history ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <Briefcase className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No employment history captured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.employment_history ?? []).map((h, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                        <div className="text-lg font-bold text-[#1d1d1f]">
                          {h.designation} <span className="text-[#86868b] font-medium mx-1">at</span> {h.company_name}
                        </div>
                        <div className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-bold text-[#86868b]">
                          {h.start_date} — {h.end_date || "Present"}
                        </div>
                      </div>
                      {h.responsibilities && (
                        <p className="text-sm font-medium text-[#86868b] leading-relaxed mb-4">{h.responsibilities}</p>
                      )}
                      {h.reason_for_leaving && (
                        <div className="bg-[#fbfbfd] p-4 rounded-2xl border border-gray-100">
                          <div className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider mb-1">Reason for Leaving</div>
                          <p className="text-sm font-medium text-[#86868b]">{h.reason_for_leaving}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Education */}
            <TabsContent value="education" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Education</h3>
              {(data.education ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <GraduationCap className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No education captured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.education ?? []).map((e, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                        <Field label="Qualification" value={e.qualification} icon={<GraduationCap className="h-4 w-4" />} />
                        <Field label="Specialization" value={e.specialization} />
                        <Field label="Institution" value={e.institution_name} />
                        <Field label="University" value={e.university} />
                        <Field label="Passing Year" value={e.passing_year?.toString()} />
                        <Field label="Score" value={e.percentage ? `${e.percentage}%` : e.grade} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Interview Rounds */}
            <TabsContent value="rounds" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Interview Rounds</h3>
              {(data.interview_rounds ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <ClipboardCheck className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No rounds recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.interview_rounds ?? []).map((r) => (
                    <div key={r.round_id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div>
                          <div className="text-lg font-bold text-[#1d1d1f] mb-1">
                            {r.round_type?.replace(/_/g, " ")} <span className="text-[#86868b] font-medium mx-1">·</span> Round {r.round_number}
                          </div>
                          <div className="text-sm font-medium text-[#86868b] flex items-center gap-2">
                            <User className="h-4 w-4" /> {r.interviewer_email}
                          </div>
                        </div>
                        <div className="flex flex-col sm:items-end gap-2">
                          <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                            r.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#f5f5f7] text-[#1d1d1f]'
                          }`}>
                            {r.status}
                          </span>
                          {r.completed_at && (
                            <div className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                              {new Date(r.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {r.evaluation_data && Object.keys(r.evaluation_data).length > 0 ? (
                        <div className="grid sm:grid-cols-2 gap-6">
                          {Object.entries(r.evaluation_data.topic_scores || r.evaluation_data).map(([k, v]: [string, any]) => {
                            if (typeof v !== 'object' && typeof v !== 'number') return null;
                            return (
                              <div key={k} className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100">
                                <div className="flex justify-between items-start gap-4 mb-2">
                                  <div className="text-sm font-bold text-[#1d1d1f]">{k}</div>
                                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-bold text-[#1d1d1f] shadow-sm shrink-0">
                                    {typeof v === "object" ? v.rating : Number(v).toFixed(1)} <span className="text-[#86868b] ml-0.5 text-xs">/ 5</span>
                                  </div>
                                </div>
                                {v?.remarks && <p className="text-sm font-medium text-[#86868b] leading-relaxed">{v.remarks}</p>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-[#86868b] text-center p-4 bg-[#fbfbfd] rounded-2xl border border-gray-50">
                          No evaluation data available yet.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Uploaded Documents</h3>
              {(data.documents ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <FileText className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No documents uploaded.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(data.documents ?? []).map((d) => {
                    const fileUrl = `${API_BASE_URL}${d.file_path?.startsWith("/") ? "" : "/"}${d.file_path}`;
                    const isPdf = d.file_name?.toLowerCase()?.endsWith(".pdf");
                    return (
                      <div key={d.document_id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                              <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="min-w-0 pr-4">
                              <div className="text-sm font-bold text-[#1d1d1f] mb-0.5">{d.document_type?.replace(/_/g, " ")}</div>
                              <div className="text-xs font-medium text-[#86868b] truncate max-w-md">{d.file_name}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-center h-10 w-10 rounded-full bg-white border border-gray-200 text-[#1d1d1f] hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <a 
                              href={fileUrl} 
                              download={d.file_name}
                              className="flex items-center justify-center h-10 w-10 rounded-full bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        {isPdf && (
                          <div className="mt-6 rounded-2xl border border-gray-100 overflow-hidden bg-[#f5f5f7]">
                            <iframe src={fileUrl} className="w-full h-[400px]" title={d.file_name} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Activity Log / Timeline */}
            <TabsContent value="timeline" className="outline-none space-y-4">
              <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] pl-2">Activity Log</h3>
              {(data.activity_logs ?? []).length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <Clock className="h-10 w-10 text-gray-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#86868b]">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <div className="space-y-6">
                    {[...(data.activity_logs ?? [])].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((log, i) => (
                        <div key={log.log_id ?? i} className="flex gap-4 relative">
                          {i < (data.activity_logs?.length ?? 0) - 1 && (
                            <div className="absolute left-2.5 top-6 bottom-[-24px] w-px bg-gray-100" />
                          )}
                          <div className="h-5 w-5 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center mt-1 relative z-10 shrink-0">
                            <div className="h-2 w-2 rounded-full bg-[#0066cc]" />
                          </div>
                          <div className="flex-1 min-w-0 bg-[#fbfbfd] p-4 rounded-2xl border border-gray-50">
                            <div className="text-sm font-bold text-[#1d1d1f]">{log.action}</div>
                            {log.details && (
                              <div className="text-sm font-medium text-[#86868b] mt-1">{log.details}</div>
                            )}
                            <div className="text-xs font-bold text-[#1d1d1f]/40 uppercase tracking-wider mt-3 flex items-center gap-2">
                              <span>{log.performed_by}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span>{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          
              {/* Perspective Assessment */}
              <TabsContent value="perspective" className="outline-none">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Perspective Assessment</h3>
                  {data.personality_assessment && data.personality_assessment.length > 0 ? (
                    <div className="space-y-4">
                      {data.personality_assessment.map((a: any, i: number) => (
                        <div key={i} className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100">
                          <div className="text-sm font-bold text-[#1d1d1f] mb-2">{a.question_text}</div>
                          <div className="text-sm text-[#86868b]">Rating: <span className="font-bold text-[#1d1d1f]">{a.rating_value}/5</span></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#86868b] bg-[#fbfbfd] p-4 rounded-xl border border-gray-50 text-center">No perspective assessment found.</div>
                  )}
                </div>
              </TabsContent>

              {/* Scenarios */}
              <TabsContent value="scenarios" className="outline-none">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Workplace Scenarios</h3>
                  {data.situational_responses && data.situational_responses.length > 0 ? (
                    <div className="space-y-6">
                      {data.situational_responses.map((s: any, i: number) => (
                        <div key={i} className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100">
                          <div className="text-sm font-bold text-[#1d1d1f] mb-2">{s.scenario_text}</div>
                          <div className="text-sm text-[#86868b] leading-relaxed">Response: {s.response_text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#86868b] bg-[#fbfbfd] p-4 rounded-xl border border-gray-50 text-center">No scenario responses found.</div>
                  )}
                </div>
              </TabsContent>

              {/* Descriptive Questions */}
              <TabsContent value="descriptive" className="outline-none">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
                  <h3 className="text-xl font-bold tracking-tight text-[#1d1d1f] mb-6">Descriptive Questions</h3>
                  {data.written_responses && data.written_responses.length > 0 ? (
                    <div className="space-y-6">
                      {data.written_responses.map((w: any, i: number) => (
                        <div key={i} className="bg-[#fbfbfd] p-5 rounded-2xl border border-gray-100">
                          <div className="text-sm font-bold text-[#1d1d1f] mb-2">{w.question_text}</div>
                          <div className="text-sm text-[#86868b] leading-relaxed">Response: {w.response_text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#86868b] bg-[#fbfbfd] p-4 rounded-xl border border-gray-50 text-center">No descriptive responses found.</div>
                  )}
                </div>
              </TabsContent>
</Tabs>
  );
}






