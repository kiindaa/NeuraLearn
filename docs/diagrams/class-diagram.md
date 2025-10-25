@startuml
title NeuraLearn - Class Diagram

class User {
  - user_id: String
  - name: String
  - email: String
  - password_hash: String
  - role: String
  - avatar_url: String
  + register()
  + login()
  + get_profile()
}

class Course {
  - course_id: String
  - title: String
  - description: String
  - instructor_id: String
  - thumbnail_url: String
  - created_at: String
  + create_course()
  + update_course()
  + publish_course()
}

class Lesson {
  - lesson_id: String
  - title: String
  - content: String
  - video_url: String
  - duration_minutes: int
  - order_index: int
  + get_content()
  + mark_completed()
}

class Quiz {
  - quiz_id: String
  - title: String
  - lesson_id: String
  - generated_by_ai: boolean
  - status: String
  - time_limit: int
  + generate_quiz()
  + take_quiz()
  + evaluate_answers()
}

class Question {
  - question_id: String
  - quiz_id: String
  - question_text: String
  - options: String[]
  - correct_answer: String
  - explanation: String
  - ai_confidence: float
  + validate_answer()
}

class Progress {
  - progress_id: String
  - user_id: String
  - lesson_id: String
  - quiz_id: String
  - completion_status: String
  - score: float
  - time_spent: int
  + update_progress()
  + calculate_completion()
}

class AIService {
  - api_key: String
  - model_name: String
  + generate_quiz_from_text(content: String): Quiz
  + validate_question_quality(question: Question): boolean
  + adjust_difficulty(questions: Question[]): Question[]
}

class AuthManager {
  - secret_key: String
  + generate_jwt(user_data: Map): String
  + verify_jwt(token: String): Map
  + hash_password(password: String): String
  + verify_password(password: String, hash: String): boolean
}

' Relationships
User "1" -- "*" Course : instructs >
User "1" -- "*" Progress : has >
Course "1" -- "*" Lesson : contains >
Lesson "1" -- "0..1" Quiz : has >
Quiz "1" -- "*" Question : contains >
Quiz "1" -- "*" Progress : results_in >
AIService ..> Quiz : <<generates>>
AIService ..> Question : <<creates>>
AuthManager ..> User : <<authenticates>>

note top of Progress
  Tracks completion status and
  scores for progress dashboard
  shown in Figma designs
end note

note right of AIService
  Uses Hugging Face API for
  quiz generation as specified
  in project requirements
end note

@enduml
