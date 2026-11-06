# Feature Flag Admin
Roles: engineer (toggle staging), admin (toggle prod), viewer (read).
Entity Flag: key, description, env (staging|prod), state (off|on|percentage), percentage, owner, updated_at.
Transitions: off -> on | percentage; on -> off; percentage -> on | off. Prod transitions admin only. Reason required.
Views: table grouped by env with inline toggle, flag detail, audit tab. Seed: 12 flags.
