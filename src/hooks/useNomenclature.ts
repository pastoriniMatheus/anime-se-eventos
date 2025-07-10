
import { useSystemSettings } from '@/hooks/useSystemSettings';

export const useNomenclature = () => {
  const { data: systemSettings = [] } = useSystemSettings();
  
  const getCourseNomenclature = () => {
    const setting = systemSettings.find((s: any) => s.key === 'course_nomenclature');
    return setting?.value ? (typeof setting.value === 'string' ? setting.value : JSON.parse(setting.value)) : 'Produtos';
  };
  
  const getPostgraduateNomenclature = () => {
    const setting = systemSettings.find((s: any) => s.key === 'postgraduate_nomenclature');
    return setting?.value ? (typeof setting.value === 'string' ? setting.value : JSON.parse(setting.value)) : 'Pós-graduação';
  };
  
  return {
    data: {
      course_nomenclature: getCourseNomenclature(),
      postgraduate_nomenclature: getPostgraduateNomenclature(),
    },
    courseNomenclature: getCourseNomenclature(),
    postgraduateNomenclature: getPostgraduateNomenclature(),
  };
};
