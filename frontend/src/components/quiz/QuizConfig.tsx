import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const topics = [
  { id: 'ml', name: 'Machine Learning' },
  { id: 'programming', name: 'Programming' },
  { id: 'ds', name: 'Data Science' },
  { id: 'ai', name: 'Artificial Intelligence' },
  { id: 'web', name: 'Web Development' },
];

const questionTypes = [
  { id: 'multiple_choice', name: 'Multiple Choice' },
  { id: 'true_false', name: 'True/False' },
  { id: 'short_answer', name: 'Short Answer' },
];

const difficulties = [
  { id: 'easy', name: 'Easy' },
  { id: 'medium', name: 'Medium' },
  { id: 'hard', name: 'Hard' },
];

export const QuizConfig = () => {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple_choice']);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const navigate = useNavigate();

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const toggleQuestionType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId)
        ? selectedTypes.length > 1 ? prev.filter(id => id !== typeId) : prev
        : [...prev, typeId]
    );
  };

  const handleStartQuiz = () => {
    // TODO: Implement quiz generation logic
    navigate('/quiz');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Quiz</h1>
      
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Topics</h2>
        <div className="flex flex-wrap gap-3">
          {topics.map(topic => (
            <button
              key={topic.id}
              onClick={() => toggleTopic(topic.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTopics.includes(topic.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Question Types</h2>
          <div className="space-y-3">
            {questionTypes.map(type => (
              <label key={type.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => toggleQuestionType(type.id)}
                  className="rounded text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{type.name}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Difficulty</h2>
          <div className="space-y-3">
            {difficulties.map(diff => (
              <label key={diff.id} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="difficulty"
                  checked={difficulty === diff.id}
                  onChange={() => setDifficulty(diff.id)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{diff.name}</span>
              </label>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col space-y-2">
          <label htmlFor="questionCount" className="text-sm font-medium text-gray-700">
            Number of Questions: {questionCount}
          </label>
          <input
            id="questionCount"
            type="range"
            min="5"
            max="20"
            value={questionCount}
            onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20</span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleStartQuiz}
          disabled={selectedTopics.length === 0}
          className="px-8 py-3 text-lg"
        >
          Start Quiz
        </Button>
      </div>
    </div>
  );
};
