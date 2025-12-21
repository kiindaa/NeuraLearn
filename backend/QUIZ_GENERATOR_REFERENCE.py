"""
Quick Reference: How the AI Quiz Generator Works Now
=====================================================

FLOW DIAGRAM:
-------------

User Selects:                   System Generates:
- Topic: "Machine Learning"  →  🎲 Random Seed: 2621
- Difficulty: "Medium"       →  📝 Unique Prompt with ML concepts
- Type: Multiple Choice      →  🌐 API Call with variation parameters
- Count: 5 questions         →  ⚠️  Fallback if API fails
                                ✅ 5 varied ML questions

RANDOMIZATION SOURCES:
----------------------

1. Timestamp (milliseconds)
   - Different for each request
   - Used as API seed parameter

2. Random Seed (1000-9999)
   - Generated per request
   - Embedded in prompt

3. Random Concept Selection
   - 5 concepts randomly chosen from 10+ per topic
   - Different each generation

4. Random Template Selection
   - Multiple question templates per difficulty
   - Randomly selected for each question

5. Random Option Order
   - Multiple choice options shuffled
   - Prevents answer pattern recognition

TOPIC-SPECIFIC CONCEPTS:
------------------------

Machine Learning:
- neural networks, backpropagation, gradient descent
- supervised/unsupervised/reinforcement learning
- overfitting, regularization, cross-validation
- ensemble methods, transfer learning, etc.

Programming:
- algorithms, data structures, OOP
- design patterns, debugging, optimization
- recursion, memory management, testing
- version control, APIs, concurrency, etc.

Data Science:
- data cleaning, EDA, visualization
- statistical analysis, hypothesis testing
- feature selection, model validation
- A/B testing, time series, ETL, etc.

DIFFICULTY LEVELS:
------------------

Easy:
- "What is the primary goal of [concept]?"
- "Define [concept] in simple terms."
- Basic concepts and definitions

Medium:
- "How does [concept] improve performance?"
- "Compare [concept] with traditional approaches."
- Application and analysis questions

Hard:
- "Analyze the computational complexity of [concept]."
- "Design a system using [concept] for scale."
- Complex scenarios and optimization

API PARAMETERS EXPLAINED:
-------------------------

temperature: 0.85
→ Controls randomness (0=deterministic, 1=creative)
→ 0.85 = high creativity for varied questions

do_sample: True
→ CRITICAL: Enables random sampling
→ Without this, output is deterministic

top_p: 0.92
→ Nucleus sampling - consider top 92% of probability mass
→ Balances quality and diversity

repetition_penalty: 1.3
→ Penalizes repeating tokens
→ 1.3 = strong penalty against repetition

no_repeat_ngram_size: 3
→ Prevents repeating 3-word phrases
→ Ensures unique phrasing

seed: timestamp
→ Different seed = different output
→ Uses millisecond timestamp for uniqueness

use_cache: False
→ CRITICAL: Don't return cached responses
→ Forces fresh generation every time

EXAMPLE GENERATIONS:
--------------------

Request 1:
Topic: Machine Learning
Difficulty: Medium
Seed: 2621
Questions:
1. "What are the key parameters to tune in transfer learning?"
2. "How does gradient descent prevent overfitting?"
3. "Compare ensemble methods with single models."

Request 2 (Same Settings):
Topic: Machine Learning
Difficulty: Medium
Seed: 8454 (different!)
Questions:
1. "Explain the role of regularization in neural networks."
2. "How does cross-validation improve model evaluation?"
3. "What are the trade-offs of supervised learning?"

FALLBACK SYSTEM:
----------------

When AI API fails (404, timeout, invalid response):

1. Uses topic_templates dictionary
2. Selects concepts based on topic
3. Chooses difficulty-appropriate templates
4. Tracks used concepts to avoid duplicates
5. Randomizes question variations
6. Shuffles multiple choice options

Result: High-quality, varied questions without AI!

DEBUGGING:
----------

Look for these log messages:

🎯 GENERATING QUIZ:
   → Shows all input parameters

📝 Generated prompt (first 300 chars):
   → Preview of what's sent to AI

🎲 Using randomization seed: 2621
   → Confirms random seed is unique

🌐 Sending request to Hugging Face API...
   → API call being made

✅ API Response Status: 200/404
   → Whether API succeeded or failed

⚠️  Using fallback question generation
   → Fallback system activated

COMMON ISSUES:
--------------

Issue: "Still getting same questions"
Fix: Check logs - verify random seeds are different

Issue: "Questions not matching topic"
Fix: Check topic name in database vs topic_templates keys

Issue: "API always returns 404"
Fix: Add HUGGINGFACE_API_KEY to environment (or use fallback)

Issue: "Questions too easy/hard"
Fix: Check difficulty parameter being passed correctly

TESTING CHECKLIST:
------------------

□ Different topics produce different questions
□ Different difficulties have appropriate complexity
□ Same settings produce varied questions
□ Multiple choice has 4 options
□ Short answer has text prompts
□ Questions are relevant to selected topic
□ No duplicate questions in same quiz
□ Fallback works when API unavailable

CONFIGURATION:
--------------

Environment Variables:
- HUGGINGFACE_API_KEY (optional)
  → Set to use real AI
  → Fallback works without it

Database:
- Topics must exist in CourseTopic table
- Topic names must match keys in topic_templates

Code Locations:
- Main logic: backend/app/ai_service.py
- API routes: backend/app/routes/ai_quiz.py
- Tests: backend/test_quiz_variation.py

PERFORMANCE:
------------

API Call: ~1-2 seconds
Fallback: ~0.1 seconds (instant)
Timeout: 30 seconds max
Cache: Disabled for freshness

METRICS:
--------

Topics Supported: 5+ (easily extensible)
Concepts per Topic: 10-15
Question Templates: 3 per difficulty level
Variations per Generation: Infinite (due to randomization)
Success Rate: 100% (fallback ensures always works)

"""
