import React from 'react';
import { BookOpen, Clock, Award, TrendingUp, Lock } from 'lucide-react';

interface LearningCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    icon: string;
    duration: string;
    lessonCount: number;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    isPremium: boolean;
    progress?: number;
    certificate: boolean;
    category: string;
    instructor?: string;
    rating?: number;
    students?: number;
  };
  onClick?: () => void;
}

const LearningCard: React.FC<LearningCardProps> = ({ course, onClick }) => {
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 hover:border-green-400 transform hover:scale-105"
      onClick={onClick}
    >
      {/* Premium Banner */}
      {course.isPremium && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Award size={16} />
            Premium Course
          </span>
          {course.certificate && (
            <span className="text-xs bg-white/30 px-2 py-1 rounded-full">
              🏆 Certificate Included
            </span>
          )}
        </div>
      )}

      {/* Course Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white">
        <div className="text-6xl mb-3">{course.icon}</div>
        <h3 className="text-xl font-bold mb-2">{course.title}</h3>
        <div className="flex items-center justify-center gap-2 text-sm opacity-90">
          <Clock size={14} />
          <span>{course.duration}</span>
          <span>•</span>
          <span>{course.lessonCount} lessons</span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
          {course.description}
        </p>

        {/* Course Metadata */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Difficulty</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(course.difficultyLevel)}`}>
              {course.difficultyLevel.charAt(0).toUpperCase() + course.difficultyLevel.slice(1)}
            </span>
          </div>
          
          {course.instructor && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Instructor</span>
              <span className="text-xs font-medium text-gray-900">{course.instructor}</span>
            </div>
          )}

          {course.rating && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Rating</span>
              <span className="text-xs font-medium text-amber-600">
                ⭐ {course.rating}/5.0
              </span>
            </div>
          )}

          {course.students && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Students</span>
              <span className="text-xs font-medium text-gray-900">
                {course.students.toLocaleString()}+ enrolled
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (if enrolled) */}
        {typeof course.progress !== 'undefined' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-gray-700">Your Progress</span>
              <span className="text-xs font-semibold text-green-600">{course.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Course Features */}
        <ul className="space-y-2 mb-4 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            {course.lessonCount} video lessons
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Hands-on projects
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            Lifetime access
          </li>
          {course.certificate && (
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Certificate of completion
            </li>
          )}
        </ul>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            {course.price > 0 ? (
              <div>
                <div className="text-2xl font-bold text-green-600">${course.price}</div>
                <div className="text-xs text-gray-500">One-time payment</div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">Free</div>
            )}
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl">
            {typeof course.progress !== 'undefined' ? (
              <>
                <BookOpen size={18} />
                Continue
              </>
            ) : (
              <>
                {course.isPremium && <Lock size={18} />}
                {course.price > 0 ? 'Enroll Now' : 'Start Free'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LearningCard;
