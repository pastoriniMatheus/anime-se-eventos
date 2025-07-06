
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useNomenclature } from '@/hooks/useNomenclature';
import { Type } from 'lucide-react';

const NomenclatureSettings = () => {
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();
  const updateSetting = useUpdateSystemSetting();
  
  const [courseNaming, setCourseNaming] = useState(courseNomenclature);
  const [postgraduateNaming, setPostgraduateNaming] = useState(postgraduateNomenclature);

  const handleSaveNomenclature = async () => {
    try {
      await updateSetting.mutateAsync({
        key: 'course_nomenclature',
        value: courseNaming
      });
      
      await updateSetting.mutateAsync({
        key: 'postgraduate_nomenclature', 
        value: postgraduateNaming
      });
    } catch (error) {
      console.error('Erro ao salvar nomenclatura:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Type className="h-5 w-5" />
          <span>Nomenclatura do Sistema</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="course-nomenclature">Nome para Cursos/Produtos</Label>
          <Input
            id="course-nomenclature"
            value={courseNaming}
            onChange={(e) => setCourseNaming(e.target.value)}
            placeholder="Ex: Produtos, Serviços, Consultorias"
          />
          <p className="text-sm text-muted-foreground">
            Este nome será usado em todo o sistema para se referir aos cursos
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="postgraduate-nomenclature">Nome para Pós-graduação</Label>
          <Input
            id="postgraduate-nomenclature"
            value={postgraduateNaming}
            onChange={(e) => setPostgraduateNaming(e.target.value)}
            placeholder="Ex: Pós-graduação, Mentorias, Especializações"
          />
          <p className="text-sm text-muted-foreground">
            Este nome será usado em todo o sistema para se referir às pós-graduações
          </p>
        </div>

        <Button 
          onClick={handleSaveNomenclature}
          disabled={updateSetting.isPending}
          className="w-full"
        >
          {updateSetting.isPending ? 'Salvando...' : 'Salvar Nomenclatura'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default NomenclatureSettings;
