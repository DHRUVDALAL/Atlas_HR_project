import re

with open("frontend-new/src/components/candidate-profile-tabs.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_str = 'import { PERSONALITY_QUESTIONS, SITUATIONAL_QUESTIONS, WRITTEN_QUESTIONS } from "@/routes/register-candidate";\n'
content = content.replace('import type { CandidateDetail } from "@/lib/types";', 'import type { CandidateDetail } from "@/lib/types";\n' + import_str)

content = content.replace('{a.question_text}', '{PERSONALITY_QUESTIONS[a.question_number - 1] || "Unknown Question"}')
content = content.replace('{a.rating_value}', '{a.rating}')

content = content.replace('{s.scenario_text}', '{SITUATIONAL_QUESTIONS[s.question_number - 1]?.prompt || "Unknown Scenario"}')
content = content.replace('{s.response_text}', '{s.selected_option}')

content = content.replace('{w.question_text}', '{WRITTEN_QUESTIONS[w.question_number - 1] || "Unknown Question"}')
content = content.replace('{w.response_text}', '{w.answer_text}')

with open("frontend-new/src/components/candidate-profile-tabs.tsx", "w", encoding="utf-8") as f:
    f.write(content)
