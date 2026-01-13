import { Heart, Brain, Users, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { storage, type AdminBlogPost } from "@/lib/storage";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  icon: LucideIcon;
  featured?: boolean;
  content: ReactNode;
};

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "terapia-online-transformar-vida",
    title: "Como a Terapia Online Pode Transformar Sua Vida",
    excerpt:
      "Descubra os benefícios da psicoterapia digital e como ela pode ser tão eficaz quanto o atendimento presencial.",
    category: "Terapia Online",
    readTime: "5 min",
    date: "15 Mar 2024",
    icon: Heart,
    featured: true,
    content: (
      <div className="prose prose-invert max-w-none">
        <p>
          A terapia online vem ganhando cada vez mais adesão por sua
          praticidade, acessibilidade e eficácia. Para muitas pessoas,
          especialmente com rotinas intensas ou que vivem em cidades
          diferentes, o atendimento virtual se torna uma excelente
          alternativa para cuidar da saúde mental sem abrir mão do conforto
          e da privacidade.
        </p>
        <h3>Benefícios da terapia online</h3>
        <ul>
          <li>Maior flexibilidade de horários e locais.</li>
          <li>Ambiente seguro e reservado onde você se sente confortável.</li>
          <li>Continuidade do acompanhamento mesmo em viagens ou mudanças.</li>
          <li>
            Eficácia comprovada cientificamente para diversos quadros, como
            ansiedade e depressão.
          </li>
        </ul>
        <h3>É tão eficaz quanto a presencial?</h3>
        <p>
          Sim. Estudos indicam que, quando há um vínculo terapêutico
          consistente e uma boa estrutura de atendimento, os resultados são
          comparáveis aos da terapia presencial. O mais importante é a
          constância e a qualidade da relação terapêutica.
        </p>
        <p>
          Se você busca um cuidado que se adapte à sua rotina, a terapia
          online pode ser o caminho ideal para começar sua jornada de
          autoconhecimento com segurança e acolhimento.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    slug: "tecnicas-mindfulness-dia-a-dia",
    title: "5 Técnicas de Mindfulness para o Dia a Dia",
    excerpt:
      "Aprenda práticas simples de atenção plena que podem reduzir significativamente seus níveis de ansiedade.",
    category: "Bem-estar",
    readTime: "7 min",
    date: "12 Mar 2024",
    icon: Brain,
    content: (
      <div className="prose prose-invert max-w-none">
        <p>
          Mindfulness é a prática de estar presente no momento, observando
          pensamentos e emoções sem julgamento. Com pequenas ações diárias,
          é possível notar uma redução da ansiedade e um aumento de
          bem-estar.
        </p>
        <h3>Práticas rápidas</h3>
        <ol>
          <li>
            Respiração 4-4-4: inspire por 4 segundos, segure por 4 e
            expire por 4. Repita por 2 minutos.
          </li>
          <li>
            Escaneamento corporal: observe da cabeça aos pés as sensações
            físicas presentes, sem tentar mudá-las.
          </li>
          <li>
            Pausa consciente: antes de responder uma mensagem difícil,
            faça 3 respirações profundas.
          </li>
          <li>
            Atenção nas refeições: coma devagar, percebendo texturas e
            sabores.
          </li>
          <li>
            Caminhada atenta: foque nos passos, no contato com o chão e na
            respiração.
          </li>
        </ol>
        <p>
          Comece com o que for mais simples para você. O objetivo não é
          "zerar" pensamentos, mas criar um espaço interno mais calmo e
          gentil.
        </p>
      </div>
    ),
  },
  {
    id: 3,
    slug: "relacionamentos-saudaveis-comunicacao",
    title: "Relacionamentos Saudáveis: Dicas de Comunicação",
    excerpt:
      "Estratégias eficazes para melhorar a comunicação e fortalecer vínculos em relacionamentos amorosos.",
    category: "Relacionamentos",
    readTime: "6 min",
    date: "08 Mar 2024",
    icon: Users,
    content: (
      <div className="prose prose-invert max-w-none">
        <p>
          Uma comunicação clara e respeitosa é o coração de qualquer
          relacionamento saudável. Pequenas mudanças de postura podem
          transformar conflitos repetitivos em conversas construtivas.
        </p>
        <h3>Três práticas essenciais</h3>
        <ul>
          <li>
            Use mensagens no formato "eu sinto... quando... porque..." para
            evitar acusações.
          </li>
          <li>
            Pratique a escuta ativa: repita com suas palavras o que ouviu
            para validar o outro.
          </li>
          <li>
            Combine pausas quando a conversa esquentar; retomar depois pode
            ajudar a manter o respeito.
          </li>
        </ul>
        <p>
          Com tempo e consistência, a confiança se fortalece e o diálogo se
          torna um espaço de cuidado mútuo.
        </p>
      </div>
    ),
  },
  {
    id: 4,
    slug: "entendendo-ansiedade-sintomas-tratamentos",
    title: "Entendendo a Ansiedade: Sintomas e Tratamentos",
    excerpt:
      "Um guia completo sobre transtornos ansiosos e as abordagens terapêuticas mais eficazes.",
    category: "Saúde Mental",
    readTime: "8 min",
    date: "05 Mar 2024",
    icon: Heart,
    content: (
      <div className="prose prose-invert max-w-none">
        <p>
          A ansiedade é uma resposta natural do corpo, mas quando se torna
          intensa e frequente pode impactar o sono, o humor e o
          funcionamento diário. Reconhecer sinais é o primeiro passo.
        </p>
        <h3>Principais sintomas</h3>
        <ul>
          <li>Preocupação constante e antecipatória</li>
          <li>Taquicardia, tensão muscular e sudorese</li>
          <li>Dificuldade de concentração</li>
          <li>Distúrbios do sono</li>
        </ul>
        <h3>Tratamentos eficazes</h3>
        <p>
          A psicoterapia, especialmente abordagens cognitivo-comportamentais,
          apresenta ótimos resultados. Em alguns casos, pode haver indicação
          de avaliação psiquiátrica para uso combinado de medicação.
        </p>
        <p>
          Buscar ajuda é um ato de coragem. Com acompanhamento adequado, é
          possível retomar a qualidade de vida e construir novas
          possibilidades.
        </p>
      </div>
    ),
  },
];

export const getPostBySlug = (slug: string) =>
  getAllPosts().find((p) => p.slug === slug);

// --- Dynamic posts from admin (localStorage) ---
const iconMap: Record<string, LucideIcon> = {
  Heart,
  Brain,
  Users,
  BookOpen,
};

const toDisplayPost = (p: AdminBlogPost, idx: number): BlogPost => ({
  id: 1000 + idx,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  readTime: p.readTime,
  date: p.date,
  icon: iconMap[p.iconName || "BookOpen"] || BookOpen,
  featured: p.featured,
  content: (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {p.content}
      </ReactMarkdown>
    </div>
  ),
});

export const getAllPosts = (): BlogPost[] => {
  const dyn = storage.getPosts().map(toDisplayPost);
  // Merge: dynamic first, then static
  return [...dyn, ...blogPosts];
};
