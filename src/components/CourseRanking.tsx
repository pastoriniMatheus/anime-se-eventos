
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useNomenclature } from '@/hooks/useNomenclature';

interface CourseRankingProps {
  leads: any[];
  courses: any[];
}

const CourseRanking = ({ leads, courses }: CourseRankingProps) => {
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();

  // Ranking de cursos regulares
  const courseRanking = courses.map((course: any) => {
    const courseLeads = leads.filter(lead => lead.course_id === course.id);
    return {
      id: course.id,
      name: course.name,
      type: courseNomenclature.slice(0, -1), // Remove 's' do final se houver
      leadCount: courseLeads.length,
    };
  }).filter(course => course.leadCount > 0);

  // Ranking de pós-graduação
  const postgraduateRanking = postgraduateCourses.map((course: any) => {
    const courseLeads = leads.filter(lead => lead.postgraduate_course_id === course.id);
    return {
      id: course.id,
      name: course.name,
      type: postgraduateNomenclature,
      leadCount: courseLeads.length,
    };
  }).filter(course => course.leadCount > 0);

  // Combinar e ordenar por número de leads
  const allCourses = [...courseRanking, ...postgraduateRanking]
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 10);

  if (allCourses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nenhum {courseNomenclature.toLowerCase()} com leads ainda</p>
      </div>
    );
  }

  const maxLeads = Math.max(...allCourses.map(course => course.leadCount));

  return (
    <div className="space-y-3">
      {allCourses.map((course, index) => (
        <div key={`${course.type}-${course.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900">{course.name}</p>
              <Badge variant={course.type === courseNomenclature.slice(0, -1) ? 'default' : 'secondary'} className="text-xs">
                {course.type}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{course.leadCount}</p>
              <p className="text-xs text-gray-500">leads</p>
            </div>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(course.leadCount / maxLeads) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseRanking;
