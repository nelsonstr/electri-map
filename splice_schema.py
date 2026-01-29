
lines = []
with open('supabase/full_schema.sql', 'r') as f:
    lines = f.readlines()

# 0-indexed adjustment defined by logic
# service_requests starts at line 383 (index 382)
# sla_definitions starts at line 899 (index 898)
# sla_breach_history starts at line 944 (index 943)

head_and_categories = lines[:382]
sla_block = lines[898:943]
middle_service_requests_etc = lines[382:898]
tail = lines[943:]

full_content = head_and_categories + sla_block + middle_service_requests_etc + tail

with open('supabase/sorted_schema.sql', 'w') as f:
    f.writelines(full_content)
