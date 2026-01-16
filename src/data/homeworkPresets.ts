export type FieldType = 'text' | 'checkbox' | 'question' | 'scale' | 'multi_checkbox' | 'date';

export interface TemplateField {
  id: string;
  type: FieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  options?: string[]; // For multi_checkbox
}

export interface HomeworkTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  fields: TemplateField[];
}

export const HOMEWORK_CATEGORIES = [
  { value: 'tcc', label: 'TCC - Terapia Cognitivo-Comportamental' },
  { value: 'terapia_sexual', label: 'Terapia Sexual' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'comportamental', label: 'Comportamental' },
  { value: 'cognitivo', label: 'Cognitivo' },
  { value: 'geral', label: 'Geral' },
];

export const PRESET_TEMPLATES: HomeworkTemplate[] = [
  {
    id: 'rpd',
    title: 'Registro de Pensamentos Disfuncionais (RPD)',
    description: 'Identificar e reestruturar pensamentos automáticos negativos',
    category: 'tcc',
    fields: [
      { id: 'situacao', type: 'text', label: 'Situação', placeholder: 'Descreva brevemente a situação que desencadeou o pensamento...', required: true },
      { id: 'emocoes', type: 'text', label: 'Emoções sentidas', placeholder: 'Ex: tristeza, ansiedade, raiva...', required: true },
      { id: 'intensidade_emocao', type: 'scale', label: 'Intensidade da emoção (0-10)', min: 0, max: 10, required: true },
      { id: 'pensamento_automatico', type: 'text', label: 'Pensamento Automático', placeholder: 'O que passou pela sua mente naquele momento?', required: true },
      { id: 'evidencias_favor', type: 'text', label: 'Evidências a favor do pensamento', placeholder: 'Que fatos apoiam este pensamento?' },
      { id: 'evidencias_contra', type: 'text', label: 'Evidências contra o pensamento', placeholder: 'Que fatos contradizem este pensamento?' },
      { id: 'pensamento_alternativo', type: 'text', label: 'Pensamento Alternativo', placeholder: 'Qual seria uma forma mais equilibrada de ver a situação?', required: true },
      { id: 'reavaliacao', type: 'scale', label: 'Como se sente agora? (0-10)', min: 0, max: 10 },
    ],
  },
  {
    id: 'experimento_comportamental',
    title: 'Experimento Comportamental',
    description: 'Testar crenças através de ações concretas',
    category: 'tcc',
    fields: [
      { id: 'crenca', type: 'text', label: 'Crença a testar', placeholder: 'Ex: "Se eu pedir ajuda, vão me achar incompetente"', required: true },
      { id: 'grau_antes', type: 'scale', label: 'Grau de convicção antes (0-100%)', min: 0, max: 100, required: true },
      { id: 'experimento', type: 'text', label: 'O que vou fazer para testar', placeholder: 'Descreva o experimento planejado...', required: true },
      { id: 'quando_onde', type: 'text', label: 'Quando e onde', placeholder: 'Ex: Na próxima reunião de equipe, terça-feira' },
      { id: 'resultado', type: 'text', label: 'O que aconteceu', placeholder: 'Descreva o resultado real...' },
      { id: 'grau_depois', type: 'scale', label: 'Grau de convicção depois (0-100%)', min: 0, max: 100 },
      { id: 'conclusao', type: 'text', label: 'Conclusão', placeholder: 'O que você aprendeu com este experimento?' },
    ],
  },
  {
    id: 'ativacao_comportamental',
    title: 'Ativação Comportamental',
    description: 'Registro de atividades para combater a inércia e melhorar o humor',
    category: 'comportamental',
    fields: [
      { id: 'atividade', type: 'text', label: 'Atividade realizada', placeholder: 'Descreva a atividade...', required: true },
      { id: 'duracao', type: 'text', label: 'Duração', placeholder: 'Ex: 30 minutos' },
      { id: 'prazer', type: 'scale', label: 'Nível de prazer (0-10)', min: 0, max: 10, required: true },
      { id: 'realizacao', type: 'scale', label: 'Sensação de realização (0-10)', min: 0, max: 10, required: true },
      { id: 'humor_antes', type: 'scale', label: 'Humor antes (0-10)', min: 0, max: 10 },
      { id: 'humor_depois', type: 'scale', label: 'Humor depois (0-10)', min: 0, max: 10 },
    ],
  },
  {
    id: 'mindfulness_exercise',
    title: 'Exercício de Mindfulness',
    description: 'Registro de práticas de atenção plena',
    category: 'mindfulness',
    fields: [
      { id: 'tipo_pratica', type: 'multi_checkbox', label: 'Tipo de prática', options: ['Respiração', 'Body scan', '5 sentidos', 'Caminhada consciente', 'Alimentação consciente'], required: true },
      { id: 'duracao', type: 'text', label: 'Duração (minutos)', placeholder: 'Ex: 10 minutos' },
      { id: 'distracoes', type: 'question', label: 'Que distrações você notou?', hint: 'Observe sem julgamento os pensamentos que surgiram' },
      { id: 'sensacoes', type: 'text', label: 'Sensações corporais percebidas', placeholder: 'Descreva o que sentiu no corpo...' },
      { id: 'avaliacao', type: 'scale', label: 'Avaliação da prática (0-10)', min: 0, max: 10 },
    ],
  },
  {
    id: 'diario_gratidao',
    title: 'Diário de Gratidão',
    description: 'Registro diário de momentos e coisas pelas quais somos gratos',
    category: 'geral',
    fields: [
      { id: 'gratidao_1', type: 'text', label: 'Algo que agradeço hoje', placeholder: 'Pelo que você é grato?', required: true },
      { id: 'gratidao_2', type: 'text', label: 'Outra coisa que agradeço', placeholder: 'Pode ser algo pequeno...' },
      { id: 'gratidao_3', type: 'text', label: 'Mais uma coisa', placeholder: 'Uma pessoa, momento ou experiência...' },
      { id: 'reflexao', type: 'question', label: 'Como essas coisas impactam sua vida?', hint: 'Reflita sobre o significado' },
    ],
  },
  {
    id: 'foco_sensorial',
    title: 'Foco Sensorial',
    description: 'Exercício de atenção às sensações corporais para terapia sexual',
    category: 'terapia_sexual',
    fields: [
      { id: 'momento', type: 'text', label: 'Momento do exercício', placeholder: 'Quando você realizou o exercício?' },
      { id: 'ambiente', type: 'text', label: 'Ambiente', placeholder: 'Descreva o ambiente onde estava...' },
      { id: 'sensacoes_agradaveis', type: 'text', label: 'Sensações agradáveis percebidas', placeholder: 'O que foi prazeroso?' },
      { id: 'dificuldades', type: 'text', label: 'Dificuldades encontradas', placeholder: 'O que foi desafiador?' },
      { id: 'relaxamento', type: 'scale', label: 'Nível de relaxamento (0-10)', min: 0, max: 10 },
      { id: 'conexao', type: 'scale', label: 'Conexão com o corpo (0-10)', min: 0, max: 10 },
      { id: 'reflexao', type: 'question', label: 'O que você aprendeu sobre si?', hint: 'Observe sem julgamento' },
    ],
  },
];
