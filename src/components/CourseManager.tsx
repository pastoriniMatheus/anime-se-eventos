
import React from 'react';
import { useCourses, useCreateCourse } from '@/hooks/useCourses';
import EditableItemManager from './EditableItemManager';
import { useNomenclature } from '@/hooks/useNomenclature';

const CourseManager = () => {
  const { data: courses = [], isLoading } = useCourses();
  const createCourse = useCreateCourse();
  const { courseNomenclature } = useNomenclature();

  const handleCreateCourse = async (name: string) => {
    await createCourse.mutateAsync(name);
  };

  if (isLoading) {
    return <div>Carregando {courseNomenclature.toLowerCase()}...</div>;
  }

  return (
    <EditableItemManager
      title={`Gerenciar ${courseNomenclature}`}
      description={`Adicione, edite ou remova ${courseNomenclature.toLowerCase()} do sistema`}
      items={courses}
      onCreate={handleCreateCourse}
      itemName={courseNomenclature.toLowerCase().slice(0, -1)} // Remove 's' do final se houver
      withColor={false}
      tableName="courses"
      queryKey={['courses']}
    />
  );
};

export default CourseManager;
