export const areas = ['Trabalhista', 'Previdenciário', 'Família', 'Cível e patrimonial'];
export const seed = [
  {id: 1, name: 'Mariana Costa', area: 'Trabalhista', subject: 'Verbas rescisórias', time: 'Hoje, 10:42', status: 'Para assumir', urgent: true, city: 'São Paulo, SP', report: 'Fui demitida há duas semanas e ainda não recebi as verbas rescisórias. A empresa pediu que eu vá amanhã assinar os papéis.', answers: [['Existe processo judicial?', 'Ainda não'], ['Prazo informado', 'Reunião na empresa amanhã']], docs: ['Termo de rescisão.pdf']},
  {id: 2, name: 'Roberto Almeida', area: 'Previdenciário', subject: 'Aposentadoria', time: 'Hoje, 09:18', status: 'Em triagem', city: 'Campinas, SP', report: 'Quero saber se já posso pedir aposentadoria. Trabalhei com carteira assinada por muitos anos.'},
  {id: 3, name: 'Camila Ferreira', area: 'Família', subject: 'Guarda e pensão', time: 'Hoje, 08:51', status: 'Para assumir', city: 'São Paulo, SP', report: 'Preciso conversar com um advogado sobre a guarda da minha filha e a pensão.'},
  {id: 4, name: 'André Ribeiro', area: 'Cível e patrimonial', subject: 'Regularização de imóvel', time: 'Ontem, 17:26', status: 'Em atendimento', city: 'Guarulhos, SP', report: 'Comprei um imóvel e gostaria de entender como regularizar a documentação.'},
  {id: 5, name: 'Juliana Martins', area: 'Trabalhista', subject: 'Horas extras', time: 'Ontem, 16:03', status: 'Concluído', city: 'Santos, SP', report: 'Trabalhei horas extras por vários meses e não encontrei os pagamentos no holerite.'},
];
export const welcome = 'Olá! Sou a assistente virtual do Macena Advogados. Pode me contar o que aconteceu com suas próprias palavras? Vou fazer algumas perguntas para encaminhar seu atendimento à nossa equipe.';
export function classify(message) {
  const clean = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return [
    /demit|rescis|hora extra|vinculo empreg|assedio|acidente de trabalho/,
    /inss|aposent|loas|bpc|beneficio|contribui/,
    /divorci|pensao aliment|guarda|casamento|filhos?|inventario|partilha/,
    /imovel|imobili|contrato|indeniza|divida|cobranca|usucapiao|patrimonio/,
  ].map((pattern, index) => pattern.test(clean) ? areas[index] : null).find(Boolean)
    || (/empreg|carteira assinada/.test(clean) ? 'Trabalhista' : 'A classificar');
}
export const questions = {
  Trabalhista: ['Qual era sua função e em que período trabalhou na empresa?', 'Você recebeu as verbas rescisórias ou ficou algum pagamento pendente?'],
  Previdenciário: ['Qual é sua idade e por quanto tempo você contribuiu para o INSS?', 'Já solicitou algum benefício? Se sim, qual foi a resposta do INSS?'],
  Família: ['Há filhos menores ou algum acordo sobre guarda e pensão?', 'Há bens a partilhar?'],
  'Cível e patrimonial': ['Existe algum contrato ou documento relacionado ao caso?', 'Quando aconteceu o fato principal que você relatou?'],
};
