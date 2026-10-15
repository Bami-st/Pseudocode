# Pseudocode Engineering & AI Verification Project

A rigorous engineering repository demonstrating code comprehension, formal specification through pseudocode, independent implementation, and rigorous verification of AI-generated code.

---

## 1. Pseudocode Standard

Every pseudocode specification across this repository adheres strictly to the following contract structure:

```markdown
FUNCTION name
INPUTS: every input with its type and meaning
OUTPUT: the returned result with its type
SIDE EFFECTS: anything written, sent, or changed outside the function, or NONE
FAILS WHEN: every condition under which the function cannot succeed

[Numbered steps, one action per step, in plain English and present tense]
```

### Operational Rules
- **Explicit Branching**: Every branch uses clear `IF` and `OTHERWISE` keywords.
- **Explicit Loops**: Every loop clearly identifies the items being iterated and the termination / stopping condition.
- **Early Returns**: Every return is explicitly identified alongside its return value.
- **External Operations**: External calls to databases, networks, or file systems are prefixed with `CALL`, noting failure modes and latency expectations.
- **State Mutations**: Any variable or persistent mutation outside local registers is prefixed with `WRITE`.
- **Language Agnostic**: Strictly avoids programming-language-specific syntax (e.g., no semicolons, braces, arrow functions, or framework shorthands).

---

## 2. Project Architecture

The repository is divided into three distinct modules plus governance documentation:

```
Pseudocode/
├── CHECKLIST.md              # Requirement-to-evidence compliance matrix
├── README.md                 # Project architecture, reproduction, and lessons
├── defense_notes.md          # 4-part defense preparation notes
├── draft_post.md             # Draft technical post on Part C discovery
├── .env.example              # Clean configuration template (no secrets)
├── .gitignore                # Dependency and credential safeguards
├── package.json              # Automation runners for all verification test suites
│
├── part-a/                   # Part A: Existing Code Analysis & Comprehension
│   ├── a1_complex_pseudocode.md        # Own code: Most complex function
│   ├── a1_money_auth_pseudocode.md      # Own code: Money / authorisation function
│   ├── a1_error_handling_pseudocode.md  # Own code: Error handling function
│   ├── a2_library_selection.md         # Open-source library reference & commit info
│   ├── a2_lib_short.md                 # Open-source: Short function
│   ├── a2_lib_medium.md                # Open-source: Medium complexity function
│   ├── a2_lib_difficult.md             # Open-source: Difficult function
│   ├── a2_comparison_notes.md          # Unaided draft vs AI explanation analysis
│   ├── a3_planted_bug_actual.md        # Planted bug: Actual observed behavior
│   ├── a3_planted_bug_intended.md      # Planted bug: Intended behavior
│   ├── a3_planted_bug_identification.md# Planted bug: Discrepancy diagnosis
│   └── run_tests.js                    # Part A execution and trace comparison runner
│
├── part-b/                   # Part B: Independent Specification & Implementation
│   ├── feature_specification.md        # Complete feature pseudocode specification
│   ├── hand_traces.md                  # 5 pre-implementation hand traces
│   ├── discount_service.js             # User independent implementation (Zero AI)
│   ├── step_mapping.md                 # 1-to-1 mapping between steps and code lines
│   ├── spec_revisions.md               # Revisions made during implementation
│   └── run_tests.js                    # Part B verification test runner
│
└── part-c/                   # Part C: AI Implementation & Verification
    ├── c1_handoff_prompt.md            # Clean pseudocode handoff prompt
    ├── c1_ai_implementation.js         # Isolated AI-generated code
    ├── c2_reverse_engineered_pseudocode.md # Reverse-engineered pseudocode (unaided)
    ├── c2_difference_table.md          # Side-by-side difference & ambiguity table
    ├── c3_ten_input_comparison.md      # 10-input comparison & discrepancy report
    ├── c4_recording_prep.md            # 5-minute presentation speaking notes
    ├── c4_listener_feedback.md         # Human listener comprehension report
    └── run_tests.js                    # Part C side-by-side test harness
```

---

## 3. Reproduction Instructions

To execute and verify all evidence suites from a fresh clone:

### Prerequisites
- Node.js (v18.0.0 or later, v24 recommended)
- Git (v2.40+ recommended)

### Quick Start
```bash
# Clone the repository
git clone <repo-url> pseudocode-verification
cd pseudocode-verification

# Copy environment configuration
cp .env.example .env

# Run all verification test suites (Part A, Part B, Part C)
npm test

# Or run individual verification suites
npm run test:part-a
npm run test:part-b
npm run test:part-c
```

---

## 4. Key Lessons: Specification vs. Implementation

1. **Specification Gaps Become Implementation Divergences**:
   When edge cases (such as boundary timestamps, zero quantities, or float precision) are not stated explicitly in pseudocode, different implementers (human vs AI) make arbitrary, silent assumptions.
2. **Pseudocode Reveals Hidden State Mutations**:
   Marking operations with `WRITE` and `CALL` highlights hidden dependencies and concurrency hazards that syntax highlighting in traditional IDEs tends to obscure.
3. **Hand-Tracing Forces Confrontation with Assumptions**:
   Hand-tracing tricky edge cases before writing code uncovers algorithmic flaws early, preventing flawed logic from ever reaching the implementation stage.
4. **AI Generation Requires Zero-Trust Reverse-Engineering**:
   Generating code with AI without reverse-engineering and rigorous side-by-side verification introduces silent drift, added unnecessary behavior, and unhandled failure modes.
