# Claude.md - Life Systems Architect Development Guide

This file contains essential context and guidelines for developing the Life Systems Architect app using Claude Code.

## Project Overview

**Life Systems Architect** is a transformational mobile app that uses short, powerful AI questions to guide users from just reacting to problems to actively designing their life. Built with Expo architecture, featuring smart AI systems and a seven-phase growth journey.

## Core Philosophy

A thoughtful AI companion that guides users through an important transformation—learning to design the life they want instead of just reacting to whatever happens.

## Architecture

- **Framework**: Expo with Single App Structure
- **Backend**: Supabase (auth, database, storage)
- **AI**: Advanced OpenAI GPT-4 with multi-system orchestration
- **Design**: Cosmic purple/aurora blue, glassmorphic design
- **Navigation**: React Navigation with transformation-aware routing
- **Core Systems**: Thoughtful questioning, pattern recognition, leverage analysis

## Development Workflow

1. **One task at a time** - Complete and validate before proceeding
2. **Test commands**: Run `pnpm lint`, `pnpm typecheck`, `pnpm test` after changes
3. **Build validation**: Use `eas build --profile preview` for testing

## Key Directories

```
apps/mobile/                 # Main Expo app
├── screens/
│   ├── auth/               # Sign-up, login screens
│   ├── onboarding/         # Welcome flow
│   └── main/               # Home, check-in, history, settings
├── components/             # Reusable UI components
├── services/               # API calls, Supabase client
└── ai/
    └── prompts/            # AI system prompts

design-system/              # Design tokens and styled components
```

## The Seven-Phase Transformation

### **Phase 1: Wisdom Through Scientific Inquiry** - "Building Awareness Using Proven Methods"
- Use scientifically-proven psychological methods to build deep self-awareness
- Rotate through CBT Socratic questioning, motivational interviewing, Stoic practices
- Apply 5-Why methodology and narrative concrete questioning for systematic insight development

### **Phase 2: Understanding** - "The Leverage Principle"
- Shift from working harder to working on the right systems
- Learn to identify the few changes that transform everything
- See connections between seemingly unrelated life areas

### **Phase 3: Realization** - "The Meta-Life Loop"
- Transition from fixing problems to eliminating their root causes
- Every challenge becomes a system design opportunity
- Surface-level changes evolve into foundational architecture

### **Phase 4: Transformation** - "Infinite Leverage"
- Problems become design challenges, not struggles
- Success becomes systematic, not lucky
- Build life systems that make goals inevitable

### **Phase 5: Vision** - "The Life You're Capable Of"
- See what becomes possible with proper system architecture
- Understand how small changes compound into massive transformations
- Design the life most people think is impossible

### **Phase 6: Reality** - "The Architected Life"
- Daily existence as a life systems designer
- Health, wealth, relationships, and fulfillment by design
- Living intentionally while others live reactively

### **Phase 7: Integration** - "The Complete Transformation"
- Become someone who designs outcomes rather than hopes for them
- Join the small group who architect their reality
- Master the meta-skill that improves everything else

## The Six Interconnected Life Systems

### **Health System**: Energy, vitality, and physical foundation
### **Wealth System**: Financial freedom and resource architecture
### **Relationship System**: Connection, love, and social architecture
### **Growth System**: Learning, skills, and personal evolution
### **Purpose System**: Meaning, contribution, and legacy design
### **Environment System**: Space, culture, and contextual design

## Daily Life Architecture Practice

### **Daily Check-in Questions**
Each day, the AI asks 3-5 short, scientifically-based questions (3-8 words) using proven psychological methods:

**Sample Questions (Phase 1 - Scientific Methods):**
- "When do you feel most you?" *(Open-ended & Concrete)*
- "What story am I rehearsing right now?" *(CBT Socratic)*
- "If you chose to act, what first step feels smallest?" *(Motivational Interviewing)*
- "If not now, when?" *(Stoic Time-Consciousness)*
- "Why does this matter to me right now?" *(5-Why Root Cause)*

### **Smart Life Analysis**
Your responses feed into smart AI analysis that spots patterns, finds the biggest opportunities for change, and suggests better approaches.

## Database Schema (Supabase)

```sql
-- Core user journey tracking
users (id, email, current_phase, transformation_start_date, life_systems_data, profile_data)
phases (id, user_id, phase_number, start_date, insights, breakthroughs, completion_status)
daily_reflections (id, user_id, date, questions, responses, ai_analysis, depth_level)

-- Life systems framework
life_systems (id, user_id, system_type, current_state, target_state, interventions, last_updated)
patterns (id, user_id, pattern_type, description, first_identified, impact_areas, transformation_potential)
leverage_points (id, user_id, intervention, potential_impact, implementation_status, system_connections)

-- AI analysis and insights
system_analyses (id, user_id, analysis_type, insights, connections, recommendations, created_at)
wisdom_conversations (id, user_id, conversation_thread, depth_level, revelations, follow_ups)
architectural_designs (id, user_id, life_area, current_design, proposed_design, implementation_steps)
```

## Environment Variables

Required in `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

## Design System Tokens

- **Primary Colors**: Cosmic purple, aurora blue
- **Style**: Glassmorphic with blur effects
- **Components**: Cards, buttons, inputs with cosmic theme

## Testing Strategy

- **Unit**: Component testing with Jest
- **Integration**: API endpoint testing
- **E2E**: Complete user journey testing
- **Beta**: TestFlight builds with feedback collection

## Security & Privacy

- Row Level Security (RLS) enabled on all user data
- End-to-end encryption for sensitive data
- Data export and account deletion options
- Privacy controls for AI processing

## AI Implementation

### **Master AI Systems**

**System 1: Scientific Inquiry Engine**
```
Guide users through scientifically-proven psychological methods for self-discovery.
Use CBT Socratic questioning, motivational interviewing, Stoic practices, 
5-Why methodology, and narrative concrete questioning. Rotate through different
scientific approaches based on user's phase and readiness level.
```

**System 2: Life Architecture Mapper**
```
Analyze user responses to identify current life systems and 
interconnections. Map progress from reactive to architectural thinking.
Identify: patterns they can't see, leverage points for maximum impact,
systems needing redesign vs. optimization, beliefs limiting design thinking.
```

**System 3: Root Cause & Leverage Analysis**
```
Using systems thinking principles, identify underlying patterns creating
current results. Look for: beliefs cascading into behaviors,
habits compounding into outcomes, relationships between life areas,
highest-leverage interventions for transformation.
```

**System 4: Life Design Guidance**
```
Based on vision and current reality, design specific systems they could
implement. Focus on: practical architectures demonstrating systems thinking,
changes solving multiple problems simultaneously, interventions proving
small inputs can yield exponential outputs.
```

### **The Naval Ravikant Framework Integration**
- **Leverage Over Effort**: Find the few things that matter most
- **Systems Over Goals**: Build architectures that make success inevitable
- **Principles Over Tactics**: Understand underlying patterns
- **Compound Over Linear**: Small consistent changes that compound exponentially
- **Design Over Default**: Intentionally architect rather than drift

## Performance Requirements

- Smooth 60fps animations
- Streaming AI responses
- Offline draft saving
- Optimized image handling

## Launch Readiness Checklist

- [ ] Core flow: signup → onboarding → check-in → AI insights
- [ ] Data persistence and retrieval
- [ ] Personal AI responses with context
- [ ] Design system implementation
- [ ] History and progress tracking
- [ ] Settings and preferences
- [ ] Performance optimization
- [ ] Privacy compliance

## Common Commands

```bash
# Development
pnpm dev
pnpm lint
pnpm typecheck
pnpm test

# Build
eas build --profile preview
eas submit

# Database
npx supabase gen types typescript --local
```

## Development Phases

### **Phase 1: AI Foundation (2-3 weeks)**
1. ✅ Basic project setup
2. ✅ Advanced database schema implementation
3. ✅ Sophisticated AI prompt system architecture
4. ✅ Wisdom questioning engine foundation
5. ✅ Transformation phase tracking system

### **Phase 2: Core Systems (3-4 weeks)**
1. Seven-phase transformation journey implementation
2. Six life systems framework structure
3. Pattern recognition and analysis engine
4. Leverage point identification system
5. Basic systems thinking analysis

### **Phase 3: Advanced Intelligence (2-3 weeks)**
1. Multi-system AI orchestration
2. Complex interconnection mapping
3. Progressive insight revelation system
4. Context-aware conversation memory
5. Architectural thinking tools

### **Phase 4: User Experience & Polish (2-3 weeks)**
1. Naval Ravikant-inspired frameworks
2. Dynamic questioning based on patterns
3. Compound effect tracking and visualization
4. Complete user journey optimization
5. Beta testing and refinement

### **Deferred to Future Phases:**
- Advanced data visualization and insights dashboards
- Community features for life architects
- Integration with external life management tools
- Advanced behavioral change tracking
- Predictive life systems modeling

## Notes for Claude

- Always run lint/typecheck after code changes
- Follow existing code patterns and conventions
- Use design system tokens consistently
- Test AI prompts for empathetic, contextual responses
- Validate user flows end-to-end before marking tasks complete
- Prioritize user privacy and data security