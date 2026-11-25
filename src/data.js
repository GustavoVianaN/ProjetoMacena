export const PLATFORM = 'JusPonte';
export const areas = ['Trabalhista', 'Previdenciário', 'Família', 'Cível e patrimonial', 'Penal', 'Consumidor'];
export const statuses = ['Em triagem', 'Para assumir', 'Em atendimento', 'Concluído'];
export const account = {name: 'Paulo Macena', role: 'Sócio · Macena Advogados', lawyer: 'paulo'};

// Nomes ainda hipotéticos, conforme combinado com o Paulo.
export const lawyers = {
  paulo: {name: 'Dr. Paulo Macena', short: 'Dr. Paulo', title: 'Cível, Família e Previdenciário', areas: ['Cível e patrimonial', 'Família', 'Previdenciário'], tone: 'a3'},
  luiz: {name: 'Dr. Luiz', short: 'Dr. Luiz', title: 'Direito do Trabalho', areas: ['Trabalhista'], tone: 'a0'},
  nick: {name: 'Dr. Nick', short: 'Dr. Nick', title: 'Direito Penal', areas: ['Penal'], tone: 'a4'},
  parceiros: {name: 'Rede de parceiros', short: 'um advogado parceiro', title: 'Outras áreas do Direito', areas: ['Consumidor'], tone: 'a5'},
};
export const route = area => Object.keys(lawyers).find(key => lawyers[key].areas.includes(area)) || 'paulo';

export const channels = {
  jusponte: {label: PLATFORM, detail: 'Plataforma nacional', tone: 'jp'},
  site: {label: 'Site Macena', detail: 'Bate-papo do site', tone: 'mc'},
  whatsapp: {label: 'WhatsApp', detail: 'Número do escritório', tone: 'wa'},
};

export const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const firstName = name => String(name || '').trim().split(/\s+/)[0] || '';
export const initials = name => String(name || '?').replace(/^Dr\.?\s+/, '').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();

/* ---------- CPF e telefone ---------- */
const digit = (digits, size) => {
  let sum = 0;
  for (let i = 0; i < size; i++) sum += digits[i] * (size + 1 - i);
  const rest = sum * 10 % 11;
  return rest === 10 ? 0 : rest;
};
export function validCpf(value) {
  const digits = String(value).replace(/\D/g, '').split('').map(Number);
  if (digits.length !== 11 || digits.every(n => n === digits[0])) return false;
  return digit(digits, 9) === digits[9] && digit(digits, 10) === digits[10];
}
export const formatCpf = value => String(value).replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
export const maskCpf = cpf => cpf ? '***.' + formatCpf(cpf).slice(4, 11) + '-**' : 'Não coletado';
export function fakeCpf() {
  const digits = Array.from({length: 9}, () => Math.floor(Math.random() * 10));
  digits.push(digit(digits, 9));
  digits.push(digit(digits, 10));
  return formatCpf(digits.join(''));
}
const four = () => String(Math.floor(1000 + Math.random() * 9000));
const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '62'];
export const fakePhone = () => `(${ddds[Math.floor(Math.random() * ddds.length)]}) 9${four()}-${four()}`;
export const validPhone = value => /^\d{10,11}$/.test(String(value).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, ''));
export function formatPhone(value) {
  const d = String(value).replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

/* ---------- Datas ---------- */
const startOfDay = date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
export function when(timestamp) {
  const date = new Date(timestamp);
  if (Date.now() - timestamp < 60000) return 'Agora';
  const time = date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 864e5);
  if (days === 0) return 'Hoje, ' + time;
  if (days === 1) return 'Ontem, ' + time;
  return date.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'}) + ', ' + time;
}
export const clock = timestamp => new Date(timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
export function afterHours(timestamp) {
  const date = new Date(timestamp);
  return date.getDay() === 0 || date.getDay() === 6 || date.getHours() < 8 || date.getHours() >= 18;
}

/* ---------- Triagem ---------- */
const rules = {
  Trabalhista: [
    [/demit|demissao|mandad[oa] embora|dispensad|rescis|aviso previo|fgts|seguro.desemprego|meus direitos/, 'Rescisão e verbas trabalhistas'],
    [/horas? extras?/, 'Horas extras'],
    [/assedio|humilha/, 'Assédio moral'],
    [/acidente (de|no) trabalho|me machuquei no trabalho/, 'Acidente de trabalho'],
    [/carteira assinada|sem registro|registro em carteira|vinculo|patrao|empresa onde trabalh|salario/, 'Vínculo e direitos trabalhistas'],
  ],
  Penal: [
    [/pres[oa]|prisao|flagrante|custodia|delegacia/, 'Prisão e flagrante'],
    [/boletim de ocorrencia|policia|inquerito|denuncia|intimad[oa] (pela|na) policia/, 'Inquérito e investigação'],
    [/crime|criminal|furto|roubo|estelionato|trafico|homicidio/, 'Defesa criminal'],
    [/agress|ameaca|maria da penha|violencia/, 'Violência e ameaça'],
  ],
  Previdenciário: [
    [/pensao por morte|faleceu|falecimento|viuv/, 'Pensão por morte'],
    [/loas|bpc|deficien/, 'BPC/LOAS'],
    [/aposentadoria especial|insalubr|periculos/, 'Aposentadoria especial'],
    [/auxilio|incapacidade|afastad|pericia|doenca/, 'Benefício por incapacidade'],
    [/revisao|revisar/, 'Revisão de benefício'],
    [/aposent|inss|contribui|beneficio/, 'Aposentadoria'],
  ],
  Família: [
    [/divorci|separa(r|cao)|casamento|uniao estavel/, 'Divórcio'],
    [/pensao|alimentos/, 'Pensão alimentícia'],
    [/guarda|visita|filh/, 'Guarda e visitas'],
    [/inventario|heranca|partilha/, 'Inventário e partilha'],
  ],
  'Cível e patrimonial': [
    [/usucapiao/, 'Usucapião'],
    [/imovel|escritura|terreno|apartamento|imobili|lote|aluguel|despejo/, 'Imóveis e regularização'],
    [/indeniza|dano moral|danos|prejuizo/, 'Indenização'],
    [/divida|me deve|nao me pagou|emprestei/, 'Cobranças e dívidas'],
    [/contrato/, 'Contratos'],
  ],
  Consumidor: [
    [/cobra(nca|ram|do|ou)( \w+)? indevid|cobrado a mais/, 'Cobrança indevida'],
    [/negativad|nome sujo|serasa|spc/, 'Negativação indevida'],
    [/compra|produto|loja|entrega|defeito/, 'Problema com compra'],
    [/voo|companhia aerea|bagagem|passagem/, 'Problema com voo'],
    [/plano de saude|operadora|telefonia|banco|cartao/, 'Serviços e bancos'],
  ],
};
const urgency = /urgente|amanha|hoje|audiencia|prazo|intimad|citad|liminar|despejo|vence|ultimo dia|pericia marcada|pres[oa]|flagrante/;
const word = '[A-ZÀ-Ý][a-zà-ÿ]+';
const properName = `(${word}(?:\\s+(?:d[aeo]s?\\s+)?${word})*)`;
const nameRe = new RegExp(`(?:[Mm]eu nome (?:é|e)|[Mm]e chamo)\\s+${properName}`, 'u');
const cityRe = new RegExp(`(?:[Mm]oro em|[Rr]esido em|[Mm]oro na cidade de)\\s+(${word}(?:\\s+(?:d[aeo]s?\\s+)?${word})*(?:\\s*[-/,]\\s*[A-Z]{2})?)`, 'u');

// Lê o relato livre e extrai o que já foi dito, para a assistente não repetir perguntas.
export function analyze(text) {
  const clean = normalize(text);
  let best = null;
  for (const [area, list] of Object.entries(rules)) {
    const hits = list.filter(([pattern]) => pattern.test(clean));
    if (hits.length && (!best || hits.length > best.hits.length)) best = {area, hits};
  }
  const sentence = text.split(/(?<=[.!?])\s+/).find(part => urgency.test(normalize(part)));
  const process = /(ja|tenho|existe|tem|abri|entrei com)( um)? processo/.test(clean) && !/nao (tenho|existe|tem)( um| nenhum)? processo/.test(clean);
  return {
    area: best?.area || null,
    subject: best?.hits[0][1] || null,
    urgent: !!sentence,
    deadline: sentence?.trim() || '',
    name: text.match(nameRe)?.[1] || '',
    city: text.match(cityRe)?.[1] || '',
    process: process ? 'Sim, citado no relato' : '',
  };
}
export const guardrail = /vou ganhar|vai dar certo|garanti|tenho direito|quanto (eu )?(vou|vai) receber|qual (a|e a) chance|chances|da pra ganhar|e certeza|com certeza ganho|voce e advogad|e um robo|estou falando com (um )?(robo|advogado)/;
export const isGreeting = text => !analyze(text).area && normalize(text).split(/\s+/).length <= 4;

export const questions = {
  Trabalhista: [
    ['Ainda trabalha na empresa?', 'Você ainda trabalha nessa empresa?'],
    ['Função', 'Qual era a sua função lá?'],
    ['Período', 'Quando começou a trabalhar e, se já saiu, quando saiu?'],
    ['Verbas rescisórias', 'Você recebeu as verbas rescisórias, como saldo de salário, férias e FGTS?'],
  ],
  Penal: [
    ['Alguém está preso?', 'Neste momento, você ou a pessoa envolvida está preso(a)?'],
    ['Papel no caso', 'Você é a vítima, a pessoa acusada ou familiar de alguém envolvido?'],
    ['Quando aconteceu', 'Quando aconteceu o fato?'],
    ['Boletim ou processo', 'Já existe boletim de ocorrência, inquérito ou processo?'],
  ],
  Previdenciário: [
    ['Idade', 'Qual é a sua idade?'],
    ['Contribuição ao INSS', 'Você já contribuiu para o INSS? Mais ou menos por quanto tempo?'],
    ['Trabalha atualmente?', 'Atualmente você está trabalhando?'],
    ['Pedido ao INSS', 'Já pediu algum benefício ao INSS? Se sim, ele foi negado?'],
  ],
  Família: [
    ['Estado civil', 'Você está casado(a) ou em união estável atualmente?'],
    ['Filhos menores', 'Existem filhos menores de idade?'],
    ['Acordo de guarda ou pensão', 'Já existe algum acordo sobre guarda ou pensão?'],
    ['Bens a partilhar', 'Há bens para partilhar, como casa, carro ou outros?'],
  ],
  'Cível e patrimonial': [
    ['Quando aconteceu', 'Quando aconteceu o fato principal?'],
    ['Outra parte', 'Quem é a outra parte envolvida: uma pessoa ou uma empresa?'],
    ['Documentos do caso', 'Existe contrato, recibo ou outro documento sobre isso?'],
    ['Valor envolvido', 'Há algum valor envolvido? Se souber, pode me dizer aproximadamente.'],
  ],
  Consumidor: [
    ['Empresa', 'Qual é a empresa envolvida?'],
    ['Quando aconteceu', 'Quando o problema aconteceu?'],
    ['Reclamação feita', 'Você já reclamou com a empresa ou no Procon? Tem número de protocolo?'],
    ['Valor envolvido', 'Há algum valor envolvido? Se souber, pode me dizer aproximadamente.'],
  ],
};
export const docsByArea = {
  Trabalhista: ['Carteira de trabalho (CTPS)', 'Termo de rescisão (TRCT)', 'Últimos holerites'],
  Penal: ['Boletim de ocorrência', 'Documentos do inquérito ou processo, se houver', 'Documento de identidade'],
  Previdenciário: ['Extrato CNIS do Meu INSS', 'Carta de indeferimento do INSS, se houver', 'Laudos médicos, se houver'],
  Família: ['Certidão de casamento ou de nascimento dos filhos', 'Comprovante de renda', 'Documentos dos bens'],
  'Cível e patrimonial': ['Contrato ou documento do negócio', 'Comprovantes de pagamento', 'Fotos, mensagens ou outras provas'],
  Consumidor: ['Nota fiscal ou contrato', 'Protocolos de atendimento', 'Prints de conversas e cobranças'],
};
export const suggestedDocs = area => docsByArea[area] || ['Documentos relacionados ao caso'];

export const examples = [
  'Fui mandado embora semana passada e não recebi meus direitos',
  'Meu filho foi preso ontem à noite e não sei o que fazer',
  'Quero saber se já posso me aposentar, trabalhei 30 anos de carteira assinada',
  'Comprei um terreno há 15 anos e nunca consegui a escritura',
  'O banco me cobrou indevidamente e negativou meu nome',
];

/* ---------- Dados de demonstração ---------- */
const ago = minutes => Date.now() - minutes * 60000;
const dayAt = (daysAgo, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};
const welcomeFor = channel => channel === 'whatsapp' ? 'Olá! Sou a assistente virtual do Dr. Paulo Macena. Me conte o que aconteceu.' : `Olá! Bem-vindo ao ${channel === 'site' ? 'Macena Advogados' : PLATFORM}. Conte com suas palavras o que aconteceu.`;
export function makeSeed() {
  const base = [
    {id: 1, channel: 'jusponte', name: 'Mariana Costa Silva', phone: fakePhone(), area: 'Trabalhista', subject: 'Rescisão e verbas trabalhistas', createdAt: ago(38), status: 'Para assumir', unread: true, urgent: true, deadline: 'A empresa pediu que eu vá amanhã assinar os papéis da rescisão.', city: 'Recife - PE', report: 'Fui demitida há duas semanas e ainda não recebi as verbas rescisórias. A empresa pediu que eu vá amanhã assinar os papéis da rescisão.',
      answers: [['Já existe processo?', 'Não'], ['Ainda trabalha na empresa?', 'Não, fui demitida'], ['Função', 'Auxiliar administrativa'], ['Verbas rescisórias', 'Não recebi nada até agora']], docs: ['Termo de rescisão.pdf']},
    {id: 2, channel: 'jusponte', name: 'Carlos Eduardo Nunes', phone: fakePhone(), area: 'Penal', subject: 'Prisão e flagrante', createdAt: ago(72), status: 'Para assumir', unread: true, urgent: true, deadline: 'Meu irmão foi preso em flagrante ontem e a audiência de custódia é hoje.', city: 'Belo Horizonte - MG', report: 'Meu irmão foi preso em flagrante ontem e a audiência de custódia é hoje. Preciso de um advogado criminal urgente.',
      answers: [['Alguém está preso?', 'Sim, meu irmão'], ['Papel no caso', 'Familiar'], ['Boletim ou processo', 'Auto de prisão em flagrante']], docs: []},
    {id: 3, channel: 'whatsapp', name: 'Roberto Almeida', cpf: fakeCpf(), phone: fakePhone(), area: 'Previdenciário', subject: 'Aposentadoria', createdAt: ago(126), status: 'Em triagem', unread: true, city: 'Campinas - SP', report: 'Quero saber se já posso pedir aposentadoria. Trabalhei com carteira assinada por muitos anos.',
      answers: [['Idade', '61 anos'], ['Contribuição ao INSS', 'Uns 32 anos']], docs: []},
    {id: 4, channel: 'site', name: 'Camila Ferreira Rocha', phone: fakePhone(), area: 'Família', subject: 'Guarda e visitas', createdAt: dayAt(1, 23, 14), status: 'Para assumir', city: 'São Paulo - SP', report: 'Preciso conversar com um advogado sobre a guarda da minha filha e a pensão. O pai dela quer levar ela para outra cidade.',
      answers: [['Já existe processo?', 'Não'], ['Filhos menores', 'Uma filha de 6 anos'], ['Acordo de guarda ou pensão', 'Nenhum acordo formal']], docs: []},
    {id: 5, channel: 'jusponte', name: 'Fernanda Lopes', phone: fakePhone(), area: 'Consumidor', subject: 'Problema com voo', createdAt: dayAt(1, 20, 40), status: 'Para assumir', city: 'Porto Alegre - RS', report: 'A companhia aérea cancelou meu voo e perdi um compromisso de trabalho. Não me deram hotel nem reembolso.',
      answers: [['Empresa', 'Companhia aérea'], ['Reclamação feita', 'Sim, protocolo 448812']], docs: ['Cartão de embarque.pdf']},
    {id: 6, channel: 'site', name: 'André Ribeiro', phone: fakePhone(), area: 'Cível e patrimonial', subject: 'Imóveis e regularização', createdAt: dayAt(1, 17, 26), status: 'Em atendimento', city: 'Guarulhos - SP', report: 'Comprei um imóvel e gostaria de entender como regularizar a documentação.',
      answers: [['Já existe processo?', 'Não'], ['Quando aconteceu', 'Comprei em 2019']], docs: ['Contrato de compra e venda.pdf', 'IPTU 2026.pdf'],
      messages: [
        {role: 'assistant', text: welcomeFor('site')},
        {role: 'client', text: 'Comprei um imóvel e gostaria de entender como regularizar a documentação.'},
        {role: 'handoff', lawyer: 'paulo'},
        {role: 'client', text: 'Contrato de compra e venda.pdf', file: true},
        {role: 'lawyer', text: 'Olá, André! Aqui é o Paulo. Já vi o contrato. Podemos conversar amanhã às 10h?'},
      ]},
    {id: 7, channel: 'jusponte', name: 'Juliana Martins', phone: fakePhone(), area: 'Trabalhista', subject: 'Horas extras', createdAt: dayAt(2, 6, 35), status: 'Em atendimento', city: 'Fortaleza - CE', report: 'Trabalhei horas extras por vários meses e não encontrei os pagamentos no holerite.',
      answers: [['Ainda trabalha na empresa?', 'Sim'], ['Função', 'Operadora de caixa']], docs: ['Holerites 2026.pdf']},
    {id: 8, channel: 'whatsapp', name: 'Sebastião Lima', cpf: fakeCpf(), phone: fakePhone(), area: 'Previdenciário', subject: 'BPC/LOAS', createdAt: dayAt(3, 20, 5), status: 'Concluído', city: 'Osasco - SP', report: 'Meu pedido de BPC foi negado. Tenho perícia marcada no INSS na sexta-feira.',
      answers: [['Idade', '67 anos'], ['Pedido ao INSS', 'Sim, foi negado em outubro']], docs: ['Carta do INSS.pdf']},
    {id: 9, channel: 'jusponte', name: 'Patrícia Gomes', phone: fakePhone(), area: 'Penal', subject: 'Violência e ameaça', createdAt: dayAt(3, 9, 12), status: 'Concluído', city: 'Goiânia - GO', report: 'Venho sofrendo ameaças do meu ex-companheiro e quero saber como pedir uma medida protetiva.',
      answers: [['Papel no caso', 'Vítima'], ['Boletim ou processo', 'Fiz boletim de ocorrência']], docs: ['Boletim de ocorrência.pdf']},
  ];
  return base.map(item => ({...item, lawyer: route(item.area)}));
}
