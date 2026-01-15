import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Upload,
  BookOpen,
  Loader2,
  Brain,
  Heart,
  AlertCircle,
  FileUp,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  file_name: string | null;
  file_type: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: "tcc", label: "TCC", icon: Brain },
  { value: "terapia_sexual", label: "Terapia Sexual", icon: Heart },
  { value: "tecnicas", label: "Técnicas", icon: FileText },
  { value: "artigos", label: "Artigos Científicos", icon: BookOpen },
  { value: "geral", label: "Geral", icon: FileText },
];

// CBT Templates
const CBT_TEMPLATES = [
  {
    title: "Registro de Pensamentos Disfuncionais (RPD)",
    category: "tcc",
    content: `# Registro de Pensamentos Disfuncionais (RPD)

## O que é o RPD?
O Registro de Pensamentos Disfuncionais é uma ferramenta fundamental da Terapia Cognitivo-Comportamental (TCC) para identificar e modificar padrões de pensamento negativos automáticos.

## Estrutura do RPD - 7 Colunas

### 1. SITUAÇÃO
- Descreva brevemente a situação que provocou a emoção negativa
- Onde você estava? Com quem? O que aconteceu?
- Seja específico e objetivo

### 2. EMOÇÕES
- Identifique as emoções sentidas (tristeza, ansiedade, raiva, medo, etc.)
- Avalie a intensidade de 0 a 100%
- Exemplo: Ansiedade (80%), Tristeza (60%)

### 3. PENSAMENTO AUTOMÁTICO
- Qual foi o pensamento que passou pela sua mente?
- O que você disse para si mesmo naquele momento?
- Identifique o "pensamento quente" (mais perturbador)

### 4. EVIDÊNCIAS A FAVOR
- Quais fatos apoiam esse pensamento?
- O que você observou que confirma essa ideia?
- Seja objetivo, use apenas fatos

### 5. EVIDÊNCIAS CONTRA
- Quais fatos contradizem esse pensamento?
- Existe outra forma de ver a situação?
- O que você diria a um amigo nessa situação?

### 6. PENSAMENTO ALTERNATIVO
- Formule um pensamento mais equilibrado e realista
- Considere todas as evidências
- Seja compassivo consigo mesmo

### 7. RESULTADO
- Reavalie suas emoções após o exercício
- Nova intensidade de 0 a 100%
- O que você aprendeu?

## Distorções Cognitivas Comuns

1. **Pensamento tudo-ou-nada**: Ver em extremos, preto ou branco
2. **Catastrofização**: Esperar o pior resultado possível
3. **Leitura mental**: Assumir saber o que outros pensam
4. **Personalização**: Culpar-se por eventos externos
5. **Generalização**: "Sempre" ou "nunca"
6. **Filtro mental**: Focar apenas no negativo
7. **Desqualificação do positivo**: Ignorar experiências positivas
8. **Raciocínio emocional**: "Sinto, logo é verdade"
9. **Declarações "deveria"**: Regras rígidas e inflexíveis
10. **Rotulação**: "Sou um fracasso" ao invés de "Cometi um erro"

## Dicas para Preenchimento
- Preencha o mais próximo possível do evento
- Seja honesto e específico
- Não julgue seus pensamentos
- Pratique regularmente para melhores resultados`,
  },
  {
    title: "Experimentos Comportamentais",
    category: "tcc",
    content: `# Experimentos Comportamentais na TCC

## O que são Experimentos Comportamentais?
São atividades planejadas para testar a validade de pensamentos, crenças ou previsões do paciente através da experiência direta. São fundamentais para a mudança cognitiva.

## Tipos de Experimentos

### 1. Experimentos de Descoberta
- Objetivo: Coletar informações sobre uma situação
- Usado quando não sabemos o resultado
- Exemplo: "Vou perguntar a opinião de 5 pessoas e ver o que acontece"

### 2. Experimentos de Teste de Hipótese
- Objetivo: Testar uma previsão específica
- Compara previsão vs. resultado real
- Exemplo: "Acredito que serei rejeitado. Vou testar convidando alguém para um café"

### 3. Experimentos de Survey
- Objetivo: Descobrir o que outras pessoas pensam/fazem
- Normaliza experiências
- Exemplo: "Vou perguntar a 10 pessoas se elas já se sentiram assim"

## Estrutura do Experimento

### ETAPA 1: Identificar a Crença
- Qual pensamento/crença você quer testar?
- Qual o grau de convicção (0-100%)?
- O que você prevê que vai acontecer?

### ETAPA 2: Planejar o Experimento
- O que você vai fazer exatamente?
- Quando e onde?
- Quais são os critérios de sucesso?
- Quais obstáculos podem surgir?

### ETAPA 3: Executar
- Realize o experimento conforme planejado
- Observe o que realmente acontece
- Não evite situações difíceis

### ETAPA 4: Avaliar os Resultados
- O que aconteceu de fato?
- A previsão se confirmou?
- O que você aprendeu?
- Novo grau de convicção na crença (0-100%)?

### ETAPA 5: Tirar Conclusões
- O que isso significa para sua crença original?
- Qual é uma visão mais equilibrada?
- Que outros experimentos podem ser úteis?

## Exemplos Práticos

### Ansiedade Social
**Crença**: "Se eu falar em público, vou fazer papel de ridículo"
**Experimento**: Fazer uma pergunta em uma reunião pequena
**Observar**: Reações das pessoas, próprios sintomas

### Depressão
**Crença**: "Nada me dá prazer"
**Experimento**: Programar 3 atividades prazerosas na semana
**Observar**: Níveis de prazer antes/durante/depois

### Perfeccionismo
**Crença**: "Se eu não fizer perfeito, serei criticado"
**Experimento**: Entregar um trabalho "80% bom"
**Observar**: Feedback recebido

## Dicas para Sucesso
1. Comece com experimentos de baixo risco
2. Seja específico sobre o que observar
3. Anote resultados imediatamente
4. Aceite qualquer resultado como aprendizado
5. Repita experimentos se necessário
6. Aumente gradualmente a dificuldade`,
  },
  {
    title: "Ativação Comportamental",
    category: "tcc",
    content: `# Ativação Comportamental

## Fundamentos
A Ativação Comportamental é uma intervenção baseada em evidências que visa aumentar o engajamento em atividades que trazem prazer e senso de realização, quebrando o ciclo de evitação e inatividade comum na depressão.

## Ciclo da Depressão
Humor deprimido → Redução de atividades → Menos recompensas → Piora do humor

## Ciclo da Ativação
Aumento de atividades → Mais experiências positivas → Melhora do humor → Mais motivação

## Monitoramento de Atividades

### Registro Diário
Para cada atividade, registre:
- **Atividade**: O que você fez?
- **Duração**: Quanto tempo?
- **Prazer (P)**: 0-10
- **Realização (R)**: 0-10
- **Humor antes/depois**: 0-10

### Análise dos Padrões
- Quais atividades aumentam seu humor?
- Quando você se sente pior?
- Há padrões de evitação?

## Programação de Atividades

### Tipos de Atividades

**1. Atividades Prazerosas**
- Hobbies, lazer, socialização
- Contato com a natureza
- Autocuidado

**2. Atividades de Realização**
- Tarefas domésticas
- Trabalho/estudo
- Exercícios físicos
- Cuidar de outros

**3. Atividades de Rotina**
- Higiene pessoal
- Alimentação
- Sono regular

### Técnica de Gradação
1. Liste atividades do mais fácil ao mais difícil
2. Comece pelas mais fáceis
3. Divida grandes tarefas em pequenos passos
4. Celebre pequenas vitórias
5. Aumente gradualmente

## Enfrentando Barreiras

### Pensamentos Comuns
- "Não tenho vontade" → Aja antes de sentir vontade
- "Não vai adiantar" → Teste empiricamente
- "Estou muito cansado" → Fadiga pode melhorar com atividade

### Estratégias
1. Comprometa-se com outros
2. Use lembretes e alarmes
3. Prepare o ambiente com antecedência
4. Comece muito pequeno (5 minutos)
5. Recompense-se após completar

## Planilha Semanal
Programe atividades equilibradas:
- 2-3 atividades prazerosas/dia
- 1-2 atividades de realização/dia
- Manter rotina básica
- Incluir exercício físico
- Contato social regular

## Acompanhamento
- Revise semanalmente com terapeuta
- Ajuste conforme necessário
- Celebre progressos
- Seja compassivo com recaídas`,
  },
  {
    title: "Reestruturação Cognitiva",
    category: "tcc",
    content: `# Reestruturação Cognitiva

## Conceito
Processo sistemático de identificar, avaliar e modificar pensamentos automáticos negativos e crenças disfuncionais que contribuem para sofrimento emocional.

## Níveis de Cognição

### 1. Pensamentos Automáticos
- Surgem espontaneamente
- São situacionais
- Mais fáceis de identificar e modificar
- Exemplo: "Vou falhar nessa prova"

### 2. Crenças Intermediárias
- Regras, atitudes, suposições
- "Se...então" e "Devo/Deveria"
- Exemplo: "Se eu não for perfeito, serei rejeitado"

### 3. Crenças Nucleares
- Mais profundas e rígidas
- Sobre si mesmo, outros e mundo
- Exemplo: "Sou incompetente"

## Técnicas de Questionamento

### Questionamento Socrático
1. Qual é a evidência?
2. Existe outra explicação?
3. Qual o pior/melhor/mais provável cenário?
4. Qual efeito de pensar assim?
5. O que você diria a um amigo?
6. O que você fará a respeito?

### Técnica da Seta Descendente
Para descobrir crenças nucleares:
- Se isso fosse verdade, o que significaria?
- E se isso acontecesse, então...?
- O que isso diz sobre você?

### Continuum Cognitivo
- Para pensamentos dicotômicos
- Escala de 0-100% ao invés de tudo-ou-nada
- Onde você está? Onde estão os outros?

### Advogado de Defesa
- Liste evidências contra o pensamento negativo
- Seja seu próprio advogado
- Construa o caso mais forte possível

## Modificando Crenças Nucleares

### Identificação
- Temas recorrentes nos pensamentos
- Padrões de comportamento
- Histórico desenvolvimental

### Diário de Dados Positivos
- Registre experiências que contradizem a crença
- Colete "evidências" diárias
- Revise semanalmente

### Cartões de Enfrentamento
- Escreva respostas racionais
- Leia quando a crença ativar
- Pratique nova perspectiva

## Armadilhas Comuns

1. **Racionalização vazia**: Use evidências, não apenas frases positivas
2. **Substituição prematura**: Entenda o pensamento antes de mudar
3. **Forçar o positivo**: Busque equilíbrio, não positivismo
4. **Ignorar emoções**: Valide sentimentos enquanto questiona pensamentos

## Prática Contínua
- Use RPD regularmente
- Identifique padrões ao longo do tempo
- Trabalhe do superficial ao profundo
- Seja paciente com crenças nucleares`,
  },
  {
    title: "Técnicas de Relaxamento e Mindfulness",
    category: "tcc",
    content: `# Técnicas de Relaxamento e Mindfulness na TCC

## Respiração Diafragmática

### Técnica Básica
1. Sente-se ou deite-se confortavelmente
2. Coloque uma mão no peito, outra no abdômen
3. Inspire pelo nariz em 4 segundos (abdômen sobe)
4. Segure por 2 segundos
5. Expire pela boca em 6 segundos (abdômen desce)
6. Repita 5-10 ciclos

### Respiração 4-7-8
- Inspire: 4 segundos
- Segure: 7 segundos
- Expire: 8 segundos
- Ideal para ansiedade aguda

## Relaxamento Muscular Progressivo

### Protocolo Completo (15-20 min)
1. **Mãos e antebraços**: Feche os punhos com força
2. **Braços**: Flexione os bíceps
3. **Testa**: Eleve as sobrancelhas
4. **Olhos e bochechas**: Feche os olhos com força
5. **Boca e mandíbula**: Aperte os dentes
6. **Pescoço**: Incline a cabeça para trás
7. **Ombros**: Eleve em direção às orelhas
8. **Peito**: Inspire profundamente e segure
9. **Abdômen**: Contraia os músculos
10. **Nádegas**: Aperte
11. **Coxas**: Estenda as pernas
12. **Panturrilhas**: Aponte os pés para cima
13. **Pés**: Curve os dedos para baixo

Para cada grupo: Tensione 5-7 segundos → Relaxe 15-20 segundos

### Versão Rápida (5 min)
- Tensione todo o corpo de uma vez
- Segure 5 segundos
- Relaxe completamente
- Repita 3 vezes

## Mindfulness Básico

### Atenção à Respiração
1. Foque nas sensações da respiração
2. Quando a mente divagar, note gentilmente
3. Retorne à respiração sem julgamento
4. Comece com 5 minutos, aumente gradualmente

### Body Scan
1. Comece pelos pés, suba pelo corpo
2. Note sensações em cada área
3. Não tente mudar, apenas observe
4. 15-20 minutos completo

### 5 Sentidos (Grounding)
Em momentos de ansiedade:
- 5 coisas que você VÊ
- 4 coisas que você TOCA
- 3 coisas que você OUVE
- 2 coisas que você CHEIRA
- 1 coisa que você SABOREIA

## Imagens Mentais

### Lugar Seguro
1. Imagine um lugar onde se sinta seguro e calmo
2. Visualize detalhes: cores, sons, cheiros, texturas
3. Note as sensações corporais de calma
4. Associe a uma palavra-âncora
5. Pratique regularmente para fortalecer

### Dessensibilização
1. Crie hierarquia de situações temidas
2. Relaxe profundamente
3. Visualize situação menos ameaçadora
4. Mantenha relaxamento
5. Progrida gradualmente na hierarquia

## Dicas de Prática
- Pratique diariamente, mesmo sem ansiedade
- Comece em ambiente calmo e tranquilo
- Use apps ou áudios guiados inicialmente
- Não espere resultados imediatos
- Seja gentil com distrações
- Integre ao dia a dia (filas, transporte)`,
  },
  {
    title: "Psicoeducação sobre Ansiedade",
    category: "tcc",
    content: `# Psicoeducação sobre Ansiedade

## O que é Ansiedade?
Resposta natural de alerta do corpo diante de ameaças percebidas. É adaptativa e necessária para sobrevivência, mas pode se tornar problemática quando excessiva ou desproporcional.

## A Resposta de Luta ou Fuga

### Sistema Nervoso Simpático
Quando ativado, prepara o corpo para ação:

**Sintomas Físicos e Sua Função**
- **Coração acelerado**: Mais sangue para músculos
- **Respiração rápida**: Mais oxigênio
- **Suor**: Resfriamento do corpo
- **Tensão muscular**: Preparação para movimento
- **Pupilas dilatadas**: Melhor visão
- **Digestão lenta**: Energia para músculos
- **Boca seca**: Fluidos redistribuídos

### Por que não é perigoso
- Esses sintomas são desconfortáveis, mas SEGUROS
- Não causam ataques cardíacos, desmaios ou loucura
- São limitados no tempo
- O corpo retorna ao equilíbrio naturalmente

## Ciclo da Ansiedade

### Modelo Cognitivo
```
Situação/Gatilho
       ↓
Pensamento (interpretação de ameaça)
       ↓
Ansiedade (emoção + sensações físicas)
       ↓
Comportamento (evitação, segurança)
       ↓
Manutenção/Reforço do medo
```

### Evitação: O Problema
- Alívio imediato → Reforça o medo
- Nunca testamos nossas previsões
- O mundo "encolhe"
- Aumenta sensibilidade futura

## Tipos de Transtornos de Ansiedade

### Transtorno de Ansiedade Generalizada (TAG)
- Preocupação excessiva com múltiplos temas
- "E se...?" constante
- Tensão, fadiga, dificuldade de concentração

### Transtorno de Pânico
- Ataques de pânico inesperados
- Medo de ter novos ataques
- Interpretação catastrófica de sensações

### Fobia Social
- Medo de avaliação negativa
- Evitação de situações sociais
- Foco excessivo em si mesmo

### Fobias Específicas
- Medo intenso de objetos/situações específicos
- Desproporcional ao perigo real
- Evitação acentuada

## Estratégias de Enfrentamento

### Curto Prazo
1. Respiração diafragmática
2. Grounding (5 sentidos)
3. Técnicas de relaxamento
4. Falar com alguém de confiança

### Longo Prazo
1. Reestruturação cognitiva
2. Exposição gradual
3. Mudanças no estilo de vida
4. Psicoterapia (TCC)

## Estilo de Vida e Ansiedade

### Fatores Protetores
- Exercício físico regular
- Sono adequado (7-9h)
- Alimentação equilibrada
- Limitar cafeína e álcool
- Conexões sociais
- Técnicas de relaxamento

### Fatores de Risco
- Sedentarismo
- Privação de sono
- Excesso de cafeína
- Uso de substâncias
- Isolamento social
- Estresse crônico

## Mensagem Principal
- Ansiedade é tratável
- Exposição > Evitação
- Pensamentos não são fatos
- Desconforto não é perigo
- Recuperação é gradual`,
  },
];

// Sexual Therapy Templates
const SEXUAL_THERAPY_TEMPLATES = [
  {
    title: "Modelo PLISSIT para Intervenção em Sexualidade",
    category: "terapia_sexual",
    content: `# Modelo PLISSIT

## Visão Geral
O modelo PLISSIT é um framework progressivo para intervenção em questões de sexualidade, desenvolvido por Jack Annon (1976). Permite diferentes níveis de intervenção conforme a necessidade e complexidade do caso.

## Os Quatro Níveis

### P - Permission (Permissão)
**O que é**: Normalizar e validar preocupações sexuais

**Na prática**:
- "É comum ter essas dúvidas sobre..."
- "Muitas pessoas experimentam..."
- "É normal que..."

**Objetivos**:
- Reduzir culpa e vergonha
- Validar experiências
- Abrir espaço para discussão
- Eliminar mitos e tabus

**Exemplos de intervenção**:
- Normalizar variações do desejo
- Validar preocupações sobre performance
- Permitir expressão de fantasias (quando apropriadas)

### LI - Limited Information (Informação Limitada)
**O que é**: Fornecer informações específicas e educativas

**Conteúdos comuns**:
- Anatomia e fisiologia sexual
- Resposta sexual humana
- Efeitos de medicamentos
- Mudanças ao longo da vida
- Impacto de condições de saúde

**Na prática**:
- Psicoeducação sobre ciclo de resposta sexual
- Explicar efeitos de antidepressivos no desejo
- Informar sobre mudanças na menopausa/andropausa

### SS - Specific Suggestions (Sugestões Específicas)
**O que é**: Orientações práticas e técnicas específicas

**Técnicas comuns**:
- Foco sensorial (Sensate Focus)
- Técnicas para ejaculação precoce
- Exercícios de Kegel
- Comunicação sexual assertiva
- Uso de auxiliares (lubrificantes, etc.)

**Quando indicar**:
- Quando P e LI não são suficientes
- Para problemas específicos e circunscritos
- Quando há motivação para mudança comportamental

### IT - Intensive Therapy (Terapia Intensiva)
**O que é**: Tratamento aprofundado para casos complexos

**Indicações**:
- Trauma sexual
- Transtornos de identidade
- Parafilias
- Disfunções resistentes
- Questões relacionais profundas

**Abordagens**:
- Terapia cognitivo-comportamental
- Terapia de casal
- Processamento de trauma
- Terapia psicodinâmica

## Aplicação Clínica

### Avaliação Inicial
1. Determine o nível necessário
2. Comece sempre por P e LI
3. Avalie resposta antes de progredir
4. Nem todos precisam de todos os níveis

### Flexibilidade
- Pode-se transitar entre níveis
- Alguns casos requerem múltiplos níveis simultaneamente
- Adapte ao paciente/casal

## Competências do Terapeuta
- Conforto com temas sexuais
- Conhecimento técnico
- Habilidades de comunicação
- Reconhecer limites de competência
- Saber encaminhar quando necessário`,
  },
  {
    title: "Foco Sensorial (Sensate Focus)",
    category: "terapia_sexual",
    content: `# Técnica de Foco Sensorial (Sensate Focus)

## Origem e Conceito
Desenvolvida por Masters & Johnson (1970), é uma das técnicas mais utilizadas em terapia sexual. Visa reduzir ansiedade de performance e reconectar o casal com sensações prazerosas.

## Princípios Fundamentais

1. **Foco no processo, não no resultado**
2. **Sem objetivo de excitação ou orgasmo**
3. **Comunicação aberta**
4. **Progressão gradual**
5. **Sem pressão ou expectativa**

## Fases da Técnica

### FASE 1: Toque Não-Genital
**Objetivo**: Redescobrir sensações corporais sem pressão sexual

**Instruções**:
- Ambiente confortável e privado
- Sem relação sexual antes ou depois
- Alternância: um toca, outro recebe
- Evitar seios e genitais completamente
- Duração: 15-30 minutos cada

**O que explorar**:
- Texturas, temperaturas, pressões
- Partes do corpo geralmente ignoradas
- Preferências de toque

**Comunicação**:
- Receptor guia verbalmente ou com as mãos
- "Mais leve", "mais devagar", "isso é bom"
- Foco no prazer sensorial, não sexual

### FASE 2: Toque Genital (Não-Demandante)
**Quando progredir**: Após conforto consistente na Fase 1

**Instruções**:
- Incluir seios e genitais no toque
- Ainda sem objetivo de excitação
- Explorar sensações, não performance
- Manter comunicação aberta

**Importante**:
- Se houver excitação, deixar fluir naturalmente
- Não "perseguir" a excitação
- Orgasmo não é o objetivo

### FASE 3: Toque Mútuo
**Objetivo**: Sincronizar prazer do casal

**Instruções**:
- Toque simultâneo
- Manter foco nas sensações
- Comunicar preferências em tempo real
- Explorar reciprocidade

### FASE 4: Contenção Sem Movimento
**Para casais com penetração como objetivo**

**Instruções**:
- Penetração sem movimento
- Foco nas sensações de conexão
- Comunicar experiência interna
- Sem pressão para continuar

### FASE 5: Movimento Gradual
**Fase final**:
- Introduzir movimento lentamente
- Manter foco sensorial
- Parar se surgir ansiedade de performance
- Celebrar conexão, não performance

## Prescrição Típica
- 2-3 sessões por semana
- Mínimo de 1 semana em cada fase
- Progressão baseada em conforto
- Pode retornar a fases anteriores

## Problemas Comuns

### "Não consigo parar de pensar em sexo"
- Volte ao foco nas sensações físicas
- Use mindfulness
- Aceite pensamentos sem agir

### "É artificial/estranho"
- Normal no início
- Persista por algumas sessões
- Discuta em terapia

### "Um de nós quer avançar mais rápido"
- Respeitar o ritmo do mais lento
- Explorar frustração em sessão
- Negociar compromissos

## Indicações
- Disfunções do desejo
- Ansiedade de performance
- Disfunção erétil psicogênica
- Anorgasmia
- Vaginismo (com modificações)
- Reconexão após crise conjugal

## Contraindicações
- Conflito conjugal intenso não trabalhado
- Trauma sexual não processado
- Um parceiro não consente genuinamente`,
  },
  {
    title: "Ciclo de Resposta Sexual",
    category: "terapia_sexual",
    content: `# Ciclo de Resposta Sexual Humana

## Modelos Teóricos

### Modelo de Masters & Johnson (1966)
Modelo linear de 4 fases:
1. Excitação
2. Platô
3. Orgasmo
4. Resolução

### Modelo de Kaplan (1979)
Adiciona componente psicológico:
1. **Desejo** (fase mental)
2. **Excitação** (fase física)
3. **Orgasmo** (fase reflexa)

### Modelo Circular de Basson (2000)
**Especialmente relevante para mulheres**

Considera:
- Início pode ser neutro (sem desejo espontâneo)
- Motivações não-sexuais para intimidade
- Desejo responsivo vs. espontâneo
- Influência do contexto relacional

```
Neutralidade Sexual
       ↓
Motivações para Intimidade (conexão, afeto)
       ↓
Estímulos Sexuais + Contexto Apropriado
       ↓
Excitação Subjetiva
       ↓
Desejo Responsivo
       ↓
Satisfação (com ou sem orgasmo)
       ↓
Intimidade Emocional
       ↓ (retroalimenta)
Motivação para futuras experiências
```

## Fases Detalhadas

### DESEJO
**Definição**: Interesse ou motivação para atividade sexual

**Tipos**:
- **Espontâneo**: Surge sem estímulo externo
- **Responsivo**: Surge em resposta a estímulos

**Fatores que influenciam**:
- Hormônios (testosterona)
- Saúde geral
- Qualidade do relacionamento
- Estresse e fadiga
- Medicamentos
- Experiências passadas

### EXCITAÇÃO
**Alterações fisiológicas**:

**Nos homens**:
- Ereção peniana
- Elevação testicular
- Lubrificação pré-ejaculatória

**Nas mulheres**:
- Lubrificação vaginal
- Tumescência clitoriana
- Expansão vaginal
- Ingurgitamento labial

**Ambos**:
- Aumento da frequência cardíaca
- Elevação da pressão arterial
- Rubor sexual
- Mamilos eretos

### ORGASMO
**Definição**: Pico de prazer com contrações rítmicas

**Nos homens**:
- Contrações do assoalho pélvico
- Ejaculação (geralmente)
- Período refratário

**Nas mulheres**:
- Contrações uterinas e vaginais
- Pode ser múltiplo
- Variação na experiência

### RESOLUÇÃO
**Retorno ao estado não-excitado**:
- Detumescência
- Relaxamento muscular
- Normalização cardíaca
- Sensação de bem-estar

## Aplicações Clínicas

### Avaliação
- Em qual fase está o problema?
- É primário ou secundário?
- Situacional ou generalizado?
- Fatores contribuintes?

### Intervenções por Fase

**Transtornos do Desejo**:
- Psicoeducação
- Abordar fatores relacionais
- Hormonal (quando indicado)
- Modelo de Basson

**Transtornos da Excitação**:
- Foco sensorial
- Manejo de ansiedade
- Avaliação médica

**Transtornos do Orgasmo**:
- Técnicas específicas
- Reduzir pressão de performance
- Explorar crenças limitantes

## Diferenças de Gênero
- Não são absolutas, há grande variação individual
- Homens: mais desejo espontâneo (geralmente)
- Mulheres: mais desejo responsivo (geralmente)
- Contextual vs. visual
- Importância da intimidade emocional`,
  },
  {
    title: "Disfunções Sexuais - Visão Geral",
    category: "terapia_sexual",
    content: `# Disfunções Sexuais: Visão Geral Clínica

## Classificação (DSM-5)

### Disfunções Masculinas
1. **Transtorno do Desejo Sexual Masculino Hipoativo**
2. **Disfunção Erétil**
3. **Ejaculação Precoce**
4. **Ejaculação Retardada**

### Disfunções Femininas
1. **Transtorno do Interesse/Excitação Sexual Feminino**
2. **Transtorno do Orgasmo Feminino**
3. **Transtorno da Dor Gênito-Pélvica/Penetração**

### Aplicáveis a Ambos
- Disfunção Sexual Induzida por Substância/Medicamento

## Avaliação Diagnóstica

### Critérios Gerais
- Duração mínima de 6 meses
- Causa sofrimento significativo
- Não explicado por outro transtorno mental
- Não devido exclusivamente a substância ou condição médica

### Especificadores
- **Ao longo da vida** vs. **Adquirido**
- **Generalizado** vs. **Situacional**
- Gravidade: Leve, Moderada, Grave

### Avaliação Completa
1. **História sexual detalhada**
2. **Exame médico** (quando indicado)
3. **Avaliação psicológica**
4. **Contexto relacional**
5. **Medicamentos e substâncias**

## Disfunções Específicas

### Disfunção Erétil
**Fatores de risco**:
- Idade
- Diabetes
- Doenças cardiovasculares
- Medicamentos
- Ansiedade de performance
- Depressão

**Tratamento**:
- Inibidores PDE5 (Sildenafil, etc.)
- Terapia sexual (ansiedade de performance)
- Modificações de estilo de vida
- Terapia de casal

### Ejaculação Precoce
**Definição**: Ejaculação persistente em ~1 minuto após penetração

**Subtipos**:
- Primária (ao longo da vida)
- Secundária (adquirida)

**Tratamento**:
- Técnica de parada-início
- Técnica do aperto
- Anestésicos tópicos
- ISRS (off-label)
- Terapia cognitivo-comportamental

### Transtorno do Desejo Feminino
**Características**:
- Ausência/redução de interesse sexual
- Ausência/redução de fantasias
- Resposta reduzida a estímulos

**Fatores associados**:
- Relacionamento
- Estresse
- Imagem corporal
- Histórico de trauma
- Hormônios
- Medicamentos

### Dor Gênito-Pélvica/Penetração
**Inclui**:
- Vaginismo
- Dispareunia

**Componentes**:
- Medo/ansiedade sobre penetração
- Tensão muscular
- Dor durante tentativas

**Tratamento**:
- Dilatadores vaginais progressivos
- Fisioterapia pélvica
- Dessensibilização
- Terapia de casal
- Processamento de trauma (se aplicável)

## Fatores Etiológicos

### Biológicos
- Doenças crônicas
- Alterações hormonais
- Medicamentos
- Álcool/drogas
- Cirurgias/traumas

### Psicológicos
- Ansiedade de performance
- Depressão
- Trauma sexual
- Crenças disfuncionais
- Imagem corporal

### Relacionais
- Conflito conjugal
- Comunicação deficiente
- Assimetria de desejo
- Rotina/monotonia
- Infidelidade

### Socioculturais
- Educação sexual repressiva
- Tabus religiosos/culturais
- Expectativas irrealistas
- Influência da pornografia

## Princípios de Tratamento

1. **Avaliação compreensiva**
2. **Psicoeducação**
3. **Abordagem biopsicossocial**
4. **Envolver parceiro(a) quando possível**
5. **Modificar fatores contribuintes**
6. **Técnicas específicas**
7. **Encaminhar quando necessário**`,
  },
];

export const KnowledgeManager = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "geral",
    file_name: "",
  });

  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { data, error } = await supabase
        .from("ai_knowledge_documents")
        .select("*")
        .eq("user_id", sessionData.session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data || []) as KnowledgeDocument[]);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }
    
    return fullText.trim();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isText = ["text/plain", "text/markdown", "application/json"].includes(file.type) || 
                   file.name.endsWith(".md") || file.name.endsWith(".txt");

    if (!isPdf && !isText) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Por favor, envie arquivos PDF ou de texto (.txt, .md).",
        variant: "destructive",
      });
      return;
    }

    try {
      let content: string;

      if (isPdf) {
        setIsExtractingPdf(true);
        toast({
          title: "Processando PDF...",
          description: "Extraindo texto do documento. Aguarde.",
        });
        content = await extractTextFromPdf(file);
        setIsExtractingPdf(false);
      } else {
        content = await file.text();
      }

      setFormData(prev => ({
        ...prev,
        content,
        file_name: file.name,
        title: prev.title || file.name.replace(/\.[^.]+$/, ""),
      }));
      
      toast({
        title: "Arquivo carregado",
        description: `Conteúdo de "${file.name}" importado com sucesso.${isPdf ? ` (${content.length.toLocaleString()} caracteres extraídos)` : ""}`,
      });
    } catch (error) {
      console.error("Error reading file:", error);
      setIsExtractingPdf(false);
      toast({
        title: "Erro ao ler arquivo",
        description: isPdf 
          ? "Não foi possível extrair o texto do PDF. O arquivo pode estar protegido ou corrompido."
          : "Não foi possível ler o conteúdo do arquivo.",
        variant: "destructive",
      });
    }

    e.target.value = "";
  };

  const handleAddTemplate = async (template: typeof CBT_TEMPLATES[0]) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("ai_knowledge_documents")
        .insert({
          user_id: sessionData.session.user.id,
          title: template.title,
          content: template.content,
          category: template.category,
          file_type: "template",
          is_active: true,
        });

      if (error) throw error;
      
      toast({ 
        title: "Template adicionado!",
        description: `"${template.title}" foi adicionado à base de conhecimento.`,
      });
      loadDocuments();
    } catch (error) {
      console.error("Error adding template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o template.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAllTemplates = async (templates: typeof CBT_TEMPLATES) => {
    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      const documents = templates.map(template => ({
        user_id: sessionData.session!.user.id,
        title: template.title,
        content: template.content,
        category: template.category,
        file_type: "template",
        is_active: true,
      }));

      const { error } = await supabase
        .from("ai_knowledge_documents")
        .insert(documents);

      if (error) throw error;
      
      toast({ 
        title: "Templates adicionados!",
        description: `${templates.length} templates foram adicionados à base de conhecimento.`,
      });
      setIsTemplateDialogOpen(false);
      loadDocuments();
    } catch (error) {
      console.error("Error adding templates:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar os templates.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o conteúdo.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Não autenticado");

      if (isEditing && selectedDoc) {
        const { error } = await supabase
          .from("ai_knowledge_documents")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            file_name: formData.file_name || null,
          })
          .eq("id", selectedDoc.id);

        if (error) throw error;
        toast({ title: "Documento atualizado!" });
      } else {
        const { error } = await supabase
          .from("ai_knowledge_documents")
          .insert({
            user_id: sessionData.session.user.id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            file_name: formData.file_name || null,
            file_type: "text",
          });

        if (error) throw error;
        toast({ title: "Documento adicionado!" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadDocuments();
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (doc: KnowledgeDocument) => {
    if (!confirm(`Excluir "${doc.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("ai_knowledge_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
      toast({ title: "Documento excluído!" });
      loadDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (doc: KnowledgeDocument) => {
    try {
      const { error } = await supabase
        .from("ai_knowledge_documents")
        .update({ is_active: !doc.is_active })
        .eq("id", doc.id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error("Error toggling document:", error);
    }
  };

  const handleEdit = (doc: KnowledgeDocument) => {
    setSelectedDoc(doc);
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      file_name: doc.file_name || "",
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "geral",
      file_name: "",
    });
    setSelectedDoc(null);
    setIsEditing(false);
  };

  const handleNewDocument = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const getCategoryConfig = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const activeCount = documents.filter(d => d.is_active).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Base de Conhecimento
            </h2>
            <p className="text-sm text-muted-foreground">
              Adicione documentos para enriquecer as respostas da IA
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Templates TCC
            </Button>
            <Button onClick={handleNewDocument}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Documento
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Documentos</p>
                  <p className="text-2xl font-bold">{documents.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativos na IA</p>
                  <p className="text-2xl font-bold text-green-500">{activeCount}</p>
                </div>
                <Brain className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Caracteres Totais</p>
                  <p className="text-2xl font-bold">
                    {documents.filter(d => d.is_active).reduce((acc, d) => acc + d.content.length, 0).toLocaleString()}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">Como funciona a Base de Conhecimento?</p>
                <p className="text-muted-foreground mt-1">
                  Documentos ativos são automaticamente incluídos no contexto da IA, permitindo respostas mais personalizadas 
                  e baseadas no seu material de referência (artigos, protocolos, técnicas, etc.).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-base">Documentos</CardTitle>
            <CardDescription>
              Gerencie o conteúdo que alimenta a IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum documento adicionado ainda</p>
                <p className="text-sm mt-1">Adicione artigos, protocolos ou técnicas para enriquecer a IA</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {documents.map((doc) => {
                    const categoryConfig = getCategoryConfig(doc.category);
                    const CategoryIcon = categoryConfig.icon;
                    
                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-lg border ${
                          doc.is_active ? "bg-muted/50" : "bg-muted/20 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium truncate">{doc.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {categoryConfig.label}
                              </Badge>
                              {doc.is_active ? (
                                <Badge className="bg-green-500/10 text-green-500 text-xs">Ativo</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Inativo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {doc.content.slice(0, 200)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {doc.content.length.toLocaleString()} caracteres • 
                              Atualizado em {format(new Date(doc.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={doc.is_active}
                              onCheckedChange={() => handleToggleActive(doc)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Documento" : "Adicionar Documento"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize o conteúdo do documento" 
                : "Adicione um novo documento à base de conhecimento da IA"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Protocolo de TCC para Ansiedade"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo *</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".txt,.md,.json,.pdf"
                    onChange={handleFileUpload}
                    disabled={isExtractingPdf}
                  />
                  <Button variant="outline" size="sm" asChild disabled={isExtractingPdf}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {isExtractingPdf ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileUp className="h-4 w-4 mr-2" />
                      )}
                      {isExtractingPdf ? "Extraindo..." : "Importar PDF/TXT"}
                    </label>
                  </Button>
                </div>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Cole ou digite o conteúdo do documento aqui..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length.toLocaleString()} caracteres
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? "Atualizar" : "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
