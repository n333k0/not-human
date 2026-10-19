/* The audit demo: what a Not Human audit delivers, told as a story. ILLUSTRATIVE: the company, the people and every
   number are invented for the demo and labelled as such on the page. Values are modelled with the "Hours first, money
   second" method; time returned is time, not headcount. Format after Varick Agents' public audit demo (structure only). */
var NHA = window.NHA = {
  company: 'Agency group', profile: ['4 agencies', '260 people', '14-person finance team', '~$38M revenue', '4 legal entities'],
  weeks: '3 weeks', range: '2–4 weeks with your team',
  stats: [[11, 'People interviewed'], [9, 'Systems connected, read-only'], [19, 'Workflows mapped'], [14, 'Things worth automating']],

  people: [
    ['EP', 'Elena Park', 'CFO', 'Leadership', 'I find out how a month went three weeks after it ended.'],
    ['MH', 'Marcus Hale', 'Group controller', 'Accounting', 'Close is fine as long as I am not on holiday.'],
    ['PN', 'Priya Nair', 'Billing lead', 'Billing', 'Every invoice starts in four places and ends in one person.'],
    ['TB', 'Tom Becker', 'Collections specialist', 'Receivables', 'I chase whoever is oldest, not whoever is likely to pay.'],
    ['AS', 'Ana Sousa', 'Payables specialist', 'Payables', 'Bills come by email, by post and by Slack.'],
    ['DK', 'Daniel Kim', 'FP&A analyst', 'Planning', 'The board pack is six days of copy and paste.'],
    ['LM', 'Laura Méndez', 'Expenses and payroll', 'People ops', 'I re-sort three hundred expenses every month.'],
    ['SO', 'Sam Okoye', 'Head of operations', 'Agency ops', 'Scope changes live in Slack threads.'],
    ['CM', 'Chloe Martin', 'Account director', 'Client side', 'I approve timesheets from my inbox on Sunday night.'],
    ['JF', 'Jonah Fischer', 'Studio manager', 'Agency ops', 'Rate cards live in a PDF nobody can find.'],
    ['IS', 'Ibrahim Saleh', 'Systems and IT', 'IT', 'Each agency we bought kept its own books.'],
  ],

  // the agenda: [day, week, title, people initials, tools, what we learned]
  agenda: [
    ['Mon 3', 1, 'What you want out of this', ['EP', 'MH'], [], 'Two goals agreed: a faster close and cash in sooner. One rule: nothing changes in their systems during the audit.'],
    ['Tue 4', 1, 'Following one invoice, from hours to sent', ['PN', 'CM'], ['Harvest', 'QuickBooks', 'Xero'], 'An invoice touches Harvest, a rate card PDF, an email approval and one of four ledgers before it goes out: twelve steps.'],
    ['Wed 5', 1, 'How money comes back in', ['TB'], ['QuickBooks', 'Xero', 'Gmail'], 'Reminders go out by age of invoice. One client always pays late above $40k and on time below it; the system treats both the same.'],
    ['Thu 6', 1, 'How bills and expenses get paid', ['AS', 'LM'], ['Bill.com', 'Expensify'], 'Bills arrive through three channels. Expense categories do not match any of the four charts of accounts.'],
    ['Fri 7', 1, 'Where extra work gets agreed', ['SO', 'JF'], ['Slack', 'HubSpot'], 'Extra work is agreed in Slack threads and on calls. Most of it never reaches an invoice.'],
    ['Mon 10', 2, 'Closing the month across four companies', ['MH'], ['QuickBooks', 'Xero', 'Sheets'], 'Intercompany recharges live in one spreadsheet that only Marcus fully understands.'],
    ['Tue 11', 2, 'What leadership sees, and when', ['EP', 'DK'], ['Sheets', 'Bank portals'], 'Cash is checked monthly. The board pack takes six working days to assemble from four exports.'],
    ['Wed 12', 2, 'Connecting your tools, read-only', ['IS'], ['All 9'], 'Every tool connected read-only with its own audit account. Nothing written, nothing migrated.'],
    ['Thu 13', 2, 'A year of numbers, side by side', [], ['QuickBooks', 'Xero', 'Harvest'], 'We matched a year of hours to invoices and bills to payments. Two duplicate payments surfaced on day one.'],
    ['Fri 14', 2, 'Turning conversations into hours', [], [], 'Each interview turned into hours: who spends how long on what, every week.'],
    ['Mon 17', 3, 'The process on paper, and the real one', [], [], 'Five processes drawn twice: as written down, and as they really run.'],
    ['Tue 18', 3, 'What is worth automating, in order', [], [], 'Fourteen things worth automating, each with value, effort and who stays in charge.'],
    ['Wed 19', 3, 'Putting a number on it', [], [], 'Every number built from the team’s own hours and a rate they agreed with.'],
    ['Thu 20', 3, 'The order to build it in', [], [], 'Twelve weeks, cheapest wins first, nothing that depends on something unbuilt.'],
    ['Fri 21', 3, 'Walking you through it', ['EP', 'MH'], [], 'One hour together. They keep the full audit, whatever they decide next.'],
  ],

  // tools: [name, role, state (auto|manual|broken), note]
  systems: [
    ['Harvest', 'Time tracking', 'manual', 'Hours exported by hand into invoices every month'],
    ['QuickBooks ×2', 'Books for two agencies', 'manual', 'Two charts of accounts, mapped by hand at close'],
    ['Xero ×2', 'Books for two agencies', 'manual', 'Two more charts of accounts'],
    ['HubSpot', 'Deals and contracts', 'broken', 'Signed scope never reaches billing'],
    ['Bill.com', 'Payables', 'auto', 'Syncs payments to the books'],
    ['Expensify', 'Expenses', 'broken', '300 expenses re-sorted every month'],
    ['Stripe', 'Card payments', 'auto', 'Payments land in the books on their own'],
    ['Slack', 'Team chat', 'broken', 'Scope changes agreed here, then lost'],
    ['Google Sheets', 'Everywhere', 'manual', 'Intercompany, cash, board pack, rate cards'],
  ],

  // how 14 people spend their week, as 100 dots: [label, %, tone, plain line]
  time: [
    ['Moving information between tools', 34, 'a', 'Copying hours, re-keying bills, exporting reports'],
    ['Gathering and checking data', 26, 'b', 'Hunting for the right number before work can start'],
    ['Chasing people', 18, 'c', 'Approvals, missing receipts, who agreed what'],
    ['Judgement calls', 13, 'h', 'Exceptions that really need a person'],
    ['Analysis and advice', 9, 'w', 'The work they were hired to do'],
  ],
  timeNote: '78% of the team’s week is work an agent can take or speed up. 13% needs judgement and stays human. Only 9% is the analysis they were hired for.',

  // paper vs reality: [area, paper steps, real steps, handoffs, cycle, volume, gaps[]]
  processes: [
    ['Billing', ['Time logged', 'Invoice drafted', 'Invoice sent'], 12, 5, '11 days after month end', '~420 invoices a month',
      ['Hours, rates and approvals live in four places', 'Account directors approve timesheets by email, often late', 'Extra work agreed in Slack is rarely billed', 'Each agency invoices from its own ledger and template']],
    ['Collections', ['Invoice due', 'Reminder sent', 'Payment applied'], 8, 3, '58 days to get paid (benchmark 42)', '~$6.1M owed at any time',
      ['Chased by age only, not by how each client pays', 'Payments matched to invoices by hand for half the clients', 'No one sees all four agencies’ receivables at once']],
    ['Month-end close', ['Checklist', 'Journals', 'Reconcile', 'Consolidate', 'Report'], 15, 7, '14 working days', '4 entities, 4 charts of accounts',
      ['Intercompany recharges in one spreadsheet, one owner', 'Four charts of accounts mapped by hand every month', 'Close status checked by asking each person']],
    ['Payables and expenses', ['Bill received', 'Approved', 'Paid'], 9, 4, '6 days per bill', '~1,100 bills, ~300 expenses a month',
      ['Bills arrive by email, post and Slack', 'Two duplicate payments in twelve months ($41k)', 'Expense categories re-sorted by hand at close']],
    ['Cash and reporting', ['Pull numbers', 'Analyse', 'Present'], 7, 3, 'Board pack takes 6 days', 'Cash checked once a month',
      ['Cash position rebuilt in a spreadsheet each month', 'Board pack built from four separate exports', 'Leadership sees a month three weeks after it ends']],
  ],

  // findings: [tag, number, headline, story, cost]
  findings: [
    ['Time', '11 days', 'Invoices leave eleven days after the month ends.', 'Priya rebuilds every invoice from Harvest exports, a rate card PDF and an approval email, then keys it into one of four ledgers. Account directors approve timesheets late, so billing waits for them.', 'About 2,100 hours a year across billing and account directors.'],
    ['Cash', '1.2%', 'Extra work is agreed, delivered and never billed.', 'Change requests are agreed in Slack and on calls. Matching a year of hours to invoices showed 1.2% of revenue in work that was done but never invoiced.', '~$456k a year of work already delivered.'],
    ['Cash', '58 days', 'Clients pay in 58 days; similar agencies get paid in 42.', 'Tom chases the oldest invoices first. Payment history shows clear patterns (some clients pay late only on large invoices, some only in December) that nobody uses.', 'About $1.5M of cash tied up; ~$117k a year at the group’s cost of borrowing.'],
    ['Risk', '1 person', 'One spreadsheet runs the intercompany recharges, and one person understands it.', 'Marcus built it after the last acquisition. When he is away, close stops. There is no documentation and no second person.', 'Close delays and audit risk, not yet priced.'],
    ['Time', '4 ledgers', 'Four charts of accounts are mapped together by hand every month.', 'Each agency kept its own books after acquisition. Consolidation is two days of mapping before close can even start.', 'About 380 hours a year.'],
    ['Cash', '$41k', 'Two bills were paid twice last year.', 'Bills arrive by email, post and Slack, sometimes all three. Nothing checks across agencies for the same vendor and amount.', '$41k recovered; ~$95k a year of duplicates and unused subscriptions.'],
    ['Time', '6 days', 'The board pack takes six days to build.', 'Daniel exports from four ledgers, Harvest and HubSpot, reconciles them in a spreadsheet and pastes them into slides.', 'About 290 hours a year, and decisions made on old numbers.'],
    ['Risk', 'Monthly', 'Cash is a monthly question.', 'Elena sees the cash position once a month, after close. Payroll weeks are planned on a number that is already weeks old.', 'Not priced; a weekly view removes the guesswork.'],
  ],

  risks: [
    ['Single point of failure', 'critical', 'Intercompany recharges', 'One spreadsheet, one owner, no documentation.'],
    ['Revenue leakage', 'critical', 'Unbilled extra work', '1.2% of revenue delivered and never invoiced.'],
    ['Payments', 'high', 'Duplicate bills', 'No check across agencies for the same vendor and amount.'],
    ['Data', 'high', 'Four charts of accounts', 'Consolidation depends on a manual mapping each month.'],
    ['Visibility', 'medium', 'Monthly cash view', 'Payroll planned on weeks-old numbers.'],
    ['Reporting', 'medium', 'Six-day board pack', 'Leadership decides on a month three weeks late.'],
  ],

  // opportunities: [area, name, value $k/yr, effort 1-3, weeks "from–to", now, then, a person decides]
  opps: [
    ['Billing', 'Invoice drafting from time', 180, 1, [1, 4], 'Invoices rebuilt by hand from four places', 'Drafts ready the day work is approved, line by line', 'Billing lead approves each invoice'],
    ['Billing', 'Extra-work capture', 420, 2, [3, 7], 'Scope changes lost in Slack and calls', 'Every request logged against the contract, quoted or billed', 'Account director confirms what is billable'],
    ['Billing', 'Rate cards and contract rules', 30, 1, [1, 2], 'Rates in PDFs nobody can find', 'One set of rules every agent reads', 'Studio manager owns the rules'],
    ['Collections', 'Collections by payment behaviour', 85, 2, [4, 7], 'Chased by age only', 'Reminders timed to how each client actually pays', 'Collections specialist approves escalations'],
    ['Collections', 'Payment matching', 45, 1, [4, 6], 'Half the payments matched by hand', 'Payments matched across all four ledgers', 'Flags only'],
    ['Collections', 'Faster cash (DSO 58 → 44)', 117, 2, [4, 10], 'Cash tied up 16 days longer than peers', '~$1.5M released, earning its keep', 'CFO sees it weekly'],
    ['Close', 'Intercompany recharges', 60, 3, [6, 11], 'One spreadsheet, one owner', 'Recharges calculated, explained and documented', 'Controller approves journals'],
    ['Close', 'Close tracker', 40, 1, [5, 7], 'Status checked by asking around', 'One live view of every task, every entity', 'Nobody: it is a view'],
    ['Close', 'Chart-of-accounts mapping', 35, 2, [2, 5], 'Four ledgers mapped by hand monthly', 'Mapping kept by an agent, exceptions flagged', 'Controller reviews new accounts'],
    ['Payables', 'Bill intake and coding', 55, 1, [2, 5], 'Bills from email, post and Slack', 'One intake, coded and routed for approval', 'Budget owner approves each bill'],
    ['Payables', 'Duplicate and leakage watch', 95, 1, [1, 3], 'Nothing checks across agencies', 'Duplicates and unused subscriptions flagged before payment', 'Payables specialist decides'],
    ['Payables', 'Expense sorting', 25, 1, [2, 4], '300 expenses re-sorted monthly', 'Expenses mapped to the right ledger as they arrive', 'Flags only'],
    ['Reporting', 'Weekly cash pulse', 10, 1, [2, 3], 'Cash seen once a month', 'Every Monday at 8:00, across four entities', 'Read-only'],
    ['Reporting', 'Board pack assembly', 25, 2, [8, 12], 'Six days of exports and slides', 'A draft pack two days after close', 'CFO edits and presents'],
  ],

  value: [
    ['Time returned to the team', 450, 'Finance team and account directors, at agreed hourly costs. Time, not headcount.'],
    ['Work delivered but never billed', 456, '1.2% of revenue, matched from a year of hours and invoices.'],
    ['Cash in sooner', 117, '16 fewer days to get paid on ~$38M, at the group’s cost of borrowing.'],
    ['Duplicates and leakage stopped', 95, 'Duplicate bills and unused subscriptions across four agencies.'],
    ['Fewer errors at close', 70, 'Rework hours and audit fees, measured against last year.'],
  ],
  valueNote: 'Modelled for an illustrative company. Each line is built from the team’s own hours, a year of their data, and rates they agreed with. After go-live, the same numbers are measured again and reported.',

  next: [
    ['Read-through', 'One hour together on this audit. You keep it, whatever you decide.'],
    ['Pick the first system', 'We suggest billing: the most value, the least effort, and it unblocks the rest.'],
    ['Accounts and access', 'Each agent gets its own account, read-only first, on your own server and your private network (Tailscale).'],
    ['Shadow mode', 'For two weeks the agents work next to the team without acting, until they agree with them.'],
    ['First close with agents', 'Week 8: the first month-end where the agents prepare and people approve.'],
  ],
  roles: [
    ['Billing lead', 'Main contact for weeks 1–4, 2 hours a week'],
    ['Controller', '30 minutes a week, approves every rule that touches the books'],
    ['Systems and IT', 'Creates the agents’ accounts, half a day in week 1'],
    ['CFO', 'Monthly read-out, 30 minutes'],
  ],
};

/* ---------------------------------------------------------------- the plan, technical: how it is built and why it is safe.
   These are the options we choose between at the audit, written as specs; nothing here claims a client deployment. */
NHA.tech = {
  lede: 'For your IT lead. Every agent is a small, typed program with its own identity, running inside your own infrastructure. We pick the deployment with you; both keep your data inside your perimeter.',
  modes: {
    cloud: { name: 'Private cloud', line: 'A dedicated VM in your own AWS, GCP or Hetzner account. Frontier models through business APIs with zero data retention.',
      layers: [
        ['Interface', 'Slack approvals · email · a read-only dashboard', 'Where people approve, edit or reject'],
        ['Orchestration', 'Event queue · idempotent jobs · retries · typed JSON outputs', 'Each step validated before the next one runs'],
        ['Agents', '14 single-purpose agents · one service account each', 'Least-privilege scopes, read-only by default'],
        ['Memory', 'Second brain: Markdown in Git + hybrid search (BM25 + embeddings)', 'Versioned, diffable, yours'],
        ['Inference', 'Model router: frontier API for drafting and judgement, small models for sorting', 'Zero-retention business terms; no training on your data'],
        ['Runtime', 'Linux VM in your cloud account · containers · nightly encrypted backups', 'Provisioned from code, patched automatically'],
        ['Network', 'Tailscale tailnet over WireGuard · ACLs per person and device · no public ingress', 'Tool events arrive through one signed webhook'],
      ] },
    local: { name: 'On-premise, local inference', line: 'A machine in your office or data centre. Open-weight models run on your own GPU, so ledger data never leaves the building.',
      layers: [
        ['Interface', 'Slack approvals · email · a read-only dashboard', 'Same experience for the team'],
        ['Orchestration', 'Event queue · idempotent jobs · retries · typed JSON outputs', 'Same pipeline, same checks'],
        ['Agents', '14 single-purpose agents · one service account each', 'Least-privilege scopes, read-only by default'],
        ['Memory', 'Second brain: Markdown in Git + local embeddings', 'Embeddings computed on your hardware'],
        ['Inference', 'Open-weight models served locally (vLLM or Ollama) · frontier API only for non-sensitive text, if at all', 'Prompts and ledgers stay on-premise'],
        ['Runtime', 'Your server with a GPU · containers · encrypted disk and backups', 'No third-party compute'],
        ['Network', 'Tailscale tailnet over WireGuard · ACLs · no inbound ports opened', 'Reachable only from your team’s devices'],
      ] },
  },
  // tool, how we connect, what the agent may do, access level (read | draft | write)
  connectors: [
    ['Harvest', 'REST API v2 · personal access token for the agent’s own user', 'Read time entries, projects, rates', 'read'],
    ['QuickBooks Online ×2', 'OAuth 2.0 · accounting scope', 'Read ledgers · create invoices as drafts only', 'draft'],
    ['Xero ×2', 'OAuth 2.0 · granular scopes', 'Read transactions · create draft invoices and bills', 'draft'],
    ['HubSpot', 'Private app · scoped token', 'Read deals, contracts, line items', 'read'],
    ['Bill.com', 'API · agent sync user', 'Create bills for approval · never pay', 'draft'],
    ['Expensify', 'Integration Server API', 'Read reports · suggest categories', 'read'],
    ['Stripe', 'Restricted key + signed webhooks', 'Read payments and payouts', 'read'],
    ['Slack', 'Bot user · interactive messages', 'Post approval cards · read the channels it is invited to', 'write'],
    ['Google Drive and Sheets', 'Service account · shared per file', 'Read contracts and rate cards · write the cash pulse sheet', 'write'],
    ['Gmail', 'Gmail API · one shared inbox · label-scoped', 'Read bills and remittances that arrive by email', 'read'],
  ],
  // agent specs, written as the config we would ship
  specs: [
    ['invoice-drafter', `agent: invoice-drafter
runs_on: vm-finance-01        # your cloud account, eu-west-1
network: tailnet              # no public ingress
trigger: harvest.timesheet.approved | month_end
reads:
  - harvest.time_entries
  - hubspot.deals.line_items
  - memory://billing/rate-cards
writes:
  - quickbooks.invoices  [status: draft]
  - xero.invoices        [status: draft]
model:
  draft_notes: frontier   # zero data retention
  classify:   small
output_schema: Invoice@v3     # validated before write
confidence:
  auto: never               # money: always a person
  review: ">= 0.80"
  escalate: "< 0.80"
approver: billing-lead
eval: 240 past invoices, must match >= 97%
log: append-only, 400 days`],
    ['scope-watcher', `agent: scope-watcher
runs_on: vm-finance-01
trigger: slack.message | meeting.summary
reads:
  - slack.channels  [project-*]
  - memory://clients/*/contracts
  - memory://meetings/*
writes:
  - hubspot.notes
  - memory://clients/*/change-requests
model:
  detect_request: small
  match_contract: frontier
confidence:
  log_only: ">= 0.70"
  ask_account_director: "< 0.70"
approver: account-director
eval: 3 months of channels, recall >= 90%
privacy: no DMs, invited channels only`],
    ['intercompany', `agent: intercompany-recharges
runs_on: vm-finance-01
trigger: close.day_2
reads:
  - quickbooks.*.journals
  - xero.*.journals
  - memory://close/recharge-rules   # was one spreadsheet
writes:
  - journals  [status: proposed]
  - memory://close/recharge-notes
model:
  reconcile: deterministic           # plain code, no LLM
  explain:   frontier
checks:
  - recharges_net_to_zero
  - each_line_has_source
approver: group-controller
rollback: one command, every journal tagged`],
  ],
  guarantees: [
    ['No public ingress', 'The server opens no ports to the internet. Only devices on your tailnet reach it.'],
    ['Least privilege', 'Each agent holds its own scoped credentials. Money-moving permissions are never granted.'],
    ['Zero retention', 'Cloud models run on business terms with no training and no retention; or locally, with nothing leaving.'],
    ['Evals before promotion', 'An agent earns autonomy by matching your team’s past decisions on real history, not by a demo.'],
    ['Deterministic where it can be', 'Arithmetic, matching and checks run as plain code. Models write and judge; code counts.'],
    ['Append-only log, one switch', 'Every read, decision and write is logged with its reason. One command pauses everything.'],
  ],
};
