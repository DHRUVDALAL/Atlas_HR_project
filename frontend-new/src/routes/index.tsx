import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Users, Briefcase, Zap, Building, Mail, Phone, MapPin } from "lucide-react";
import { useRef } from "react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Easing curve for Apple-like feel
  const smoothEase = [0.16, 1, 0.3, 1];
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: smoothEase } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f] font-sans overflow-x-hidden selection:bg-[#0066cc] selection:text-white" ref={containerRef}>
      
      {/* GLOBAL NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Atlas Logo" className="h-6 w-auto" />
            <span className="font-bold text-xl tracking-tight">ATLAS</span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full font-medium">by Abhiyanta</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#workflow" className="hover:text-black transition-colors">Workflow</a>
            <a href="#about" className="hover:text-black transition-colors">About Us</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium hover:text-black transition-colors hidden md:block">Staff Login</Link>
            <Link to="/register-candidate" className="bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:scale-105 hover:bg-gray-800 transition-all">
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center min-h-[90vh] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/40 rounded-full blur-3xl -z-10" />
        
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={staggerContainer}
          className="text-center max-w-4xl mx-auto z-10"
        >
          <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
            <Zap className="w-4 h-4 text-[#0066cc]" />
            <span>Introducing ATLAS for SAP Partners</span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight mb-8 text-black">
            Hiring.<br/>Perfected.
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-[#86868b] max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The ultimate Interview Management System engineered exclusively for Abhiyanta India Solutions. Precision, speed, and intelligence in every hire.
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register-candidate" className="w-full sm:w-auto bg-[#0066cc] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#0055b3] hover:scale-105 transition-all shadow-lg shadow-blue-500/25">
              Start Application
            </Link>
            <a href="#features" className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-gray-900 hover:text-[#0066cc] transition-colors">
              Explore the platform 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup - Cinematic Fade In */}
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: smoothEase }}
          className="mt-20 w-full max-w-6xl mx-auto bg-white rounded-2xl md:rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative z-10 flex flex-col"
        >
          <div className="h-12 bg-gray-50 border-b border-gray-100 flex items-center px-6 gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300 hover:bg-red-400 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-gray-300 hover:bg-amber-400 transition-colors" />
              <div className="w-3 h-3 rounded-full bg-gray-300 hover:bg-green-400 transition-colors" />
            </div>
          </div>
          <div className="aspect-[16/9] bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-8">
             {/* Mock UI Elements matching a premium SaaS app */}
             <div className="w-full h-full flex gap-6">
                <div className="w-1/4 h-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 hidden md:block">
                  <div className="h-6 w-24 bg-gray-200 rounded mb-8"></div>
                  <div className="space-y-4">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100"></div>)}
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-6">
                  <div className="h-24 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#0066cc]"><Users size={20} /></div>
                       <div>
                         <div className="h-5 w-48 bg-gray-200 rounded mb-2"></div>
                         <div className="h-4 w-32 bg-gray-100 rounded"></div>
                       </div>
                     </div>
                     <div className="h-10 w-24 bg-[#0066cc]/10 rounded-full"></div>
                  </div>
                  <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                     <div className="flex justify-between items-center mb-6">
                       <div className="h-6 w-32 bg-gray-200 rounded"></div>
                       <div className="h-8 w-8 bg-gray-100 rounded-full"></div>
                     </div>
                     <div className="space-y-3">
                        {[1,2,3,4].map(i => <div key={i} className="h-16 w-full bg-gray-50 rounded-lg border border-gray-100"></div>)}
                     </div>
                  </div>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* FEATURES - BENTO GRID */}
      <section id="features" className="py-32 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">Everything you need.<br/>Nothing you don't.</h2>
            <p className="text-xl text-[#86868b] max-w-2xl mx-auto">A seamless orchestration of tools designed specifically for SAP consulting pipelines.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
            
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: smoothEase }}
              className="md:col-span-2 bg-[#fbfbfd] rounded-[2rem] p-10 overflow-hidden relative group border border-gray-100 shadow-sm"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 text-[#0066cc]">
                  <Users size={24} />
                </div>
                <h3 className="text-3xl font-bold tracking-tight mb-4 text-black">The 8-Step Wizard.</h3>
                <p className="text-lg text-[#86868b] max-w-md leading-relaxed">Candidate registration, reimagined. A seamless, client-side 8-step wizard from personal details to situational judgment.</p>
              </div>
              <div className="absolute right-0 bottom-0 w-[60%] h-[70%] bg-white rounded-tl-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] border-t border-l border-gray-100 translate-y-8 translate-x-8 group-hover:translate-y-6 group-hover:translate-x-6 transition-transform duration-500 p-6 flex flex-col gap-4">
                 <div className="flex items-center gap-4"><div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-[#0066cc]" /></div><div className="h-3 w-32 bg-gray-200 rounded"></div></div>
                 <div className="flex items-center gap-4"><div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-[#0066cc]" /></div><div className="h-3 w-40 bg-gray-200 rounded"></div></div>
                 <div className="flex items-center gap-4 opacity-50"><div className="w-6 h-6 rounded-full border border-gray-300"></div><div className="h-3 w-28 bg-gray-200 rounded"></div></div>
              </div>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: smoothEase }}
              className="md:col-span-1 bg-[#fbfbfd] rounded-[2rem] p-10 overflow-hidden relative border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 text-amber-500">
                <Briefcase size={24} />
              </div>
              <h3 className="text-3xl font-bold tracking-tight mb-4 text-black">SAP Scorecards.</h3>
              <p className="text-lg text-[#86868b] leading-relaxed">Built for SAP. Dedicated scorecards for FI, CO, MM, SD, and 6 other core domains.</p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: smoothEase }}
              className="md:col-span-1 bg-[#fbfbfd] rounded-[2rem] p-10 overflow-hidden relative border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 text-emerald-500">
                <Shield size={24} />
              </div>
              <h3 className="text-3xl font-bold tracking-tight mb-4 text-black">Granular RBAC.</h3>
              <p className="text-lg text-[#86868b] leading-relaxed">Total Control. 15 permission nodes. 7 distinct roles. Uncompromising security for enterprise data.</p>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: smoothEase }}
              className="md:col-span-2 bg-[#fbfbfd] rounded-[2rem] p-10 overflow-hidden flex flex-col justify-between border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="max-w-xl">
                <h3 className="text-3xl font-bold tracking-tight mb-4 text-black">Multi-Round Engine.</h3>
                <p className="text-lg text-[#86868b] leading-relaxed">From HR to CEO. A state-machine driven workflow that tracks technical rounds with surgical precision. Complete lock-safe concurrency prevents data collisions.</p>
              </div>
              <div className="flex items-center gap-4 mt-8">
                 <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="w-full h-full bg-[#0066cc] rounded-full" /></div>
                 <ArrowRight className="w-5 h-5 text-gray-400" />
                 <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"><div className="w-1/2 h-full bg-[#0066cc] rounded-full" /></div>
                 <ArrowRight className="w-5 h-5 text-gray-400" />
                 <div className="flex-1 h-2 bg-gray-200 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PIPELINE / WORKFLOW */}
      <section id="workflow" className="py-32 px-6 bg-[#fbfbfd] border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-black">The Pipeline.</h2>
            <p className="text-xl text-[#86868b] max-w-2xl mx-auto">A seamless flow from initial registration to the final CEO offer.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { num: "01", title: "Application Submitted", desc: "Candidates enter the portal. Resumes parsed. Initial data captured atomically." },
              { num: "02", title: "HR & Tech Review", desc: "Assigned interviewers evaluate SAP competencies in real-time. Lock-safe concurrency." },
              { num: "03", title: "The CEO Round", desc: "Final review. Offer generated. The pipeline concludes with absolute clarity." }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.2, ease: smoothEase }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-300 shadow-sm border border-gray-100 mb-8 group-hover:border-[#0066cc] group-hover:text-[#0066cc] transition-colors duration-500">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-black">{step.title}</h3>
                <p className="text-[#86868b] leading-relaxed max-w-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT US */}
      <section id="about" className="py-32 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="flex-1"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 text-[#0066cc] border border-blue-100">
              <Building size={32} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-black">About Abhiyanta.</h2>
            <p className="text-xl text-[#86868b] leading-relaxed mb-6">
              Abhiyanta India Solutions is a proud SAP Gold Partner, delivering enterprise-grade SAP implementations, migrations, and support worldwide.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We built ATLAS to ensure our hiring process is as precise, structured, and advanced as the solutions we deliver to our clients. Talent is our greatest asset, and ATLAS ensures we identify the very best SAP professionals in the industry.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: smoothEase }}
            className="flex-1 w-full aspect-square bg-[#fbfbfd] rounded-3xl overflow-hidden border border-gray-100 shadow-sm flex items-center justify-center relative"
          >
             {/* Abstract minimal graphic representing the company */}
             <div className="w-64 h-64 bg-white rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 flex items-center justify-center relative z-10">
                <span className="text-gray-300 font-bold text-5xl tracking-tighter">AIS</span>
             </div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-gray-200 rounded-full opacity-50 border-dashed" />
          </motion.div>
        </div>
      </section>

      {/* CONTACT US */}
      <section id="contact" className="py-32 px-6 bg-[#fbfbfd] border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
           <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: smoothEase }}
           >
             <h2 className="text-4xl md:text-5xl font-bold tracking-tighter mb-6 text-black">Get in Touch.</h2>
             <p className="text-xl text-[#86868b] mb-16 max-w-2xl mx-auto">Have questions about the platform or our SAP consulting services? We're here to help.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-[#fbfbfd] rounded-full border border-gray-100 flex items-center justify-center text-gray-700">
                     <Mail size={20} />
                   </div>
                   <span className="font-medium text-black">contact@abhiyanta.com</span>
                </div>
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-[#fbfbfd] rounded-full border border-gray-100 flex items-center justify-center text-gray-700">
                     <Phone size={20} />
                   </div>
                   <span className="font-medium text-black">+91 123 456 7890</span>
                </div>
                <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                   <div className="w-12 h-12 bg-[#fbfbfd] rounded-full border border-gray-100 flex items-center justify-center text-gray-700">
                     <MapPin size={20} />
                   </div>
                   <span className="font-medium text-black">Pune, India</span>
                </div>
             </div>
           </motion.div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-40 px-6 bg-white border-t border-gray-100 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: smoothEase }}
        >
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter mb-10 text-black">Ready to scale your talent?</h2>
          <Link to="/register-candidate" className="inline-block bg-black text-white px-10 py-4 rounded-full text-lg font-medium hover:scale-105 hover:bg-gray-800 transition-all shadow-xl shadow-black/10">
            Apply to Abhiyanta
          </Link>
        </motion.div>
        
        <div className="mt-40 pt-10 border-t border-gray-100 w-full max-w-7xl text-sm text-[#86868b] flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Abhiyanta India Solutions. System engineered by ATLAS.</p>
          <div className="flex items-center gap-6">
             <a href="#" className="hover:text-black transition-colors">Privacy Policy</a>
             <a href="#" className="hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </section>
    </div>
  );
}
