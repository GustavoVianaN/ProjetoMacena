export const areas = ['Trabalhista', 'Previdenciário', 'Família', 'Cível e patrimonial'];
export const statuses = ['Em triagem', 'Para assumir', 'Em atendimento', 'Concluído'];

// Credenciais de demonstração. Na produção, a autenticação fica no servidor.
export const users = {
  paulo: {password: '123456', name: 'Paulo Macena', role: 'Sócio · Equipe jurídica'},
};

export const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
export const firstName = name => String(name || '').trim().split(/\s+/)[0] || '';
export const initials = name => String(name || '?').split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();

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
export const maskCpf = cpf => cpf ? '***.' + formatCpf(cpf).slice(4, 11) + '-**' : 'Não informado';
export function fakeCpf() {
  const digits = Array.from({length: 9}, () => Math.floor(Math.random() * 10));
  digits.push(digit(digits, 9));
  digits.push(digit(digits, 10));
  return formatCpf(digits.join(''));
}
const four = () => String(Math.floor(1000 + Math.random() * 9000));
export const fakePhone = () => `(11) 9${four()}-${four()}`;

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
    [/carteira assinada|sem registro|registro em carteira|vinculo|patrao|empresa|salario/, 'Vínculo e direitos trabalhistas'],
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
    [/imovel|escritura|terreno|apartamento|imobili|lote/, 'Regularização imobiliária'],
    [/indeniza|dano moral|danos|prejuizo/, 'Indenização'],
    [/divida|cobranca|me deve|negativad|nome sujo|serasa/, 'Cobranças e dívidas'],
    [/contrato/, 'Contratos'],
  ],
};
const urgency = /urgente|amanha|hoje|audiencia|prazo|intimad|citad|liminar|despejo|vence|ultimo dia|pericia marcada/;
const word = '[A-ZÀ-Ý][a-zà-ÿ]+';
const properName = `(${word}(?:\\s+(?:d[aeo]s?\\s+)?${word})*)`;
const nameRe = new RegExp(`(?:[Mm]eu nome (?:é|e)|[Mm]e chamo)\\s+${properName}`, 'u');
const cityRe = new RegExp(`(?:[Mm]oro em|[Rr]esido em|[Mm]oro na cidade de)\\s+${properName}`, 'u');

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
export const guardrail = /vou ganhar|vai dar certo|garant|tenho direito|quanto (eu )?(vou|vai) receber|qual (a|e a) chance|chances|da pra ganhar|e certeza|com certeza ganho/;
export const isGreeting = text => !analyze(text).area && normalize(text).split(/\s+/).length <= 4;

export const questions = {
  Trabalhista: [
    ['Ainda trabalha na empresa?', 'Você ainda trabalha nessa empresa?'],
    ['Função', 'Qual era a sua função lá?'],
    ['Período', 'Quando começou a trabalhar e, se já saiu, quando saiu?'],
    ['Verbas rescisórias', 'Você recebeu as verbas rescisórias, como saldo de salário, férias e FGTS?'],
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
};
export const docsByArea = {
  Trabalhista: ['Carteira de trabalho (CTPS)', 'Termo de rescisão (TRCT)', 'Últimos holerites'],
  Previdenciário: ['Extrato CNIS do Meu INSS', 'Carta de indeferimento do INSS, se houver', 'Laudos médicos, se houver'],
  Família: ['Certidão de casamento ou de nascimento dos filhos', 'Comprovante de renda', 'Documentos dos bens'],
  'Cível e patrimonial': ['Contrato ou documento do negócio', 'Comprovantes de pagamento', 'Fotos, mensagens ou outras provas'],
};
export const suggestedDocs = area => docsByArea[area] || ['Documentos relacionados ao caso'];

export const welcome = 'Olá! Seja muito bem-vindo ao Macena Advogados. 😊\n\nSou a assistente virtual do escritório e vou ajudar você neste primeiro atendimento. Fique à vontade para me contar o que aconteceu, com suas próprias palavras. Pode escrever ou mandar áudio.\n\nSuas informações são sigilosas e usadas apenas pela equipe do escritório, conforme a LGPD.';
export const examples = [
  'Fui mandado embora semana passada e não recebi meus direitos',
  'Quero saber se já posso me aposentar, trabalhei 30 anos de carteira assinada',
  'Meu ex não paga a pensão do nosso filho há 3 meses',
  'Comprei um terreno há 15 anos e nunca consegui a escritura',
];

/* ---------- Dados de demonstração ---------- */
const ago = minutes => Date.now() - minutes * 60000;
const dayAt = (daysAgo, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};
export function makeSeed() {
  return [
    {id: 1, name: 'Mariana Costa Silva', cpf: fakeCpf(), phone: fakePhone(), area: 'Trabalhista', subject: 'Rescisão e verbas trabalhistas', createdAt: ago(38), status: 'Para assumir', unread: true, urgent: true, deadline: 'A empresa pediu que eu vá amanhã assinar os papéis da rescisão.', city: 'São Paulo', report: 'Fui demitida há duas semanas e ainda não recebi as verbas rescisórias. A empresa pediu que eu vá amanhã assinar os papéis da rescisão.',
      answers: [['Já existe processo?', 'Não'], ['Ainda trabalha na empresa?', 'Não, fui demitida'], ['Função', 'Auxiliar administrativa'], ['Período', 'De março de 2021 a novembro de 2026'], ['Verbas rescisórias', 'Não recebi nada até agora']],
      docs: ['Termo de rescisão.pdf'],
      messages: [
        {role: 'assistant', text: welcome},
        {role: 'client', text: 'Oi, fui demitida há duas semanas e ainda não recebi as verbas rescisórias. A empresa pediu que eu vá amanhã assinar os papéis da rescisão.'},
        {role: 'assistant', text: 'Sinto muito por isso, Mariana. Pelo que você contou, parece ser um caso trabalhista. Anotei que existe uma urgência: amanhã você precisa ir à empresa. Vou sinalizar isso como prioridade para a equipe.\n\nVocê recebeu as verbas rescisórias, como saldo de salário, férias e FGTS?'},
        {role: 'client', text: 'Não recebi nada até agora'},
        {role: 'assistant', text: 'Entendi. Se tiver em mãos, pode enviar foto ou PDF do termo de rescisão e dos últimos holerites.'},
        {role: 'client', text: 'Termo de rescisão.pdf', file: true},
        {role: 'assistant', text: 'Recebi o documento. Já organizei tudo e um advogado vai continuar seu atendimento por aqui o quanto antes.'},
      ]},
    {id: 2, name: 'Roberto Almeida', cpf: fakeCpf(), phone: fakePhone(), area: 'Previdenciário', subject: 'Aposentadoria', createdAt: ago(126), status: 'Em triagem', unread: true, city: 'Campinas', report: 'Quero saber se já posso pedir aposentadoria. Trabalhei com carteira assinada por muitos anos.',
      answers: [['Idade', '61 anos'], ['Contribuição ao INSS', 'Uns 32 anos']], docs: []},
    {id: 3, name: 'Camila Ferreira Rocha', cpf: fakeCpf(), phone: fakePhone(), area: 'Família', subject: 'Guarda e visitas', createdAt: dayAt(1, 23, 14), status: 'Para assumir', city: 'São Paulo', report: 'Preciso conversar com um advogado sobre a guarda da minha filha e a pensão. O pai dela quer levar ela para outra cidade.',
      answers: [['Já existe processo?', 'Não'], ['Estado civil', 'Separada'], ['Filhos menores', 'Uma filha de 6 anos'], ['Acordo de guarda ou pensão', 'Nenhum acordo formal']], docs: []},
    {id: 4, name: 'André Ribeiro', cpf: fakeCpf(), phone: fakePhone(), area: 'Cível e patrimonial', subject: 'Regularização imobiliária', createdAt: dayAt(1, 17, 26), status: 'Em atendimento', responsible: 'Paulo Macena', city: 'Guarulhos', report: 'Comprei um imóvel e gostaria de entender como regularizar a documentação.',
      answers: [['Já existe processo?', 'Não'], ['Quando aconteceu', 'Comprei em 2019'], ['Documentos do caso', 'Tenho o contrato de compra e venda']],
      docs: ['Contrato de compra e venda.pdf', 'IPTU 2026.pdf'],
      messages: [
        {role: 'assistant', text: welcome},
        {role: 'client', text: 'Comprei um imóvel e gostaria de entender como regularizar a documentação.'},
        {role: 'assistant', text: 'Entendi, André. Pelo que você contou, parece ser um caso de regularização imobiliária. Existe contrato, recibo ou outro documento sobre a compra?'},
        {role: 'client', text: 'Tenho o contrato de compra e venda'},
        {role: 'client', text: 'Contrato de compra e venda.pdf', file: true},
        {role: 'client', text: 'IPTU 2026.pdf', file: true},
        {role: 'lawyer', text: 'Olá, André! Aqui é o Paulo, do Macena Advogados. Já analisei o contrato. Podemos marcar uma conversa amanhã às 10h?'},
      ]},
    {id: 5, name: 'Juliana Martins', cpf: fakeCpf(), phone: fakePhone(), area: 'Trabalhista', subject: 'Horas extras', createdAt: dayAt(2, 6, 35), status: 'Concluído', responsible: 'Paulo Macena', city: 'Santos', report: 'Trabalhei horas extras por vários meses e não encontrei os pagamentos no holerite.',
      answers: [['Ainda trabalha na empresa?', 'Sim'], ['Função', 'Operadora de caixa']], docs: ['Holerites 2026.pdf']},
    {id: 6, name: 'Sebastião Lima', cpf: fakeCpf(), phone: fakePhone(), area: 'Previdenciário', subject: 'BPC/LOAS', createdAt: dayAt(3, 20, 5), status: 'Para assumir', urgent: true, deadline: 'Tenho perícia marcada no INSS na sexta-feira.', city: 'Osasco', report: 'Meu pedido de BPC foi negado. Tenho perícia marcada no INSS na sexta-feira e não sei o que levar.',
      answers: [['Idade', '67 anos'], ['Pedido ao INSS', 'Sim, foi negado em outubro']], docs: []},
  ];
}
