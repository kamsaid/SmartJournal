# Plan Feature - Implementation Guide

## Overview
The Plan feature replaces the History tab with a productivity-focused planning tool that transforms morning check-in intentions into actionable tasks.

## Setup Instructions

### 1. Database Migration
Run the SQL migration to create the required tables:

```sql
-- Run the migration file:
-- create-plan-tables.sql
```

This creates two new tables:
- `plan_intents` - Stores clarified intentions
- `plan_tasks` - Stores atomic tasks (max 30 min each)

### 2. Environment Variables
Ensure your OpenAI API key is configured:
```
EXPO_PUBLIC_OPENAI_API_KEY=your-api-key-here
```

### 3. Test the Feature
1. Complete a Morning Check-In with "What will make today great?" answers
2. Navigate to the Plan tab
3. Select an intention to clarify
4. Review the AI-generated clarification and 3 atomic tasks
5. Check off tasks as you complete them

## Architecture

### Components
- **PlanScreen** (`src/screens/plan/PlanScreen.tsx`)
  - Main screen component
  - Displays morning intentions
  - Shows clarification modal
  - Manages task checkboxes

### Services
- **planAssistant** (`src/services/openai/planAssistant.ts`)
  - `clarifyAndChunk()` - AI clarification and task generation
  - `updateTaskStatus()` - Toggle task completion
  - `getTodayPlanIntents()` - Fetch today's plans

### Database Schema
```typescript
// plan_intents table
{
  id: uuid
  user_id: uuid
  date: date
  intent_text: text
  clarified_text: text
  created_at: timestamp
}

// plan_tasks table
{
  id: uuid
  intent_id: uuid
  title: text
  est_minutes: int (max 30)
  status: 'pending' | 'done'
  created_at: timestamp
  updated_at: timestamp
}
```

## AI Prompts

### Clarification Prompt
```
You are a concise life coach.
Rewrite the following goal in <=12 words, starting with a strong verb.
If vague, ask ONE clarifying question first.
```

### Task Generation Prompt
```
Role: Systems-thinking coach.
Turn the clarified goal below into exactly THREE atomic actions, each <=30 min.
Respond as JSON array: [{"title":"", "estMinutes":25}]
```

## Features
- ✅ Replaces History tab with Plan tab
- ✅ Fetches morning check-in intentions
- ✅ AI clarification of vague goals
- ✅ Generates 3 atomic tasks (≤30 min each)
- ✅ Persistent task completion status
- ✅ Clean, intuitive UI with modal flow
- ✅ RLS policies for data security

## Future Enhancements
- Integration with Nightly Check-In to review task completion
- Task scheduling and time tracking
- Recurring intentions
- Task analytics and insights 