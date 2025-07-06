
import React from 'react';
import { usePostgraduateCourses, useCreatePostgraduateCourse } from '@/hooks/usePostgraduateCourses';
import EditableItemManager from './EditableItemManager';
import { useNomenclature } from '@/hooks/useNomenclature';

const PostgraduateCourseManager = () => {
  const { data: postgraduateCourses = [], isLoading } = usePostgraduateCourses();
  const createPostgraduateCourse = useCreatePostgraduateCourse();
  const { postgraduateNomenclature } = useNomenclature();

  const handleCreatePostgraduateCourse = async (name: string) => {
    await createPostgraduateCourse.mutateAsync(name);
  };

  if (isLoading) {
    return <div>Carregando {postgraduateNomenclature.toLowerCase()}...</div>;
  }

  return (
    <EditableItemManager
      title={`Gerenciar ${postgraduateNomenclature}`}
      description={`Adicione, edite ou remova ${postgraduateNomenclature.toLowerCase()} do sistema`}
      items={postgraduateCourses}
      onCreate={handleCreatePostgraduateCourse}
      itemName={postgraduateNomenclature.toLowerCase()}
      withColor={false}
      tableName="postgraduate_courses"
      queryKey={['postgraduate_courses']}
    />
  );
};

export default PostgraduateCourseManager;
