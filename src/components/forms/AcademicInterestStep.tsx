
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BookOpen, Calendar, GraduationCap } from 'lucide-react';

interface AcademicInterestStepProps {
  formData: {
    courseId: string;
    eventId: string;
    courseType: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  courses: any[];
  postgraduateCourses: any[];
  events: any[];
  courseNomenclature: string;
  postgraduateNomenclature: string;
  qrCodeData: any;
}

const AcademicInterestStep = ({
  formData,
  onFormDataChange,
  courses,
  postgraduateCourses,
  events,
  courseNomenclature,
  postgraduateNomenclature,
  qrCodeData
}: AcademicInterestStepProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
          <GraduationCap className="w-4 h-4" />
          Tipo de Curso
        </Label>
        <RadioGroup
          value={formData.courseType}
          onValueChange={(value) => onFormDataChange('courseType', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="course" id="course" />
            <Label htmlFor="course" className="lead-form-label">{courseNomenclature}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="postgraduate" id="postgraduate" />
            <Label htmlFor="postgraduate" className="lead-form-label">{postgraduateNomenclature}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
          <BookOpen className="w-4 h-4" />
          {formData.courseType === 'course' ? courseNomenclature : postgraduateNomenclature}
        </Label>
        <Select value={formData.courseId} onValueChange={(value) => onFormDataChange('courseId', value)}>
          <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 lead-form-input">
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {(formData.courseType === 'course' ? courses : postgraduateCourses).map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Só mostra o campo de evento se NÃO há dados do QR code */}
      {!qrCodeData?.event?.name && (
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2 lead-form-label">
            <Calendar className="w-4 h-4" />
            Evento
          </Label>
          <Select value={formData.eventId} onValueChange={(value) => onFormDataChange('eventId', value)}>
            <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 lead-form-input">
              <SelectValue placeholder="Selecione um evento (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default AcademicInterestStep;
