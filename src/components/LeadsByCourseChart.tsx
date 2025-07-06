
import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { usePostgraduateCourses } from '@/hooks/usePostgraduateCourses';
import { useNomenclature } from '@/hooks/useNomenclature';
import { BarChart3, PieChart as PieChartIcon, Filter } from 'lucide-react';

interface LeadsByCourseChartProps {
  leads: any[];
  courses: any[];
}

const LeadsByCourseChart = ({ leads, courses }: LeadsByCourseChartProps) => {
  const { data: postgraduateCourses = [] } = usePostgraduateCourses();
  const { courseNomenclature, postgraduateNomenclature } = useNomenclature();
  const [viewType, setViewType] = useState<'pie' | 'bar'>('pie');
  const [courseFilter, setCourseFilter] = useState<'all' | 'graduation' | 'postgraduate'>('all');
  const [maxCourses, setMaxCourses] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  
  const colors = [
    '#3b82f6',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#84cc16',
    '#f97316',
    '#8d5524',
    '#6b7280',
  ];

  const chartData = useMemo(() => {
    // Dados de cursos regulares
    let courseData = courses.map((course: any, index: number) => {
      const courseLeads = leads.filter(lead => lead.course_id === course.id);
      return {
        name: course.name,
        fullName: `${course.name} (${courseNomenclature.slice(0, -1)})`,
        value: courseLeads.length,
        color: colors[index % colors.length],
        type: 'graduation'
      };
    }).filter(item => item.value > 0);

    // Dados de pós-graduação
    let postgraduateData = postgraduateCourses.map((course: any, index: number) => {
      const courseLeads = leads.filter(lead => lead.postgraduate_course_id === course.id);
      return {
        name: course.name,
        fullName: `${course.name} (${postgraduateNomenclature})`,
        value: courseLeads.length,
        color: colors[(courses.length + index) % colors.length],
        type: 'postgraduate'
      };
    }).filter(item => item.value > 0);

    let allData = [...courseData, ...postgraduateData];

    // Filtrar por tipo de curso
    if (courseFilter === 'graduation') {
      allData = courseData;
    } else if (courseFilter === 'postgraduate') {
      allData = postgraduateData;
    }

    // Ordenar por valor decrescente
    allData.sort((a, b) => b.value - a.value);

    // Limitar número de cursos e agrupar outros
    if (allData.length > maxCourses) {
      const topCourses = allData.slice(0, maxCourses - 1);
      const otherCourses = allData.slice(maxCourses - 1);
      const otherTotal = otherCourses.reduce((sum, course) => sum + course.value, 0);
      
      if (otherTotal > 0) {
        topCourses.push({
          name: 'Outros',
          fullName: `Outros (${otherCourses.length} ${courseNomenclature.toLowerCase()})`,
          value: otherTotal,
          color: '#6b7280',
          type: 'other'
        });
      }
      
      return topCourses;
    }

    return allData;
  }, [leads, courses, postgraduateCourses, courseFilter, maxCourses, courseNomenclature, postgraduateNomenclature]);

  const totalLeads = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalLeads > 0 ? ((data.value / totalLeads) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">{data.fullName}</p>
          <p className="text-blue-600 font-semibold">{data.value} leads ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>Nenhum lead por {courseNomenclature.toLowerCase()} ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant={viewType === 'pie' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType('pie')}
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'bar' ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalLeads} leads total
        </Badge>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Tipo:</label>
            <Select value={courseFilter} onValueChange={(value: any) => setCourseFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="graduation">{courseNomenclature}</SelectItem>
                <SelectItem value="postgraduate">{postgraduateNomenclature}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Exibir:</label>
            <Select value={maxCourses.toString()} onValueChange={(value) => setMaxCourses(parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ value, percent }) => 
                  percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>
                    {entry.payload.name} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          ) : (
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <XAxis type="number" />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#3b82f6">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="font-semibold text-blue-700">{courseNomenclature}</div>
          <div className="text-blue-600">
            {leads.filter(l => l.course_id).length} leads
          </div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="font-semibold text-purple-700">{postgraduateNomenclature}</div>
          <div className="text-purple-600">
            {leads.filter(l => l.postgraduate_course_id).length} leads
          </div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded">
          <div className="font-semibold text-green-700">{courseNomenclature} Ativos</div>
          <div className="text-green-600">
            {chartData.filter(c => c.type !== 'other').length}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="font-semibold text-gray-700">Média/{courseNomenclature.slice(0, -1)}</div>
          <div className="text-gray-600">
            {chartData.length > 0 ? Math.round(totalLeads / chartData.filter(c => c.type !== 'other').length) : 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsByCourseChart;
