import re

with open("frontend-new/src/components/candidate-profile-tabs.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('{s.selected_option}. {SITUATIONAL_QUESTIONS[s.question_number - 1]?.options[s.selected_option.charCodeAt(0) - 65]}', '{s.selected_option}. {SITUATIONAL_QUESTIONS[s.question_number - 1]?.options[s.selected_option?.charCodeAt(0) - 65] || ""}')

with open("frontend-new/src/components/candidate-profile-tabs.tsx", "w", encoding="utf-8") as f:
    f.write(content)
